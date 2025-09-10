const axios = require('axios');
const db = require('../config/database');

class WhatsAppCloudService {
  constructor() {
    this.baseURL = 'https://graph.facebook.com/v18.0';
    this.credentials = new Map(); // Cache de credenciais por workspace
  }

  /**
   * Configurar credenciais para uma workspace
   */
  async setCredentials(workspaceUuid, credentials) {
    try {
      const {
        appId,
        appSecret,
        accessToken,
        phoneNumberId,
        businessAccountId,
        webhookUrl
      } = credentials;

      // Salvar no banco de dados
      const existingConfig = await db.query(`
        SELECT id FROM whatsapp_cloud_configs 
        WHERE workspace_uuid = $1
      `, [workspaceUuid]);

      if (existingConfig.length > 0) {
        // Atualizar existente
        await db.query(`
          UPDATE whatsapp_cloud_configs SET
            app_id = $1,
            app_secret = $2,
            access_token = $3,
            phone_number_id = $4,
            business_account_id = $5,
            webhook_url = $6,
            updated_at = CURRENT_TIMESTAMP
          WHERE workspace_uuid = $7
        `, [appId, appSecret, accessToken, phoneNumberId, businessAccountId, webhookUrl, workspaceUuid]);
      } else {
        // Criar novo
        await db.query(`
          INSERT INTO whatsapp_cloud_configs (
            workspace_uuid, app_id, app_secret, access_token, 
            phone_number_id, business_account_id, webhook_url
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [workspaceUuid, appId, appSecret, accessToken, phoneNumberId, businessAccountId, webhookUrl]);
      }

      // Cachear credenciais
      this.credentials.set(workspaceUuid, {
        appId,
        appSecret,
        accessToken,
        phoneNumberId,
        businessAccountId,
        webhookUrl
      });

      return {
        success: true,
        message: 'Credenciais configuradas com sucesso'
      };

    } catch (error) {
      console.error('Erro ao configurar credenciais:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obter credenciais de uma workspace
   */
  async getCredentials(workspaceUuid) {
    try {
      // Verificar cache primeiro
      if (this.credentials.has(workspaceUuid)) {
        return this.credentials.get(workspaceUuid);
      }

      // Buscar no banco
      const result = await db.query(`
        SELECT app_id, app_secret, access_token, phone_number_id, 
               business_account_id, webhook_url
        FROM whatsapp_cloud_configs 
        WHERE workspace_uuid = $1 AND active = true
      `, [workspaceUuid]);

      if (result.length === 0) {
        throw new Error('Credenciais não encontradas para esta workspace');
      }

      const credentials = {
        appId: result[0].app_id,
        appSecret: result[0].app_secret,
        accessToken: result[0].access_token,
        phoneNumberId: result[0].phone_number_id,
        businessAccountId: result[0].business_account_id,
        webhookUrl: result[0].webhook_url
      };

      // Cachear
      this.credentials.set(workspaceUuid, credentials);

      return credentials;

    } catch (error) {
      throw new Error(`Erro ao obter credenciais: ${error.message}`);
    }
  }

  /**
   * Enviar mensagem de texto
   */
  async sendTextMessage(workspaceUuid, to, text, messageId = null) {
    try {
      const credentials = await this.getCredentials(workspaceUuid);

      const payload = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: {
          body: text
        }
      };

      const response = await axios.post(
        `${this.baseURL}/${credentials.phoneNumberId}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Salvar mensagem no banco
      if (response.data.messages && response.data.messages[0]) {
        await this.saveMessage(workspaceUuid, {
          whatsapp_message_id: response.data.messages[0].id,
          phone_number: to,
          message_type: 'text',
          content: text,
          direction: 'outbound',
          status: 'sent',
          internal_message_id: messageId
        });
      }

      return {
        success: true,
        data: response.data,
        messageId: response.data.messages[0]?.id
      };

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * Enviar mensagem com template
   */
  async sendTemplateMessage(workspaceUuid, to, templateName, languageCode = 'pt_BR', parameters = []) {
    try {
      const credentials = await this.getCredentials(workspaceUuid);

      const payload = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode
          }
        }
      };

      // Adicionar parâmetros se fornecidos
      if (parameters.length > 0) {
        payload.template.components = [
          {
            type: 'body',
            parameters: parameters.map(param => ({ type: 'text', text: param }))
          }
        ];
      }

      const response = await axios.post(
        `${this.baseURL}/${credentials.phoneNumberId}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Salvar mensagem no banco
      if (response.data.messages && response.data.messages[0]) {
        await this.saveMessage(workspaceUuid, {
          whatsapp_message_id: response.data.messages[0].id,
          phone_number: to,
          message_type: 'template',
          content: JSON.stringify({ templateName, parameters }),
          direction: 'outbound',
          status: 'sent'
        });
      }

      return {
        success: true,
        data: response.data,
        messageId: response.data.messages[0]?.id
      };

    } catch (error) {
      console.error('Erro ao enviar template:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * Obter templates aprovados
   */
  async getTemplates(workspaceUuid) {
    try {
      const credentials = await this.getCredentials(workspaceUuid);

      const response = await axios.get(
        `${this.baseURL}/${credentials.businessAccountId}/message_templates`,
        {
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`
          },
          params: {
            fields: 'name,status,components,language'
          }
        }
      );

      return {
        success: true,
        data: response.data.data || []
      };

    } catch (error) {
      console.error('Erro ao obter templates:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * Verificar webhook (para Meta validar)
   */
  verifyWebhook(mode, token, challenge) {
    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'OSH_WEBHOOK_TOKEN_2024';
    
    if (mode === 'subscribe' && token === verifyToken) {
      return challenge;
    }
    return null;
  }

  /**
   * Processar callback do OAuth do Meta
   */
  async processOAuthCallback(code, workspaceUuid, redirectUri) {
    try {
      console.log(`🔐 Iniciando OAuth callback para workspace: ${workspaceUuid}`);

      // App credentials (essas devem estar no .env em produção)
      const APP_ID = process.env.FACEBOOK_APP_ID || 'your_app_id_here';
      const APP_SECRET = process.env.FACEBOOK_APP_SECRET || 'your_app_secret_here';

      // Trocar código por access token
      const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
        params: {
          client_id: APP_ID,
          client_secret: APP_SECRET,
          redirect_uri: redirectUri,
          code: code
        }
      });

      const accessToken = tokenResponse.data.access_token;

      if (!accessToken) {
        throw new Error('Access token não recebido do Meta');
      }

      console.log(`✅ Access token obtido para workspace: ${workspaceUuid}`);

      // Obter informações da conta WhatsApp Business
      const businessResponse = await axios.get('https://graph.facebook.com/v18.0/me/businesses', {
        params: {
          access_token: accessToken
        }
      });

      if (!businessResponse.data.data || businessResponse.data.data.length === 0) {
        throw new Error('Nenhuma conta Business encontrada');
      }

      const businessAccountId = businessResponse.data.data[0].id;

      // Obter números de telefone WhatsApp
      const phoneResponse = await axios.get(`https://graph.facebook.com/v18.0/${businessAccountId}/phone_numbers`, {
        params: {
          access_token: accessToken
        }
      });

      if (!phoneResponse.data.data || phoneResponse.data.data.length === 0) {
        throw new Error('Nenhum número de WhatsApp encontrado na conta Business');
      }

      const phoneNumberId = phoneResponse.data.data[0].id;
      const phoneNumber = phoneResponse.data.data[0].display_phone_number;

      console.log(`📱 Número encontrado: ${phoneNumber} (ID: ${phoneNumberId})`);

      // Verificar se já existe configuração para esta workspace
      const existingConfig = await db.query(`
        SELECT id FROM whatsapp_cloud_configs 
        WHERE workspace_uuid = $1
      `, [workspaceUuid]);

      if (existingConfig.length > 0) {
        // Atualizar configuração existente
        await db.query(`
          UPDATE whatsapp_cloud_configs SET
            app_id = $1,
            access_token = $2,
            phone_number_id = $3,
            business_account_id = $4,
            phone_number = $5,
            active = true,
            updated_at = CURRENT_TIMESTAMP
          WHERE workspace_uuid = $6
        `, [APP_ID, accessToken, phoneNumberId, businessAccountId, phoneNumber, workspaceUuid]);

        console.log(`🔄 Configuração atualizada para workspace: ${workspaceUuid}`);
      } else {
        // Criar nova configuração
        await db.query(`
          INSERT INTO whatsapp_cloud_configs (
            workspace_uuid, app_id, access_token, phone_number_id, 
            business_account_id, phone_number, active, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [workspaceUuid, APP_ID, accessToken, phoneNumberId, businessAccountId, phoneNumber]);

        console.log(`✨ Nova configuração criada para workspace: ${workspaceUuid}`);
      }

      return {
        success: true,
        message: 'WhatsApp Cloud API conectado com sucesso',
        data: {
          phoneNumber: phoneNumber,
          phoneNumberId: phoneNumberId,
          businessAccountId: businessAccountId
        }
      };

    } catch (error) {
      console.error('❌ Erro no OAuth callback:', error);
      
      let errorMessage = 'Erro desconhecido';
      if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Processar webhook de mensagem recebida
   */
  async processWebhook(workspaceUuid, webhookData) {
    try {
      const { entry } = webhookData;

      if (!entry || entry.length === 0) {
        return { success: true, message: 'Webhook vazio' };
      }

      for (const entryItem of entry) {
        const { changes } = entryItem;

        if (!changes) continue;

        for (const change of changes) {
          const { value } = change;

          if (!value || !value.messages) continue;

          // Processar mensagens recebidas
          for (const message of value.messages) {
            await this.processIncomingMessage(workspaceUuid, message, value.contacts);
          }

          // Processar status de mensagens
          if (value.statuses) {
            for (const status of value.statuses) {
              await this.processMessageStatus(workspaceUuid, status);
            }
          }
        }
      }

      return { success: true, message: 'Webhook processado' };

    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Processar mensagem recebida
   */
  async processIncomingMessage(workspaceUuid, message, contacts) {
    try {
      const contact = contacts ? contacts.find(c => c.wa_id === message.from) : null;
      
      // Salvar/atualizar contato
      if (contact) {
        await this.saveOrUpdateContact(workspaceUuid, contact);
      }

      // Salvar mensagem
      let content = '';
      let messageType = message.type;

      switch (message.type) {
        case 'text':
          content = message.text.body;
          break;
        case 'image':
        case 'video':
        case 'audio':
        case 'document':
          content = JSON.stringify({
            id: message[message.type].id,
            mime_type: message[message.type].mime_type,
            caption: message[message.type].caption || ''
          });
          break;
        case 'location':
          content = JSON.stringify({
            latitude: message.location.latitude,
            longitude: message.location.longitude,
            name: message.location.name || '',
            address: message.location.address || ''
          });
          break;
        default:
          content = JSON.stringify(message);
      }

      await this.saveMessage(workspaceUuid, {
        whatsapp_message_id: message.id,
        phone_number: message.from,
        message_type: messageType,
        content: content,
        direction: 'inbound',
        status: 'received',
        timestamp: message.timestamp
      });

      return { success: true };

    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      throw error;
    }
  }

  /**
   * Processar status de mensagem
   */
  async processMessageStatus(workspaceUuid, status) {
    try {
      await db.query(`
        UPDATE whatsapp_messages SET 
          status = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE whatsapp_message_id = $2 AND workspace_uuid = $3
      `, [status.status, status.id, workspaceUuid]);

      return { success: true };

    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      throw error;
    }
  }

  /**
   * Salvar mensagem no banco
   */
  async saveMessage(workspaceUuid, messageData) {
    try {
      await db.query(`
        INSERT INTO whatsapp_messages (
          workspace_uuid, whatsapp_message_id, phone_number, message_type,
          content, direction, status, timestamp, internal_message_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        workspaceUuid,
        messageData.whatsapp_message_id,
        messageData.phone_number,
        messageData.message_type,
        messageData.content,
        messageData.direction,
        messageData.status,
        messageData.timestamp || new Date(),
        messageData.internal_message_id || null
      ]);

    } catch (error) {
      console.error('Erro ao salvar mensagem:', error);
      throw error;
    }
  }

  /**
   * Salvar/atualizar contato
   */
  async saveOrUpdateContact(workspaceUuid, contact) {
    try {
      const existingContact = await db.query(`
        SELECT id FROM whatsapp_contacts 
        WHERE workspace_uuid = $1 AND phone_number = $2
      `, [workspaceUuid, contact.wa_id]);

      if (existingContact.length > 0) {
        // Atualizar
        await db.query(`
          UPDATE whatsapp_contacts SET
            name = $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE workspace_uuid = $2 AND phone_number = $3
        `, [contact.profile?.name || '', workspaceUuid, contact.wa_id]);
      } else {
        // Criar novo
        await db.query(`
          INSERT INTO whatsapp_contacts (
            workspace_uuid, phone_number, name
          ) VALUES ($1, $2, $3)
        `, [workspaceUuid, contact.wa_id, contact.profile?.name || '']);
      }

    } catch (error) {
      console.error('Erro ao salvar contato:', error);
      throw error;
    }
  }

  /**
   * Obter conversas de uma workspace
   */
  async getConversations(workspaceUuid, limit = 50) {
    try {
      const conversations = await db.query(`
        SELECT 
          c.phone_number,
          c.name as contact_name,
          m.content as last_message,
          m.direction as last_message_direction,
          m.created_at as last_message_time,
          COUNT(CASE WHEN m.direction = 'inbound' AND m.read_at IS NULL THEN 1 END) as unread_count
        FROM whatsapp_contacts c
        LEFT JOIN whatsapp_messages m ON c.phone_number = m.phone_number AND c.workspace_uuid = m.workspace_uuid
        WHERE c.workspace_uuid = $1
        GROUP BY c.phone_number, c.name
        ORDER BY MAX(m.created_at) DESC
        LIMIT $2
      `, [workspaceUuid, limit]);

      return {
        success: true,
        data: conversations
      };

    } catch (error) {
      console.error('Erro ao obter conversas:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obter mensagens de uma conversa
   */
  async getMessages(workspaceUuid, phoneNumber, limit = 100) {
    try {
      const messages = await db.query(`
        SELECT 
          id, whatsapp_message_id, message_type, content, direction,
          status, created_at, timestamp, read_at
        FROM whatsapp_messages
        WHERE workspace_uuid = $1 AND phone_number = $2
        ORDER BY created_at ASC
        LIMIT $3
      `, [workspaceUuid, phoneNumber, limit]);

      return {
        success: true,
        data: messages
      };

    } catch (error) {
      console.error('Erro ao obter mensagens:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new WhatsAppCloudService();