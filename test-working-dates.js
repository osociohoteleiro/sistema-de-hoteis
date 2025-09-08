const { extract_prices_from_booking } = require('./extrator-rate-shopper/src/booking-extractor-optimized');
const path = require('path');

async function testWorkingDates() {
  console.log('🧪 Testando com datas onde sabemos que funciona...');
  
  try {
    // URL do Venice Hotel (mesmo da extração que funcionou)
    const url = 'https://www.booking.com/hotel/br/venice.pt-br.html';
    
    // Testando um período onde vimos preços nos logs (outubro/novembro)
    const startDate = new Date('2025-10-31'); // Sexta-feira (pode ter mínimo de noites para fim de semana)
    const endDate = new Date('2025-11-03');   // Segunda-feira - incluindo fim de semana
    
    const maxBundleSize = 4; // Reduzir para teste mais rápido
    const resultsFilepath = path.join(__dirname, 'test-working-results.csv');
    
    console.log(`📅 Testando período: ${startDate.toISOString().split('T')[0]} até ${endDate.toISOString().split('T')[0]}`);
    console.log('🏨 Hotel: Venice Hotel');
    console.log('📦 Max bundle size:', maxBundleSize);
    console.log('🎯 Objetivo: Verificar detecção de mínimo de noites em fim de semana');
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
    console.log('📄 Resultados salvos em: test-working-results.csv');
    
    // Mostrar conteúdo do arquivo
    try {
      const fs = require('fs');
      const results = fs.readFileSync(resultsFilepath, 'utf8');
      console.log('');
      console.log('📊 Preços extraídos:');
      console.log('---');
      console.log(results || 'Nenhum preço extraído');
      console.log('---');
    } catch (err) {
      console.log('📄 Arquivo de resultados não foi criado (sem preços extraídos)');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

// Executar teste
testWorkingDates().catch(console.error);