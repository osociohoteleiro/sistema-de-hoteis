const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const { getBrowserConfig, getRandomUserAgent, getRandomDelay } = require('./extrator-rate-shopper/src/browser-config');
const { wait, generate_booking_query_param_date, new_generate_new_booking_url } = require('./extrator-rate-shopper/src/utils');

async function debugBookingResponse() {
  console.log('🔍 DEBUG: Analisando resposta real da Booking para 12→14 setembro');
  
  let browser = null;
  
  try {
    // URL correta
    const url = 'https://www.booking.com/hotel/br/caribe-ubatuba.pt-br.html';
    
    // Período específico: 12→14 (2 noites)
    const checkinDate = new Date('2025-09-12');
    const checkoutDate = new Date('2025-09-14');
    
    const checkin_str = generate_booking_query_param_date(checkinDate);
    const checkout_str = generate_booking_query_param_date(checkoutDate);
    
    const booking_url = new_generate_new_booking_url(url, checkin_str, checkout_str);
    
    console.log('🏨 Hotel: Venice (Caribe Ubatuba)');
    console.log('📅 Check-in:', checkin_str);
    console.log('📅 Check-out:', checkout_str);
    console.log('🌐 URL:', booking_url);
    console.log('');
    
    // Configurar browser
    const browserConfig = getBrowserConfig();
    browser = await puppeteer.launch(browserConfig);
    const page = await browser.newPage();
    
    await page.setUserAgent(getRandomUserAgent());
    
    console.log('🔄 Navegando para a página...');
    await page.goto(booking_url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await wait(getRandomDelay(4000, 8000));
    
    console.log('📊 Extraindo dados do window.booking.env...');
    
    const booking_data = await page.evaluate(() => {
      if (!window.booking || !window.booking.env) {
        return { error: 'window.booking.env não encontrado' };
      }
      
      const env = window.booking.env;
      
      return {
        has_rooms: !!env.b_rooms_available_and_soldout,
        rooms_count: env.b_rooms_available_and_soldout?.length || 0,
        rooms_data: env.b_rooms_available_and_soldout?.map(room => ({
          room_name: room.b_room_name,
          blocks_count: room.b_blocks?.length || 0,
          blocks: room.b_blocks?.map(block => ({
            max_persons: block.b_max_persons,
            price: block.b_price_breakdown_simplified?.b_headline_price_amount,
            currency: block.b_price_breakdown_simplified?.b_currency
          })) || []
        })) || []
      };
    });
    
    console.log('');
    console.log('📋 RESULTADO DA ANÁLISE:');
    console.log('========================');
    console.log('Tem quartos:', booking_data.has_rooms ? '✅ SIM' : '❌ NÃO');
    console.log('Número de tipos de quartos:', booking_data.rooms_count);
    console.log('');
    
    if (booking_data.rooms_count > 0) {
      console.log('🏠 DETALHES DOS QUARTOS ENCONTRADOS:');
      booking_data.rooms_data.forEach((room, index) => {
        console.log(`\n${index + 1}. ${room.room_name}`);
        console.log(`   Blocos disponíveis: ${room.blocks_count}`);
        
        if (room.blocks.length > 0) {
          room.blocks.forEach((block, blockIndex) => {
            console.log(`   ${blockIndex + 1}. Max pessoas: ${block.max_persons} | Preço: ${block.price} ${block.currency}`);
          });
        } else {
          console.log('   ❌ Nenhum bloco disponível');
        }
      });
      
      // Filtrar quartos para 2 pessoas
      const validBlocks = [];
      booking_data.rooms_data.forEach(room => {
        room.blocks.forEach(block => {
          if (block.max_persons === 2) {
            validBlocks.push({
              room: room.room_name,
              price: block.price,
              currency: block.currency
            });
          }
        });
      });
      
      console.log('\n🎯 QUARTOS VÁLIDOS PARA 2 PESSOAS:');
      if (validBlocks.length > 0) {
        validBlocks.forEach((block, index) => {
          console.log(`${index + 1}. ${block.room} - ${block.price} ${block.currency}`);
        });
        
        const cheapest = validBlocks.sort((a, b) => a.price - b.price)[0];
        const pricePerNight = cheapest.price / 2; // 2 noites
        console.log(`\n💰 MENOR PREÇO: ${cheapest.price} ${cheapest.currency} total`);
        console.log(`💰 POR NOITE: ${pricePerNight.toFixed(2)} ${cheapest.currency}`);
      } else {
        console.log('❌ Nenhum quarto válido para 2 pessoas encontrado');
      }
      
    } else if (booking_data.error) {
      console.log('❌ ERRO:', booking_data.error);
    } else {
      console.log('❌ Nenhum quarto disponível retornado pela Booking');
    }
    
  } catch (error) {
    console.error('❌ Erro durante debug:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

debugBookingResponse().catch(console.error);