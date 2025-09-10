const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const metaAdsAPI = require('../services/metaAdsAPI');
const db = require('../config/database');
const moment = require('moment');
const axios = require('axios');
const crypto = require('crypto');

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
        SELECT h.id, h.name, h.hotel_uuid
        FROM hotels h
        WHERE h.hotel_uuid = $1
      `, [hotelUuid]);
    } else {
      hotelAccess = await db.query(`
        SELECT h.id, h.name, h.hotel_uuid
        FROM hotels h
        INNER JOIN user_hotels uh ON h.id = uh.hotel_id
        WHERE h.hotel_uuid = $1 AND uh.user_id = $2 AND uh.active = true
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
        name: req.hotel.name
      }
    });

  } catch (error) {
    console.error('Error setting Meta credentials:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/meta/credentials/:hotelUuid - Obter status das credenciais (APENAS contas conectadas)
router.get('/credentials/:hotelUuid', authenticateToken, validateHotelAccess, async (req, res) => {
  try {
    const { hotelUuid } = req.params;

    // Buscar contas conectadas
    const connectedAccounts = await db.query(`
      SELECT 
        id, account_id, account_name, account_status, business_name, created_at, updated_at
      FROM meta_connected_accounts 
      WHERE hotel_uuid = $1 AND account_status = 1
      ORDER BY created_at ASC
    `, [hotelUuid]);

    if (!connectedAccounts || connectedAccounts.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Nenhuma conta Meta conectada para este hotel'
      });
    }

    // Pegar a primeira conta como principal para compatibilidade
    const primaryAccount = connectedAccounts[0];

    res.json({
      success: true,
      credentials: {
        app_id: process.env.META_APP_ID,
        ad_account_id: primaryAccount.ad_account_id,
        created_at: primaryAccount.created_at,
        updated_at: primaryAccount.updated_at,
        // Não retornar tokens por segurança
        app_secret: '***',
        access_token: '***',
        expires_in_days: null,
        needs_refresh: false
      },
      connected_accounts: connectedAccounts.map(acc => ({
        id: acc.id,
        ad_account_id: acc.ad_account_id,
        ad_account_name: acc.ad_account_name,
        status: acc.status,
        business_name: acc.business_name
      }))
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
      ) VALUES ($1, 'manual', 'success', NOW())
    `, [hotelUuid]);

    const syncLogId = syncLog.insertId;

    try {
      // Sincronizar dados
      const data = await metaAdsAPI.syncAllData(hotelUuid, dateRange);

      // Atualizar log de sucesso
      await db.query(`
        UPDATE meta_sync_logs 
        SET status = 'success', 
            records_processed = $1, 
            sync_completed_at = NOW()
        WHERE id = $2
      `, [data.length, syncLogId]);

      // Atualizar último sync nas credenciais
      await db.query(`
        UPDATE meta_credentials 
        SET last_sync_at = NOW() 
        WHERE hotel_uuid = $1
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
            name: req.hotel.name
          }
        }
      });

    } catch (syncError) {
      // Atualizar log de erro
      await db.query(`
        UPDATE meta_sync_logs 
        SET status = 'error', 
            error_message = $1, 
            sync_completed_at = NOW()
        WHERE id = $2
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
      WHERE hotel_uuid = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [hotelUuid, parseInt(limit), parseInt(offset)]);

    const [{ total }] = await db.query(`
      SELECT COUNT(*) as total 
      FROM meta_sync_logs 
      WHERE hotel_uuid = $1
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
      WHERE hotel_uuid = $1
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

// === OAUTH ROUTES ===

// GET /api/meta/oauth/url/:hotelUuid - Gerar URL de autorização OAuth
router.get('/oauth/url/:hotelUuid', authenticateToken, validateHotelAccess, async (req, res) => {
  try {
    const { hotelUuid } = req.params;
    
    if (!process.env.META_APP_ID) {
      return res.status(500).json({
        error: 'Configuração do Facebook não encontrada'
      });
    }

    // Gerar state para segurança
    const state = crypto.randomBytes(32).toString('hex');
    
    // Salvar state temporariamente (cache ou banco)
    await db.query(`
      INSERT INTO oauth_states (state, hotel_uuid, expires_at)
      VALUES ($1, $2, NOW() + INTERVAL '10 minutes')
      ON CONFLICT (state) DO UPDATE SET
        hotel_uuid = EXCLUDED.hotel_uuid,
        created_at = NOW(),
        expires_at = EXCLUDED.expires_at
    `, [state, hotelUuid]);

    const redirectUri = `${process.env.API_BASE_URL || 'http://localhost:3001'}/api/meta/oauth/callback`;
    
    // Scopes necessários para Meta Ads
    const scopes = [
      'ads_read',
      'ads_management'
    ].join(',');

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth` +
      `?client_id=${process.env.META_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&response_type=code` +
      `&state=${state}`;

    res.json({
      success: true,
      authUrl,
      state
    });

  } catch (error) {
    console.error('Error generating OAuth URL:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/meta/oauth/callback - Callback do OAuth
router.get('/oauth/callback', async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;

    // Verificar se houve erro na autorização
    if (error) {
      console.error('OAuth error:', error, error_description);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/hotel/marketing?error=${encodeURIComponent(error_description || error)}`);
    }

    if (!code || !state) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/hotel/marketing?error=missing_parameters`);
    }

    // Validar state
    const stateRecords = await db.query(`
      SELECT hotel_uuid, expires_at
      FROM oauth_states 
      WHERE state = $1 AND expires_at > NOW()
      LIMIT 1
    `, [state]);
    const stateRecord = stateRecords[0];

    if (!stateRecord) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/hotel/marketing?error=invalid_state`);
    }

    const hotelUuid = stateRecord.hotel_uuid;

    // Trocar código por access token
    const tokenResponse = await axios.post('https://graph.facebook.com/v18.0/oauth/access_token', {
      client_id: process.env.META_APP_ID,
      client_secret: process.env.META_APP_SECRET,
      redirect_uri: `${process.env.API_BASE_URL || 'http://localhost:3001'}/api/meta/oauth/callback`,
      code: code
    });

    const { access_token, expires_in } = tokenResponse.data;

    // Obter informações do usuário e contas de anúncios
    const meResponse = await axios.get('https://graph.facebook.com/v18.0/me', {
      params: {
        access_token,
        fields: 'id,name,email'
      }
    });

    const adAccountsResponse = await axios.get('https://graph.facebook.com/v18.0/me/adaccounts', {
      params: {
        access_token,
        fields: 'id,name,account_status,currency,business'
      }
    });

    // Calcular data de expiração do token
    const tokenExpiresAt = moment().add(expires_in || 3600, 'seconds').format('YYYY-MM-DD HH:mm:ss');

    // Salvar todas as contas DISPONÍVEIS (não conectadas ainda)
    const availableAccounts = adAccountsResponse.data.data;
    
    // Limpar contas disponíveis antigas deste hotel primeiro (reconexão)
    await db.query(`
      DELETE FROM meta_available_accounts 
      WHERE hotel_uuid = $1
    `, [hotelUuid]);

    // Inserir cada conta como DISPONÍVEL (não conectada)
    for (const account of availableAccounts) {
      await db.query(`
        INSERT INTO meta_available_accounts (
          hotel_uuid, account_id, account_name, business_id, business_name,
          account_status, currency
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (hotel_uuid, account_id) DO UPDATE SET
          account_name = EXCLUDED.account_name,
          business_id = EXCLUDED.business_id,
          business_name = EXCLUDED.business_name,
          account_status = EXCLUDED.account_status,
          currency = EXCLUDED.currency,
          updated_at = NOW()
      `, [
        hotelUuid,
        account.id.replace('act_', ''),
        account.name,
        account.business?.id || '',
        account.business?.name || '',
        account.account_status || 1,
        account.currency || ''
      ]);
    }

    console.log(`✅ Salvou ${availableAccounts.length} contas DISPONÍVEIS para hotel: ${hotelUuid}`);

    // Limpar state usado
    await db.query('DELETE FROM oauth_states WHERE state = $1', [state]);

    console.log(`✅ OAuth completed successfully for hotel: ${hotelUuid}`);

    // Redirecionar para seleção de contas (não conectar automaticamente)
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/hotel/marketing?oauth_success=1&select_accounts=1`);

  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/hotel/marketing?error=oauth_failed`);
  }
});

// GET /api/meta/oauth/available-accounts/:hotelUuid - Obter contas disponíveis para seleção
router.get('/oauth/available-accounts/:hotelUuid', authenticateToken, validateHotelAccess, async (req, res) => {
  try {
    const { hotelUuid } = req.params;

    // Buscar contas disponíveis (após OAuth)
    const availableAccounts = await db.query(`
      SELECT account_id, account_name, business_id, business_name, 
             account_status, currency, created_at
      FROM meta_available_accounts 
      WHERE hotel_uuid = $1
      ORDER BY account_name ASC
    `, [hotelUuid]);

    // Buscar contas já conectadas
    const connectedAccounts = await db.query(`
      SELECT account_id
      FROM meta_connected_accounts 
      WHERE hotel_uuid = $1 AND account_status = 1
    `, [hotelUuid]);

    const connectedAccountIds = connectedAccounts.map(acc => acc.account_id);

    if (!availableAccounts || availableAccounts.length === 0) {
      return res.json({
        success: false,
        message: 'Nenhuma conta disponível. Faça login no Facebook primeiro.',
        accounts: [],
        connectedAccountIds: connectedAccountIds
      });
    }

    res.json({
      success: true,
      accounts: availableAccounts.map(acc => ({
        id: `act_${acc.account_id}`,
        account_id: acc.account_id,
        name: acc.account_name,
        business: {
          id: acc.business_id,
          name: acc.business_name
        },
        account_status: acc.account_status,
        currency: acc.currency,
        isConnected: connectedAccountIds.includes(acc.account_id),
        created_at: acc.created_at
      })),
      connectedAccountIds: connectedAccountIds,
      total: availableAccounts.length
    });

  } catch (error) {
    console.error('Error getting available accounts:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/meta/oauth/accounts/:hotelUuid - Obter contas conectadas (compatibilidade)
router.get('/oauth/accounts/:hotelUuid', authenticateToken, validateHotelAccess, async (req, res) => {
  try {
    const { hotelUuid } = req.params;

    // Buscar contas conectadas da tabela PostgreSQL com status completo
    const connectedAccounts = await db.query(`
      SELECT account_id, account_name, business_name, account_status, 
             business_id, created_at, updated_at
      FROM meta_connected_accounts 
      WHERE hotel_uuid = $1 AND account_status = 1
    `, [hotelUuid]);

    res.json({
      success: true,
      accounts: connectedAccounts.map(acc => ({
        id: `act_${acc.account_id}`,
        name: acc.account_name || `Conta ${acc.account_id}`,
        business_name: acc.business_name,
        business_id: acc.business_id,
        account_status: acc.account_status, // Campo importante para status Ativa/Inativa
        status: acc.account_status, // Compatibilidade
        created_at: acc.created_at,
        updated_at: acc.updated_at
      })),
      selectedAccount: connectedAccounts.length > 0 ? {
        id: `act_${connectedAccounts[0].account_id}`,
        name: connectedAccounts[0].account_name
      } : null,
      connectedAccounts: connectedAccounts
    });

  } catch (error) {
    console.error('Error getting OAuth accounts:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/meta/oauth/connect-accounts/:hotelUuid - Conectar contas selecionadas
router.post('/oauth/connect-accounts/:hotelUuid', authenticateToken, validateHotelAccess, async (req, res) => {
  try {
    const { hotelUuid } = req.params;
    const { accountIds } = req.body;

    if (!accountIds || !Array.isArray(accountIds) || accountIds.length === 0) {
      return res.status(400).json({
        error: 'Pelo menos uma conta deve ser selecionada'
      });
    }

    const connectedAccounts = [];

    // Conectar cada conta selecionada
    for (const accountId of accountIds) {
      const cleanAccountId = accountId.replace('act_', '');
      
      // Buscar dados da conta disponível
      const availableAccountResults = await db.query(`
        SELECT account_id, account_name, business_id, business_name
        FROM meta_available_accounts 
        WHERE hotel_uuid = $1 AND account_id = $2
        LIMIT 1
      `, [hotelUuid, cleanAccountId]);
      const availableAccount = availableAccountResults[0];

      if (!availableAccount) {
        console.warn(`Conta ${accountId} não encontrada nas disponíveis`);
        continue;
      }

      // Inserir na tabela de contas conectadas
      const tempToken = `temp_token_${availableAccount.account_id}`;
      await db.query(`
        INSERT INTO meta_connected_accounts (
          hotel_uuid, account_id, account_name, business_id, business_name,
          account_status, access_token
        ) VALUES ($1, $2, $3, $4, $5, 1, $6)
        ON CONFLICT (hotel_uuid, account_id) DO UPDATE SET
          account_name = EXCLUDED.account_name,
          business_id = EXCLUDED.business_id,
          business_name = EXCLUDED.business_name,
          account_status = 1,
          updated_at = NOW()
      `, [
        hotelUuid,
        availableAccount.account_id,
        availableAccount.account_name,
        availableAccount.business_id,
        availableAccount.business_name,
        tempToken
      ]);

      connectedAccounts.push({
        id: accountId,
        name: availableAccount.account_name
      });
    }

    res.json({
      success: true,
      message: `${connectedAccounts.length} conta(s) conectada(s) com sucesso!`,
      connectedAccounts: connectedAccounts,
      total: connectedAccounts.length
    });

  } catch (error) {
    console.error('Error connecting accounts:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/meta/oauth/disconnect-account/:hotelUuid - Desconectar conta específica
router.post('/oauth/disconnect-account/:hotelUuid', authenticateToken, validateHotelAccess, async (req, res) => {
  try {
    const { hotelUuid } = req.params;
    const { adAccountId } = req.body;

    if (!adAccountId) {
      return res.status(400).json({
        error: 'ID da conta de anúncios é obrigatório'
      });
    }

    const cleanAccountId = adAccountId.replace('act_', '');

    // Remover da tabela de conectadas
    const result = await db.query(`
      DELETE FROM meta_connected_accounts 
      WHERE hotel_uuid = $1 AND account_id = $2
    `, [hotelUuid, cleanAccountId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Conta não encontrada ou já desconectada'
      });
    }

    res.json({
      success: true,
      message: 'Conta desconectada com sucesso'
    });

  } catch (error) {
    console.error('Error disconnecting account:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;