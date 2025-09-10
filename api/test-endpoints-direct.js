// Script para testar endpoints diretamente
const axios = require('axios');

// Configuração da API
const API_BASE = 'http://ep.osociohoteleiro.com.br/api';
const HOTEL_ID = 17; // Hotel de teste: Eco Encanto Pousada

async function testEndpoints() {
  console.log('🧪 TESTANDO ENDPOINTS DIRETAMENTE\n');
  
  try {
    // 1. Testar endpoint de dashboard
    console.log('📊 TESTE: Dashboard Endpoint');
    console.log(`   URL: ${API_BASE}/rate-shopper/${HOTEL_ID}/dashboard`);
    
    try {
      const dashboardResponse = await axios.get(`${API_BASE}/rate-shopper/${HOTEL_ID}/dashboard`, {
        timeout: 30000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`   ✅ Status: ${dashboardResponse.status}`);
      console.log(`   ✅ Response size: ${JSON.stringify(dashboardResponse.data).length} bytes`);
      
      const data = dashboardResponse.data;
      if (data.recent_searches) {
        console.log(`   ✅ Recent searches: ${data.recent_searches.length} itens`);
      }
      if (data.price_analysis) {
        console.log(`   ✅ Price analysis: ${data.price_analysis.length} itens`);
      }
      if (data.statistics) {
        console.log(`   ✅ Statistics: ${JSON.stringify(data.statistics)}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Erro: ${error.response?.status} - ${error.response?.statusText}`);
      if (error.response?.data) {
        console.log(`   ❌ Response: ${JSON.stringify(error.response.data)}`);
      } else {
        console.log(`   ❌ Network Error: ${error.message}`);
      }
    }

    console.log('');

    // 2. Testar endpoint de propriedades
    console.log('🏢 TESTE: Properties Endpoint');
    console.log(`   URL: ${API_BASE}/rate-shopper/${HOTEL_ID}/properties`);
    
    try {
      const propertiesResponse = await axios.get(`${API_BASE}/rate-shopper/${HOTEL_ID}/properties`, {
        timeout: 30000
      });
      
      console.log(`   ✅ Status: ${propertiesResponse.status}`);
      console.log(`   ✅ Properties count: ${propertiesResponse.data.length}`);
      
      if (propertiesResponse.data.length > 0) {
        const sample = propertiesResponse.data[0];
        console.log(`   ✅ Sample: ${sample.property_name} (${sample.platform})`);
      }
      
    } catch (error) {
      console.log(`   ❌ Erro: ${error.response?.status} - ${error.response?.statusText}`);
      if (error.response?.data) {
        console.log(`   ❌ Response: ${JSON.stringify(error.response.data)}`);
      }
    }

    console.log('');

    // 3. Testar endpoint de buscas
    console.log('🔍 TESTE: Searches Endpoint');
    console.log(`   URL: ${API_BASE}/rate-shopper/${HOTEL_ID}/searches`);
    
    try {
      const searchesResponse = await axios.get(`${API_BASE}/rate-shopper/${HOTEL_ID}/searches`, {
        timeout: 30000
      });
      
      console.log(`   ✅ Status: ${searchesResponse.status}`);
      console.log(`   ✅ Searches count: ${searchesResponse.data.length}`);
      
      if (searchesResponse.data.length > 0) {
        const sample = searchesResponse.data[0];
        console.log(`   ✅ Sample: Search ${sample.id} - ${sample.status}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Erro: ${error.response?.status} - ${error.response?.statusText}`);
      if (error.response?.data) {
        console.log(`   ❌ Response: ${JSON.stringify(error.response.data)}`);
      }
    }

    console.log('');

    // 4. Testar endpoint de preços
    console.log('💰 TESTE: Prices Endpoint');
    console.log(`   URL: ${API_BASE}/rate-shopper/${HOTEL_ID}/prices`);
    
    try {
      const pricesResponse = await axios.get(`${API_BASE}/rate-shopper/${HOTEL_ID}/prices`, {
        timeout: 30000
      });
      
      console.log(`   ✅ Status: ${pricesResponse.status}`);
      console.log(`   ✅ Prices count: ${pricesResponse.data.length}`);
      
      if (pricesResponse.data.length > 0) {
        const sample = pricesResponse.data[0];
        console.log(`   ✅ Sample: ${sample.currency} ${sample.price} (${sample.property_name})`);
      }
      
    } catch (error) {
      console.log(`   ❌ Erro: ${error.response?.status} - ${error.response?.statusText}`);
      if (error.response?.data) {
        console.log(`   ❌ Response: ${JSON.stringify(error.response.data)}`);
      }
    }

    console.log('');

    // 5. Testar health check geral da API
    console.log('🏥 TESTE: API Health Check');
    console.log(`   URL: ${API_BASE}/health`);
    
    try {
      const healthResponse = await axios.get(`${API_BASE}/health`, {
        timeout: 10000
      });
      
      console.log(`   ✅ Status: ${healthResponse.status}`);
      console.log(`   ✅ Response: ${JSON.stringify(healthResponse.data)}`);
      
    } catch (error) {
      console.log(`   ❌ Erro: ${error.response?.status} - ${error.response?.statusText}`);
      if (error.response?.data) {
        console.log(`   ❌ Response: ${JSON.stringify(error.response.data)}`);
      }
    }

    console.log('\n===== RESUMO DOS TESTES =====');
    console.log('🔍 Se todos os endpoints estão funcionando, o problema pode estar:');
    console.log('   1. No frontend não fazendo as requisições corretas');
    console.log('   2. Em problemas de autenticação/autorização');
    console.log('   3. Em filtros ou parâmetros específicos');
    console.log('   4. Em problemas de CORS quando acessado pelo browser');
    console.log('   5. Em timeout ou configurações de rede');

    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('   1. Verificar console do browser no frontend');
    console.log('   2. Verificar Network tab das requisições');
    console.log('   3. Confirmar que frontend está usando URLs corretas');
    console.log('   4. Verificar logs do servidor durante acesso via frontend');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testEndpoints().catch(console.error);