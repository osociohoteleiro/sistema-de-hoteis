const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const whatsappCloudService = require('../services/whatsappCloudService');
const db = require('../config/database');

/**
 * POST /api/whatsapp-cloud/credentials/:workspaceUuid
 * Configurar credenciais da WhatsApp Cloud API para uma workspace
 */
router.post('/credentials/:workspaceUuid', authenticateToken, async (req, res) => {
  try {
    const { workspaceUuid } = req.params;
    const {
      appId,
      appSecret,
      accessToken,
      phoneNumberId,
      businessAccountId,
      webhookUrl
    } = req.body;

    // Validar campos obrigatórios
    if (!appId || !appSecret || !accessToken || !phoneNumberId) {
      return res.status(400).json({
        success: false,
        error: 'App ID, App Secret, Access Token e Phone Number ID são obrigatórios'
      });
    }

    // Verificar se o usuário tem acesso à workspace
    const workspaceAccess = await db.query(`
      SELECT w.id, w.workspace_name 
      FROM workspaces w 
      WHERE w.uuid = ? AND w.active = true
    `, [workspaceUuid]);

    if (workspaceAccess.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Workspace não encontrada'
      });
    }

    console.log(`🔧 Configurando credenciais WhatsApp Cloud para workspace: ${workspaceUuid}`);

    const result = await whatsappCloudService.setCredentials(workspaceUuid, {
      appId,
      appSecret,
      accessToken,
      phoneNumberId,
      businessAccountId,
      webhookUrl
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'Credenciais configuradas com sucesso',
        workspace: {
          uuid: workspaceUuid,
          name: workspaceAccess[0].workspace_name
        }
      });
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('❌ Erro ao configurar credenciais:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/whatsapp-cloud/credentials/:workspaceUuid
 * Obter status das credenciais configuradas
 */
router.get('/credentials/:workspaceUuid', async (req, res) => {
  try {
    const { workspaceUuid } = req.params;

    const config = await db.query(`
      SELECT app_id, phone_number_id, business_account_id, 
             webhook_url, active, created_at, updated_at
      FROM whatsapp_cloud_configs 
      WHERE workspace_uuid = ?
    `, [workspaceUuid]);

    if (config.length === 0) {
      return res.json({
        success: true,
        configured: false,
        data: null
      });
    }

    res.json({
      success: true,
      configured: true,
      data: {
        appId: config[0].app_id,
        phoneNumberId: config[0].phone_number_id,
        businessAccountId: config[0].business_account_id,
        webhookUrl: config[0].webhook_url,
        active: config[0].active,
        configuredAt: config[0].created_at,
        updatedAt: config[0].updated_at
      }
    });

  } catch (error) {
    console.error('❌ Erro ao obter credenciais:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/whatsapp-cloud/send-message/:workspaceUuid
 * Enviar mensagem de texto
 */
router.post('/send-message/:workspaceUuid', authenticateToken, async (req, res) => {
  try {
    const { workspaceUuid } = req.params;
    const { to, text, messageId } = req.body;

    if (!to || !text) {
      return res.status(400).json({
        success: false,
        error: 'Número do destinatário e texto são obrigatórios'
      });
    }

    console.log(`📤 Enviando mensagem WhatsApp Cloud - Workspace: ${workspaceUuid}, Para: ${to}`);

    const result = await whatsappCloudService.sendTextMessage(workspaceUuid, to, text, messageId);

    res.json(result);

  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/whatsapp-cloud/send-template/:workspaceUuid
 * Enviar mensagem com template
 */
router.post('/send-template/:workspaceUuid', authenticateToken, async (req, res) => {
  try {
    const { workspaceUuid } = req.params;
    const { to, templateName, languageCode, parameters } = req.body;

    if (!to || !templateName) {
      return res.status(400).json({
        success: false,
        error: 'Número do destinatário e nome do template são obrigatórios'
      });
    }

    console.log(`📝 Enviando template WhatsApp Cloud - Workspace: ${workspaceUuid}, Template: ${templateName}`);

    const result = await whatsappCloudService.sendTemplateMessage(
      workspaceUuid, 
      to, 
      templateName, 
      languageCode || 'pt_BR', 
      parameters || []
    );

    res.json(result);

  } catch (error) {
    console.error('❌ Erro ao enviar template:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/whatsapp-cloud/templates/:workspaceUuid
 * Obter templates aprovados
 */
router.get('/templates/:workspaceUuid', authenticateToken, async (req, res) => {
  try {
    const { workspaceUuid } = req.params;

    console.log(`📋 Obtendo templates WhatsApp Cloud - Workspace: ${workspaceUuid}`);

    const result = await whatsappCloudService.getTemplates(workspaceUuid);

    res.json(result);

  } catch (error) {
    console.error('❌ Erro ao obter templates:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/whatsapp-cloud/conversations/:workspaceUuid
 * Obter conversas da workspace
 */
router.get('/conversations/:workspaceUuid', authenticateToken, async (req, res) => {
  try {
    const { workspaceUuid } = req.params;
    const { limit } = req.query;

    console.log(`💬 Obtendo conversas WhatsApp Cloud - Workspace: ${workspaceUuid}`);

    const result = await whatsappCloudService.getConversations(workspaceUuid, parseInt(limit) || 50);

    res.json(result);

  } catch (error) {
    console.error('❌ Erro ao obter conversas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/whatsapp-cloud/messages/:workspaceUuid/:phoneNumber
 * Obter mensagens de uma conversa específica
 */
router.get('/messages/:workspaceUuid/:phoneNumber', authenticateToken, async (req, res) => {
  try {
    const { workspaceUuid, phoneNumber } = req.params;
    const { limit } = req.query;

    console.log(`📱 Obtendo mensagens - Workspace: ${workspaceUuid}, Número: ${phoneNumber}`);

    const result = await whatsappCloudService.getMessages(
      workspaceUuid, 
      phoneNumber, 
      parseInt(limit) || 100
    );

    res.json(result);

  } catch (error) {
    console.error('❌ Erro ao obter mensagens:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/whatsapp-cloud/mark-read/:workspaceUuid
 * Marcar mensagem como lida
 */
router.post('/mark-read/:workspaceUuid', authenticateToken, async (req, res) => {
  try {
    const { workspaceUuid } = req.params;
    const { messageId } = req.body;

    if (!messageId) {
      return res.status(400).json({
        success: false,
        error: 'ID da mensagem é obrigatório'
      });
    }

    await db.query(`
      UPDATE whatsapp_messages SET
        read_at = CURRENT_TIMESTAMP
      WHERE id = ? AND workspace_uuid = ?
    `, [messageId, workspaceUuid]);

    res.json({
      success: true,
      message: 'Mensagem marcada como lida'
    });

  } catch (error) {
    console.error('❌ Erro ao marcar como lida:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/whatsapp-cloud/webhook
 * Verificação do webhook (Meta validação)
 */
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log(`🔐 Webhook verification - Mode: ${mode}, Token: ${token}`);

  const result = whatsappCloudService.verifyWebhook(mode, token, challenge);

  if (result) {
    console.log('✅ Webhook verificado com sucesso');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Falha na verificação do webhook');
    res.status(403).send('Forbidden');
  }
});

/**
 * POST /api/whatsapp-cloud/webhook
 * Receber webhooks da WhatsApp Cloud API
 */
router.post('/webhook', async (req, res) => {
  try {
    console.log('📥 Webhook recebido:', JSON.stringify(req.body, null, 2));

    // Extrair workspace UUID do webhook (pode ser configurado na URL do webhook)
    const workspaceUuid = req.query.workspace || req.headers['x-workspace-uuid'];

    if (!workspaceUuid) {
      console.log('⚠️ Webhook sem workspace UUID');
      return res.status(400).json({
        success: false,
        error: 'Workspace UUID não fornecido'
      });
    }

    const result = await whatsappCloudService.processWebhook(workspaceUuid, req.body);

    if (result.success) {
      res.status(200).json({ success: true });
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/whatsapp-cloud/test/:workspaceUuid
 * Testar configuração
 */
router.get('/test/:workspaceUuid', authenticateToken, async (req, res) => {
  try {
    const { workspaceUuid } = req.params;

    console.log(`🧪 Testando configuração WhatsApp Cloud - Workspace: ${workspaceUuid}`);

    // Tentar obter templates (teste básico de conectividade)
    const result = await whatsappCloudService.getTemplates(workspaceUuid);

    if (result.success) {
      res.json({
        success: true,
        message: 'Configuração testada com sucesso',
        data: {
          templatesCount: result.data.length,
          connectionStatus: 'OK'
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Falha no teste de configuração: ' + result.error
      });
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/whatsapp-cloud/oauth/callback
 * Processar callback do OAuth do Meta
 */
router.post('/oauth/callback', async (req, res) => {
  try {
    const { code, workspaceUuid, redirectUri } = req.body;

    if (!code || !workspaceUuid) {
      return res.status(400).json({
        success: false,
        error: 'Código de autorização e workspace UUID são obrigatórios'
      });
    }

    console.log(`🔐 Processando OAuth callback - Workspace: ${workspaceUuid}`);

    const result = await whatsappCloudService.processOAuthCallback(code, workspaceUuid, redirectUri);

    res.json(result);

  } catch (error) {
    console.error('❌ Erro no callback OAuth:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/whatsapp-cloud/stats/:workspaceUuid
 * Obter estatísticas da workspace
 */
router.get('/stats/:workspaceUuid', authenticateToken, async (req, res) => {
  try {
    const { workspaceUuid } = req.params;

    const stats = await db.query(`
      SELECT 
        COUNT(*) as total_messages,
        COUNT(CASE WHEN direction = 'inbound' THEN 1 END) as received_messages,
        COUNT(CASE WHEN direction = 'outbound' THEN 1 END) as sent_messages,
        COUNT(CASE WHEN direction = 'inbound' AND read_at IS NULL THEN 1 END) as unread_messages,
        COUNT(DISTINCT phone_number) as total_contacts
      FROM whatsapp_messages 
      WHERE workspace_uuid = ?
    `, [workspaceUuid]);

    const recentActivity = await db.query(`
      SELECT DATE(created_at) as date, COUNT(*) as message_count
      FROM whatsapp_messages 
      WHERE workspace_uuid = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, [workspaceUuid]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          total_messages: 0,
          received_messages: 0,
          sent_messages: 0,
          unread_messages: 0,
          total_contacts: 0
        },
        recentActivity: recentActivity
      }
    });

  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;