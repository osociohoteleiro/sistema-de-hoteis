const axios = require('axios');
const db = require('../config/database');

// Configurações da API Flowise
const FLOWISE_CONFIG = {
  apiKey: 'shrq4KZg2IGHJFA4ZikqjrXpf46jU7hXfFKXSQUS84M',
  username: 'osociohoteleiro@gmail.com',
  password: 'OSH4040()Xx!..n',
  baseUrl: 'https://flows.osociohoteleiro.com.br'
};

async function loginFlowise() {
  try {
    console.log('🔐 Fazendo login na API Flowise...');
    
    const loginResponse = await axios.post(`${FLOWISE_CONFIG.baseUrl}/api/v1/login`, {
      username: FLOWISE_CONFIG.username,
      password: FLOWISE_CONFIG.password
    });
    
    if (loginResponse.data && loginResponse.data.token) {
      console.log('✅ Login realizado com sucesso');
      return loginResponse.data.token;
    }
    
    throw new Error('Token não encontrado na resposta do login');
    
  } catch (error) {
    console.error('❌ Erro no login:', error.response?.data || error.message);
    throw error;
  }
}

async function getChatflows(token) {
  try {
    console.log('📋 Buscando chatflows...');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Se não conseguir com token, tenta com API key
    if (!token) {
      headers['Authorization'] = `Bearer ${FLOWISE_CONFIG.apiKey}`;
    }
    
    const response = await axios.get(`${FLOWISE_CONFIG.baseUrl}/api/v1/chatflows`, {
      headers
    });
    
    console.log(`✅ Encontrados ${response.data.length} chatflows`);
    return response.data;
    
  } catch (error) {
    console.error('❌ Erro ao buscar chatflows:', error.response?.data || error.message);
    
    // Tenta sem autenticação como fallback
    if (error.response?.status === 401) {
      console.log('🔄 Tentando sem autenticação...');
      try {
        const response = await axios.get(`${FLOWISE_CONFIG.baseUrl}/api/v1/chatflows`);
        return response.data;
      } catch (fallbackError) {
        console.error('❌ Erro no fallback:', fallbackError.message);
      }
    }
    
    throw error;
  }
}

async function insertChatflowsIntoDatabase(chatflows) {
  try {
    console.log('💾 Conectando ao banco de dados...');
    await db.connect();
    
    // Buscar o primeiro hotel disponível para associar os bots
    const hotels = await db.query('SELECT hotel_uuid FROM hotels LIMIT 1');
    if (hotels.length === 0) {
      throw new Error('Nenhum hotel encontrado no banco de dados');
    }
    
    const defaultHotelUuid = hotels[0].hotel_uuid;
    console.log(`🏨 Usando hotel padrão: ${defaultHotelUuid}`);
    
    let insertedCount = 0;
    let skippedCount = 0;
    
    for (const chatflow of chatflows) {
      try {
        // Verificar se o chatflow já existe
        const existing = await db.query(
          'SELECT id FROM flowise_bots WHERE bot_id = ? AND hotel_uuid = ?',
          [chatflow.id, defaultHotelUuid]
        );
        
        if (existing.length > 0) {
          console.log(`ℹ️  Chatflow ${chatflow.name} já existe, pulando...`);
          skippedCount++;
          continue;
        }
        
        // Construir URLs da API
        const prediction_url = `${FLOWISE_CONFIG.baseUrl}/api/v1/prediction/${chatflow.id}`;
        const upsert_url = `${FLOWISE_CONFIG.baseUrl}/api/v1/vector/upsert/${chatflow.id}`;
        
        // Inserir o chatflow na tabela
        await db.query(`
          INSERT INTO flowise_bots (
            bot_name, 
            bot_description, 
            bot_type, 
            prediction_url, 
            upsert_url, 
            bot_id, 
            hotel_uuid,
            active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          chatflow.name || `Chatflow ${chatflow.id}`,
          chatflow.description || 'Chatflow importado da API Flowise',
          chatflow.category || 'chatflow',
          prediction_url,
          upsert_url,
          chatflow.id,
          defaultHotelUuid,
          true
        ]);
        
        console.log(`✅ Chatflow ${chatflow.name} inserido com sucesso`);
        insertedCount++;
        
      } catch (error) {
        console.error(`❌ Erro ao inserir chatflow ${chatflow.name}:`, error.message);
      }
    }
    
    console.log(`\n📊 Resumo:`);
    console.log(`   - Chatflows inseridos: ${insertedCount}`);
    console.log(`   - Chatflows já existentes: ${skippedCount}`);
    console.log(`   - Total processados: ${chatflows.length}`);
    
    await db.close();
    
  } catch (error) {
    console.error('❌ Erro ao inserir no banco:', error.message);
    throw error;
  }
}

async function syncFlowiseBots() {
  try {
    console.log('🚀 Iniciando sincronização dos bots Flowise...\n');
    
    let token = null;
    
    // Tentar fazer login (pode não ser necessário dependendo da configuração)
    try {
      token = await loginFlowise();
    } catch (loginError) {
      console.log('⚠️  Login falhou, tentando com API key diretamente...');
    }
    
    // Buscar chatflows
    const chatflows = await getChatflows(token);
    
    if (chatflows.length === 0) {
      console.log('ℹ️  Nenhum chatflow encontrado');
      return;
    }
    
    // Exibir chatflows encontrados
    console.log('\n📋 Chatflows encontrados:');
    chatflows.forEach((flow, index) => {
      console.log(`   ${index + 1}. ${flow.name} (ID: ${flow.id})`);
      if (flow.description) {
        console.log(`      Descrição: ${flow.description}`);
      }
    });
    
    // Inserir no banco de dados
    await insertChatflowsIntoDatabase(chatflows);
    
    console.log('\n🎉 Sincronização concluída com sucesso!');
    
  } catch (error) {
    console.error('\n❌ Erro na sincronização:', error.message);
    process.exit(1);
  }
}

// Executar o script
if (require.main === module) {
  syncFlowiseBots();
}

module.exports = { syncFlowiseBots };