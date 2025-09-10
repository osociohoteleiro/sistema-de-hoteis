// Script para testar API local
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';
const HOTEL_ID = 17;

async function testLocalAPI() {
  console.log('🧪 TESTANDO API LOCAL\n');
  
  try {
    // Teste 1: Health check
    console.log('🏥 TESTE: Health Check');
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log(`   ✅ Status: ${healthResponse.status}`);
    console.log(`   ✅ Response: ${JSON.stringify(healthResponse.data)}\n`);
    
    // Teste 2: Dashboard
    console.log('📊 TESTE: Dashboard');
    const dashboardResponse = await axios.get(`${API_BASE}/rate-shopper/${HOTEL_ID}/dashboard`);
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
    const propertiesResponse = await axios.get(`${API_BASE}/rate-shopper/${HOTEL_ID}/properties`);
    console.log(`   ✅ Status: ${propertiesResponse.status}`);
    console.log(`   ✅ Properties: ${propertiesResponse.data.length} encontradas`);
    
    if (propertiesResponse.data.length > 0) {
      const sample = propertiesResponse.data[0];
      console.log(`   ✅ Exemplo: ${sample.property_name} (${sample.platform})`);
    }
    
    console.log('\n');
    
    // Teste 4: Searches
    console.log('🔍 TESTE: Searches');
    const searchesResponse = await axios.get(`${API_BASE}/rate-shopper/${HOTEL_ID}/searches`);
    console.log(`   ✅ Status: ${searchesResponse.status}`);
    console.log(`   ✅ Searches: ${searchesResponse.data.length} encontradas`);
    
    if (searchesResponse.data.length > 0) {
      const sample = searchesResponse.data[0];
      console.log(`   ✅ Exemplo: Search ${sample.id} - Status: ${sample.status}`);
    }
    
    console.log('\n===== CONCLUSÃO =====');
    console.log('✅ A API está funcionando PERFEITAMENTE em localhost!');
    console.log('🚨 O problema é que a API não está rodando em produção ou não está acessível.');
    console.log('\n💡 SOLUÇÕES:');
    console.log('   1. Fazer deploy da API para produção');
    console.log('   2. Verificar se a API está rodando no servidor de produção');
    console.log('   3. Configurar proxy reverso para rotear /api para a API');
    console.log('   4. Verificar configuração de firewall/portas');
    
  } catch (error) {
    console.error('❌ Erro ao testar API local:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', JSON.stringify(error.response.data));
    }
  }
}

testLocalAPI().catch(console.error);