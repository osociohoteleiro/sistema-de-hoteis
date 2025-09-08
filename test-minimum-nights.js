const { extract_prices_from_booking } = require('./extrator-rate-shopper/src/booking-extractor-optimized');
const DatabaseIntegration = require('./extrator-rate-shopper/src/database-integration');
const path = require('path');

async function testMinimumNights() {
  console.log('🧪 Testando detecção de mínimo de noites...');
  
  try {
    // URL do Venice Hotel (exemplo)
    const url = 'https://www.booking.com/hotel/br/venice.pt-br.html';
    
    // Testando um período pequeno que pode ter mínimo de noites
    const startDate = new Date('2025-09-12'); // Quinta-feira
    const endDate = new Date('2025-09-15');   // Domingo - 3 dias incluindo fim de semana
    
    const maxBundleSize = 7;
    const resultsFilepath = path.join(__dirname, 'test-results.csv');
    
    console.log(`📅 Testando período: ${startDate.toISOString().split('T')[0]} até ${endDate.toISOString().split('T')[0]}`);
    console.log('🏨 Hotel: Venice Hotel');
    console.log('📦 Max bundle size:', maxBundleSize);
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
    console.log('✅ Teste concluído! Verifique os logs acima para detecção de mínimo de noites.');
    console.log('📄 Resultados salvos em: test-results.csv');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

// Executar teste
testMinimumNights().catch(console.error);