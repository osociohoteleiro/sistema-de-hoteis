const express = require('express');
const router = express.Router();
const contactsCacheService = require('../services/contactsCacheService');

/**
 * GET /api/contacts-cache/:instanceName/:phoneNumber
 * Buscar informações de contato com cache inteligente
 */
router.get('/:instanceName/:phoneNumber', async (req, res) => {
  try {
    const { instanceName, phoneNumber } = req.params;

    console.log(`🔍 Buscando contato via cache: ${instanceName}/${phoneNumber}`);

    const result = await contactsCacheService.getContactInfo(instanceName, phoneNumber);

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        cached: result.cached,
        freshData: result.freshData || false,
        rateLimited: result.rateLimited || false,
        cacheAge: result.cacheAge || null
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        cached: result.cached
      });
    }

  } catch (error) {
    console.error('❌ Erro na rota contacts-cache:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/contacts-cache/stats
 * Obter estatísticas do cache
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await contactsCacheService.getCacheStats();

    res.json({
      success: true,
      data: stats
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
 * DELETE /api/contacts-cache/clean
 * Limpar cache expirado
 */
router.delete('/clean', async (req, res) => {
  try {
    const removedCount = await contactsCacheService.cleanExpiredCache();

    res.json({
      success: true,
      message: `${removedCount} registros expirados removidos`,
      removedCount
    });

  } catch (error) {
    console.error('❌ Erro ao limpar cache:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/contacts-cache/batch
 * Buscar múltiplos contatos em lote (com throttling)
 */
router.post('/batch', async (req, res) => {
  try {
    const { contacts } = req.body; // Array de { instanceName, phoneNumber }

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Array de contatos é obrigatório'
      });
    }

    // Limitar a 20 contatos por vez para evitar sobrecarga
    if (contacts.length > 20) {
      return res.status(400).json({
        success: false,
        error: 'Máximo 20 contatos por requisição'
      });
    }

    console.log(`🔍 Buscando ${contacts.length} contatos em lote`);

    // Buscar contatos com delay entre requisições para respeitar rate limits
    const results = [];
    for (let i = 0; i < contacts.length; i++) {
      const { instanceName, phoneNumber } = contacts[i];

      if (!instanceName || !phoneNumber) {
        results.push({
          instanceName,
          phoneNumber,
          success: false,
          error: 'instanceName e phoneNumber são obrigatórios'
        });
        continue;
      }

      const result = await contactsCacheService.getContactInfo(instanceName, phoneNumber);
      results.push({
        instanceName,
        phoneNumber,
        ...result
      });

      // Delay apenas se for fazer requisição real para Evolution API (não do cache)
      if (!result.cached && i < contacts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200)); // 200ms entre requisições
      }
    }

    const stats = {
      total: results.length,
      cached: results.filter(r => r.cached).length,
      fresh: results.filter(r => r.freshData).length,
      errors: results.filter(r => !r.success).length
    };

    res.json({
      success: true,
      data: results,
      stats
    });

  } catch (error) {
    console.error('❌ Erro na busca em lote:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;