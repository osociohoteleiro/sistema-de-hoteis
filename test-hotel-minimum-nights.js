const { extract_prices_from_booking } = require('./extrator-rate-shopper/src/booking-extractor-optimized');
const path = require('path');

async function testHotelMinimumNights() {
  console.log('🧪 Testando DETECÇÃO DE MÍNIMO DE NOITES - Caso Real do Hotel');
  
  try {
    // URL do hotel (assumindo Venice Hotel com base nos logs)
    const url = 'https://www.booking.com/hotel/br/venice.pt-br.html';
    
    // Período exato que o usuário mencionou: 11 a 14 de setembro
    const startDate = new Date('2025-09-11'); // 11/09
    const endDate = new Date('2025-09-14');   // 14/09 (até 13/09)
    
    const maxBundleSize = 7; // Testar até 7 noites
    const resultsFilepath = path.join(__dirname, 'test-hotel-results.csv');
    
    console.log(`📅 Testando período EXATO: ${startDate.toISOString().split('T')[0]} até ${endDate.toISOString().split('T')[0]}`);
    console.log('🏨 Hotel: Venice Hotel (mesmo do seu sistema)');
    console.log('📦 Max bundle size:', maxBundleSize);
    console.log('');
    console.log('🎯 EXPECTATIVA:');
    console.log('  - Tentar 11→12 (1 noite): deve FALHAR');
    console.log('  - Tentar 11→13 (2 noites): deve FALHAR');  
    console.log('  - Tentar 11→14 (3 noites): deve ENCONTRAR preço');
    console.log('  - Dividir preço por 3 e aplicar aos dias 11, 12, 13');
    console.log('');
    
    // Executar extração de teste
    await extract_prices_from_booking(
      url, 
      startDate, 
      endDate, 
      maxBundleSize, 
      resultsFilepath
    );
    
    console.log('');
    console.log('✅ Teste concluído!');
    console.log('📄 Resultados salvos em: test-hotel-results.csv');
    
    // Mostrar conteúdo do arquivo
    try {
      const fs = require('fs');
      if (fs.existsSync(resultsFilepath)) {
        const results = fs.readFileSync(resultsFilepath, 'utf8');
        console.log('');
        console.log('📊 Preços extraídos:');
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
  }
}

// Executar teste
testHotelMinimumNights().catch(console.error);