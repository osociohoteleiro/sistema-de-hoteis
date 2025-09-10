// Script para testar price-trends local
const axios = require('axios');

const API_BASE = 'http://localhost:3002/api';
const HOTEL_ID = 17;

async function testLocalPriceTrends() {
  console.log('🧪 TESTANDO ENDPOINT PRICE-TRENDS LOCAL\n');
  
  const url = `${API_BASE}/rate-shopper/${HOTEL_ID}/price-trends?start_date=2025-09-10&end_date=2025-10-09&future_days=30`;
  console.log(`📊 URL: ${url}\n`);
  
  try {
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Response data keys: ${Object.keys(response.data)}`);
    
    if (response.data.success) {
      const data = response.data.data;
      console.log(`✅ Funciona! Estrutura:`);
      console.log(`   • Chart data: ${data.chart_data ? Object.keys(data.chart_data).length : 0} datas`);
      console.log(`   • Properties: ${data.properties ? data.properties.length : 0} propriedades`);
      console.log(`   • Main properties: ${data.main_properties ? data.main_properties.length : 0} principais`);
      console.log(`   • Date range: ${JSON.stringify(data.date_range)}`);
      
      if (data.chart_data) {
        const sampleDate = Object.keys(data.chart_data)[0];
        if (sampleDate) {
          console.log(`   • Exemplo de data (${sampleDate}): ${JSON.stringify(data.chart_data[sampleDate]).substring(0, 100)}...`);
        }
      }
    } else {
      console.log(`❌ Resposta de erro: ${JSON.stringify(response.data)}`);
    }
    
    console.log('\n✅ SUCESSO! O endpoint price-trends está funcionando localmente.');
    console.log('💡 Agora precisa fazer deploy das correções para produção.');
    
  } catch (error) {
    console.error('❌ Erro ao testar price-trends local:', error.message);
    
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      if (error.response.data) {
        console.log(`   Response: ${JSON.stringify(error.response.data)}`);
      }
    }
    
    console.log('\n🚨 AINDA HÁ PROBLEMAS MESMO LOCALMENTE');
    console.log('   Verificar logs do servidor para mais detalhes');
  }
}

testLocalPriceTrends().catch(console.error);