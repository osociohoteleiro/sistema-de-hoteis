const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Plugins para evitar detecção
puppeteer.use(StealthPlugin());

const { getBrowserConfig, getRandomUserAgent, getRandomDelay } = require('./browser-config');
const { logger, logScrapingStart, logScrapingEnd, logScrapingError, logPriceExtracted, logRetryAttempt } = require('./logger');
const {
  wait,
  generate_booking_query_param_date,
  generate_final_result_date,
  get_dates_between,
  write_to_file,
  new_generate_new_booking_url,
} = require('./utils');

/**
 * Extrator otimizado de preços do Booking.com com suporte completo ao Linux
 * @param {string} url - URL da propriedade no Booking
 * @param {Date} start_date - Data de início
 * @param {Date} end_date - Data de fim
 * @param {number} max_bundle_size - Tamanho máximo do bundle
 * @param {string} results_filepath - Caminho do arquivo de resultados
 * @param {Object} dbConnection - Conexão com banco de dados (opcional)
 * @param {number} searchId - ID da busca no banco (opcional)
 * @param {number} propertyId - ID da propriedade no banco (opcional)
 * @param {number} hotelId - ID do hotel para APIs de progresso (opcional)
 * @returns {Promise<void>}
 */
async function extract_prices_from_booking(url, start_date, end_date, max_bundle_size, results_filepath, dbConnection = null, searchId = null, propertyId = null, hotelId = null) {
  const startTime = Date.now();
  const dates = get_dates_between(start_date, end_date);
  // DEBUG: Array de datas criado
  const propertyName = extractPropertyNameFromUrl(url);

  logScrapingStart(propertyName, `${start_date.toISOString().split('T')[0]} to ${end_date.toISOString().split('T')[0]}`);

  let browser = null;
  let totalPricesExtracted = 0;
  let processedDates = 0;
  
  try {
    // Configuração otimizada do browser
    const browserConfig = getBrowserConfig();
    browser = await puppeteer.launch(browserConfig);
    
    const main_page = await browser.newPage();
    
    // Configurar User-Agent aleatório
    await main_page.setUserAgent(getRandomUserAgent());
    
    // Headers realistas
    await main_page.setExtraHTTPHeaders({
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      'Cache-Control': 'max-age=0',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1'
    });

    // Interceptar e bloquear recursos desnecessários
    await main_page.setRequestInterception(true);
    main_page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });

    let current_url = url;
    let i = 1;
    const processedDates = new Set();

    for (const date of dates) {
      const current_execution = i;
      i++;

      const dateKey = date.toISOString().split('T')[0];
      if (processedDates.has(dateKey)) {
        console.log(`📋 Dia ${dateKey} já processado em bundle anterior - PULANDO`);
        console.log(`Price ${current_execution} of ${dates.length} extracted (already processed)`);
        continue;
      }

      // Lógica CORRIGIDA para detectar mínimo de noites
      // Exemplo: se não encontrar 11-12, tenta 11-13, depois 11-14, etc.
      let priceFound = false;
      let minimumNightsDetected = 1;
      
      logger.info(`🔍 Iniciando busca incremental para ${generate_booking_query_param_date(date)}`, {
        property: propertyName,
        date: generate_booking_query_param_date(date),
        max_bundle_size: max_bundle_size
      });
      
      for (let bundle_size = 1; bundle_size <= max_bundle_size && !priceFound; bundle_size++) {
        // Calcular data de checkout (check-in + número de noites)
        let checkout_date = new Date(date.getTime());
        checkout_date.setUTCDate(checkout_date.getUTCDate() + bundle_size);

        const checkin_str = generate_booking_query_param_date(date);
        const checkout_str = generate_booking_query_param_date(checkout_date);

        logger.info(`🧪 Testando ${bundle_size} noite(s): ${checkin_str} → ${checkout_str}`, {
          property: propertyName,
          checkin: checkin_str,
          checkout: checkout_str,
          nights: bundle_size
        });

        current_url = new_generate_new_booking_url(
          url,
          checkin_str,
          checkout_str,
        );

        // Sistema de retry
        const maxRetries = 3;
        let success = false;
        let hasValidRooms = false;

        for (let retry = 0; retry < maxRetries && !success; retry++) {
          try {
            if (retry > 0) {
              logRetryAttempt(propertyName, retry + 1, maxRetries, new Error('Previous attempt failed'));
              await wait(getRandomDelay(5000, 10000));
            }

            // Navegar para a URL com timeout
            await Promise.race([
              main_page.goto(current_url, { 
                waitUntil: 'domcontentloaded',
                timeout: 30000 
              }),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Navigation timeout')), 35000)
              )
            ]);

            // Aguardar carregamento da página
            await wait(getRandomDelay(4000, 8000));

            // Verificar se a página carregou corretamente
            const pageTitle = await main_page.title();
            if (pageTitle.includes('Error') || pageTitle.includes('404')) {
              throw new Error('Page loaded with error');
            }

            // Extrair dados do window.booking.env
            const booking_data = await main_page.evaluate(() => {
              if (!window.booking || !window.booking.env) {
                throw new Error('Booking data not found');
              }
              return window.booking.env;
            });

            // Verificar se há quartos disponíveis
            if (!booking_data.b_rooms_available_and_soldout || !booking_data.b_rooms_available_and_soldout.length) {
              logger.info(`❌ Sem quartos disponíveis para ${bundle_size} noite(s): ${checkin_str} → ${checkout_str}`, {
                property: propertyName,
                checkin: checkin_str,
                checkout: checkout_str,
                nights: bundle_size,
                attempt: `${bundle_size}/${max_bundle_size}`
              });
              success = true; // Marcar como success para continuar testando outros bundle_size
              break;
            }

            // Filtrar quartos válidos (mínimo 2 pessoas - pode ser 2, 3, 4, etc.)
            let valid_room_blocks = [];
            for (const room of booking_data.b_rooms_available_and_soldout) {
              const filtered_room_blocks = room.b_blocks.filter((room_block) => {
                return room_block.b_max_persons >= 2; // CORRIGIDO: >= 2 em vez de === 2
              });

              if (filtered_room_blocks.length) {
                valid_room_blocks = valid_room_blocks.concat(filtered_room_blocks);
              }
            }

            if (!valid_room_blocks.length) {
              logger.info(`❌ Sem quartos válidos (mín. 2 pessoas) para ${bundle_size} noite(s): ${checkin_str} → ${checkout_str}`, {
                property: propertyName,
                checkin: checkin_str,
                checkout: checkout_str,
                nights: bundle_size,
                attempt: `${bundle_size}/${max_bundle_size}`,
                note: 'Buscando quartos com capacidade >= 2 pessoas'
              });
              success = true;
              break;
            }

            logger.info(`✅ Quartos encontrados para ${bundle_size} noite(s): ${valid_room_blocks.length} opções disponíveis`, {
              property: propertyName,
              checkin: checkin_str,
              checkout: checkout_str,
              nights: bundle_size,
              rooms_found: valid_room_blocks.length,
              capacities: valid_room_blocks.map(block => block.b_max_persons)
            });

            // SE CHEGOU ATÉ AQUI, ENCONTROU QUARTOS VÁLIDOS!
            hasValidRooms = true;
            priceFound = true;
            minimumNightsDetected = bundle_size;

            // Ordenar por preço
            valid_room_blocks.sort((roomA, roomB) => {
              return roomA.b_price_breakdown_simplified.b_headline_price_amount - 
                     roomB.b_price_breakdown_simplified.b_headline_price_amount;
            });

            const cheapest_room_block = valid_room_blocks[0];
            const selected_block_price = cheapest_room_block.b_price_breakdown_simplified.b_headline_price_amount;
            const calculated_selected_block_price = selected_block_price / bundle_size;

            // Detectar se é um pacote especial
            const packageInfo = detectSpecialPackage(date, bundle_size, selected_block_price);
            
            // Log DETALHADO sobre sucesso na detecção
            if (packageInfo.isSpecialPackage) {
              logger.info(`🎉 ${packageInfo.name} ENCONTRADO! ${checkin_str} → ${checkout_str} (${bundle_size} noites)`, {
                property: propertyName,
                checkin: checkin_str,
                checkout: checkout_str,
                package_type: packageInfo.type,
                package_name: packageInfo.name,
                nights: bundle_size,
                total_price: selected_block_price,
                per_night_price: calculated_selected_block_price,
                priority: packageInfo.priority,
                room_type: cheapest_room_block.b_room_name || 'Standard'
              });
            } else if (bundle_size > 1) {
              logger.info(`✅ MÍNIMO DE NOITES DETECTADO! ${checkin_str} → ${checkout_str} (${bundle_size} noites)`, {
                property: propertyName,
                checkin: checkin_str,
                checkout: checkout_str,
                minimum_nights: bundle_size,
                total_price: selected_block_price,
                per_night_price: calculated_selected_block_price,
                room_type: cheapest_room_block.b_room_name || 'Standard',
                message: `Preço encontrado apenas com ${bundle_size} noites - será dividido por ${bundle_size} dias`
              });
            } else {
              logger.info(`✅ Preço encontrado para 1 noite: ${checkin_str} → ${checkout_str}`, {
                property: propertyName,
                checkin: checkin_str,
                checkout: checkout_str,
                price: calculated_selected_block_price,
                room_type: cheapest_room_block.b_room_name || 'Standard'
              });
            }

            const selected_block_price_string = calculated_selected_block_price.toFixed(2);
            const selected_block_price_string_parsed_to_brazil_locale = 
              selected_block_price_string.split('.').join(',');

            // REMOVIDO: Configuração de pulo que causava dados ausentes
            // Agora cada data é processada independentemente para garantir cobertura completa
            if (bundle_size > 1) {
              // amount_of_dates_to_jump_after_bundle_found = bundle_size - 1; // REMOVIDO
              
              // Log detalhado sobre distribuição de preços
              const nightsList = [];
              for (let j = 0; j < bundle_size; j++) {
                const nightDate = dates[(current_execution - 1) + j];
                if (nightDate) {
                  nightsList.push(generate_booking_query_param_date(nightDate));
                }
              }
              
              const logMessage = packageInfo.isSpecialPackage 
                ? `🎉 Distribuindo ${packageInfo.name}: R$ ${calculated_selected_block_price.toFixed(2)} por noite para ${bundle_size} noites: [${nightsList.join(', ')}]`
                : `📅 Aplicando mínimo de ${bundle_size} noites: R$ ${calculated_selected_block_price.toFixed(2)} por noite para: [${nightsList.join(', ')}]`;
              
              logger.info(logMessage, {
                property: propertyName,
                nights_to_apply: bundle_size,
                price_per_night: calculated_selected_block_price,
                nights_list: nightsList,
                is_special_package: packageInfo.isSpecialPackage,
                package_type: packageInfo.type
              });
            }

            // Salvar resultados para cada dia do bundle (mínimo de noites)
            const fs = require('fs').promises;
            const debugLog = async (msg) => {
              try {
                await fs.appendFile('D:/APPS-OSH/extrator-rate-shopper/debug_bundle.log', new Date().toISOString() + ' - ' + msg + '\n');
              } catch(e) {}
            };
            
            await debugLog(`🔄 BUNDLE LOOP START: bundle_size=${bundle_size}, current_execution=${current_execution}, dates.length=${dates.length}`);
            console.log(`🔄 Salvando bundle: ${bundle_size} dias, current_execution=${current_execution}`);
            
            for (let save_result_execution = 1; save_result_execution <= bundle_size; save_result_execution++) {
              await debugLog(`   📅 ITERATION START: ${save_result_execution}/${bundle_size}`);
              console.log(`   📅 Iteração ${save_result_execution}/${bundle_size}`);
              
              // CORRIGIDO: Calcular data diretamente a partir da data base do bundle
              const baseDate = dates[current_execution - 1]; // Data do dia atual
              const bundle_part_date = new Date(baseDate.getTime());
              bundle_part_date.setUTCDate(bundle_part_date.getUTCDate() + (save_result_execution - 1));

              // Validar se a data calculada está dentro do período de extração
              if (bundle_part_date > end_date) {
                await debugLog(`   ⏭️ BUNDLE DATE EXCEEDS END: ${generate_booking_query_param_date(bundle_part_date)} > ${end_date.toISOString().split('T')[0]}, skipping`);
                console.log(`   ⏭️ Data do bundle ${generate_booking_query_param_date(bundle_part_date)} excede período, pulando`);
                continue;
              }
              
              const dateStr = generate_booking_query_param_date(bundle_part_date);
              await debugLog(`   ✅ SAVING PRICE FOR: ${dateStr}`);
              console.log(`   ✅ Salvando preço para ${dateStr}`);

              let next_bundle_day_date = new Date(bundle_part_date.getTime());
              next_bundle_day_date.setUTCDate(next_bundle_day_date.getUTCDate() + 1);

              const final_result_current_date = generate_final_result_date(bundle_part_date);
              const final_result_next_day_date = generate_final_result_date(next_bundle_day_date);

              // Salvar diretamente no banco (se conexão disponível)
              if (dbConnection && searchId && propertyId) {
                try {
                  const priceData = {
                    check_in_date: final_result_current_date,
                    check_out_date: final_result_next_day_date,
                    price: calculated_selected_block_price,
                    room_type: cheapest_room_block.b_room_name || 'Standard',
                    currency: 'BRL',
                    is_bundle: bundle_size > 1,
                    bundle_size: bundle_size,
                    minimum_nights: minimumNightsDetected,
                    package_type: packageInfo.type,
                    package_name: packageInfo.name,
                    is_special_package: packageInfo.isSpecialPackage
                  };
                  
                  await dbConnection.savePrice(searchId, propertyId, priceData);
                  await debugLog(`   💾 DB SAVE SUCCESS: ${final_result_current_date} - R$ ${calculated_selected_block_price}`);
                  
                  // Log personalizado baseado no tipo
                  let saveLogInfo = '';
                  if (packageInfo.isSpecialPackage) {
                    saveLogInfo = ` (${packageInfo.name})`;
                  } else if (bundle_size > 1) {
                    saveLogInfo = ` (${bundle_size} noites mín.)`;
                  }
                  
                  console.log(`   💾 Preço salvo no banco: R$ ${calculated_selected_block_price.toFixed(2).replace('.', ',')}${saveLogInfo} (${priceData.room_type})`);
                } catch (dbError) {
                  await debugLog(`   ❌ DB SAVE ERROR: ${dbError.message}`);
                  console.log(`   ⚠️  Erro ao salvar no banco: ${dbError.message}`);
                  // Fallback para CSV em caso de erro no banco
                  let bundleInfo = "";
                  if (packageInfo.isSpecialPackage) {
                    bundleInfo = `${packageInfo.type} ${bundle_size}`;
                  } else if (bundle_size > 1) {
                    bundleInfo = `BUNDLE ${bundle_size} (MIN NIGHTS)`;
                  }
                  const value = `${final_result_current_date};${final_result_next_day_date};${selected_block_price_string_parsed_to_brazil_locale};${bundleInfo}`;
                  await write_to_file(results_filepath, value);
                }
              } else {
                // Fallback para CSV se não tiver conexão do banco
                let bundleInfo = "";
                if (packageInfo.isSpecialPackage) {
                  bundleInfo = `${packageInfo.type} ${bundle_size}`;
                } else if (bundle_size > 1) {
                  bundleInfo = `BUNDLE ${bundle_size} (MIN NIGHTS)`;
                }
                const value = `${final_result_current_date};${final_result_next_day_date};${selected_block_price_string_parsed_to_brazil_locale};${bundleInfo}`;
                await write_to_file(results_filepath, value);
              }
              
              logPriceExtracted(propertyName, final_result_current_date, selected_block_price_string_parsed_to_brazil_locale, bundle_size);
              totalPricesExtracted++;
              
              // Marcar esta data como processada para evitar reprocessamento
              const bundleDateKey = bundle_part_date.toISOString().split('T')[0];
              processedDates.add(bundleDateKey);
              console.log(`     📝 Data ${bundleDateKey} marcada como processada`);
            }

            success = true;
            break; // Sair do loop de retry

          } catch (error) {
            logScrapingError(propertyName, error, current_url);
            
            if (retry === maxRetries - 1) {
              logger.error(`Failed after ${maxRetries} attempts`, {
                property: propertyName,
                date: booking_query_param_current_date,
                bundle_size: bundle_size
              });
            }
          }
        }

        // Se encontrou preços válidos, sair do loop de bundle_size
        if (priceFound) break;
      }

      // Se não encontrou nenhum preço mesmo com bundle máximo, log informativo
      if (!priceFound) {
        logger.warn(`❌ Nenhum preço encontrado para ${generate_booking_query_param_date(date)} mesmo testando até ${max_bundle_size} noites`, {
          property: propertyName,
          date: generate_booking_query_param_date(date),
          max_bundle_tested: max_bundle_size
        });
      }

      logger.info(`Progress: ${current_execution}/${dates.length} dates processed`, {
        property: propertyName,
        progress: Math.round((current_execution / dates.length) * 100)
      });

      // Atualizar progresso via API em tempo real
      if (dbConnection && searchId && hotelId) {
        await dbConnection.updateExtractionProgress(searchId, hotelId, current_execution, dates.length, totalPricesExtracted);
      }
    }

  } catch (error) {
    logScrapingError(propertyName, error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
    
    const duration = Date.now() - startTime;
    logScrapingEnd(propertyName, totalPricesExtracted, duration);
  }
}

/**
 * Detecta se uma data faz parte de um pacote especial (ex: Ano Novo, feriados)
 * e retorna informações sobre o pacote
 */
function detectSpecialPackage(date, bundle_size, price) {
  const month = date.getUTCMonth() + 1; // 1-12
  const day = date.getUTCDate();
  
  // Detectar pacotes de Ano Novo (28/12 - 05/01)
  if ((month === 12 && day >= 28) || (month === 1 && day <= 5)) {
    return {
      type: 'NEW_YEAR',
      name: 'Pacote Ano Novo',
      isSpecialPackage: true,
      shouldDistribute: bundle_size >= 3, // Se for 3+ noites, provavelmente é pacote especial
      priority: 'HIGH'
    };
  }
  
  // Detectar pacotes de Carnaval (fevereiro/março - aproximado)
  if ((month === 2 && day >= 20) || (month === 3 && day <= 10)) {
    return {
      type: 'CARNIVAL',
      name: 'Pacote Carnaval',
      isSpecialPackage: true,
      shouldDistribute: bundle_size >= 3,
      priority: 'HIGH'
    };
  }
  
  // Detectar fins de semana longos (sexta a domingo = bundle_size 3)
  if (bundle_size === 3) {
    const dayOfWeek = date.getUTCDay(); // 0 = domingo, 5 = sexta
    if (dayOfWeek === 5) { // Sexta-feira
      return {
        type: 'WEEKEND_PACKAGE',
        name: 'Pacote Fim de Semana',
        isSpecialPackage: true,
        shouldDistribute: true,
        priority: 'MEDIUM'
      };
    }
  }
  
  // Não é um pacote especial
  return {
    type: 'REGULAR',
    name: 'Reserva Regular',
    isSpecialPackage: false,
    shouldDistribute: false,
    priority: 'LOW'
  };
}

/**
 * Extrai o nome da propriedade da URL
 */
function extractPropertyNameFromUrl(url) {
  try {
    const urlParts = url.split('/');
    const hotelPart = urlParts.find(part => part.includes('hotel'));
    if (hotelPart) {
      return hotelPart.split('.')[0].replace('hotel-', '').toUpperCase();
    }
    return 'UNKNOWN_PROPERTY';
  } catch (error) {
    return 'UNKNOWN_PROPERTY';
  }
}

module.exports = {
  extract_prices_from_booking,
};