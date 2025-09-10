// Script para testar resposta completa do dashboard
const axios = require('axios');

const API_BASE = 'http://ep.osociohoteleiro.com.br/api';
const HOTEL_ID = 17;

async function testDashboardResponse() {
  console.log('🔍 TESTANDO RESPOSTA COMPLETA DO DASHBOARD\n');
  
  try {
    const response = await axios.get(`${API_BASE}/rate-shopper/${HOTEL_ID}/dashboard`, {
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 RESPOSTA COMPLETA:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    }
  }
}

testDashboardResponse().catch(console.error);