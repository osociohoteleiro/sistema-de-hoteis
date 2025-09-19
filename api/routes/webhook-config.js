const express = require('express');
const router = express.Router();
const axios = require('axios');

/**
 * POST /api/webhook-config/setup
 * Configurar webhook automaticamente para uma instância
 */
router.post('/setup', async (req, res) => {
  try {
    const { instanceName, evolutionApiUrl, evolutionApiKey } = req.body;

    // Validar parâmetros obrigatórios
    if (!instanceName || !evolutionApiUrl) {
      return res.status(400).json({
        success: false,
        error: 'instanceName e evolutionApiUrl são obrigatórios'
      });
    }

    console.log(`🔧 Configurando webhook para instância: ${instanceName}`);

    // URL do nosso webhook endpoint
    const webhookUrl = `${process.env.API_BASE_URL || 'http://localhost:3001'}/api/evolution-webhook`;

    // Configuração do webhook na Evolution API
    const webhookConfig = {
      url: webhookUrl,
      webhook_by_events: false,
      webhook_base64: false,
      events: [
        'MESSAGES_UPSERT',
        'MESSAGES_UPDATE',
        'CONNECTION_UPDATE',
        'CONTACTS_UPSERT'
      ]
    };

    // Headers para requisição à Evolution API
    const headers = {
      'Content-Type': 'application/json'
    };

    if (evolutionApiKey) {
      headers['apikey'] = evolutionApiKey;
    }

    // Fazer requisição para configurar o webhook
    const response = await axios.post(
      `${evolutionApiUrl}/webhook/set/${instanceName}`,
      webhookConfig,
      { headers, timeout: 10000 }
    );

    if (response.status === 200 || response.status === 201) {
      console.log(`✅ Webhook configurado com sucesso para ${instanceName}`);

      // Verificar se a configuração foi aplicada
      const verificationResponse = await axios.get(
        `${evolutionApiUrl}/webhook/find/${instanceName}`,
        { headers, timeout: 5000 }
      );

      res.json({
        success: true,
        message: `Webhook configurado com sucesso para ${instanceName}`,
        webhookUrl,
        config: webhookConfig,
        verification: verificationResponse.data,
        timestamp: new Date()
      });

    } else {
      throw new Error(`Resposta inesperada da Evolution API: ${response.status}`);
    }

  } catch (error) {
    console.error('❌ Erro ao configurar webhook:', error);

    let errorMessage = 'Erro interno ao configurar webhook';
    let statusCode = 500;

    if (error.response) {
      // Erro da Evolution API
      statusCode = error.response.status;
      errorMessage = error.response.data?.message ||
                    error.response.data?.error ||
                    `Erro da Evolution API: ${error.response.status}`;
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Não foi possível conectar à Evolution API';
      statusCode = 503;
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'URL da Evolution API inválida';
      statusCode = 400;
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/webhook-config/verify/:instanceName
 * Verificar configuração atual do webhook para uma instância
 */
router.get('/verify/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params;
    const { evolutionApiUrl, evolutionApiKey } = req.query;

    if (!evolutionApiUrl) {
      return res.status(400).json({
        success: false,
        error: 'evolutionApiUrl é obrigatório'
      });
    }

    const headers = {
      'Content-Type': 'application/json'
    };

    if (evolutionApiKey) {
      headers['apikey'] = evolutionApiKey;
    }

    // Buscar configuração atual do webhook
    const response = await axios.get(
      `${evolutionApiUrl}/webhook/find/${instanceName}`,
      { headers, timeout: 5000 }
    );

    const expectedWebhookUrl = `${process.env.API_BASE_URL || 'http://localhost:3001'}/api/evolution-webhook`;
    const currentConfig = response.data;

    const isConfigured = currentConfig.url === expectedWebhookUrl;
    const hasRequiredEvents = [
      'MESSAGES_UPSERT',
      'MESSAGES_UPDATE',
      'CONNECTION_UPDATE',
      'CONTACTS_UPSERT'
    ].every(event => currentConfig.events?.includes(event));

    res.json({
      success: true,
      instanceName,
      isConfigured,
      hasRequiredEvents,
      currentConfig,
      expectedConfig: {
        url: expectedWebhookUrl,
        events: ['MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'CONNECTION_UPDATE', 'CONTACTS_UPSERT']
      },
      needsUpdate: !isConfigured || !hasRequiredEvents,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('❌ Erro ao verificar webhook:', error);

    let errorMessage = 'Erro ao verificar configuração do webhook';
    let statusCode = 500;

    if (error.response?.status === 404) {
      statusCode = 404;
      errorMessage = 'Instância não encontrada ou webhook não configurado';
    } else if (error.response) {
      statusCode = error.response.status;
      errorMessage = error.response.data?.message || `Erro da Evolution API: ${error.response.status}`;
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * DELETE /api/webhook-config/remove/:instanceName
 * Remover configuração de webhook para uma instância
 */
router.delete('/remove/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params;
    const { evolutionApiUrl, evolutionApiKey } = req.body;

    if (!evolutionApiUrl) {
      return res.status(400).json({
        success: false,
        error: 'evolutionApiUrl é obrigatório'
      });
    }

    const headers = {
      'Content-Type': 'application/json'
    };

    if (evolutionApiKey) {
      headers['apikey'] = evolutionApiKey;
    }

    // Remover webhook da Evolution API
    const response = await axios.delete(
      `${evolutionApiUrl}/webhook/${instanceName}`,
      { headers, timeout: 5000 }
    );

    console.log(`🗑️ Webhook removido para instância: ${instanceName}`);

    res.json({
      success: true,
      message: `Webhook removido com sucesso para ${instanceName}`,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('❌ Erro ao remover webhook:', error);

    let errorMessage = 'Erro ao remover configuração do webhook';
    let statusCode = 500;

    if (error.response) {
      statusCode = error.response.status;
      errorMessage = error.response.data?.message || `Erro da Evolution API: ${error.response.status}`;
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/webhook-config/test
 * Testar conectividade com a Evolution API
 */
router.post('/test', async (req, res) => {
  try {
    const { evolutionApiUrl, evolutionApiKey } = req.body;

    if (!evolutionApiUrl) {
      return res.status(400).json({
        success: false,
        error: 'evolutionApiUrl é obrigatório'
      });
    }

    const headers = {
      'Content-Type': 'application/json'
    };

    if (evolutionApiKey) {
      headers['apikey'] = evolutionApiKey;
    }

    // Testar conectividade com endpoint de instâncias
    const response = await axios.get(
      `${evolutionApiUrl}/instance/fetchInstances`,
      { headers, timeout: 5000 }
    );

    res.json({
      success: true,
      message: 'Conectividade com Evolution API confirmada',
      responseStatus: response.status,
      instanceCount: Array.isArray(response.data) ? response.data.length : 'unknown',
      timestamp: new Date()
    });

  } catch (error) {
    console.error('❌ Erro ao testar conectividade:', error);

    let errorMessage = 'Erro ao conectar com Evolution API';
    let statusCode = 503;

    if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Evolution API não está respondendo';
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'URL da Evolution API inválida';
      statusCode = 400;
    } else if (error.response?.status === 401) {
      errorMessage = 'Chave da API inválida';
      statusCode = 401;
    } else if (error.response) {
      statusCode = error.response.status;
      errorMessage = `Erro da Evolution API: ${error.response.status}`;
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/webhook-config/stats
 * Obter estatísticas de webhooks configurados
 */
router.get('/stats', (req, res) => {
  try {
    const websocketService = req.app.get('websocketService');
    const websocketStats = websocketService.getStats();

    res.json({
      success: true,
      data: {
        webhookEndpoint: `${process.env.API_BASE_URL || 'http://localhost:3001'}/api/evolution-webhook`,
        websocketStats,
        timestamp: new Date()
      }
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