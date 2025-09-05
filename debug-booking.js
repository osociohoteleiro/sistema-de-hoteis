const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function debugBookingPage() {
  console.log('🔍 DEBUG: Investigando página da Booking.com...');
  console.log('===============================================');

  let browser = null;
  
  try {
    // Configurar browser
    browser = await puppeteer.launch({
      headless: false, // VISUAL para ver o que acontece
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
      defaultViewport: null
    });
    
    const page = await browser.newPage();
    
    // User agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // URL do hotel com datas específicas (próxima semana)
    const checkinDate = new Date();
    checkinDate.setDate(checkinDate.getDate() + 7);
    const checkoutDate = new Date(checkinDate);
    checkoutDate.setDate(checkoutDate.getDate() + 1);
    
    const checkin = checkinDate.toISOString().split('T')[0];
    const checkout = checkoutDate.toISOString().split('T')[0];
    
    const url = `https://www.booking.com/hotel/br/intercity-sao-paulo-times-square.pt-br.html?checkin=${checkin}&checkout=${checkout}&group_adults=2&no_rooms=1`;
    
    console.log(`🌐 Acessando: ${url}`);
    console.log(`📅 Check-in: ${checkin}`);
    console.log(`📅 Check-out: ${checkout}`);
    
    // Ir para a página
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log('✅ Página carregada');
    
    // Aguardar um tempo para carregamento completo
    console.log('⏳ Aguardando carregamento completo...');
    await page.waitForTimeout(10000);
    
    // Verificar se window.booking existe
    const hasBookingData = await page.evaluate(() => {
      return {
        hasWindow: typeof window !== 'undefined',
        hasBooking: typeof window.booking !== 'undefined',
        hasEnv: typeof window.booking?.env !== 'undefined',
        hasRooms: typeof window.booking?.env?.b_rooms_available_and_soldout !== 'undefined',
        roomsCount: window.booking?.env?.b_rooms_available_and_soldout?.length || 0
      };
    });
    
    console.log('\\n📊 STATUS DA PÁGINA:');
    console.log('===================');
    console.log('Window exists:', hasBookingData.hasWindow);
    console.log('Booking object exists:', hasBookingData.hasBooking);
    console.log('Booking env exists:', hasBookingData.hasEnv);
    console.log('Rooms array exists:', hasBookingData.hasRooms);
    console.log('Rooms count:', hasBookingData.roomsCount);
    
    if (hasBookingData.hasRooms && hasBookingData.roomsCount > 0) {
      // Extrair dados dos quartos
      const roomsData = await page.evaluate(() => {
        const rooms = window.booking.env.b_rooms_available_and_soldout;
        return rooms.map(room => ({
          name: room.b_room_name || 'N/A',
          price: room.b_raw_price || 'N/A',
          available: room.b_is_available || false,
          soldOut: room.b_is_soldout || false
        }));
      });
      
      console.log('\\n🏠 QUARTOS ENCONTRADOS:');
      console.log('======================');
      roomsData.forEach((room, i) => {
        console.log(`${i+1}. ${room.name}`);
        console.log(`   Preço: ${room.price}`);
        console.log(`   Disponível: ${room.available}`);
        console.log(`   Esgotado: ${room.soldOut}`);
        console.log('');
      });
      
      const validPrices = roomsData.filter(r => r.price && r.price !== 'N/A' && !isNaN(parseFloat(r.price)));
      console.log(`💰 PREÇOS VÁLIDOS: ${validPrices.length} de ${roomsData.length}`);
      
      if (validPrices.length > 0) {
        console.log('\\n🎉 SUCESSO! PREÇOS ENCONTRADOS:');
        validPrices.forEach((room, i) => {
          console.log(`   ${i+1}. ${room.name}: R$ ${parseFloat(room.price).toFixed(2)}`);
        });
      }
      
    } else {
      console.log('\\n❌ PROBLEMA IDENTIFICADO:');
      console.log('========================');
      
      if (!hasBookingData.hasBooking) {
        console.log('• window.booking não existe - página pode não ter carregado corretamente');
      } else if (!hasBookingData.hasEnv) {
        console.log('• window.booking.env não existe - estrutura de dados mudou');
      } else if (!hasBookingData.hasRooms) {
        console.log('• Array de quartos não existe - estrutura de dados mudou');
      } else {
        console.log('• Array de quartos está vazio - sem disponibilidade para essas datas');
      }
      
      // Tentar métodos alternativos
      console.log('\\n🔧 TENTANDO MÉTODOS ALTERNATIVOS...');
      
      // Procurar preços na página usando seletores CSS
      const pricesFromSelectors = await page.evaluate(() => {
        const priceSelectors = [
          '[data-testid="price-and-discounted-price"] bdi',
          '.prco-valign-middle-helper bdi',
          '.bui-price-display__value bdi',
          '.sr-hotel__price bdi',
          '.bui-price-display bdi'
        ];
        
        const prices = [];
        for (const selector of priceSelectors) {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            const text = el.textContent.trim();
            if (text && text.includes('R$')) {
              prices.push({
                selector,
                text,
                cleanPrice: text.replace(/[^0-9,]/g, '').replace(',', '.')
              });
            }
          });
        }
        return prices;
      });
      
      if (pricesFromSelectors.length > 0) {
        console.log('\\n✅ PREÇOS ENCONTRADOS POR SELETORES:');
        pricesFromSelectors.forEach((price, i) => {
          console.log(`   ${i+1}. ${price.text} (${price.selector})`);
        });
      } else {
        console.log('❌ Nenhum preço encontrado por seletores CSS');
      }
    }
    
    // Manter browser aberto para inspeção manual
    console.log('\\n⚠️  Browser mantido aberto para inspeção manual');
    console.log('   Feche o browser quando terminar de investigar');
    
    // Aguardar 60 segundos antes de fechar
    await page.waitForTimeout(60000);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

debugBookingPage();