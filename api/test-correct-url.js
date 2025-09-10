// Script para testar URLs diferentes
const axios = require('axios');

const HOTEL_ID = 17;

async function testDifferentURLs() {
  console.log('🔍 TESTANDO DIFERENTES URLs\n');
  
  const urls = [
    'http://ep.osociohoteleiro.com.br/api',
    'https://ep.osociohoteleiro.com.br/api', 
    'http://ep.osociohoteleiro.com.br:3001/api',
    'https://api.osociohoteleiro.com.br/api',
    'http://api.osociohoteleiro.com.br/api',
    'https://pms.osociohoteleiro.com.br/api'
  ];
  
  for (const baseUrl of urls) {
    console.log(`🧪 Testando: ${baseUrl}`);
    
    try {
      const response = await axios.get(`${baseUrl}/rate-shopper/${HOTEL_ID}/dashboard`, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`   ✅ Status: ${response.status}`);
      
      // Verificar se é JSON ou HTML
      const contentType = response.headers['content-type'];
      const isJson = contentType && contentType.includes('application/json');
      
      if (isJson) {
        console.log(`   ✅ Retorna JSON válido`);
        console.log(`   ✅ Tamanho da resposta: ${JSON.stringify(response.data).length} bytes`);
        
        if (response.data.success) {
          console.log(`   ✅ API funcionando! Dados encontrados.`);
          console.log(`   ✅ URL CORRETA: ${baseUrl}`);
          
          // Mostrar estrutura dos dados
          if (response.data.data) {
            const data = response.data.data;
            console.log(`   📊 Summary: ${JSON.stringify(data.summary || {})}`);
            console.log(`   📊 Recent searches: ${data.recent_searches?.length || 0} itens`);
            console.log(`   📊 Price trends: ${data.price_trends?.length || 0} itens`);
            console.log(`   📊 Properties: ${data.properties?.length || 0} itens`);
          }
          
          break;
        }
      } else {
        console.log(`   ❌ Retorna HTML (não é a API)`);
      }
      
    } catch (error) {
      if (error.code === 'ENOTFOUND') {
        console.log(`   ❌ DNS não resolve: ${error.message}`);
      } else if (error.code === 'ECONNREFUSED') {
        console.log(`   ❌ Conexão recusada`);
      } else if (error.response) {
        console.log(`   ❌ Status: ${error.response.status} - ${error.response.statusText}`);
      } else {
        console.log(`   ❌ Erro: ${error.message}`);
      }
    }
    
    console.log('');
  }
  
  console.log('💡 Se nenhuma URL funcionar, verifique:');
  console.log('   1. Se a API está rodando em produção');
  console.log('   2. Se há proxy/load balancer configurado');
  console.log('   3. Se a porta está correta');
  console.log('   4. Se há autenticação necessária');
}

testDifferentURLs().catch(console.error);