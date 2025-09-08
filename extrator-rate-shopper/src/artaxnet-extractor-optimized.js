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
} = require('./utils');

/**
 * Extrator otimizado de preços do Artaxnet com suporte completo ao Linux
 * @param {string} url - URL da propriedade no Artaxnet
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
async function extract_prices_from_artaxnet(url, start_date, end_date, max_bundle_size, results_filepath, dbConnection = null, searchId = null, propertyId = null, hotelId = null) {
  const startTime = Date.now();
  const dates = get_dates_between(start_date, end_date);
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

      // Lógica para detectar mínimo de noites (similar ao Booking)
      let priceFound = false;
      let minimumNightsDetected = 1;
      
      logger.info(`🔍 Iniciando busca incremental para ${generate_booking_query_param_date(date)}`, {
        property: propertyName,
        date: generate_booking_query_param_date(date),
        max_bundle_size: max_bundle_size,
        platform: 'Artaxnet'
      });
      
      for (let bundle_size = 1; bundle_size <= max_bundle_size && !priceFound; bundle_size++) {
        // Calcular data de checkout
        let checkout_date = new Date(date.getTime());
        checkout_date.setUTCDate(checkout_date.getUTCDate() + bundle_size);

        const checkin_str = generate_artaxnet_date_format(date);
        const checkout_str = generate_artaxnet_date_format(checkout_date);

        logger.info(`🧪 Testando ${bundle_size} noite(s): ${checkin_str} → ${checkout_str}`, {
          property: propertyName,
          checkin: checkin_str,
          checkout: checkout_str,
          nights: bundle_size,
          platform: 'Artaxnet'
        });

        current_url = generate_artaxnet_url(
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

            // Aguardar elementos carregarem completamente
            await main_page.waitForSelector('body', { timeout: 10000 });

            // Tentar extrair dados do Artaxnet
            const artaxnet_data = await extractArtaxnetPriceData(main_page);

            if (!artaxnet_data.rooms || !artaxnet_data.rooms.length) {
              logger.info(`❌ Sem quartos disponíveis para ${bundle_size} noite(s): ${checkin_str} → ${checkout_str}`, {
                property: propertyName,
                checkin: checkin_str,
                checkout: checkout_str,
                nights: bundle_size,
                attempt: `${bundle_size}/${max_bundle_size}`,
                platform: 'Artaxnet'
              });
              success = true;
              break;
            }

            // Filtrar quartos válidos (mínimo 2 pessoas)
            const valid_rooms = artaxnet_data.rooms.filter(room => {
              return room.capacity >= 2 && room.price > 0;
            });

            if (!valid_rooms.length) {
              logger.info(`❌ Sem quartos válidos (mín. 2 pessoas) para ${bundle_size} noite(s): ${checkin_str} → ${checkout_str}`, {
                property: propertyName,
                checkin: checkin_str,
                checkout: checkout_str,
                nights: bundle_size,
                attempt: `${bundle_size}/${max_bundle_size}`,
                platform: 'Artaxnet',
                note: 'Buscando quartos com capacidade >= 2 pessoas'
              });
              success = true;
              break;
            }

            logger.info(`✅ Quartos encontrados para ${bundle_size} noite(s): ${valid_rooms.length} opções disponíveis`, {
              property: propertyName,
              checkin: checkin_str,
              checkout: checkout_str,
              nights: bundle_size,
              rooms_found: valid_rooms.length,
              capacities: valid_rooms.map(room => room.capacity),
              platform: 'Artaxnet'
            });

            // SE CHEGOU ATÉ AQUI, ENCONTROU QUARTOS VÁLIDOS!
            hasValidRooms = true;
            priceFound = true;
            minimumNightsDetected = bundle_size;

            // Ordenar por preço
            valid_rooms.sort((roomA, roomB) => roomA.price - roomB.price);

            const cheapest_room = valid_rooms[0];
            const selected_price = cheapest_room.price;
            const calculated_price_per_night = selected_price / bundle_size;

            // Detectar se é um pacote especial
            const packageInfo = detectSpecialPackage(date, bundle_size, selected_price);
            
            // Log sobre sucesso na detecção
            if (packageInfo.isSpecialPackage) {
              logger.info(`🎉 ${packageInfo.name} ENCONTRADO! ${checkin_str} → ${checkout_str} (${bundle_size} noites)`, {
                property: propertyName,
                checkin: checkin_str,
                checkout: checkout_str,
                package_type: packageInfo.type,
                package_name: packageInfo.name,
                nights: bundle_size,
                total_price: selected_price,
                per_night_price: calculated_price_per_night,
                priority: packageInfo.priority,
                room_type: cheapest_room.name || 'Standard',
                platform: 'Artaxnet'
              });
            } else if (bundle_size > 1) {
              logger.info(`✅ MÍNIMO DE NOITES DETECTADO! ${checkin_str} → ${checkout_str} (${bundle_size} noites)`, {
                property: propertyName,
                checkin: checkin_str,
                checkout: checkout_str,
                minimum_nights: bundle_size,
                total_price: selected_price,
                per_night_price: calculated_price_per_night,
                room_type: cheapest_room.name || 'Standard',
                platform: 'Artaxnet',
                message: `Preço encontrado apenas com ${bundle_size} noites - será dividido por ${bundle_size} dias`
              });
            } else {
              logger.info(`✅ Preço encontrado para 1 noite: ${checkin_str} → ${checkout_str}`, {
                property: propertyName,
                checkin: checkin_str,
                checkout: checkout_str,
                price: calculated_price_per_night,
                room_type: cheapest_room.name || 'Standard',
                platform: 'Artaxnet'
              });
            }

            const price_string = calculated_price_per_night.toFixed(2);
            const price_string_brazil_locale = price_string.split('.').join(',');

            // Salvar resultados para cada dia do bundle
            const fs = require('fs').promises;
            const debugLog = async (msg) => {
              try {
                await fs.appendFile('D:/APPS-OSH/extrator-rate-shopper/debug_artaxnet_bundle.log', new Date().toISOString() + ' - ' + msg + '\n');
              } catch(e) {}
            };
            
            await debugLog(`🔄 ARTAXNET BUNDLE LOOP START: bundle_size=${bundle_size}, current_execution=${current_execution}, dates.length=${dates.length}`);
            console.log(`🔄 Salvando bundle Artaxnet: ${bundle_size} dias, current_execution=${current_execution}`);
            
            for (let save_result_execution = 1; save_result_execution <= bundle_size; save_result_execution++) {
              await debugLog(`   📅 ARTAXNET ITERATION START: ${save_result_execution}/${bundle_size}`);
              console.log(`   📅 Artaxnet - Iteração ${save_result_execution}/${bundle_size}`);
              
              // Calcular data diretamente a partir da data base do bundle
              const baseDate = dates[current_execution - 1];
              const bundle_part_date = new Date(baseDate.getTime());
              bundle_part_date.setUTCDate(bundle_part_date.getUTCDate() + (save_result_execution - 1));

              // Validar se a data calculada está dentro do período
              if (bundle_part_date > end_date) {
                await debugLog(`   ⏭️ ARTAXNET BUNDLE DATE EXCEEDS END: ${generate_booking_query_param_date(bundle_part_date)} > ${end_date.toISOString().split('T')[0]}, skipping`);
                console.log(`   ⏭️ Data do bundle Artaxnet ${generate_booking_query_param_date(bundle_part_date)} excede período, pulando`);
                continue;
              }
              
              const dateStr = generate_booking_query_param_date(bundle_part_date);
              await debugLog(`   ✅ ARTAXNET SAVING PRICE FOR: ${dateStr}`);
              console.log(`   ✅ Artaxnet - Salvando preço para ${dateStr}`);

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
                    price: calculated_price_per_night,
                    room_type: cheapest_room.name || 'Standard',
                    currency: 'BRL',
                    is_bundle: bundle_size > 1,
                    bundle_size: bundle_size,
                    minimum_nights: minimumNightsDetected,
                    package_type: packageInfo.type,
                    package_name: packageInfo.name,
                    is_special_package: packageInfo.isSpecialPackage,
                    platform: 'Artaxnet'
                  };
                  
                  await dbConnection.savePrice(searchId, propertyId, priceData);
                  await debugLog(`   💾 ARTAXNET DB SAVE SUCCESS: ${final_result_current_date} - R$ ${calculated_price_per_night}`);
                  
                  // Log personalizado baseado no tipo
                  let saveLogInfo = '';
                  if (packageInfo.isSpecialPackage) {
                    saveLogInfo = ` (${packageInfo.name})`;
                  } else if (bundle_size > 1) {
                    saveLogInfo = ` (${bundle_size} noites mín.)`;
                  }
                  
                  console.log(`   💾 Artaxnet - Preço salvo no banco: R$ ${calculated_price_per_night.toFixed(2).replace('.', ',')}${saveLogInfo} (${priceData.room_type})`);
                } catch (dbError) {
                  await debugLog(`   ❌ ARTAXNET DB SAVE ERROR: ${dbError.message}`);
                  console.log(`   ⚠️  Artaxnet - Erro ao salvar no banco: ${dbError.message}`);
                  // Fallback para CSV
                  let bundleInfo = "";
                  if (packageInfo.isSpecialPackage) {
                    bundleInfo = `ARTAXNET ${packageInfo.type} ${bundle_size}`;
                  } else if (bundle_size > 1) {
                    bundleInfo = `ARTAXNET BUNDLE ${bundle_size} (MIN NIGHTS)`;
                  } else {
                    bundleInfo = `ARTAXNET`;
                  }
                  const value = `${final_result_current_date};${final_result_next_day_date};${price_string_brazil_locale};${bundleInfo}`;
                  await write_to_file(results_filepath, value);
                }
              } else {
                // Fallback para CSV
                let bundleInfo = "";
                if (packageInfo.isSpecialPackage) {
                  bundleInfo = `ARTAXNET ${packageInfo.type} ${bundle_size}`;
                } else if (bundle_size > 1) {
                  bundleInfo = `ARTAXNET BUNDLE ${bundle_size} (MIN NIGHTS)`;
                } else {
                  bundleInfo = `ARTAXNET`;
                }
                const value = `${final_result_current_date};${final_result_next_day_date};${price_string_brazil_locale};${bundleInfo}`;
                await write_to_file(results_filepath, value);
              }
              
              logPriceExtracted(propertyName, final_result_current_date, price_string_brazil_locale, bundle_size);
              totalPricesExtracted++;
              
              // Marcar esta data como processada
              const bundleDateKey = bundle_part_date.toISOString().split('T')[0];
              processedDates.add(bundleDateKey);
              console.log(`     📝 Artaxnet - Data ${bundleDateKey} marcada como processada`);
            }

            success = true;
            break; // Sair do loop de retry

          } catch (error) {
            logScrapingError(propertyName, error, current_url);
            
            if (retry === maxRetries - 1) {
              logger.error(`Artaxnet - Failed after ${maxRetries} attempts`, {
                property: propertyName,
                date: generate_booking_query_param_date(date),
                bundle_size: bundle_size,
                platform: 'Artaxnet'
              });
            }
          }
        }

        // Se encontrou preços válidos, sair do loop de bundle_size
        if (priceFound) break;
      }

      // Se não encontrou nenhum preço
      if (!priceFound) {
        logger.warn(`❌ Artaxnet - Nenhum preço encontrado para ${generate_booking_query_param_date(date)} mesmo testando até ${max_bundle_size} noites`, {
          property: propertyName,
          date: generate_booking_query_param_date(date),
          max_bundle_tested: max_bundle_size,
          platform: 'Artaxnet'
        });
      }

      logger.info(`Artaxnet Progress: ${current_execution}/${dates.length} dates processed`, {
        property: propertyName,
        progress: Math.round((current_execution / dates.length) * 100),
        platform: 'Artaxnet'
      });

      // Atualizar progresso via API
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
 * Extrai dados de preços específicos do Artaxnet
 */
async function extractArtaxnetPriceData(page) {
  try {
    // Aguardar elementos do Artaxnet carregarem
    await wait(3000);

    // Tentar diferentes seletores comuns do Artaxnet
    const priceData = await page.evaluate(() => {
      const rooms = [];
      
      // Tentar extrair dados via seletores comuns do Artaxnet
      // Estratégia 1: Procurar por elementos com classes relacionadas a preços
      const priceSelectors = [
        '.price',
        '.valor',
        '.tarifa',
        '.room-price',
        '.accommodation-price',
        '.daily-rate',
        '[data-price]',
        '.currency'
      ];

      const roomSelectors = [
        '.room',
        '.accommodation',
        '.quarto',
        '.suite',
        '.apartamento',
        '.unit'
      ];

      // Tentar encontrar elementos de quarto e preço
      roomSelectors.forEach(roomSelector => {
        const roomElements = document.querySelectorAll(roomSelector);
        
        roomElements.forEach((roomElement, index) => {
          let price = 0;
          let roomName = `Quarto ${index + 1}`;
          let capacity = 2; // Default

          // Buscar preço dentro do elemento do quarto
          priceSelectors.forEach(priceSelector => {
            if (price > 0) return;
            
            const priceElement = roomElement.querySelector(priceSelector) || 
                               document.querySelector(priceSelector);
            
            if (priceElement) {
              const priceText = priceElement.textContent || priceElement.innerText || '';
              const priceMatch = priceText.match(/[\d.,]+/);
              if (priceMatch) {
                price = parseFloat(priceMatch[0].replace(',', '.'));
              }
            }
          });

          // Buscar nome do quarto
          const nameElement = roomElement.querySelector('h1, h2, h3, h4, .title, .name, .room-name') ||
                             roomElement;
          if (nameElement && nameElement.textContent) {
            roomName = nameElement.textContent.trim();
          }

          // Buscar capacidade
          const capacityText = roomElement.textContent || '';
          const capacityMatch = capacityText.match(/(\d+)\s*(pessoas?|pax|guests?|adults?)/i);
          if (capacityMatch) {
            capacity = parseInt(capacityMatch[1]);
          }

          if (price > 0) {
            rooms.push({
              name: roomName,
              price: price,
              capacity: capacity,
              source: 'dom-extraction'
            });
          }
        });
      });

      // Estratégia 2: Procurar por variáveis JavaScript globais
      if (rooms.length === 0) {
        // Verificar se existem variáveis globais com dados
        if (window.roomData || window.accommodations || window.prices) {
          const data = window.roomData || window.accommodations || window.prices;
          if (Array.isArray(data)) {
            data.forEach(item => {
              if (item.price || item.valor || item.tarifa) {
                rooms.push({
                  name: item.name || item.nome || 'Quarto Padrão',
                  price: item.price || item.valor || item.tarifa,
                  capacity: item.capacity || item.capacidade || 2,
                  source: 'js-variable'
                });
              }
            });
          }
        }
      }

      // Estratégia 3: Busca mais agressiva por números que parecem preços
      if (rooms.length === 0) {
        const allText = document.body.textContent || '';
        const priceMatches = allText.match(/R\$\s*[\d.,]+|\d+[,.]?\d*\s*(?:reais?|R\$)/gi);
        
        if (priceMatches) {
          priceMatches.forEach((match, index) => {
            const priceMatch = match.match(/[\d.,]+/);
            if (priceMatch) {
              const price = parseFloat(priceMatch[0].replace(',', '.'));
              if (price > 50 && price < 2000) { // Filtro básico para preços razoáveis
                rooms.push({
                  name: `Opção ${index + 1}`,
                  price: price,
                  capacity: 2,
                  source: 'text-extraction'
                });
              }
            }
          });
        }
      }

      return { rooms };
    });

    console.log(`🏨 Artaxnet - Encontrados ${priceData.rooms.length} quartos:`, 
      priceData.rooms.map(r => `${r.name}: R$ ${r.price} (${r.capacity} pax)`));

    return priceData;

  } catch (error) {
    console.error('Erro ao extrair dados do Artaxnet:', error.message);
    return { rooms: [] };
  }
}

/**
 * Gera URL do Artaxnet com parâmetros de data
 */
function generate_artaxnet_url(base_url, checkin_date, checkout_date) {
  try {
    const url = new URL(base_url);
    
    // Remover o hash fragment se existir
    url.hash = '';
    
    // Definir parâmetros de data no formato esperado pelo Artaxnet
    url.searchParams.set('start', checkin_date);
    url.searchParams.set('end', checkout_date);
    url.searchParams.set('adults', '2'); // Default 2 adultos
    
    // Adicionar hash fragment se necessário
    url.hash = `/?start=${checkin_date}&end=${checkout_date}&adults=2`;
    
    return url.toString();
  } catch (error) {
    console.error('Erro ao gerar URL Artaxnet:', error.message);
    // Fallback: tentar substituição simples
    return base_url.replace(/start=[^&]*/, `start=${checkin_date}`)
                  .replace(/end=[^&]*/, `end=${checkout_date}`);
  }
}

/**
 * Converte Date para formato esperado pelo Artaxnet (YYYY-MM-DD)
 */
function generate_artaxnet_date_format(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Detecta pacotes especiais (mesmo do Booking)
 */
function detectSpecialPackage(date, bundle_size, price) {
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  
  // Pacotes de Ano Novo
  if ((month === 12 && day >= 28) || (month === 1 && day <= 5)) {
    return {
      type: 'NEW_YEAR',
      name: 'Pacote Ano Novo',
      isSpecialPackage: true,
      shouldDistribute: bundle_size >= 3,
      priority: 'HIGH'
    };
  }
  
  // Pacotes de Carnaval
  if ((month === 2 && day >= 20) || (month === 3 && day <= 10)) {
    return {
      type: 'CARNIVAL',
      name: 'Pacote Carnaval',
      isSpecialPackage: true,
      shouldDistribute: bundle_size >= 3,
      priority: 'HIGH'
    };
  }
  
  // Fins de semana longos
  if (bundle_size === 3) {
    const dayOfWeek = date.getUTCDay();
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
  
  return {
    type: 'REGULAR',
    name: 'Reserva Regular',
    isSpecialPackage: false,
    shouldDistribute: false,
    priority: 'LOW'
  };
}

/**
 * Extrai nome da propriedade da URL do Artaxnet
 */
function extractPropertyNameFromUrl(url) {
  try {
    const urlParts = url.split('/');
    // Para URLs do Artaxnet, o nome geralmente está no subdomínio
    const hostParts = new URL(url).hostname.split('.');
    if (hostParts.length > 0) {
      return hostParts[0].toUpperCase().replace(/-/g, '_');
    }
    return 'ARTAXNET_PROPERTY';
  } catch (error) {
    return 'ARTAXNET_PROPERTY';
  }
}

module.exports = {
  extract_prices_from_artaxnet,
};