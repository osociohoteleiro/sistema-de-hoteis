const { extract_prices_from_booking } = require('./extrator-rate-shopper/src/booking-extractor-single-date');
const path = require('path');

async function testFutureDateExtraction() {
  try {
    console.log('🎯 TESTE COM DATAS FUTURAS: Extraindo preços da Booking.com');
    console.log('==========================================================');
    
    // URL real da Booking para Hotel Maranduba
    const hotelUrl = 'https://www.booking.com/hotel/br/maranduba-ubatuba12.pt-br.html';
    
    // Datas: daqui a 2 semanas (para garantir disponibilidade)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 14); // +14 dias
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 3); // +3 dias (total 4 noites)
    
    // Arquivo de resultado
    const resultsFile = path.join(__dirname, 'test-extraction-future-result.csv');
    
    console.log(`🏨 Hotel URL: ${hotelUrl}`);
    console.log(`📅 Check-in: ${startDate.toLocaleDateString('pt-BR')} (${startDate.toISOString().split('T')[0]})`);
    console.log(`📅 Check-out: ${endDate.toLocaleDateString('pt-BR')} (${endDate.toISOString().split('T')[0]})`);
    console.log(`📁 Arquivo resultado: ${resultsFile}`);
    console.log(`⏰ Período: ${Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))} dias`);
    console.log('');
    
    // Executar extração (sem banco, apenas CSV)
    await extract_prices_from_booking(
      hotelUrl,
      startDate,
      endDate,
      1, // bundle size 1 (dia por dia)
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
      
      const lines = content.split('\\n').filter(line => line.trim());
      console.log(`\\n💰 TOTAL: ${lines.length} preços extraídos!`);
      
      if (lines.length > 0) {
        console.log('\\n🏆 SUCESSO! Preços reais foram extraídos da Booking.com');
        console.log('📊 Exemplo de preço extraído:');
        const firstLine = lines[0];
        const [checkin, checkout, price, roomType] = firstLine.split(';');
        console.log(`   Data: ${checkin} → ${checkout}`);
        console.log(`   Preço: R$ ${price}`);
        console.log(`   Tipo: ${roomType || 'N/A'}`);
      } else {
        console.log('\\n❌ Nenhum preço encontrado - hotel pode não ter disponibilidade ou houve erro');
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
testFutureDateExtraction();