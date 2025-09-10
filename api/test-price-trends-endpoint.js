// Script para testar endpoint price-trends específico
const axios = require('axios');

const API_BASE = 'https://osh-sistemas-api-backend.d32pnk.easypanel.host/api';
const HOTEL_UUID = '3e74f4e5-8763-11f0-bd40-02420a0b00b1';

async function testPriceTrendsEndpoint() {
  console.log('🧪 TESTANDO ENDPOINT PRICE-TRENDS ESPECÍFICO\n');
  
  const url = `${API_BASE}/rate-shopper/${HOTEL_UUID}/price-trends?start_date=2025-09-10&end_date=2025-10-09&future_days=30`;
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
    console.log(`✅ Response: ${JSON.stringify(response.data, null, 2)}`);
    
  } catch (error) {
    console.error('❌ Erro ao testar price-trends:', error.message);
    
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Headers: ${JSON.stringify(error.response.headers, null, 2)}`);
      
      if (error.response.data) {
        console.log(`   Response Data: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      
      if (error.response.status === 500) {
        console.log('\n🚨 ERRO 500 - PROBLEMA NO SERVIDOR');
        console.log('   • Provável erro SQL na query');
        console.log('   • Problema com conversão de UUID para ID');
        console.log('   • Erro nas colunas de data');
      }
    }
    
    // Testar com ID numérico em vez de UUID
    console.log('\n🔄 TESTANDO COM ID NUMÉRICO (17) EM VEZ DE UUID...');
    
    try {
      const numericUrl = `${API_BASE}/rate-shopper/17/price-trends?start_date=2025-09-10&end_date=2025-10-09&future_days=30`;
      const numericResponse = await axios.get(numericUrl, {
        timeout: 15000
      });
      
      console.log(`✅ Status com ID numérico: ${numericResponse.status}`);
      console.log(`✅ Funciona com ID numérico!`);
      
      if (numericResponse.data) {
        console.log(`   Data: ${JSON.stringify(numericResponse.data).substring(0, 200)}...`);
      }
      
    } catch (numericError) {
      console.error(`❌ Também falha com ID numérico: ${numericError.message}`);
      
      if (numericError.response?.status === 500) {
        console.log('\n💡 O problema é na query SQL do endpoint price-trends');
        console.log('   Precisa corrigir as queries SQL nesta rota específica');
      }
    }
  }
  
  console.log('\n===== DIAGNÓSTICO =====');
  console.log('🎯 Problema identificado:');
  console.log('   1. Frontend usa UUID para buscar price-trends');
  console.log('   2. Endpoint /price-trends está retornando erro 500');
  console.log('   3. Provável problema nas queries SQL dessa rota');
  console.log('   4. Dashboard funciona, mas price-trends não');
  
  console.log('\n💡 PRÓXIMOS PASSOS:');
  console.log('   1. Verificar queries SQL na rota price-trends');
  console.log('   2. Corrigir nomes de colunas (check_in vs start_date)');
  console.log('   3. Testar endpoint localmente com logs detalhados');
}

testPriceTrendsEndpoint().catch(console.error);