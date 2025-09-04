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
 * @returns {Promise<void>}
 */
async function extract_prices_from_booking(url, start_date, end_date, max_bundle_size, results_filepath) {
  const startTime = Date.now();
  const dates = get_dates_between(start_date, end_date);
  const propertyName = extractPropertyNameFromUrl(url);

  logScrapingStart(propertyName, `${start_date.toISOString().split('T')[0]} to ${end_date.toISOString().split('T')[0]}`);

  let browser = null;
  let totalPricesExtracted = 0;
  
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
    let amount_of_dates_to_jump_after_bundle_found = null;

    for (const date of dates) {
      const current_execution = i;
      i++;

      if (amount_of_dates_to_jump_after_bundle_found <= 0) {
        amount_of_dates_to_jump_after_bundle_found = null;
      }

      if (amount_of_dates_to_jump_after_bundle_found) {
        amount_of_dates_to_jump_after_bundle_found--;
        logger.info(`Skipping date due to bundle - ${current_execution} of ${dates.length}`);
        continue;
      }

      // Tentar diferentes tamanhos de bundle
      for (let bundle_size = 1; bundle_size <= max_bundle_size; bundle_size++) {
        let next_day_date = new Date(date.getTime());
        next_day_date.setUTCDate(next_day_date.getUTCDate() + bundle_size);

        const booking_query_param_current_date = generate_booking_query_param_date(date);
        const booking_query_param_next_day_date = generate_booking_query_param_date(next_day_date);

        current_url = new_generate_new_booking_url(
          url,
          booking_query_param_current_date,
          booking_query_param_next_day_date,
        );

        // Sistema de retry
        const maxRetries = 3;
        let success = false;

        for (let retry = 0; retry < maxRetries && !success; retry++) {
          try {
            if (retry > 0) {
              logRetryAttempt(propertyName, retry + 1, maxRetries, new Error('Previous attempt failed'));
              await wait(getRandomDelay(5000, 10000)); // Delay maior no retry
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
              logger.info(`No rooms available for ${booking_query_param_current_date}`, {
                property: propertyName,
                date: booking_query_param_current_date
              });
              success = true; // Não é erro, apenas não há quartos
              break;
            }

            // Filtrar quartos válidos (máximo 2 pessoas)
            let valid_room_blocks = [];
            for (const room of booking_data.b_rooms_available_and_soldout) {
              const filtered_room_blocks = room.b_blocks.filter((room_block) => {
                return room_block.b_max_persons === 2;
              });

              if (filtered_room_blocks.length) {
                valid_room_blocks = valid_room_blocks.concat(filtered_room_blocks);
              }
            }

            if (!valid_room_blocks.length) {
              logger.info(`No valid room blocks for ${booking_query_param_current_date}`, {
                property: propertyName,
                date: booking_query_param_current_date
              });
              success = true;
              break;
            }

            // Ordenar por preço
            valid_room_blocks.sort((roomA, roomB) => {
              return roomA.b_price_breakdown_simplified.b_headline_price_amount - 
                     roomB.b_price_breakdown_simplified.b_headline_price_amount;
            });

            const cheapest_room_block = valid_room_blocks[0];
            const selected_block_price = cheapest_room_block.b_price_breakdown_simplified.b_headline_price_amount;
            const calculated_selected_block_price = selected_block_price / bundle_size;

            const selected_block_price_string = calculated_selected_block_price.toFixed(2);
            const selected_block_price_string_parsed_to_brazil_locale = 
              selected_block_price_string.split('.').join(',');

            // Configurar pulo de datas se for bundle
            if (bundle_size > 1) {
              amount_of_dates_to_jump_after_bundle_found = bundle_size - 1;
            }

            // Salvar resultados para cada dia do bundle
            for (let save_result_execution = 1; save_result_execution <= bundle_size; save_result_execution++) {
              const bundle_part_date = dates[(current_execution - 1) + (save_result_execution - 1)];

              if (!bundle_part_date) break;

              let next_bundle_day_date = new Date(date.getTime());
              next_bundle_day_date.setUTCDate(next_bundle_day_date.getUTCDate() + 1);

              const final_result_current_date = generate_final_result_date(bundle_part_date);
              const final_result_next_day_date = generate_final_result_date(next_bundle_day_date);

              const value = `${final_result_current_date};${final_result_next_day_date};${selected_block_price_string_parsed_to_brazil_locale};${bundle_size > 1 ? "BUNDLE " + bundle_size : ""}`;
              await write_to_file(results_filepath, value);
              
              logPriceExtracted(propertyName, final_result_current_date, selected_block_price_string_parsed_to_brazil_locale, bundle_size);
              totalPricesExtracted++;
            }

            success = true;
            break; // Sair do loop de bundle_size

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

        if (success) break; // Se conseguiu extrair, não precisa testar outros bundle sizes
      }

      logger.info(`Progress: ${current_execution}/${dates.length} dates processed`, {
        property: propertyName,
        progress: Math.round((current_execution / dates.length) * 100)
      });
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