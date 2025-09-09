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
      ) VALUES (?, ?, ?, ?, ?, NOW())
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

module.exports = router;