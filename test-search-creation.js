const axios = require('axios');

async function testSearchCreation() {
  try {
    console.log('🧪 Testando criação de busca...');
    
    const searchData = {
      property_id: 1, // Hotel Maranduba
      start_date: '2025-09-10',
      end_date: '2025-09-12',
      max_bundle_size: 3
    };
    
    console.log('📤 Enviando dados:', JSON.stringify(searchData, null, 2));
    
    const response = await axios.post('http://localhost:3002/api/rate-shopper/2/searches', searchData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Resposta da API:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log('\n🎉 Busca criada com sucesso!');
      console.log(`🆔 ID: ${response.data.search.id}`);
      console.log(`🏷️ UUID: ${response.data.search.uuid}`);
      console.log(`🏨 Propriedade: ${response.data.search.property_name}`);
      console.log(`📅 Período: ${response.data.search.start_date} → ${response.data.search.end_date}`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao criar busca:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('📋 Detalhes do erro:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testSearchCreation();