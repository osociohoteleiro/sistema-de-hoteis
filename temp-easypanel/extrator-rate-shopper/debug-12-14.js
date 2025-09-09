const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const { getBrowserConfig, getRandomUserAgent, getRandomDelay } = require('./src/browser-config');
const { wait, generate_booking_query_param_date, new_generate_new_booking_url } = require('./src/utils');

async function debugBooking12to14() {
  console.log('🔍 DEBUG: Verificando se há preços para 12→14 setembro na Booking');
  
  let browser = null;
  
  try {
    const url = 'https://www.booking.com/hotel/br/caribe-ubatuba.pt-br.html';
    const checkin_str = '2025-09-12';
    const checkout_str = '2025-09-14';
    
    const booking_url = new_generate_new_booking_url(url, checkin_str, checkout_str);
    
    console.log('🏨 Venice Hotel (Caribe Ubatuba)');
    console.log('📅 12/09 → 14/09 (2 noites)');
    console.log('🌐 URL:', booking_url);
    console.log('');
    
    // Configurar browser
    const browserConfig = getBrowserConfig();
    browser = await puppeteer.launch(browserConfig);
    const page = await browser.newPage();
    
    await page.setUserAgent(getRandomUserAgent());
    await page.setExtraHTTPHeaders({
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    });
    
    // Interceptar recursos desnecessários
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });
    
    console.log('🔄 Carregando página...');
    await page.goto(booking_url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await wait(4000);
    
    console.log('📊 Analisando dados retornados...');
    
    const result = await page.evaluate(() => {
      try {
        if (!window.booking || !window.booking.env) {
          return { error: 'window.booking.env não encontrado' };
        }
        
        const env = window.booking.env;
        const rooms = env.b_rooms_available_and_soldout;
        
        if (!rooms || !rooms.length) {
          return { 
            hasRooms: false, 
            roomsCount: 0, 
            message: 'Nenhum quarto disponível' 
          };
        }
        
        // Contar todos os blocos
        let totalBlocks = 0;
        let blocksFor2People = 0;
        let cheapestPrice = null;
        let cheapestRoom = null;
        
        const roomsInfo = rooms.map(room => {
          const blocks = room.b_blocks || [];
          totalBlocks += blocks.length;
          
          const validBlocks = blocks.filter(block => block.b_max_persons === 2);
          blocksFor2People += validBlocks.length;
          
          if (validBlocks.length > 0) {
            const prices = validBlocks.map(block => block.b_price_breakdown_simplified.b_headline_price_amount);
            const minPrice = Math.min(...prices);
            
            if (cheapestPrice === null || minPrice < cheapestPrice) {
              cheapestPrice = minPrice;
              cheapestRoom = room.b_room_name;
            }
          }
          
          return {
            name: room.b_room_name,
            totalBlocks: blocks.length,
            blocksFor2People: validBlocks.length,
            prices: blocks.map(block => ({
              maxPersons: block.b_max_persons,
              price: block.b_price_breakdown_simplified.b_headline_price_amount
            }))
          };
        });
        
        return {
          hasRooms: true,
          roomsCount: rooms.length,
          totalBlocks,
          blocksFor2People,
          cheapestPrice,
          cheapestRoom,
          rooms: roomsInfo
        };
        
      } catch (error) {
        return { error: 'Erro ao processar dados: ' + error.message };
      }
    });
    
    console.log('');
    console.log('📋 RESULTADO COMPLETO:');
    console.log('======================');
    
    if (result.error) {
      console.log('❌ ERRO:', result.error);
    } else if (!result.hasRooms) {
      console.log('❌ Nenhum quarto encontrado na página');
    } else {
      console.log('✅ Quartos encontrados:', result.roomsCount);
      console.log('📦 Total de blocos:', result.totalBlocks);
      console.log('👥 Blocos para 2 pessoas:', result.blocksFor2People);
      
      if (result.cheapestPrice) {
        const pricePerNight = result.cheapestPrice / 2;
        console.log('');
        console.log('💰 MENOR PREÇO ENCONTRADO:');
        console.log(`   Quarto: ${result.cheapestRoom}`);
        console.log(`   Preço total: R$ ${result.cheapestPrice.toFixed(2)}`);
        console.log(`   Por noite: R$ ${pricePerNight.toFixed(2)}`);
        console.log('');
        console.log('🎉 MÍNIMO DE NOITES DETECTADO COM SUCESSO!');
        console.log('   O preço seria dividido por 2 e aplicado aos dias 12/09 e 13/09');
      } else {
        console.log('❌ Nenhum preço para 2 pessoas encontrado');
      }
      
      console.log('');
      console.log('🏠 DETALHES DOS QUARTOS:');
      result.rooms.forEach((room, index) => {
        console.log(`${index + 1}. ${room.name}`);
        console.log(`   Blocos total: ${room.totalBlocks} | Para 2 pessoas: ${room.blocksFor2People}`);
        if (room.prices.length > 0) {
          room.prices.forEach(price => {
            console.log(`   - ${price.maxPersons} pessoas: R$ ${price.price.toFixed(2)}`);
          });
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

debugBooking12to14().catch(console.error);