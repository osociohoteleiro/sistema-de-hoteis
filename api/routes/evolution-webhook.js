const express = require('express');
const router = express.Router();
const websocketService = require('../services/websocketService');
const { saveMessage } = require('./whatsapp-messages');

/**
 * POST /api/evolution-webhook
 * Endpoint para receber webhooks da Evolution API
 */
router.post('/', async (req, res) => {
  try {
    const webhookData = req.body;

    console.log(`📨 Webhook Evolution recebido:`, {
      instance: webhookData.instance,
      event: webhookData.event,
      timestamp: new Date().toISOString(),
      dataKeys: webhookData.data ? Object.keys(webhookData.data) : []
    });

    // Validar dados básicos
    if (!webhookData.instance || !webhookData.event) {
      console.warn('⚠️ Webhook inválido:', webhookData);
      return res.status(400).json({
        success: false,
        error: 'Webhook deve conter instance e event'
      });
    }

    // Processar diferentes tipos de eventos
    await processWebhookEvent(webhookData);

    // Enviar via WebSocket para clientes conectados
    websocketService.processEvolutionWebhook(webhookData);

    res.status(200).json({
      success: true,
      message: 'Webhook processado com sucesso',
      timestamp: new Date()
    });

  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno ao processar webhook'
    });
  }
});

/**
 * Processar diferentes tipos de eventos de webhook
 */
async function processWebhookEvent(webhookData) {
  const { instance, event, data } = webhookData;

  try {
    switch (event) {
      case 'MESSAGES_UPSERT':
        await handleNewMessages(instance, data, webhookData);
        break;

      case 'MESSAGES_UPDATE':
        await handleMessageUpdate(instance, data);
        break;

      case 'CONNECTION_UPDATE':
        await handleConnectionUpdate(instance, data);
        break;

      case 'CONTACTS_UPSERT':
        await handleContactUpdate(instance, data);
        break;

      case 'APPLICATION_STARTUP':
        console.log(`🚀 Aplicação iniciada: ${instance}`);
        break;

      default:
        console.log(`📋 Evento não tratado: ${event} da instância ${instance}`);
    }
  } catch (error) {
    console.error(`❌ Erro ao processar evento ${event}:`, error);
  }
}

/**
 * Manipular novas mensagens
 */
async function handleNewMessages(instance, data, webhookData = null) {
  if (!data) {
    console.warn(`⚠️ Dados vazios para instância ${instance}`);
    return;
  }

  // Verificar se a mensagem vem no formato array (data.messages) ou objeto individual (data diretamente)
  let messages = [];

  if (data.messages && Array.isArray(data.messages)) {
    // Formato antigo: array de mensagens
    messages = data.messages;
    console.log(`📥 Processando ${messages.length} mensagens do array para ${instance}`);
  } else if (data.data && data.data.key && data.data.message) {
    // Formato Evolution: mensagem individual dentro de data.data
    messages = [data.data];
    console.log(`📥 Processando mensagem Evolution individual para ${instance}:`, {
      messageType: data.data.messageType,
      fromMe: data.data.key.fromMe,
      content: data.data.message.conversation || 'Mídia/Outro tipo'
    });
  } else if (data.key && data.message) {
    // Formato alternativo: mensagem individual diretamente no data
    messages = [data];
    console.log(`📥 Processando mensagem individual para ${instance}:`, {
      messageType: data.messageType,
      fromMe: data.key.fromMe,
      content: data.message.conversation || 'Mídia/Outro tipo'
    });
  } else if (webhookData.data && webhookData.data.key && webhookData.data.message) {
    // 🔧 CORREÇÃO: Formato novo da Evolution API - dados diretamente no webhookData.data
    messages = [webhookData.data];
    console.log(`📥 Processando mensagem Evolution formato novo para ${instance}:`, {
      messageType: webhookData.data.messageType,
      fromMe: webhookData.data.key.fromMe,
      content: webhookData.data.message.conversation || 'Mídia/Outro tipo',
      pushName: webhookData.data.pushName,
      timestamp: webhookData.data.messageTimestamp
    });
  } else if (webhookData.event === 'messages.upsert' && webhookData.data && webhookData.data.key) {
    // 🔧 CORREÇÃO FINAL: Formato Evolution API atual - estrutura direta como nos logs
    messages = [webhookData.data];
    console.log(`📥 Processando mensagem Evolution formato atual para ${instance}:`, {
      event: webhookData.event,
      messageType: webhookData.data.messageType,
      fromMe: webhookData.data.key.fromMe,
      content: webhookData.data.message ? (webhookData.data.message.conversation || 'Mídia/Outro tipo') : 'Sem conteúdo',
      pushName: webhookData.data.pushName,
      timestamp: webhookData.data.messageTimestamp,
      remoteJid: webhookData.data.key.remoteJid
    });
  } else if (webhookData.event && webhookData.instance && webhookData.data && webhookData.data.key) {
    // 🔧 NOVO: Formato Evolution API real que está chegando agora
    messages = [webhookData.data];
    console.log(`📥 Processando mensagem Evolution formato REAL para ${instance}:`, {
      event: webhookData.event,
      messageType: webhookData.data.messageType,
      fromMe: webhookData.data.key.fromMe,
      content: webhookData.data.message ? (webhookData.data.message.conversation || 'Mídia/Outro tipo') : 'Sem conteúdo',
      pushName: webhookData.data.pushName,
      timestamp: webhookData.data.messageTimestamp,
      remoteJid: webhookData.data.key.remoteJid
    });
  } else {
    console.warn(`⚠️ Estrutura de mensagem não reconhecida para ${instance}:`, webhookData);
    return;
  }

  for (const message of messages) {
    try {
      // Extrair informações da mensagem
      const messageInfo = extractMessageInfo(instance, message);

      if (!messageInfo) {
        console.warn(`⚠️ Não foi possível extrair info da mensagem para ${instance}`);
        continue;
      }

      // Salvar mensagem no banco de dados
      await saveMessage(messageInfo);

      console.log(`💾 Mensagem salva via webhook: ${instance}/${messageInfo.phone_number} - ${messageInfo.message_type} - "${messageInfo.content}"`);

    } catch (error) {
      console.error('❌ Erro ao salvar mensagem via webhook:', error);
    }
  }
}

/**
 * Extrair informações da mensagem do webhook
 */
function extractMessageInfo(instance, message) {
  try {
    const phoneNumber = message.key?.remoteJid?.replace('@s.whatsapp.net', '');
    if (!phoneNumber) return null;

    // Determinar tipo da mensagem
    let messageType = 'text';
    let content = '';
    let mediaUrl = null;
    let caption = '';

    if (message.message) {
      if (message.message.conversation) {
        messageType = 'text';
        content = message.message.conversation;
      } else if (message.message.extendedTextMessage) {
        messageType = 'text';
        content = message.message.extendedTextMessage.text;
      } else if (message.message.imageMessage) {
        messageType = 'image';
        content = 'Imagem';
        caption = message.message.imageMessage.caption || '';
        mediaUrl = message.message.imageMessage.url;
      } else if (message.message.videoMessage) {
        messageType = 'video';
        content = 'Vídeo';
        caption = message.message.videoMessage.caption || '';
        mediaUrl = message.message.videoMessage.url;
      } else if (message.message.audioMessage) {
        messageType = 'audio';
        content = 'Áudio';
        mediaUrl = message.message.audioMessage.url;
      } else if (message.message.documentMessage) {
        messageType = 'document';
        content = message.message.documentMessage.fileName || 'Documento';
        caption = message.message.documentMessage.caption || '';
        mediaUrl = message.message.documentMessage.url;
      } else if (message.message.stickerMessage) {
        messageType = 'sticker';
        content = 'Sticker';
        mediaUrl = message.message.stickerMessage.url;
      } else {
        messageType = 'text';
        content = JSON.stringify(message.message);
      }
    }

    return {
      message_id: message.key?.id || `webhook_${Date.now()}`,
      instance_name: instance,
      phone_number: phoneNumber,
      contact_name: null, // Será atualizado posteriormente
      message_type: messageType,
      content: content,
      media_url: mediaUrl,
      direction: message.key?.fromMe ? 'outbound' : 'inbound',
      timestamp: message.messageTimestamp ? new Date(message.messageTimestamp * 1000) : new Date(),
      caption: caption,
      status: message.status || 'delivered',
      raw_data: message
    };

  } catch (error) {
    console.error('❌ Erro ao extrair informações da mensagem:', error);
    return null;
  }
}

/**
 * Manipular atualização de mensagem
 */
async function handleMessageUpdate(instance, data) {
  console.log(`📝 Atualização de mensagem: ${instance}`, data);
  // TODO: Implementar atualização de status de mensagem no banco
}

/**
 * Manipular atualização de conexão
 */
async function handleConnectionUpdate(instance, data) {
  console.log(`🔗 Atualização de conexão: ${instance}`, data.state);
  // TODO: Implementar log de status de conexão
}

/**
 * Manipular atualização de contato
 */
async function handleContactUpdate(instance, data) {
  console.log(`👤 Atualização de contato: ${instance}`, data);
  // TODO: Implementar atualização de informações de contato no cache
}

/**
 * GET /api/evolution-webhook/test
 * Endpoint para testar o webhook
 */
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Webhook endpoint funcionando',
    timestamp: new Date(),
    instructions: {
      method: 'POST',
      url: '/api/evolution-webhook',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        instance: 'nome_da_instancia',
        event: 'MESSAGES_UPSERT',
        data: { messages: [] }
      }
    }
  });
});

/**
 * GET /api/evolution-webhook/stats
 * Obter estatísticas do WebSocket
 */
router.get('/stats', (req, res) => {
  try {
    const stats = websocketService.getStats();
    res.json({
      success: true,
      data: stats,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter estatísticas'
    });
  }
});

/**
 * GET /api/evolution-webhook/test-direct
 * Teste direto para todos os sockets
 */
router.get('/test-direct', (req, res) => {
  try {
    websocketService.testDirectMessage();
    res.json({
      success: true,
      message: 'Teste enviado para todos os sockets',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('❌ Erro ao enviar teste:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao enviar teste'
    });
  }
});

/**
 * GET /api/evolution-webhook/test-new-message
 * Teste new-message direto para todos os sockets
 */
router.get('/test-new-message', (req, res) => {
  try {
    websocketService.testNewMessageDirect();
    res.json({
      success: true,
      message: 'Teste new-message enviado para todos os sockets',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('❌ Erro ao enviar teste new-message:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao enviar teste new-message'
    });
  }
});

/**
 * Rotas específicas para diferentes tipos de eventos da Evolution
 * (A Evolution parece enviar para endpoints específicos em vez da rota geral)
 */

// Rota para mensagens recebidas
router.post('/messages-upsert', async (req, res) => {
  try {
    console.log('📨 MESSAGES_UPSERT recebido:', req.body);

    const webhookData = {
      instance: req.body.instance || 'unknown',
      event: 'MESSAGES_UPSERT',
      data: req.body
    };

    await processWebhookEvent(webhookData);
    websocketService.processEvolutionWebhook(webhookData);

    res.status(200).json({ success: true, message: 'MESSAGES_UPSERT processado' });
  } catch (error) {
    console.error('❌ Erro MESSAGES_UPSERT:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Rota para atualizações de mensagens
router.post('/messages-update', async (req, res) => {
  try {
    console.log('📝 MESSAGES_UPDATE recebido:', req.body);

    const webhookData = {
      instance: req.body.instance || 'unknown',
      event: 'MESSAGES_UPDATE',
      data: req.body
    };

    await processWebhookEvent(webhookData);
    websocketService.processEvolutionWebhook(webhookData);

    res.status(200).json({ success: true, message: 'MESSAGES_UPDATE processado' });
  } catch (error) {
    console.error('❌ Erro MESSAGES_UPDATE:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Rota para atualizações de chats
router.post('/chats-upsert', async (req, res) => {
  try {
    console.log('💬 CHATS_UPSERT recebido:', req.body);

    const webhookData = {
      instance: req.body.instance || 'unknown',
      event: 'CHATS_UPSERT',
      data: req.body
    };

    await processWebhookEvent(webhookData);
    websocketService.processEvolutionWebhook(webhookData);

    res.status(200).json({ success: true, message: 'CHATS_UPSERT processado' });
  } catch (error) {
    console.error('❌ Erro CHATS_UPSERT:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Rota para atualizações de chats
router.post('/chats-update', async (req, res) => {
  try {
    console.log('💬 CHATS_UPDATE recebido:', req.body);

    const webhookData = {
      instance: req.body.instance || 'unknown',
      event: 'CHATS_UPDATE',
      data: req.body
    };

    await processWebhookEvent(webhookData);
    websocketService.processEvolutionWebhook(webhookData);

    res.status(200).json({ success: true, message: 'CHATS_UPDATE processado' });
  } catch (error) {
    console.error('❌ Erro CHATS_UPDATE:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Rota para atualizações de contatos
router.post('/contacts-update', async (req, res) => {
  try {
    console.log('👤 CONTACTS_UPDATE recebido:', req.body);

    const webhookData = {
      instance: req.body.instance || 'unknown',
      event: 'CONTACTS_UPDATE',
      data: req.body
    };

    await processWebhookEvent(webhookData);
    websocketService.processEvolutionWebhook(webhookData);

    res.status(200).json({ success: true, message: 'CONTACTS_UPDATE processado' });
  } catch (error) {
    console.error('❌ Erro CONTACTS_UPDATE:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Rota para atualizações de presença
router.post('/presence-update', async (req, res) => {
  try {
    console.log('👀 PRESENCE_UPDATE recebido:', req.body);

    const webhookData = {
      instance: req.body.instance || 'unknown',
      event: 'PRESENCE_UPDATE',
      data: req.body
    };

    await processWebhookEvent(webhookData);
    websocketService.processEvolutionWebhook(webhookData);

    res.status(200).json({ success: true, message: 'PRESENCE_UPDATE processado' });
  } catch (error) {
    console.error('❌ Erro PRESENCE_UPDATE:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Rota para mensagens enviadas
router.post('/send-message', async (req, res) => {
  try {
    console.log('📤 SEND_MESSAGE recebido:', req.body);

    const webhookData = {
      instance: req.body.instance || 'unknown',
      event: 'SEND_MESSAGE',
      data: req.body
    };

    await processWebhookEvent(webhookData);
    websocketService.processEvolutionWebhook(webhookData);

    res.status(200).json({ success: true, message: 'SEND_MESSAGE processado' });
  } catch (error) {
    console.error('❌ Erro SEND_MESSAGE:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;