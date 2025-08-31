const express = require('express');
const router = express.Router();
const evolutionService = require('../services/evolutionService');

/**
 * POST /api/evolution/create
 * Criar nova instância da Evolution
 */
router.post('/create', async (req, res) => {
  try {
    const {
      instanceName,
      hotel_uuid,
      webhook_url,
      integration = 'WHATSAPP-BAILEYS',
      settings = {}
    } = req.body;

    // Validar dados obrigatórios
    if (!instanceName) {
      return res.status(400).json({
        success: false,
        error: 'instanceName é obrigatório'
      });
    }

    if (!hotel_uuid) {
      return res.status(400).json({
        success: false,
        error: 'hotel_uuid é obrigatório'
      });
    }

    console.log(`🚀 Criando instância: ${instanceName} para hotel: ${hotel_uuid}`);

    const result = await evolutionService.createInstance({
      instanceName,
      hotel_uuid,
      webhook_url,
      integration,
      ...settings
    });

    if (result.success) {
      res.status(201).json({
        success: true,
        message: 'Instância criada com sucesso!',
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Erro na rota create:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/evolution/connect/:instanceName
 * Conectar instância e obter QR Code
 */
router.get('/connect/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params;

    console.log(`🔗 Conectando instância: ${instanceName}`);

    const result = await evolutionService.connectInstance(instanceName);

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Erro na rota connect:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/evolution/status/:instanceName
 * Verificar status da conexão
 */
router.get('/status/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params;

    const result = await evolutionService.getConnectionState(instanceName);

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Erro na rota status:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/evolution/instances
 * Listar instâncias da Evolution API
 */
router.get('/instances', async (req, res) => {
  try {
    const result = await evolutionService.fetchInstances();

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Erro na rota instances:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/evolution/database
 * Listar instâncias do banco de dados
 */
router.get('/database', async (req, res) => {
  try {
    const { hotel_uuid } = req.query;

    const result = await evolutionService.getInstancesFromDatabase(hotel_uuid);

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Erro na rota database:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * DELETE /api/evolution/delete/:instanceName
 * Deletar instância
 */
router.delete('/delete/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params;

    console.log(`🗑️ Deletando instância: ${instanceName}`);

    const result = await evolutionService.deleteInstance(instanceName);

    if (result.success) {
      res.json({
        success: true,
        message: 'Instância deletada com sucesso!',
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Erro na rota delete:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/evolution/test
 * Testar conexão com Evolution API
 */
router.get('/test', async (req, res) => {
  try {
    console.log('🧪 Testando conexão com Evolution API...');

    const result = await evolutionService.fetchInstances();

    if (result.success) {
      res.json({
        success: true,
        message: 'Conexão com Evolution API funcionando!',
        data: {
          instances_count: Array.isArray(result.data) ? result.data.length : 0,
          response: result.data
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        message: 'Falha na conexão com Evolution API'
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

module.exports = router;