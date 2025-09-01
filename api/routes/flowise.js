const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { syncFlowiseBots } = require('../scripts/sync-flowise-bots');
const flowiseService = require('../services/flowiseService');

// GET /api/flowise/bots/count/:hotel_uuid - Buscar contagem de chatbots por hotel
router.get('/bots/count/:hotel_uuid', async (req, res) => {
  try {
    const { hotel_uuid } = req.params;
    
    console.log('🤖 Buscando contagem de chatbots Flowise para hotel:', hotel_uuid);
    
    const query = `
      SELECT COUNT(*) as count 
      FROM flowise_bots 
      WHERE hotel_uuid = ? AND active = 1
    `;
    
    const result = await db.query(query, [hotel_uuid]);
    const count = result[0]?.count || 0;
    
    console.log(`✅ Encontrados ${count} chatbots ativos para o hotel ${hotel_uuid}`);
    
    res.json({
      success: true,
      data: {
        count,
        hotel_uuid
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar contagem de chatbots Flowise:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message,
        type: 'DATABASE_ERROR'
      }
    });
  }
});

// GET /api/flowise/bots/:hotel_uuid - Listar chatbots por hotel
router.get('/bots/:hotel_uuid', async (req, res) => {
  try {
    const { hotel_uuid } = req.params;
    
    console.log('📋 Buscando chatbots Flowise para hotel:', hotel_uuid);
    
    const query = `
      SELECT 
        id,
        bot_name,
        bot_description,
        bot_type,
        prediction_url,
        upsert_url,
        bot_id,
        active,
        created_at,
        updated_at
      FROM flowise_bots 
      WHERE hotel_uuid = ?
      ORDER BY created_at DESC
    `;
    
    const chatbots = await db.query(query, [hotel_uuid]);
    
    console.log(`✅ Encontrados ${chatbots.length} chatbots para o hotel ${hotel_uuid}`);
    
    res.json({
      success: true,
      data: chatbots
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar chatbots Flowise:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message,
        type: 'DATABASE_ERROR'
      }
    });
  }
});

// POST /api/flowise/sync - Sincronizar chatbots do Flowise
router.post('/sync', async (req, res) => {
  try {
    console.log('🔄 Iniciando sincronização dos chatbots Flowise...');
    
    // Executar a sincronização
    await syncFlowiseBots();
    
    // Buscar contagem total após sincronização
    const countQuery = 'SELECT COUNT(*) as count FROM flowise_bots WHERE active = 1';
    const countResult = await db.query(countQuery);
    const totalCount = countResult[0]?.count || 0;
    
    console.log(`✅ Sincronização concluída! Total de ${totalCount} chatbots ativos`);
    
    res.json({
      success: true,
      data: {
        message: 'Sincronização concluída com sucesso',
        totalChatbots: totalCount
      }
    });
    
  } catch (error) {
    console.error('❌ Erro na sincronização dos chatbots Flowise:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message,
        type: 'SYNC_ERROR'
      }
    });
  }
});

// POST /api/flowise/relate - Relacionar chatbot com hotel
router.post('/relate', async (req, res) => {
  try {
    const { bot_id, hotel_uuid, bot_name } = req.body;
    
    if (!bot_id || !hotel_uuid) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'bot_id e hotel_uuid são obrigatórios',
          type: 'VALIDATION_ERROR'
        }
      });
    }
    
    console.log(`🔗 Relacionando chatbot ${bot_id} com hotel ${hotel_uuid}`);
    
    // Verificar se o hotel já possui um chatbot (regra: 1 hotel = 1 chatbot máximo)
    const existingHotelBotQuery = 'SELECT id, bot_name FROM flowise_bots WHERE hotel_uuid = ?';
    const existingHotelBot = await db.query(existingHotelBotQuery, [hotel_uuid]);
    
    if (existingHotelBot.length > 0) {
      return res.status(409).json({
        success: false,
        error: {
          message: `Este hotel já possui um chatbot relacionado: ${existingHotelBot[0].bot_name}`,
          type: 'HOTEL_LIMIT_ERROR'
        }
      });
    }
    
    // Verificar se o relacionamento específico já existe
    const existingRelationQuery = 'SELECT id FROM flowise_bots WHERE bot_id = ? AND hotel_uuid = ?';
    const existingRelation = await db.query(existingRelationQuery, [bot_id, hotel_uuid]);
    
    if (existingRelation.length > 0) {
      return res.status(409).json({
        success: false,
        error: {
          message: 'Este chatbot já está relacionado com este hotel',
          type: 'CONFLICT_ERROR'
        }
      });
    }
    
    // Buscar informações do chatbot no Flowise
    const axios = require('axios');
    const flowiseConfig = {
      baseUrl: 'https://flows.osociohoteleiro.com.br',
      apiKey: 'shrq4KZg2IGHJFA4ZikqjrXpf46jU7hXfFKXSQUS84M'
    };
    
    let chatflowData = {
      name: bot_name || `Chatbot ${bot_id}`,
      description: 'Chatbot relacionado manualmente',
      category: 'chatflow'
    };
    
    try {
      const response = await axios.get(`${flowiseConfig.baseUrl}/api/v1/chatflows/${bot_id}`, {
        headers: {
          'Authorization': `Bearer ${flowiseConfig.apiKey}`
        }
      });
      
      if (response.data) {
        chatflowData = {
          name: response.data.name || chatflowData.name,
          description: response.data.description || chatflowData.description,
          category: response.data.category || chatflowData.category
        };
      }
    } catch (apiError) {
      console.log('⚠️ Não foi possível buscar dados do chatbot na API Flowise, usando dados fornecidos');
    }
    
    // Inserir o relacionamento
    const prediction_url = `${flowiseConfig.baseUrl}/api/v1/prediction/${bot_id}`;
    const upsert_url = `${flowiseConfig.baseUrl}/api/v1/vector/upsert/${bot_id}`;
    
    const insertQuery = `
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
    `;
    
    await db.query(insertQuery, [
      chatflowData.name,
      chatflowData.description,
      chatflowData.category,
      prediction_url,
      upsert_url,
      bot_id,
      hotel_uuid,
      true
    ]);
    
    console.log(`✅ Chatbot ${bot_id} relacionado com hotel ${hotel_uuid} com sucesso`);
    
    // Criar integração Flowise automaticamente
    try {
      await flowiseService.createFlowiseIntegration(hotel_uuid, chatflowData.name, prediction_url);
      console.log('✅ Integração Flowise criada automaticamente');
    } catch (integrationError) {
      console.warn('⚠️ Aviso: Erro ao criar integração Flowise automaticamente:', integrationError.message);
      // Não interrompe o processo, apenas registra o aviso
    }
    
    res.json({
      success: true,
      data: {
        message: 'Chatbot relacionado com sucesso',
        bot_id,
        hotel_uuid,
        bot_name: chatflowData.name
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao relacionar chatbot:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message,
        type: 'DATABASE_ERROR'
      }
    });
  }
});

// GET /api/flowise/available/:hotel_uuid - Listar chatbots disponíveis para um hotel
router.get('/available/:hotel_uuid', async (req, res) => {
  try {
    const { hotel_uuid } = req.params;
    const { mode } = req.query; // 'relate' ou 'replace'
    
    console.log('🔍 Buscando chatbots disponíveis para hotel:', hotel_uuid, 'modo:', mode);
    
    // Verificar se o hotel já tem um chatbot relacionado
    const existingBotQuery = `
      SELECT bot_id, bot_name 
      FROM flowise_bots 
      WHERE hotel_uuid = ? 
      LIMIT 1
    `;
    const existingBots = await db.query(existingBotQuery, [hotel_uuid]);
    
    if (existingBots.length > 0 && mode !== 'replace') {
      console.log(`⚠️ Hotel já possui um chatbot relacionado: ${existingBots[0].bot_name}`);
      return res.json({
        success: true,
        data: [],
        message: 'Hotel já possui um chatbot relacionado. Um hotel pode ter apenas 1 chatbot.',
        current_bot: {
          id: existingBots[0].bot_id,
          name: existingBots[0].bot_name
        }
      });
    }
    
    const axios = require('axios');
    const flowiseConfig = {
      baseUrl: 'https://flows.osociohoteleiro.com.br',
      apiKey: 'shrq4KZg2IGHJFA4ZikqjrXpf46jU7hXfFKXSQUS84M'
    };
    
    // Buscar todos os chatbots do Flowise (todos disponíveis, pois um bot pode estar em vários hotéis)
    const response = await axios.get(`${flowiseConfig.baseUrl}/api/v1/chatflows`, {
      headers: {
        'Authorization': `Bearer ${flowiseConfig.apiKey}`
      }
    });
    
    let availableChatflows = response.data || [];
    
    // Se estiver no modo replace, filtrar o chatbot atual
    if (mode === 'replace' && existingBots.length > 0) {
      const currentBotId = existingBots[0].bot_id;
      availableChatflows = availableChatflows.filter(chatflow => chatflow.id !== currentBotId);
      console.log(`✅ Modo substituição: ${availableChatflows.length} chatbots disponíveis (excluindo o atual: ${existingBots[0].bot_name})`);
    } else {
      console.log(`✅ Total de ${availableChatflows.length} chatbots disponíveis para relacionamento`);
    }
    
    res.json({
      success: true,
      data: availableChatflows,
      current_bot: existingBots.length > 0 ? {
        id: existingBots[0].bot_id,
        name: existingBots[0].bot_name
      } : null
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar chatbots disponíveis:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message,
        type: 'API_ERROR'
      }
    });
  }
});

// GET /api/flowise/available - Listar todos os chatbots da API Flowise (sem filtro)
router.get('/available', async (req, res) => {
  try {
    console.log('🔍 Buscando chatbots disponíveis na API Flowise...');
    
    const axios = require('axios');
    const flowiseConfig = {
      baseUrl: 'https://flows.osociohoteleiro.com.br',
      apiKey: 'shrq4KZg2IGHJFA4ZikqjrXpf46jU7hXfFKXSQUS84M'
    };
    
    const response = await axios.get(`${flowiseConfig.baseUrl}/api/v1/chatflows`, {
      headers: {
        'Authorization': `Bearer ${flowiseConfig.apiKey}`
      }
    });
    
    const availableChatflows = response.data || [];
    
    console.log(`✅ Encontrados ${availableChatflows.length} chatbots disponíveis na API Flowise`);
    
    res.json({
      success: true,
      data: availableChatflows
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar chatbots da API Flowise:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message,
        type: 'API_ERROR'
      }
    });
  }
});

// DELETE /api/flowise/unrelate/:hotel_uuid - Desrelacionar chatbot do hotel
router.delete('/unrelate/:hotel_uuid', async (req, res) => {
  try {
    const { hotel_uuid } = req.params;
    
    console.log(`🔗 Desrelacionando chatbot do hotel ${hotel_uuid}`);
    
    // Verificar se o hotel possui um chatbot relacionado
    const existingBotQuery = `
      SELECT id, bot_name, bot_id 
      FROM flowise_bots 
      WHERE hotel_uuid = ? 
      LIMIT 1
    `;
    const existingBots = await db.query(existingBotQuery, [hotel_uuid]);
    
    if (existingBots.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Hotel não possui nenhum chatbot relacionado',
          type: 'NOT_FOUND_ERROR'
        }
      });
    }
    
    const currentBot = existingBots[0];
    
    // Remover o relacionamento
    const deleteQuery = 'DELETE FROM flowise_bots WHERE hotel_uuid = ?';
    await db.query(deleteQuery, [hotel_uuid]);
    
    console.log(`✅ Chatbot ${currentBot.bot_name} desrelacionado do hotel ${hotel_uuid}`);
    
    res.json({
      success: true,
      data: {
        message: 'Chatbot desrelacionado com sucesso',
        removed_bot: {
          id: currentBot.bot_id,
          name: currentBot.bot_name
        },
        hotel_uuid
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao desrelacionar chatbot:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message,
        type: 'DATABASE_ERROR'
      }
    });
  }
});

// PUT /api/flowise/replace/:hotel_uuid - Substituir chatbot do hotel
router.put('/replace/:hotel_uuid', async (req, res) => {
  try {
    const { hotel_uuid } = req.params;
    const { new_bot_id, new_bot_name } = req.body;
    
    if (!new_bot_id || !new_bot_name) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'new_bot_id e new_bot_name são obrigatórios',
          type: 'VALIDATION_ERROR'
        }
      });
    }
    
    console.log(`🔄 Substituindo chatbot do hotel ${hotel_uuid} por ${new_bot_id}`);
    
    // Verificar se o hotel possui um chatbot relacionado
    const existingBotQuery = `
      SELECT id, bot_name, bot_id 
      FROM flowise_bots 
      WHERE hotel_uuid = ? 
      LIMIT 1
    `;
    const existingBots = await db.query(existingBotQuery, [hotel_uuid]);
    
    if (existingBots.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Hotel não possui nenhum chatbot para substituir',
          type: 'NOT_FOUND_ERROR'
        }
      });
    }
    
    const oldBot = existingBots[0];
    
    // Buscar informações do novo chatbot no Flowise
    const axios = require('axios');
    const flowiseConfig = {
      baseUrl: 'https://flows.osociohoteleiro.com.br',
      apiKey: 'shrq4KZg2IGHJFA4ZikqjrXpf46jU7hXfFKXSQUS84M'
    };
    
    let newBotData = {
      name: new_bot_name,
      description: 'Chatbot substituído',
      category: 'chatflow'
    };
    
    try {
      const response = await axios.get(`${flowiseConfig.baseUrl}/api/v1/chatflows/${new_bot_id}`, {
        headers: {
          'Authorization': `Bearer ${flowiseConfig.apiKey}`
        }
      });
      
      if (response.data) {
        newBotData = {
          name: response.data.name || newBotData.name,
          description: response.data.description || newBotData.description,
          category: response.data.category || newBotData.category
        };
      }
    } catch (apiError) {
      console.log('⚠️ Não foi possível buscar dados do novo chatbot na API Flowise, usando dados fornecidos');
    }
    
    // Construir URLs da API
    const prediction_url = `${flowiseConfig.baseUrl}/api/v1/prediction/${new_bot_id}`;
    const upsert_url = `${flowiseConfig.baseUrl}/api/v1/vector/upsert/${new_bot_id}`;
    
    // Atualizar o registro existente com o novo chatbot
    const updateQuery = `
      UPDATE flowise_bots 
      SET 
        bot_name = ?,
        bot_description = ?,
        bot_type = ?,
        prediction_url = ?,
        upsert_url = ?,
        bot_id = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE hotel_uuid = ?
    `;
    
    await db.query(updateQuery, [
      newBotData.name,
      newBotData.description,
      newBotData.category,
      prediction_url,
      upsert_url,
      new_bot_id,
      hotel_uuid
    ]);
    
    console.log(`✅ Chatbot do hotel ${hotel_uuid} substituído: ${oldBot.bot_name} → ${newBotData.name}`);
    
    // Atualizar integração Flowise automaticamente
    try {
      await flowiseService.createFlowiseIntegration(hotel_uuid, newBotData.name, prediction_url);
      console.log('✅ Integração Flowise atualizada automaticamente');
    } catch (integrationError) {
      console.warn('⚠️ Aviso: Erro ao atualizar integração Flowise automaticamente:', integrationError.message);
      // Não interrompe o processo, apenas registra o aviso
    }
    
    res.json({
      success: true,
      data: {
        message: 'Chatbot substituído com sucesso',
        old_bot: {
          id: oldBot.bot_id,
          name: oldBot.bot_name
        },
        new_bot: {
          id: new_bot_id,
          name: newBotData.name
        },
        hotel_uuid
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao substituir chatbot:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message,
        type: 'DATABASE_ERROR'
      }
    });
  }
});

module.exports = router;