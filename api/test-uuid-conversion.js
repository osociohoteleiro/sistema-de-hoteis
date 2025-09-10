// Script para testar conversão de UUID
const axios = require('axios');

const API_BASE = 'https://osh-sistemas-api-backend.d32pnk.easypanel.host/api';
const HOTEL_UUID = '3e74f4e5-8763-11f0-bd40-02420a0b00b1';

async function testUuidConversion() {
  console.log('🧪 TESTANDO CONVERSÃO DE UUID\n');
  
  try {
    // 1. Testar se dashboard funciona com UUID
    console.log('📊 TESTE 1: Dashboard com UUID');
    const dashboardUrl = `${API_BASE}/rate-shopper/${HOTEL_UUID}/dashboard`;
    
    try {
      const dashboardResponse = await axios.get(dashboardUrl, { timeout: 10000 });
      console.log(`   ✅ Dashboard UUID: Status ${dashboardResponse.status} - FUNCIONA`);
    } catch (error) {
      console.log(`   ❌ Dashboard UUID: Status ${error.response?.status} - FALHA`);
    }
    
    // 2. Testar price-trends com UUID
    console.log('\n💰 TESTE 2: Price-trends com UUID');
    const priceTrendsUrl = `${API_BASE}/rate-shopper/${HOTEL_UUID}/price-trends?start_date=2025-09-10&end_date=2025-10-09`;
    
    try {
      const priceTrendsResponse = await axios.get(priceTrendsUrl, { timeout: 10000 });
      console.log(`   ✅ Price-trends UUID: Status ${priceTrendsResponse.status} - FUNCIONA!`);
      return; // Se funcionar, pare aqui
    } catch (error) {
      console.log(`   ❌ Price-trends UUID: Status ${error.response?.status} - FALHA`);
    }
    
    // 3. Testar com ID numérico 17
    console.log('\n🔢 TESTE 3: Endpoints com ID numérico (17)');
    
    try {
      const dashboardNumericResponse = await axios.get(`${API_BASE}/rate-shopper/17/dashboard`, { timeout: 10000 });
      console.log(`   ✅ Dashboard ID 17: Status ${dashboardNumericResponse.status} - FUNCIONA`);
    } catch (error) {
      console.log(`   ❌ Dashboard ID 17: Status ${error.response?.status} - FALHA`);
    }
    
    try {
      const priceTrendsNumericResponse = await axios.get(`${API_BASE}/rate-shopper/17/price-trends?start_date=2025-09-10&end_date=2025-10-09`, { timeout: 10000 });
      console.log(`   ✅ Price-trends ID 17: Status ${priceTrendsNumericResponse.status} - FUNCIONA!`);
    } catch (error) {
      console.log(`   ❌ Price-trends ID 17: Status ${error.response?.status} - FALHA`);
    }
    
    // 4. Testar outros endpoints para comparação
    console.log('\n🏢 TESTE 4: Outros endpoints com UUID');
    
    const otherEndpoints = [
      '/properties',
      '/searches',
      '/prices'
    ];
    
    for (const endpoint of otherEndpoints) {
      try {
        const response = await axios.get(`${API_BASE}/rate-shopper/${HOTEL_UUID}${endpoint}`, { timeout: 10000 });
        console.log(`   ✅ ${endpoint}: Status ${response.status} - FUNCIONA`);
      } catch (error) {
        console.log(`   ❌ ${endpoint}: Status ${error.response?.status} - ${error.response?.status === 401 ? 'PRECISA AUTH' : 'FALHA'}`);
      }
    }
    
    console.log('\n===== DIAGNÓSTICO FINAL =====');
    console.log('🎯 Se dashboard funciona mas price-trends não:');
    console.log('   1. Problema específico na query SQL do price-trends');
    console.log('   2. Deploy ainda não terminou (aguardar mais tempo)');
    console.log('   3. Possível cache ou CDN impedindo atualização');
    
    console.log('\n💡 POSSÍVEIS SOLUÇÕES:');
    console.log('   1. Aguardar mais tempo para deploy completar');
    console.log('   2. Verificar logs da aplicação no EasyPanel');
    console.log('   3. Fazer deploy manual se necessário');
    console.log('   4. Corrigir conversão UUID → ID se for o problema');
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error.message);
  }
}

testUuidConversion().catch(console.error);