const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../config/database');

// Token de verificação do webhook (você definirá isso no Meta)
const WEBHOOK_VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'hotel_meta_webhook_2024';
const META_APP_SECRET = process.env.META_APP_SECRET;

// GET /api/webhooks/meta - Verificação inicial do webhook
router.get('/meta', (req, res) => {
  console.log('📞 Webhook verification request received');
  
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('Verification details:', { mode, token, challenge });

  // Verificar se o token está correto
  if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
    console.log('✅ Webhook verification successful');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Webhook verification failed');
    res.status(403).send('Forbidden');
  }
});

// POST /api/webhooks/meta - Receber dados do Meta
router.post('/meta', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    console.log('📨 Meta webhook data received');
    
    // Verificar assinatura se META_APP_SECRET estiver configurado
    if (META_APP_SECRET) {
      const signature = req.get('X-Hub-Signature-256');
      if (!verifySignature(req.body, signature)) {
        console.log('❌ Invalid webhook signature');
        return res.status(403).send('Forbidden');
      }
    }

    const body = JSON.parse(req.body.toString());
    console.log('Webhook body:', JSON.stringify(body, null, 2));

    // Processar cada entry
    if (body.entry) {
      for (const entry of body.entry) {
        await processWebhookEntry(entry);
      }
    }

    res.status(200).send('OK');

  } catch (error) {
    console.error('❌ Error processing Meta webhook:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Função para verificar assinatura do webhook
function verifySignature(payload, signature) {
  if (!signature || !META_APP_SECRET) {
    return true; // Skip verification if not configured
  }

  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', META_APP_SECRET)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Processar dados do webhook
async function processWebhookEntry(entry) {
  console.log('📊 Processing webhook entry:', entry.id);

  try {
    // Processar diferentes tipos de eventos
    if (entry.changes) {
      for (const change of entry.changes) {
        await processWebhookChange(change, entry);
      }
    }

    // Processar mensagens (se for WhatsApp Business)
    if (entry.messaging) {
      for (const message of entry.messaging) {
        await processMessage(message, entry);
      }
    }

  } catch (error) {
    console.error('❌ Error processing webhook entry:', error);
  }
}

// Processar mudanças nos dados
async function processWebhookChange(change, entry) {
  console.log(`🔄 Processing change: ${change.field}`);

  try {
    switch (change.field) {
      case 'campaigns':
        await processCampaignChange(change.value, entry);
        break;
        
      case 'adsets':
        await processAdSetChange(change.value, entry);
        break;
        
      case 'ads':
        await processAdChange(change.value, entry);
        break;
        
      case 'insights':
        await processInsightsChange(change.value, entry);
        break;
        
      default:
        console.log(`ℹ️  Unhandled change field: ${change.field}`);
    }

    // Salvar evento no banco
    await saveWebhookEvent({
      type: 'meta_change',
      field: change.field,
      entry_id: entry.id,
      data: change.value,
      processed_at: new Date()
    });

  } catch (error) {
    console.error(`❌ Error processing ${change.field} change:`, error);
  }
}

// Processar mudanças em campanhas
async function processCampaignChange(data, entry) {
  console.log('📈 Processing campaign change:', data);
  
  // Aqui você pode atualizar dados locais da campanha
  // Exemplo: sincronizar métricas, status, etc.
}

// Processar mudanças em ad sets
async function processAdSetChange(data, entry) {
  console.log('🎯 Processing ad set change:', data);
}

// Processar mudanças em anúncios
async function processAdChange(data, entry) {
  console.log('📢 Processing ad change:', data);
}

// Processar mudanças em insights
async function processInsightsChange(data, entry) {
  console.log('📊 Processing insights change:', data);
  
  // Atualizar métricas em tempo real
  // Exemplo: impressões, cliques, conversões
}

// Processar mensagens (WhatsApp Business)
async function processMessage(message, entry) {
  console.log('💬 Processing message:', message);
  
  // Processar mensagens do WhatsApp Business se integrado
}

// Salvar evento no banco
async function saveWebhookEvent(eventData) {
  try {
    await db.query(`
      INSERT INTO webhook_events (
        type, field, entry_id, data, processed_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
    `, [
      eventData.type,
      eventData.field,
      eventData.entry_id,
      JSON.stringify(eventData.data),
      eventData.processed_at
    ]);
    
    console.log('✅ Webhook event saved to database');
  } catch (error) {
    console.error('❌ Error saving webhook event:', error);
  }
}

/**
 * Webhook para receber mensagens do WhatsApp via Evolution API
 * POST /api/webhooks/whatsapp/:instanceName
 */
router.post('/whatsapp/:instanceName', async (req, res) => {
    try {
        const { instanceName } = req.params;
        const webhookData = req.body;

        console.log(`📱 Webhook recebido de ${instanceName}:`, JSON.stringify(webhookData, null, 2));

        // Verificar se é uma mensagem
        if (webhookData.event === 'messages.upsert' && webhookData.data) {
            const message = webhookData.data;

            // Filtrar apenas mensagens recebidas (não enviadas pelo bot)
            if (message.key && !message.key.fromMe && message.message) {
                await processIncomingWhatsAppMessage(instanceName, message);
            }
        }

        res.status(200).json({
            success: true,
            message: 'Webhook processado com sucesso'
        });

    } catch (error) {
        console.error('❌ Erro no webhook WhatsApp:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Webhook específico para Evolution API
 * POST /api/webhooks/evolution/:instanceName
 */
router.post('/evolution/:instanceName', async (req, res) => {
    try {
        const { instanceName } = req.params;
        const webhookData = req.body;

        console.log(`🚀 Evolution webhook recebido de ${instanceName}:`, JSON.stringify(webhookData, null, 2));

        // Processar diferentes tipos de eventos da Evolution API
        if (webhookData.event) {
            switch (webhookData.event) {
                case 'messages.upsert':
                case 'MESSAGES_UPSERT':
                    if (webhookData.data && webhookData.data.key && !webhookData.data.key.fromMe) {
                        await processEvolutionMessage(instanceName, webhookData.data);
                    }
                    break;

                case 'connection.update':
                    await processConnectionUpdate(instanceName, webhookData.data);
                    break;

                default:
                    console.log(`ℹ️ Evento não processado: ${webhookData.event}`);
            }
        }

        res.status(200).json({
            success: true,
            message: 'Webhook Evolution processado com sucesso'
        });

    } catch (error) {
        console.error('❌ Erro no webhook Evolution:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/webhooks/evolution/:instanceName/messages-upsert
 * Webhook específico para mensagens da Evolution API
 */
router.post('/evolution/:instanceName/messages-upsert', async (req, res) => {
    try {
        const { instanceName } = req.params;
        const messageData = req.body;

        console.log(`📨 Nova mensagem recebida de ${instanceName}`);
        await processEvolutionMessage(instanceName, messageData);

        res.status(200).json({
            success: true,
            message: 'Mensagem processada com sucesso'
        });

    } catch (error) {
        console.error('❌ Erro ao processar mensagem:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

/**
 * POST /api/webhooks/evolution/:instanceName/:eventType
 * Webhook genérico para outros eventos da Evolution API
 */
router.post('/evolution/:instanceName/:eventType', async (req, res) => {
    try {
        const { instanceName, eventType } = req.params;

        console.log(`📡 Evento ${eventType} recebido de ${instanceName}`);

        res.status(200).json({
            success: true,
            message: `Evento ${eventType} recebido`
        });

    } catch (error) {
        console.error(`❌ Erro no evento ${eventType}:`, error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

/**
 * Processar mensagem da Evolution API
 */
async function processEvolutionMessage(instanceName, messageData) {
    try {
        // Tentar diferentes estruturas possíveis para encontrar mensagens
        let messages = [];

        // Estrutura real da Evolution API: messageData.data é uma mensagem única
        if (messageData.data && messageData.data.key && messageData.data.message) {
            messages = [messageData.data];
        }
        // Estrutura array: messageData.data é um array de mensagens
        else if (messageData.data && Array.isArray(messageData.data)) {
            messages = messageData.data;
        }
        // messageData em si é uma mensagem
        else if (messageData.key || messageData.message || messageData.body) {
            messages = [messageData];
        }
        // Estrutura alternativa: messageData.messages
        else if (messageData.messages && Array.isArray(messageData.messages)) {
            messages = messageData.messages;
        }

        if (messages.length === 0) {
            console.log(`⚠️ Nenhuma mensagem encontrada na estrutura do webhook`);
            return;
        }

        // Processar cada mensagem
        for (const message of messages) {
            // Tentar extrair informações da mensagem
            let phoneNumber = 'desconhecido';
            let messageText = 'Mensagem sem texto';
            let messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            let direction = 'inbound';

            // Verificar diferentes estruturas possíveis
            if (message.key) {
                phoneNumber = cleanPhoneNumber(message.key.remoteJid || message.key.participant || '');
                messageId = message.key.id || messageId;
                direction = message.key.fromMe ? 'outbound' : 'inbound';
            } else if (message.remoteJid) {
                phoneNumber = cleanPhoneNumber(message.remoteJid);
            }

            // Extrair texto e informações de mídia da mensagem
            let mediaInfo = null;
            let messageType = 'text';

            if (message.message) {
                messageText = extractMessageText(message.message);
                mediaInfo = extractMediaInfo(message.message);

                if (mediaInfo) {
                    messageType = mediaInfo.type;
                }
            } else if (message.text) {
                messageText = message.text;
            } else if (message.body) {
                messageText = message.body;
            }

            console.log(`💬 Nova mensagem de ${phoneNumber}:`, {
                text: messageText,
                type: messageType,
                hasMedia: !!mediaInfo
            });

            // Preparar dados da mensagem para salvar
            const messageDataToSave = {
                message_id: messageId,
                instance_name: instanceName,
                phone_number: phoneNumber,
                contact_name: null,
                message_type: messageType,
                content: messageText,
                media_url: mediaInfo ? mediaInfo.url : null,
                direction: direction,
                timestamp: new Date(),
                raw_data: message
            };

            // Salvar mensagem diretamente no banco
            await saveIncomingMessage(messageDataToSave);
            console.log(`✅ Mensagem salva no sistema: ${messageId}`);
        }

    } catch (error) {
        console.error('❌ Erro ao processar mensagem Evolution:', error);
        console.error('Stack trace:', error.stack);
    }
}

/**
 * Processar atualização de conexão
 */
async function processConnectionUpdate(instanceName, connectionData) {
    try {
        console.log(`🔌 Atualização de conexão para ${instanceName}:`, connectionData);

        // Aqui você pode atualizar o status da instância no banco de dados
        // Por exemplo, armazenar se está conectada, desconectada, etc.

    } catch (error) {
        console.error('❌ Erro ao processar atualização de conexão:', error);
    }
}

/**
 * Limpar número de telefone
 */
function cleanPhoneNumber(remoteJid) {
    // Remover @s.whatsapp.net e outros sufixos
    return remoteJid.replace(/@.*$/, '');
}

/**
 * Salvar mensagem recebida no sistema
 */
async function saveIncomingMessage(messageData) {
    try {
        // Inserir mensagem
        await db.query(`
            INSERT INTO whatsapp_messages (
                message_id, instance_name, phone_number, contact_name,
                message_type, content, media_url, direction, timestamp,
                read_at, delivered_at, raw_data
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            ON CONFLICT (message_id) DO NOTHING
        `, [
            messageData.message_id,
            messageData.instance_name,
            messageData.phone_number,
            messageData.contact_name,
            messageData.message_type,
            messageData.content,
            messageData.media_url || null,
            messageData.direction,
            messageData.timestamp,
            messageData.read_at || null,
            messageData.delivered_at || null,
            JSON.stringify(messageData.raw_data)
        ]);

        // 🚀 NOVA LÓGICA: Criar/Atualizar contato com lógica Inbound melhorada
        const isNewInboundContact = await handleInboundContactCreation(messageData);

        // Atualizar ou criar contato
        await db.query(`
            INSERT INTO whatsapp_contacts (
                instance_name, phone_number, contact_name, last_message_at, message_count, unread_count,
                lead_source, lead_status, last_sync_at
            ) VALUES ($1, $2, $3, $4, 1, $5, $6, $7, NOW())
            ON CONFLICT (instance_name, phone_number)
            DO UPDATE SET
                contact_name = COALESCE(EXCLUDED.contact_name, whatsapp_contacts.contact_name),
                last_message_at = EXCLUDED.last_message_at,
                message_count = whatsapp_contacts.message_count + 1,
                unread_count = whatsapp_contacts.unread_count + EXCLUDED.unread_count,
                updated_at = CURRENT_TIMESTAMP
        `, [
            messageData.instance_name,
            messageData.phone_number,
            messageData.contact_name,
            messageData.timestamp,
            messageData.direction === 'inbound' ? 1 : 0, // Só incrementar não lidas se for mensagem recebida
            messageData.direction === 'inbound' ? 'WHATSAPP_INBOUND' : 'WHATSAPP_OUTBOUND',
            messageData.direction === 'inbound' ? 'NEW' : 'CONTACTED'
        ]);

        console.log(`💾 Mensagem salva: ${messageData.message_id}`);

    } catch (error) {
        console.error('❌ Erro ao salvar mensagem:', error);
        throw error;
    }
}

/**
 * Processar mensagem recebida (função original)
 */
async function processIncomingWhatsAppMessage(instanceName, messageData) {
    try {
        // Extrair dados da mensagem
        const from = messageData.key.remoteJid;
        const messageText = extractMessageText(messageData.message);
        
        if (!messageText) {
            console.log('⏭️ Mensagem não é texto, ignorando');
            return;
        }

        console.log(`💬 Mensagem de ${from}: ${messageText}`);

        // Buscar configuração do bot para esta instância
        const botConfig = await getBotConfigForInstance(instanceName);
        
        if (!botConfig) {
            console.log(`⚠️ Nenhum bot configurado para instância ${instanceName}`);
            return;
        }

        // Preparar dados para processamento
        const messageProcessorData = {
            instanceName,
            from,
            message: messageText,
            messageType: 'text',
            workspaceId: botConfig.workspace_uuid,
            botId: botConfig.chatflow_id,
            originalData: messageData
        };

        // Salvar na fila de processamento
        await saveToProcessingQueue(messageProcessorData);

    } catch (error) {
        console.error('❌ Erro ao processar mensagem:', error);
    }
}

/**
 * Extrair texto da mensagem e informações de mídia
 */
function extractMessageText(messageObj) {
    if (messageObj.conversation) {
        return messageObj.conversation;
    }

    if (messageObj.extendedTextMessage && messageObj.extendedTextMessage.text) {
        return messageObj.extendedTextMessage.text;
    }

    if (messageObj.buttonsResponseMessage && messageObj.buttonsResponseMessage.selectedDisplayText) {
        return messageObj.buttonsResponseMessage.selectedDisplayText;
    }

    if (messageObj.listResponseMessage && messageObj.listResponseMessage.title) {
        return messageObj.listResponseMessage.title;
    }

    // Mídia com caption
    if (messageObj.imageMessage && messageObj.imageMessage.caption) {
        return messageObj.imageMessage.caption;
    }

    if (messageObj.videoMessage && messageObj.videoMessage.caption) {
        return messageObj.videoMessage.caption;
    }

    if (messageObj.documentMessage && messageObj.documentMessage.caption) {
        return messageObj.documentMessage.caption;
    }

    // Mídia sem caption - retornar indicação do tipo
    if (messageObj.imageMessage) {
        return '[Imagem]';
    }

    if (messageObj.videoMessage) {
        return '[Vídeo]';
    }

    if (messageObj.audioMessage) {
        return '[Áudio]';
    }

    if (messageObj.documentMessage) {
        return '[Documento]';
    }

    if (messageObj.stickerMessage) {
        return '[Sticker]';
    }

    return null;
}

/**
 * Extrair informações de mídia da mensagem
 */
function extractMediaInfo(messageObj) {
    let mediaInfo = null;

    // Imagem
    if (messageObj.imageMessage) {
        mediaInfo = {
            type: 'image',
            mimetype: messageObj.imageMessage.mimetype,
            url: messageObj.imageMessage.url,
            caption: messageObj.imageMessage.caption || null,
            filename: messageObj.imageMessage.fileName || null,
            fileLength: messageObj.imageMessage.fileLength || null
        };
    }
    // Vídeo
    else if (messageObj.videoMessage) {
        mediaInfo = {
            type: 'video',
            mimetype: messageObj.videoMessage.mimetype,
            url: messageObj.videoMessage.url,
            caption: messageObj.videoMessage.caption || null,
            filename: messageObj.videoMessage.fileName || null,
            fileLength: messageObj.videoMessage.fileLength || null,
            seconds: messageObj.videoMessage.seconds || null
        };
    }
    // Áudio
    else if (messageObj.audioMessage) {
        mediaInfo = {
            type: 'audio',
            mimetype: messageObj.audioMessage.mimetype,
            url: messageObj.audioMessage.url,
            filename: messageObj.audioMessage.fileName || null,
            fileLength: messageObj.audioMessage.fileLength || null,
            seconds: messageObj.audioMessage.seconds || null,
            ptt: messageObj.audioMessage.ptt || false // Push to talk
        };
    }
    // Documento
    else if (messageObj.documentMessage) {
        mediaInfo = {
            type: 'document',
            mimetype: messageObj.documentMessage.mimetype,
            url: messageObj.documentMessage.url,
            caption: messageObj.documentMessage.caption || null,
            filename: messageObj.documentMessage.fileName || 'Documento',
            fileLength: messageObj.documentMessage.fileLength || null,
            title: messageObj.documentMessage.title || null
        };
    }
    // Sticker
    else if (messageObj.stickerMessage) {
        mediaInfo = {
            type: 'sticker',
            mimetype: messageObj.stickerMessage.mimetype,
            url: messageObj.stickerMessage.url,
            filename: messageObj.stickerMessage.fileName || null,
            fileLength: messageObj.stickerMessage.fileLength || null
        };
    }

    return mediaInfo;
}

/**
 * Buscar configuração do bot para instância
 */
async function getBotConfigForInstance(instanceName) {
    try {
        const query = `
            SELECT 
                w.uuid as workspace_uuid,
                fb.bot_id as chatflow_id,
                fb.prediction_url,
                h.uuid as hotel_uuid,
                h.name as hotel_name
            FROM onenode_workspaces w
            INNER JOIN hotels h ON h.uuid = w.hotel_uuid
            LEFT JOIN flowise_bots fb ON fb.hotel_uuid = h.uuid AND fb.active = TRUE
            WHERE w.instance_name = $1 AND w.active = TRUE
            LIMIT 1
        `;

        const result = await db.query(query, [instanceName]);
        
        if (result.length > 0) {
            return result[0];
        }
        
        return null;
    } catch (error) {
        console.error('❌ Erro ao buscar configuração do bot:', error);
        return null;
    }
}

/**
 * Salvar na fila de processamento
 */
async function saveToProcessingQueue(messageData) {
    try {
        // Tentar criar tabela se não existir
        await createProcessingQueueTable();

        const insertQuery = `
            INSERT INTO message_processing_queue (
                instance_name,
                from_number,
                message_text,
                message_type,
                workspace_uuid,
                bot_id,
                original_data,
                status,
                created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        `;

        const values = [
            messageData.instanceName,
            messageData.from,
            messageData.message,
            messageData.messageType,
            messageData.workspaceId,
            messageData.botId,
            JSON.stringify(messageData.originalData),
            'pending'
        ];

        await db.query(insertQuery, values);
        console.log('💾 Mensagem salva na fila de processamento');

    } catch (error) {
        console.error('❌ Erro ao salvar na fila:', error);
    }
}

/**
 * Criar tabela de fila de processamento se não existir
 */
async function createProcessingQueueTable() {
    try {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS message_processing_queue (
                id SERIAL PRIMARY KEY,
                instance_name VARCHAR(255) NOT NULL,
                from_number VARCHAR(50) NOT NULL,
                message_text TEXT,
                message_type VARCHAR(50) DEFAULT 'text',
                workspace_uuid VARCHAR(255),
                bot_id VARCHAR(255),
                original_data JSONB,
                status VARCHAR(50) DEFAULT 'pending',
                processed_at TIMESTAMP NULL,
                response_data JSONB NULL,
                error_message TEXT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `;

        await db.query(createTableQuery);

    } catch (error) {
        console.error('❌ Erro ao criar tabela:', error);
    }
}

/**
 * Webhook genérico para Flowise
 * POST /api/webhooks/flowise
 */
router.post('/flowise', async (req, res) => {
    try {
        console.log('🤖 Webhook Flowise recebido:', req.body);
        
        // Processar webhook do Flowise se necessário
        // (ex: notificações de chatflow updates, etc.)
        
        res.status(200).json({
            success: true,
            message: 'Webhook Flowise processado'
        });

    } catch (error) {
        console.error('❌ Erro no webhook Flowise:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Buscar mensagens pendentes na fila
 * GET /api/webhooks/queue/pending
 */
router.get('/queue/pending', async (req, res) => {
    try {
        const query = `
            SELECT * FROM message_processing_queue 
            WHERE status = 'pending' 
            ORDER BY created_at ASC 
            LIMIT 50
        `;

        const messages = await db.query(query);

        res.json({
            success: true,
            data: messages,
            count: messages.length
        });

    } catch (error) {
        console.error('❌ Erro ao buscar fila:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            data: [],
            count: 0
        });
    }
});

/**
 * Marcar mensagem como processada
 * PUT /api/webhooks/queue/:id/processed
 */
router.put('/queue/:id/processed', async (req, res) => {
    try {
        const { id } = req.params;
        const { response_data, error_message } = req.body;

        const updateQuery = `
            UPDATE message_processing_queue 
            SET 
                status = $1,
                processed_at = NOW(),
                response_data = $2,
                error_message = $3,
                updated_at = NOW()
            WHERE id = $4
        `;

        const status = error_message ? 'error' : 'processed';
        await db.query(updateQuery, [status, JSON.stringify(response_data), error_message, id]);

        res.json({
            success: true,
            message: 'Mensagem marcada como processada'
        });

    } catch (error) {
        console.error('❌ Erro ao atualizar mensagem:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Status da fila de processamento
 * GET /api/webhooks/queue/stats
 */
router.get('/queue/stats', async (req, res) => {
    try {
        const statsQuery = `
            SELECT 
                status,
                COUNT(*) as count
            FROM message_processing_queue 
            WHERE created_at > NOW() - INTERVAL '24 hours'
            GROUP BY status
        `;

        const stats = await db.query(statsQuery);

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('❌ Erro ao buscar estatísticas:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            data: []
        });
    }
});

/**
 * 🚀 NOVA FUNÇÃO: Gerenciar criação de contato Inbound com dados da Evolution API
 */
async function handleInboundContactCreation(messageData) {
    try {
        // Só processar mensagens Inbound (recebidas)
        if (messageData.direction !== 'inbound') {
            return false;
        }

        const { instance_name, phone_number } = messageData;

        // Verificar se é um contato novo (não existe na tabela)
        const existingContact = await db.query(`
            SELECT id, profile_picture_url, contact_name, last_sync_at
            FROM whatsapp_contacts
            WHERE instance_name = $1 AND phone_number = $2
        `, [instance_name, phone_number]);

        const isNewContact = existingContact.length === 0;

        // Se é um contato novo ou não tem foto/nome, buscar dados completos da Evolution API
        if (isNewContact || !existingContact[0]?.profile_picture_url || !existingContact[0]?.contact_name) {
            console.log(`🆕 Novo contato Inbound detectado: ${phone_number}, buscando dados completos...`);

            // Usar o ContactsCacheService para buscar dados (que já tem rate limiting)
            const contactsCacheService = require('../services/contactsCacheService');
            const cacheService = new contactsCacheService();

            const contactInfo = await cacheService.getContactInfo(instance_name, phone_number);

            if (contactInfo.success && contactInfo.data) {
                console.log(`✅ Dados do contato Inbound obtidos: ${phone_number}`, {
                    name: contactInfo.data.name,
                    hasPicture: !!contactInfo.data.picture,
                    cached: contactInfo.cached
                });

                // Se obteve dados novos, atualizar o messageData para incluir informações mais completas
                if (contactInfo.data.name && !messageData.contact_name) {
                    messageData.contact_name = contactInfo.data.name;
                }

                return true; // Indica que foi processado como novo contato Inbound
            }
        }

        return isNewContact;

    } catch (error) {
        console.error('❌ Erro ao processar contato Inbound:', error);
        return false; // Falhar silenciosamente para não interromper o fluxo principal
    }
}

module.exports = router;