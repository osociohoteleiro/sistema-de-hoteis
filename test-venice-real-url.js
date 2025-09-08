const { extract_prices_from_booking } = require('./extrator-rate-shopper/src/booking-extractor-optimized');
const path = require('path');

async function testVeniceRealURL() {
  console.log('🧪 Testando com URL REAL do Venice Hotel');
  
  try {
    // URL CORRETA fornecida pelo usuário
    const url = 'https://www.booking.com/hotel/br/caribe-ubatuba.pt-br.html';
    
    // Período exato: 11 a 14 de setembro
    const startDate = new Date('2025-09-11'); // 11/09
    const endDate = new Date('2025-09-14');   // 14/09 (até 13/09)
    
    const maxBundleSize = 7;
    const resultsFilepath = path.join(__dirname, 'test-venice-real-results.csv');
    
    console.log('🏨 Hotel: Venice (Caribe Ubatuba)');
    console.log('🌐 URL:', url);
    console.log(`📅 Período: ${startDate.toISOString().split('T')[0]} até ${endDate.toISOString().split('T')[0]}`);
    console.log('📦 Max bundle size:', maxBundleSize);
    console.log('');
    console.log('🎯 TESTE COM URL REAL:');
    console.log('  - Buscar 11→12 (1 noite)');
    console.log('  - Se não encontrar, buscar 11→13 (2 noites)');  
    console.log('  - Se não encontrar, buscar 11→14 (3 noites)');
    console.log('  - Quando encontrar, dividir pelo número de noites');
    console.log('');
    
    // Executar extração com URL REAL
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
        console.log('📊 RESULTADOS:');
        console.log('---');
        console.log(results || 'Nenhum preço extraído');
        console.log('---');
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
testVeniceRealURL().catch(console.error);