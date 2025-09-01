const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const metaAdsAPI = require('../services/metaAdsAPI');
const db = require('../config/database');
const moment = require('moment');

// Middleware de validação de acesso ao hotel
const validateHotelAccess = async (req, res, next) => {
  try {
    const hotelUuid = req.params.hotelUuid || req.body.hotelUuid;
    
    if (!hotelUuid) {
      return res.status(400).json({
        error: 'Hotel UUID é obrigatório'
      });
    }

    // Verificar se o usuário tem acesso ao hotel
    let hotelAccess;
    if (req.user.user_type === 'ADMIN' || req.user.user_type === 'SUPER' || req.user.user_type === 'SUPER_ADMIN') {
      hotelAccess = await db.query(`
        SELECT h.id, h.hotel_nome, h.hotel_uuid
        FROM hotels h
        WHERE h.hotel_uuid = ?
      `, [hotelUuid]);
    } else {
      hotelAccess = await db.query(`
        SELECT h.id, h.hotel_nome, h.hotel_uuid
        FROM hotels h
        INNER JOIN user_hotels uh ON h.id = uh.hotel_id
        WHERE h.hotel_uuid = ? AND uh.user_id = ? AND uh.active = true
      `, [hotelUuid, req.user.id]);
    }

    if (hotelAccess.length === 0) {
      return res.status(403).json({
        error: 'Acesso negado a este hotel'
      });
    }

    req.hotel = hotelAccess[0];
    next();
  } catch (error) {
    console.error('Error validating hotel access:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// POST /api/meta/credentials/:hotelUuid - Configurar credenciais Meta
router.post('/credentials/:hotelUuid', authenticateToken, validateHotelAccess, async (req, res) => {
  try {
    const { hotelUuid } = req.params;
    const { appId, appSecret, accessToken, adAccountId, businessManagerId, tokenExpiresAt } = req.body;

    // Validar campos obrigatórios
    if (!appId || !appSecret || !accessToken || !adAccountId) {
      return res.status(400).json({
        error: 'App ID, App Secret, Access Token e Ad Account ID são obrigatórios'
      });
    }

    // Testar credenciais antes de salvar
    console.log('🧪 Testing Meta credentials...');
    try {
      // Salvar temporariamente para teste
      await metaAdsAPI.setCredentials(hotelUuid, {
        appId,
        appSecret,
        accessToken,
        adAccountId,
        businessManagerId,
        tokenExpiresAt: tokenExpiresAt || moment().add(60, 'days').format('YYYY-MM-DD HH:mm:ss')
      });

      // Testar fazendo uma requisição simples
      await metaAdsAPI.getCampaigns(hotelUuid, { limit: 1 });
      console.log('✅ Meta credentials test successful');

    } catch (testError) {
      console.error('❌ Meta credentials test failed:', testError.message);
      return res.status(400).json({
        error: 'Credenciais inválidas: ' + testError.message
      });
    }

    res.json({
      success: true,
      message: 'Credenciais Meta configuradas com sucesso',
      hotel: {
        uuid: hotelUuid,
        name: req.hotel.hotel_nome
      }
    });

  } catch (error) {
    console.error('Error setting Meta credentials:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/meta/credentials/:hotelUuid - Obter status das credenciais
router.get('/credentials/:hotelUuid', authenticateToken, validateHotelAccess, async (req, res) => {
  try {
    const { hotelUuid } = req.params;

    const [credentials] = await db.query(`
      SELECT 
        app_id, ad_account_id, business_manager_id, 
        status, token_expires_at, last_sync_at,
        created_at, updated_at
      FROM meta_credentials 
      WHERE hotel_uuid = ?
      ORDER BY updated_at DESC
      LIMIT 1
    `, [hotelUuid]);

    if (!credentials) {
      return res.status(404).json({
        error: 'Credenciais Meta não encontradas para este hotel'
      });
    }

    // Verificar se o token vai expirar em breve
    const expiresIn = credentials.token_expires_at ? 
      moment(credentials.token_expires_at).diff(moment(), 'days') : null;

    res.json({
      success: true,
      credentials: {
        ...credentials,
        app_secret: '***',  // Não retornar o secret
        access_token: '***', // Não retornar o token
        expires_in_days: expiresIn,
        needs_refresh: expiresIn !== null && expiresIn < 7
      }
    });

  } catch (error) {
    console.error('Error getting Meta credentials:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/meta/sync/:hotelUuid - Sincronizar dados
router.post('/sync/:hotelUuid', authenticateToken, validateHotelAccess, async (req, res) => {
  try {
    const { hotelUuid } = req.params;
    const { dateRange } = req.body;

    console.log(`🔄 Starting Meta sync for hotel: ${hotelUuid}`);

    // Log início da sincronização
    const syncLog = await db.query(`
      INSERT INTO meta_sync_logs (
        hotel_uuid, sync_type, status, sync_started_at
      ) VALUES (?, 'manual', 'success', NOW())
    `, [hotelUuid]);

    const syncLogId = syncLog.insertId;

    try {
      // Sincronizar dados
      const data = await metaAdsAPI.syncAllData(hotelUuid, dateRange);

      // Atualizar log de sucesso
      await db.query(`
        UPDATE meta_sync_logs 
        SET status = 'success', 
            records_processed = ?, 
            sync_completed_at = NOW()
        WHERE id = ?
      `, [data.length, syncLogId]);

      // Atualizar último sync nas credenciais
      await db.query(`
        UPDATE meta_credentials 
        SET last_sync_at = NOW() 
        WHERE hotel_uuid = ?
      `, [hotelUuid]);

      console.log(`✅ Meta sync completed for hotel: ${hotelUuid}`);

      res.json({
        success: true,
        message: 'Sincronização realizada com sucesso',
        data: {
          records_processed: data.length,
          sync_id: syncLogId,
          hotel: {
            uuid: hotelUuid,
            name: req.hotel.hotel_nome
          }
        }
      });

    } catch (syncError) {
      // Atualizar log de erro
      await db.query(`
        UPDATE meta_sync_logs 
        SET status = 'error', 
            error_message = ?, 
            sync_completed_at = NOW()
        WHERE id = ?
      `, [syncError.message, syncLogId]);

      throw syncError;
    }

  } catch (error) {
    console.error('Error syncing Meta data:', error);
    res.status(500).json({
      error: 'Erro na sincronização: ' + error.message
    });
  }
});

// GET /api/meta/campaigns/:hotelUuid - Obter campanhas
router.get('/campaigns/:hotelUuid', authenticateToken, validateHotelAccess, async (req, res) => {
  try {
    const { hotelUuid } = req.params;
    const campaigns = await metaAdsAPI.getCampaigns(hotelUuid, req.query);

    res.json({
      success: true,
      data: campaigns
    });

  } catch (error) {
    console.error('Error getting campaigns:', error);
    res.status(500).json({
      error: 'Erro ao obter campanhas: ' + error.message
    });
  }
});

// GET /api/meta/insights/:hotelUuid - Obter insights
router.get('/insights/:hotelUuid', authenticateToken, validateHotelAccess, async (req, res) => {
  try {
    const { hotelUuid } = req.params;
    const { campaignId, ...params } = req.query;
    
    const insights = await metaAdsAPI.getCampaignInsights(hotelUuid, campaignId, params);

    res.json({
      success: true,
      data: insights
    });

  } catch (error) {
    console.error('Error getting insights:', error);
    res.status(500).json({
      error: 'Erro ao obter insights: ' + error.message
    });
  }
});

// POST /api/meta/refresh-token/:hotelUuid - Renovar access token
router.post('/refresh-token/:hotelUuid', authenticateToken, validateHotelAccess, async (req, res) => {
  try {
    const { hotelUuid } = req.params;
    
    await metaAdsAPI.refreshAccessToken(hotelUuid);

    res.json({
      success: true,
      message: 'Access token renovado com sucesso'
    });

  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({
      error: 'Erro ao renovar token: ' + error.message
    });
  }
});

// GET /api/meta/sync-logs/:hotelUuid - Obter logs de sincronização
router.get('/sync-logs/:hotelUuid', authenticateToken, validateHotelAccess, async (req, res) => {
  try {
    const { hotelUuid } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const logs = await db.query(`
      SELECT 
        id, sync_type, status, records_processed, error_message,
        sync_started_at, sync_completed_at, created_at
      FROM meta_sync_logs 
      WHERE hotel_uuid = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [hotelUuid, parseInt(limit), parseInt(offset)]);

    const [{ total }] = await db.query(`
      SELECT COUNT(*) as total 
      FROM meta_sync_logs 
      WHERE hotel_uuid = ?
    `, [hotelUuid]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        total: total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: (parseInt(offset) + parseInt(limit)) < total
      }
    });

  } catch (error) {
    console.error('Error getting sync logs:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/meta/credentials/:hotelUuid - Remover credenciais
router.delete('/credentials/:hotelUuid', authenticateToken, validateHotelAccess, async (req, res) => {
  try {
    const { hotelUuid } = req.params;

    await db.query(`
      UPDATE meta_credentials 
      SET status = 'disabled' 
      WHERE hotel_uuid = ?
    `, [hotelUuid]);

    res.json({
      success: true,
      message: 'Credenciais Meta removidas com sucesso'
    });

  } catch (error) {
    console.error('Error removing Meta credentials:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;