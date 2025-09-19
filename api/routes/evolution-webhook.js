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
        await handleNewMessages(instance, data);
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
async function handleNewMessages(instance, data) {
  if (!data || !data.messages) return;

  for (const message of data.messages) {
    try {
      // Extrair informações da mensagem
      const messageInfo = extractMessageInfo(instance, message);

      if (!messageInfo) continue;

      // Salvar mensagem no banco de dados
      await saveMessage(messageInfo);

      console.log(`💾 Mensagem salva via webhook: ${instance}/${messageInfo.phone_number} - ${messageInfo.message_type}`);

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
      timestamp: new Date(message.messageTimestamp * 1000),
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

module.exports = router;