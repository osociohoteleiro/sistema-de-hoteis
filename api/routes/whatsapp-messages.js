const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * GET /api/whatsapp-messages/conversations/:instanceName
 * Listar conversas (contatos únicos) de uma instância
 */
router.get('/conversations/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params;
    const { limit = 50 } = req.query;

    console.log(`📱 Buscando conversas para instância: ${instanceName}`);

    const conversations = await db.query(`
      SELECT
        c.phone_number,
        c.contact_name,
        c.profile_pic_url,
        c.last_message_at,
        c.message_count,
        c.unread_count,
        c.is_blocked,
        m.content as last_message_content,
        m.message_type as last_message_type,
        m.direction as last_message_direction
      FROM whatsapp_contacts c
      LEFT JOIN whatsapp_messages m ON (
        c.instance_name = m.instance_name
        AND c.phone_number = m.phone_number
        AND m.timestamp = c.last_message_at
      )
      WHERE c.instance_name = $1
      ORDER BY c.last_message_at DESC NULLS LAST
      LIMIT $2
    `, [instanceName, parseInt(limit)]);

    res.json({
      success: true,
      data: conversations
    });

  } catch (error) {
    console.error('❌ Erro ao buscar conversas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/whatsapp-messages/send/:instanceName
 * Enviar mensagem via Evolution API
 */
router.post('/send/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params;
    const { phoneNumber, message, messageType = 'text' } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        error: 'Número do telefone e mensagem são obrigatórios'
      });
    }

    console.log(`📤 Enviando mensagem: ${instanceName} -> ${phoneNumber}`);

    // Importar evolutionService
    const evolutionService = require('../services/evolutionService');

    // Enviar mensagem via Evolution API
    const result = await evolutionService.sendMessage(instanceName, phoneNumber, message, messageType);

    if (result.success) {
      // Salvar mensagem enviada no banco
      const messageData = {
        message_id: result.data.key?.id || `out_${Date.now()}`,
        instance_name: instanceName,
        phone_number: phoneNumber,
        contact_name: null, // Será atualizado posteriormente
        message_type: messageType,
        content: message,
        direction: 'outbound',
        timestamp: new Date(),
        raw_data: result.data
      };

      await saveMessage(messageData);

      res.json({
        success: true,
        message: 'Mensagem enviada com sucesso',
        data: messageData
      });
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * PUT /api/whatsapp-messages/mark-read/:instanceName/:phoneNumber
 * Marcar mensagens como lidas
 */
router.put('/mark-read/:instanceName/:phoneNumber', async (req, res) => {
  try {
    const { instanceName, phoneNumber } = req.params;

    console.log(`✅ Marcando mensagens como lidas: ${instanceName} - ${phoneNumber}`);

    // Marcar mensagens como lidas
    await db.query(`
      UPDATE whatsapp_messages
      SET read_at = CURRENT_TIMESTAMP
      WHERE instance_name = $1
        AND phone_number = $2
        AND direction = 'inbound'
        AND read_at IS NULL
    `, [instanceName, phoneNumber]);

    // Zerar contador de não lidas no contato
    await db.query(`
      UPDATE whatsapp_contacts
      SET unread_count = 0
      WHERE instance_name = $1 AND phone_number = $2
    `, [instanceName, phoneNumber]);

    res.json({
      success: true,
      message: 'Mensagens marcadas como lidas'
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
 * GET /api/whatsapp-messages/stats/:instanceName
 * Obter estatísticas da instância
 */
router.get('/stats/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params;

    const stats = await db.query(`
      SELECT
        COUNT(*) as total_messages,
        COUNT(CASE WHEN direction = 'inbound' THEN 1 END) as received_messages,
        COUNT(CASE WHEN direction = 'outbound' THEN 1 END) as sent_messages,
        COUNT(CASE WHEN direction = 'inbound' AND read_at IS NULL THEN 1 END) as unread_messages,
        COUNT(DISTINCT phone_number) as total_contacts
      FROM whatsapp_messages
      WHERE instance_name = $1
    `, [instanceName]);

    const recentActivity = await db.query(`
      SELECT
        DATE(timestamp) as date,
        COUNT(*) as message_count
      FROM whatsapp_messages
      WHERE instance_name = $1
        AND timestamp >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(timestamp)
      ORDER BY date DESC
    `, [instanceName]);

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

/**
 * GET /api/whatsapp-messages/:instanceName/:phoneNumber
 * Obter mensagens de uma conversa específica
 */
router.get('/:instanceName/:phoneNumber', async (req, res) => {
  try {
    const { instanceName, phoneNumber } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    console.log(`💬 Buscando mensagens: ${instanceName} - ${phoneNumber}`);

    const messages = await db.query(`
      SELECT
        id,
        message_id,
        phone_number,
        contact_name,
        message_type,
        content,
        media_url,
        direction,
        timestamp,
        read_at,
        delivered_at
      FROM whatsapp_messages
      WHERE instance_name = $1 AND phone_number = $2
      ORDER BY timestamp DESC
      LIMIT $3 OFFSET $4
    `, [instanceName, phoneNumber, parseInt(limit), parseInt(offset)]);

    // Contar total de mensagens
    const totalResult = await db.query(`
      SELECT COUNT(*) as total
      FROM whatsapp_messages
      WHERE instance_name = $1 AND phone_number = $2
    `, [instanceName, phoneNumber]);

    const total = parseInt(totalResult[0].total);

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Inverter para ordem cronológica
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < total
        }
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar mensagens:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * Função helper para salvar mensagem no banco
 */
async function saveMessage(messageData) {
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
      messageData.media_url,
      messageData.direction,
      messageData.timestamp,
      messageData.read_at,
      messageData.delivered_at,
      JSON.stringify(messageData.raw_data)
    ]);

    // Atualizar ou criar contato
    await db.query(`
      INSERT INTO whatsapp_contacts (
        instance_name, phone_number, contact_name, last_message_at, message_count, unread_count
      ) VALUES ($1, $2, $3, $4, 1, $5)
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
      messageData.direction === 'inbound' ? 1 : 0 // Só incrementar não lidas se for mensagem recebida
    ]);

    console.log(`💾 Mensagem salva: ${messageData.message_id}`);

  } catch (error) {
    console.error('❌ Erro ao salvar mensagem:', error);
    throw error;
  }
}

/**
 * DELETE /api/whatsapp-messages/cleanup-fake-data
 * Remover dados falsos/mockados que não existem na Evolution API
 */
router.delete('/cleanup-test-data', async (req, res) => {
  try {
    console.log('🧹 Removendo mensagens de teste específicas...');

    // Remover mensagens com message_id de teste
    const testMessageIds = ['message_test_real', 'test_message_1', 'test_message_2'];

    let deletedCount = 0;
    for (const testId of testMessageIds) {
      const result = await db.query(`
        DELETE FROM whatsapp_messages WHERE message_id = $1
      `, [testId]);
      deletedCount += result.length || 0;
    }

    // Remover contatos órfãos (sem mensagens)
    await db.query(`
      DELETE FROM whatsapp_contacts
      WHERE NOT EXISTS (
        SELECT 1 FROM whatsapp_messages
        WHERE whatsapp_messages.instance_name = whatsapp_contacts.instance_name
        AND whatsapp_messages.phone_number = whatsapp_contacts.phone_number
      )
    `);

    res.json({
      success: true,
      message: 'Mensagens de teste removidas',
      data: { deletedTestMessages: deletedCount }
    });

  } catch (error) {
    console.error('❌ Erro ao remover mensagens de teste:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

router.delete('/cleanup-fake-data', async (req, res) => {
  try {
    console.log('🧹 Limpando dados falsos/mockados...');

    // Buscar instâncias reais da Evolution API
    const evolutionService = require('../services/evolutionService');
    const result = await evolutionService.fetchInstances();

    if (!result.success) {
      throw new Error('Erro ao buscar instâncias da Evolution API');
    }

    const realInstances = result.data || [];
    const realInstanceNames = realInstances.map(instance => instance.name || instance.instanceName);

    console.log('📋 Instâncias reais da Evolution:', realInstanceNames);

    // Buscar instâncias no banco de dados
    const dbInstances = await db.query(`
      SELECT DISTINCT instance_name FROM whatsapp_messages
    `);

    const fakeInstances = dbInstances.filter(db =>
      !realInstanceNames.includes(db.instance_name)
    );

    console.log('🗑️ Instâncias falsas encontradas:', fakeInstances.map(f => f.instance_name));

    let deletedMessages = 0;
    let deletedContacts = 0;

    // Remover mensagens de instâncias falsas
    for (const fakeInstance of fakeInstances) {
      const messagesResult = await db.query(`
        DELETE FROM whatsapp_messages WHERE instance_name = $1
      `, [fakeInstance.instance_name]);

      const contactsResult = await db.query(`
        DELETE FROM whatsapp_contacts WHERE instance_name = $1
      `, [fakeInstance.instance_name]);

      deletedMessages += messagesResult.length || 0;
      deletedContacts += contactsResult.length || 0;

      console.log(`🗑️ Removida instância falsa: ${fakeInstance.instance_name}`);
    }

    res.json({
      success: true,
      message: 'Dados falsos removidos com sucesso',
      data: {
        fakeInstancesRemoved: fakeInstances.map(f => f.instance_name),
        realInstancesKept: realInstanceNames,
        deletedMessages,
        deletedContacts
      }
    });

  } catch (error) {
    console.error('❌ Erro ao limpar dados falsos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/whatsapp-messages/instances-summary
 * Listar todas as instâncias com resumo de mensagens (sem depender da Evolution API)
 */
router.get('/instances-summary', async (req, res) => {
  try {
    console.log('📊 Buscando resumo de todas as instâncias...');

    const instancesSummary = await db.query(`
      SELECT
        instance_name,
        COUNT(DISTINCT phone_number) as total_contacts,
        COUNT(*) as total_messages,
        COUNT(CASE WHEN direction = 'inbound' THEN 1 END) as received_messages,
        COUNT(CASE WHEN direction = 'outbound' THEN 1 END) as sent_messages,
        MAX(timestamp) as last_activity,
        COUNT(CASE WHEN direction = 'inbound' AND read_at IS NULL THEN 1 END) as unread_messages
      FROM whatsapp_messages
      GROUP BY instance_name
      ORDER BY last_activity DESC NULLS LAST
    `);

    console.log(`📊 Encontradas ${instancesSummary.length} instâncias com mensagens:`,
      instancesSummary.map(i => `${i.instance_name} (${i.total_messages} msgs)`));

    res.json({
      success: true,
      data: instancesSummary
    });

  } catch (error) {
    console.error('❌ Erro ao buscar resumo das instâncias:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Exportar função helper para uso em webhooks
module.exports = router;
module.exports.saveMessage = saveMessage;
