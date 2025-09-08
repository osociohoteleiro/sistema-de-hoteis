const { extract_prices_from_booking } = require('./extrator-rate-shopper/src/booking-extractor-optimized');
const path = require('path');

async function test12to14() {
  console.log('🧪 Testando período ESPECÍFICO: 12 a 14 de setembro');
  
  try {
    // URL correta do Venice Hotel
    const url = 'https://www.booking.com/hotel/br/caribe-ubatuba.pt-br.html';
    
    // PERÍODO EXATO: 12 a 14 de setembro
    const startDate = new Date('2025-09-12'); // 12/09
    const endDate = new Date('2025-09-14');   // 14/09 (check-out no dia 14, ou seja, até 13/09)
    
    const maxBundleSize = 5; // Reduzir para foco
    const resultsFilepath = path.join(__dirname, 'test-12-14-results.csv');
    
    console.log('🏨 Hotel: Venice (Caribe Ubatuba)');
    console.log('🌐 URL:', url);
    console.log(`📅 Período: ${startDate.toISOString().split('T')[0]} até ${endDate.toISOString().split('T')[0]}`);
    console.log('🎯 Testando especificamente 12→14 (2 noites)');
    console.log('');
    
    // Executar extração
    await extract_prices_from_booking(
      url, 
      startDate, 
      endDate, 
      maxBundleSize, 
      resultsFilepath
    );
    
    console.log('');
    console.log('✅ Teste concluído!');
    
    // Mostrar resultados
    try {
      const fs = require('fs');
      if (fs.existsSync(resultsFilepath)) {
        const results = fs.readFileSync(resultsFilepath, 'utf8');
        console.log('');
        console.log('📊 RESULTADOS EXTRAÍDOS:');
        console.log('========================');
        if (results.trim()) {
          const lines = results.trim().split('\n');
          lines.forEach((line, index) => {
            console.log(`${index + 1}. ${line}`);
          });
          console.log('========================');
          console.log(`Total de preços encontrados: ${lines.length}`);
        } else {
          console.log('Nenhum preço extraído');
          console.log('========================');
        }
      } else {
        console.log('📄 Nenhum arquivo de resultados criado');
      }
    } catch (err) {
      console.log('📄 Erro ao ler resultados:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.error(error.stack);
  }
}

// Executar teste
test12to14().catch(console.error);