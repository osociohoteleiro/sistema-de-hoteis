const { extract_prices_from_booking } = require('./extrator-rate-shopper/src/booking-extractor-single-date');
const path = require('path');

async function testDirectExtraction() {
  try {
    console.log('🎯 TESTE DIRETO: Extraindo preços da Booking.com');
    console.log('===============================================');
    
    // URL real da Booking para Hotel Maranduba
    const hotelUrl = 'https://www.booking.com/hotel/br/maranduba-ubatuba12.pt-br.html';
    
    // Datas: hoje e amanhã
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);
    
    // Arquivo de resultado
    const resultsFile = path.join(__dirname, 'test-extraction-result.csv');
    
    console.log(`🏨 Hotel URL: ${hotelUrl}`);
    console.log(`📅 Check-in: ${startDate.toLocaleDateString('pt-BR')}`);
    console.log(`📅 Check-out: ${endDate.toLocaleDateString('pt-BR')}`);
    console.log(`📁 Arquivo resultado: ${resultsFile}`);
    console.log('');
    
    // Executar extração (sem banco, apenas CSV)
    await extract_prices_from_booking(
      hotelUrl,
      startDate,
      endDate,
      1, // bundle size 1
      resultsFile
    );
    
    console.log('✅ Extração concluída! Verificando arquivo...');
    
    // Ler resultado
    const fs = require('fs');
    if (fs.existsSync(resultsFile)) {
      const content = fs.readFileSync(resultsFile, 'utf8');
      console.log('📄 CONTEÚDO DO ARQUIVO:');
      console.log('======================');
      console.log(content);
      
      const lines = content.split('\n').filter(line => line.trim());
      console.log(`\n💰 TOTAL: ${lines.length} preços extraídos!`);
      
      if (lines.length > 0) {
        console.log('\n🏆 SUCESSO! Preços foram extraídos da Booking.com');
      } else {
        console.log('\n❌ Nenhum preço encontrado - possível problema na extração');
      }
    } else {
      console.log('❌ Arquivo de resultado não foi criado');
    }
    
  } catch (error) {
    console.error('❌ Erro na extração:', error.message);
    console.error(error.stack);
  }
}

// Executar teste
testDirectExtraction();