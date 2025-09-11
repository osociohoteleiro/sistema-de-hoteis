const axios = require('axios');

async function testRateShopperEndpoint() {
  console.log('🧪 Testando endpoint do Rate Shopper em produção...');
  
  const API_BASE = 'https://osh-sistemas-api-backend.d32pnk.easypanel.host/api';
  const HOTEL_UUID = '0cf811dd-82cb-11f0-bd40-02420a0b00b1'; // UUID real de produção
  
  try {
    // 1. Testar health check
    console.log('1. Testando health check...');
    const health = await axios.get(`${API_BASE}/health`);
    console.log('   ✅ Health:', health.data);
    
    // 2. Testar se o hotel existe via dashboard
    console.log(`\n2. Testando se hotel existe (UUID: ${HOTEL_UUID})...`);
    const hotelTest = await axios.get(`${API_BASE}/rate-shopper/${HOTEL_UUID}/dashboard`);
    console.log('   ✅ Hotel encontrado:', hotelTest.status);
    
    // 3. Listar properties do hotel
    console.log('\n3. Listando properties do hotel...');
    const properties = await axios.get(`${API_BASE}/rate-shopper/${HOTEL_UUID}/properties`);
    console.log('   ✅ Properties encontradas:', properties.data?.data?.length || 0);
    
    if (properties.data?.data?.length > 0) {
      const firstProperty = properties.data.data[0];
      console.log(`   📋 Primeira property: ${firstProperty.property_name} (ID: ${firstProperty.id})`);
      
      // 4. Testar criação de search
      console.log('\n4. Testando criação de search...');
      
      const searchData = {
        property_id: firstProperty.id,
        start_date: '2025-09-15',
        end_date: '2025-09-20'
      };
      
      console.log('   📊 Dados da search:', searchData);
      
      try {
        const createSearch = await axios.post(
          `${API_BASE}/rate-shopper/${HOTEL_UUID}/searches`,
          searchData,
          {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );
        
        console.log('   ✅ Search criada com sucesso!');
        console.log('   📋 Resultado:', createSearch.data);
        
      } catch (searchError) {
        console.log('   ❌ Erro ao criar search:');
        console.log('   Status:', searchError.response?.status);
        console.log('   Data:', searchError.response?.data);
        
        // Se for erro 500, pode ser problema no backend
        if (searchError.response?.status === 500) {
          console.log('   🔍 Erro 500 - problemas no backend');
        }
      }
      
    } else {
      console.log('   ⚠️  Nenhuma property encontrada para o hotel');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.status, error.response?.data || error.message);
  }
}

testRateShopperEndpoint();