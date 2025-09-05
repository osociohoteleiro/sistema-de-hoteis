const { extract_prices_from_booking } = require('./extrator-rate-shopper/src/booking-extractor-optimized');
const path = require('path');

async function testOptimizedExtractor() {
  try {
    console.log('🎯 TESTE EXTRATOR OTIMIZADO: Hotel conhecido com disponibilidade');
    console.log('==============================================================');
    
    // Hotel Copacabana Palace - sempre tem disponibilidade
    const hotelUrl = 'https://www.booking.com/hotel/br/copacabana-palace.pt-br.html';
    
    // Data: próximo sábado/domingo (final de semana sempre tem movimento)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + (6 - startDate.getDay() + 7)); // Próximo sábado
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 2); // Domingo
    
    const resultsFile = path.join(__dirname, 'extrator-rate-shopper', 'results', 'extracted-data', 'csv', 'test-copacabana.csv');
    
    console.log(`🏨 Hotel: Copacabana Palace`);
    console.log(`🌐 URL: ${hotelUrl}`);
    console.log(`📅 Check-in: ${startDate.toLocaleDateString('pt-BR')} (${startDate.toISOString().split('T')[0]})`);
    console.log(`📅 Check-out: ${endDate.toLocaleDateString('pt-BR')} (${endDate.toISOString().split('T')[0]})`);
    console.log(`📁 Arquivo: ${resultsFile}`);
    console.log('');
    
    // Executar extração
    await extract_prices_from_booking(
      hotelUrl,
      startDate,
      endDate,
      3, // bundle size até 3 (para testar agrupamento)
      resultsFile
    );
    
    console.log('✅ Extração concluída!');
    
    // Verificar resultado
    const fs = require('fs');
    if (fs.existsSync(resultsFile)) {
      const content = fs.readFileSync(resultsFile, 'utf8');
      console.log('\\n📄 ARQUIVO GERADO:');
      console.log('==================');
      console.log(content);
      
      const lines = content.split('\\n').filter(line => line.trim());
      console.log(`\\n💰 TOTAL: ${lines.length} preços extraídos!`);
      
      if (lines.length > 0) {
        console.log('\\n🏆 SUCESSO! Preços reais extraídos:');
        lines.forEach((line, i) => {
          const [checkin, checkout, price, bundle] = line.split(';');
          console.log(`   ${i+1}. ${checkin} → ${checkout}: R$ ${price} ${bundle ? '(' + bundle + ')' : ''}`);
        });
      }
    } else {
      console.log('\\n❌ Arquivo não foi criado');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testOptimizedExtractor();