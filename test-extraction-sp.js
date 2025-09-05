const { extract_prices_from_booking } = require('./extrator-rate-shopper/src/booking-extractor-single-date');
const path = require('path');

async function testSaoPauloHotel() {
  try {
    console.log('🎯 TESTE HOTEL SÃO PAULO: Extraindo preços reais da Booking.com');
    console.log('================================================================');
    
    // Hotel conhecido com disponibilidade em São Paulo
    const hotelUrl = 'https://www.booking.com/hotel/br/intercity-sao-paulo-times-square.pt-br.html';
    
    // Datas: próxima segunda-feira (para garantir disponibilidade empresarial)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7); // +7 dias (próxima semana)
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 2); // +2 dias (2 noites)
    
    // Arquivo de resultado
    const resultsFile = path.join(__dirname, 'test-extraction-sp-result.csv');
    
    console.log(`🏨 Hotel: InterCity São Paulo Times Square`);
    console.log(`🌐 URL: ${hotelUrl}`);
    console.log(`📅 Check-in: ${startDate.toLocaleDateString('pt-BR')} (${startDate.toISOString().split('T')[0]})`);
    console.log(`📅 Check-out: ${endDate.toLocaleDateString('pt-BR')} (${endDate.toISOString().split('T')[0]})`);
    console.log(`📁 Arquivo resultado: ${resultsFile}`);
    console.log(`⏰ Período: ${Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))} dias`);
    console.log('\\n🚀 Iniciando extração...');
    
    // Executar extração (sem banco, apenas CSV)
    await extract_prices_from_booking(
      hotelUrl,
      startDate,
      endDate,
      1, // bundle size 1 (dia por dia)
      resultsFile
    );
    
    console.log('\\n✅ Extração concluída! Verificando arquivo...');
    
    // Ler resultado
    const fs = require('fs');
    if (fs.existsSync(resultsFile)) {
      const content = fs.readFileSync(resultsFile, 'utf8');
      console.log('\\n📄 CONTEÚDO DO ARQUIVO:');
      console.log('======================');
      console.log(content);
      
      const lines = content.split('\\n').filter(line => line.trim());
      console.log(`\\n💰 RESULTADO FINAL: ${lines.length} preços extraídos!`);
      
      if (lines.length > 0) {
        console.log('\\n🏆 🎉 SUCESSO! PREÇOS REAIS FORAM EXTRAÍDOS DA BOOKING.COM! 🎉');
        console.log('================================================================');
        
        lines.forEach((line, index) => {
          const [checkin, checkout, price, roomType] = line.split(';');
          console.log(`\\n💰 PREÇO ${index + 1}:`);
          console.log(`   📅 Data: ${checkin} → ${checkout}`);
          console.log(`   💵 Preço: R$ ${price}`);
          console.log(`   🏠 Tipo: ${roomType || 'N/A'}`);
        });
        
        console.log('\\n✅ A extração está funcionando perfeitamente!');
      } else {
        console.log('\\n❌ Nenhum preço encontrado - vamos investigar...');
      }
    } else {
      console.log('\\n❌ Arquivo de resultado não foi criado');
    }
    
  } catch (error) {
    console.error('❌ Erro na extração:', error.message);
    console.error(error.stack);
  }
}

// Executar teste
testSaoPauloHotel();