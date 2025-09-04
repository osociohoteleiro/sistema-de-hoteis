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
 * Extrator de preços do Booking.com DATA POR DATA (anti-detecção)
 * Processa uma data por vez com delays realistas para simular comportamento humano
 * @param {string} url - URL da propriedade no Booking
 * @param {Date} start_date - Data de início
 * @param {Date} end_date - Data de fim
 * @param {number} max_bundle_size - Tamanho máximo do bundle (ignorado, sempre 1)
 * @param {string} results_filepath - Caminho do arquivo de resultados
 * @returns {Promise<void>}
 */
async function extract_prices_from_booking(url, start_date, end_date, max_bundle_size, results_filepath) {
  const startTime = Date.now();
  const dates = get_dates_between(start_date, end_date);
  const propertyName = extractPropertyNameFromUrl(url);

  logScrapingStart(propertyName, `${start_date.toISOString().split('T')[0]} to ${end_date.toISOString().split('T')[0]}`);
  
  console.log(`🏨 ${propertyName}: Extraindo ${dates.length} datas individualmente`);
  console.log(`⏱️  Tempo estimado: ${Math.ceil(dates.length * 15 / 60)} minutos (15s por data)`);

  let browser = null;
  let totalPricesExtracted = 0;
  let totalDatesProcessed = 0;
  
  try {
    // Configuração otimizada do browser
    const browserConfig = getBrowserConfig();
    browser = await puppeteer.launch(browserConfig);
    
    const main_page = await browser.newPage();
    
    // Configurar User-Agent aleatório
    await main_page.setUserAgent(getRandomUserAgent());
    
    // Headers realistas para simular navegador humano
    await main_page.setExtraHTTPHeaders({
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      'Cache-Control': 'max-age=0',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      'DNT': '1'
    });

    // Configurar viewport realista
    await main_page.setViewport({
      width: 1366 + Math.floor(Math.random() * 200),
      height: 768 + Math.floor(Math.random() * 200),
      deviceScaleFactor: 1,
      hasTouch: false,
      isLandscape: true,
      isMobile: false,
    });

    // Interceptar e bloquear recursos desnecessários para economizar banda
    await main_page.setRequestInterception(true);
    main_page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // PROCESSAR DATA POR DATA COM DELAYS
    for (let i = 0; i < dates.length; i++) {
      const currentDate = dates[i];
      const progress = Math.round((i / dates.length) * 100);
      
      console.log(`📅 [${i + 1}/${dates.length}] Processando: ${currentDate.toLocaleDateString('pt-BR')} (${progress}%)`);
      
      try {
        // Calcular data de checkout (1 noite)
        const nextDate = new Date(currentDate.getTime());
        nextDate.setUTCDate(nextDate.getUTCDate() + 1);

        const checkinParam = generate_booking_query_param_date(currentDate);
        const checkoutParam = generate_booking_query_param_date(nextDate);

        const searchUrl = new_generate_new_booking_url(url, checkinParam, checkoutParam);

        // SISTEMA DE RETRY ROBUSTO
        const maxRetries = 3;
        let success = false;
        let lastError = null;

        for (let retry = 0; retry < maxRetries && !success; retry++) {
          try {
            if (retry > 0) {
              const retryDelay = getRandomDelay(10000, 20000); // 10-20s entre retries
              console.log(`   🔄 Retry ${retry}/${maxRetries - 1} em ${Math.round(retryDelay/1000)}s...`);
              logRetryAttempt(propertyName, retry + 1, maxRetries, lastError);
              await wait(retryDelay);
            }

            // DELAY HUMANIZADO ANTES DE CADA REQUISIÇÃO
            if (i > 0 || retry > 0) {
              const humanDelay = getRandomDelay(8000, 18000); // 8-18s entre requisições
              console.log(`   ⏳ Aguardando ${Math.round(humanDelay/1000)}s (comportamento humano)...`);
              await wait(humanDelay);
            }

            // Navegar para a URL com timeout generoso
            console.log(`   🌐 Acessando: ${searchUrl.substring(0, 80)}...`);
            
            await Promise.race([
              main_page.goto(searchUrl, { 
                waitUntil: 'domcontentloaded',
                timeout: 45000 
              }),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Navigation timeout')), 50000)
              )
            ]);

            // Aguardar carregamento completo com delay humanizado
            const loadDelay = getRandomDelay(5000, 12000);
            console.log(`   ⏳ Aguardando carregamento (${Math.round(loadDelay/1000)}s)...`);
            await wait(loadDelay);

            // Verificar se a página carregou corretamente
            const pageTitle = await main_page.title();
            if (pageTitle.includes('Error') || pageTitle.includes('404') || pageTitle.includes('Access Denied')) {
              throw new Error(`Page error detected: ${pageTitle}`);
            }

            // Simular comportamento humano - scroll aleatório
            await simulateHumanBehavior(main_page);

            // Extrair dados do window.booking.env
            const booking_data = await main_page.evaluate(() => {
              if (!window.booking || !window.booking.env) {
                throw new Error('Booking data not found - page may not be loaded correctly');
              }
              return window.booking.env;
            });

            // Verificar se há quartos disponíveis
            if (!booking_data.b_rooms_available_and_soldout || !booking_data.b_rooms_available_and_soldout.length) {
              console.log(`   ❌ Sem quartos disponíveis para ${currentDate.toLocaleDateString('pt-BR')}`);
              success = true; // Não é erro, apenas não há quartos
              break;
            }

            // EXTRAIR PREÇOS
            const roomsData = booking_data.b_rooms_available_and_soldout;
            let pricesFound = 0;

            for (const room of roomsData) {
              if (room && room.b_raw_price) {
                const price = parseFloat(room.b_raw_price.toString().replace(',', '.'));
                const roomType = room.b_room_name || 'Standard';
                
                if (!isNaN(price) && price > 0) {
                  // Salvar no formato CSV brasileiro
                  const csvLine = `${generate_final_result_date(currentDate)};${generate_final_result_date(nextDate)};${price.toFixed(2).replace('.', ',')};${roomType}`;
                  write_to_file(results_filepath, csvLine);
                  
                  console.log(`   💰 Preço encontrado: R$ ${price.toFixed(2).replace('.', ',')} (${roomType})`);
                  
                  logPriceExtracted(propertyName, generate_final_result_date(currentDate), price.toFixed(2), 1);
                  totalPricesExtracted++;
                  pricesFound++;
                }
              }
            }

            if (pricesFound === 0) {
              console.log(`   ⚠️  Nenhum preço válido encontrado para ${currentDate.toLocaleDateString('pt-BR')}`);
            }

            success = true;
            totalDatesProcessed++;

            // Log de progresso
            logger.info(`Progress: ${totalDatesProcessed}/${dates.length} dates processed`, {
              property: propertyName,
              progress: Math.round((totalDatesProcessed / dates.length) * 100)
            });

          } catch (error) {
            lastError = error;
            console.log(`   ❌ Erro na tentativa ${retry + 1}: ${error.message}`);
            
            if (retry === maxRetries - 1) {
              console.log(`   💀 Falha definitiva em ${currentDate.toLocaleDateString('pt-BR')} após ${maxRetries} tentativas`);
              logger.error(`Failed to process date ${currentDate.toLocaleDateString('pt-BR')}`, {
                property: propertyName,
                date: currentDate,
                error: error.message,
                retries: maxRetries
              });
            }
          }
        }

      } catch (dateError) {
        console.log(`💥 Erro crítico processando ${currentDate.toLocaleDateString('pt-BR')}: ${dateError.message}`);
        logger.error(`Critical error processing date`, {
          property: propertyName,
          date: currentDate,
          error: dateError.message
        });
      }

      // DELAY EXTRA A CADA 5 DATAS (simular pausa humana)
      if ((i + 1) % 5 === 0 && i < dates.length - 1) {
        const pauseDelay = getRandomDelay(30000, 60000); // 30-60s pausa
        console.log(`   🧘 Pausa estratégica de ${Math.round(pauseDelay/1000)}s (a cada 5 datas)...`);
        await wait(pauseDelay);
      }
    }

  } catch (error) {
    logScrapingError(propertyName, error.message);
    console.error(`💥 Erro crítico na extração: ${error.message}`);
    throw error;

  } finally {
    if (browser) {
      await browser.close();
    }

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log(`\n📊 RESUMO DA EXTRAÇÃO:`);
    console.log(`🏨 Hotel: ${propertyName}`);
    console.log(`📅 Datas processadas: ${totalDatesProcessed}/${dates.length}`);
    console.log(`💰 Preços extraídos: ${totalPricesExtracted}`);
    console.log(`⏱️  Tempo total: ${Math.floor(duration / 60)}min ${duration % 60}s`);
    console.log(`📁 Arquivo salvo: ${results_filepath}`);

    logScrapingEnd(propertyName, totalPricesExtracted, duration);
  }
}

/**
 * Simula comportamento humano na página
 */
async function simulateHumanBehavior(page) {
  try {
    // Scroll aleatório para simular leitura
    const scrolls = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < scrolls; i++) {
      const scrollY = Math.floor(Math.random() * 500) + 200;
      await page.evaluate((y) => window.scrollTo(0, y), scrollY);
      await wait(getRandomDelay(1000, 3000));
    }
    
    // Voltar ao topo
    await page.evaluate(() => window.scrollTo(0, 0));
    await wait(getRandomDelay(500, 1500));
  } catch (error) {
    // Ignorar erros de simulação
  }
}

/**
 * Extrai nome da propriedade da URL
 */
function extractPropertyNameFromUrl(url) {
  try {
    const match = url.match(/\/hotel\/[^\/]+\/([^\/\.]+)/);
    return match ? match[1].toUpperCase() : 'HOTEL';
  } catch (error) {
    return 'HOTEL';
  }
}

module.exports = {
  extract_prices_from_booking
};