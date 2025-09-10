// Script para testar API de produção no domínio correto
const axios = require('axios');

const API_BASE = 'https://osh-sistemas-api-backend.d32pnk.easypanel.host/api';
const HOTEL_ID = 17;

async function testProductionAPI() {
  console.log('🧪 TESTANDO API DE PRODUÇÃO NO DOMÍNIO CORRETO\n');
  console.log(`🌐 Base URL: ${API_BASE}\n`);
  
  try {
    // Teste 1: Health check
    console.log('🏥 TESTE: Health Check');
    const healthResponse = await axios.get(`${API_BASE}/health`, {
      timeout: 15000
    });
    console.log(`   ✅ Status: ${healthResponse.status}`);
    console.log(`   ✅ Response: ${JSON.stringify(healthResponse.data)}\n`);
    
    // Teste 2: Dashboard
    console.log('📊 TESTE: Dashboard');
    const dashboardResponse = await axios.get(`${API_BASE}/rate-shopper/${HOTEL_ID}/dashboard`, {
      timeout: 15000
    });
    console.log(`   ✅ Status: ${dashboardResponse.status}`);
    
    if (dashboardResponse.data.success) {
      console.log(`   ✅ API funcionando corretamente!`);
      const data = dashboardResponse.data.data;
      console.log(`   📊 Summary: ${JSON.stringify(data.summary)}`);
      console.log(`   📊 Recent searches: ${data.recent_searches?.length || 0} itens`);
      console.log(`   📊 Price trends: ${data.price_trends?.length || 0} itens`);
      console.log(`   📊 Properties: ${data.properties?.length || 0} itens`);
    } else {
      console.log(`   ❌ API retornou erro: ${JSON.stringify(dashboardResponse.data)}`);
    }
    
    console.log('\n');
    
    // Teste 3: Properties
    console.log('🏢 TESTE: Properties');
    const propertiesResponse = await axios.get(`${API_BASE}/rate-shopper/${HOTEL_ID}/properties`, {
      timeout: 15000
    });
    console.log(`   ✅ Status: ${propertiesResponse.status}`);
    console.log(`   ✅ Properties: ${propertiesResponse.data.length} encontradas`);
    
    if (propertiesResponse.data.length > 0) {
      const sample = propertiesResponse.data[0];
      console.log(`   ✅ Exemplo: ${sample.property_name} (${sample.platform || sample.booking_engine})`);
    }
    
    console.log('\n');
    
    // Teste 4: Searches  
    console.log('🔍 TESTE: Searches');
    const searchesResponse = await axios.get(`${API_BASE}/rate-shopper/${HOTEL_ID}/searches`, {
      timeout: 15000
    });
    console.log(`   ✅ Status: ${searchesResponse.status}`);
    console.log(`   ✅ Searches: ${searchesResponse.data.length} encontradas`);
    
    if (searchesResponse.data.length > 0) {
      const sample = searchesResponse.data[0];
      console.log(`   ✅ Exemplo: Search ${sample.id} - Status: ${sample.status || sample.search_status}`);
    }
    
    console.log('\n');
    
    // Teste 5: Prices
    console.log('💰 TESTE: Prices');
    const pricesResponse = await axios.get(`${API_BASE}/rate-shopper/${HOTEL_ID}/prices`, {
      timeout: 15000
    });
    console.log(`   ✅ Status: ${pricesResponse.status}`);
    console.log(`   ✅ Prices: ${pricesResponse.data.length} encontrados`);
    
    if (pricesResponse.data.length > 0) {
      const sample = pricesResponse.data[0];
      console.log(`   ✅ Exemplo: ${sample.currency} ${sample.price} - ${sample.property_name}`);
    }
    
    console.log('\n===== CONCLUSÃO =====');
    console.log('✅ API de produção encontrada e funcionando!');
    console.log(`🌐 URL correta: ${API_BASE}`);
    console.log('\n💡 O frontend deve usar esta URL para acessar a API.');
    
  } catch (error) {
    console.error('❌ Erro ao testar API de produção:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Headers:', error.response.headers);
      
      if (error.response.status >= 400 && error.response.status < 500) {
        console.log('   ⚠️  Possível problema de autorização ou parâmetros');
      } else if (error.response.status >= 500) {
        console.log('   🚨 Problema no servidor (mesmos erros de SQL que temos localmente)');
      }
      
      if (error.response.data) {
        console.log('   Data:', JSON.stringify(error.response.data));
      }
    } else {
      console.log('   ❌ Erro de rede ou timeout');
    }
  }
}

testProductionAPI().catch(console.error);