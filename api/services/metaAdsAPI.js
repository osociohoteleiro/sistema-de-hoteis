const axios = require('axios');
const db = require('../config/database');

class MetaAdsAPI {
  constructor() {
    this.baseUrl = 'https://graph.facebook.com/v18.0';
    this.apiVersion = 'v18.0';
  }

  // Configurar credenciais para um hotel específico
  async setCredentials(hotelUuid, credentials) {
    try {
      await db.query(`
        INSERT INTO meta_credentials (
          hotel_uuid, app_id, app_secret, access_token, ad_account_id, 
          business_manager_id, token_expires_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          app_id = VALUES(app_id),
          app_secret = VALUES(app_secret),
          access_token = VALUES(access_token),
          ad_account_id = VALUES(ad_account_id),
          business_manager_id = VALUES(business_manager_id),
          token_expires_at = VALUES(token_expires_at),
          updated_at = NOW()
      `, [
        hotelUuid,
        credentials.appId,
        credentials.appSecret,
        credentials.accessToken,
        credentials.adAccountId,
        credentials.businessManagerId,
        credentials.tokenExpiresAt
      ]);
      
      console.log('✅ Meta credentials saved for hotel:', hotelUuid);
      return { success: true };
    } catch (error) {
      console.error('❌ Error saving Meta credentials:', error);
      throw error;
    }
  }

  // Obter credenciais do hotel
  async getCredentials(hotelUuid) {
    try {
      const [credentials] = await db.query(`
        SELECT * FROM meta_credentials 
        WHERE hotel_uuid = $1 AND status = 'active'
        ORDER BY updated_at DESC
        LIMIT 1
      `, [hotelUuid]);

      if (!credentials) {
        throw new Error('Meta credentials not found for hotel');
      }

      return credentials;
    } catch (error) {
      console.error('❌ Error getting Meta credentials:', error);
      throw error;
    }
  }

  // Fazer requisição autenticada para Meta API
  async apiRequest(endpoint, params = {}, hotelUuid, method = 'GET') {
    try {
      const credentials = await this.getCredentials(hotelUuid);
      
      const config = {
        method,
        url: `${this.baseUrl}${endpoint}`,
        params: {
          access_token: credentials.access_token,
          ...params
        }
      };

      console.log(`📡 Meta API request: ${method} ${endpoint}`);
      const response = await axios(config);
      
      return response.data;
    } catch (error) {
      console.error('❌ Meta API request failed:', error.response?.data || error.message);
      throw this.handleApiError(error);
    }
  }

  // Obter campanhas
  async getCampaigns(hotelUuid, params = {}) {
    try {
      const credentials = await this.getCredentials(hotelUuid);
      const endpoint = `/act_${credentials.ad_account_id}/campaigns`;
      
      const defaultParams = {
        fields: 'id,name,status,objective,created_time,updated_time,start_time,stop_time',
        limit: 100
      };

      return await this.apiRequest(endpoint, { ...defaultParams, ...params }, hotelUuid);
    } catch (error) {
      throw error;
    }
  }

  // Obter insights de campanha
  async getCampaignInsights(hotelUuid, campaignId = null, params = {}) {
    try {
      const credentials = await this.getCredentials(hotelUuid);
      
      let endpoint;
      if (campaignId) {
        endpoint = `/${campaignId}/insights`;
      } else {
        endpoint = `/act_${credentials.ad_account_id}/insights`;
      }

      const defaultParams = {
        fields: [
          'campaign_id',
          'campaign_name',
          'impressions',
          'clicks',
          'spend',
          'conversions',
          'ctr',
          'cpc',
          'cpm',
          'reach',
          'frequency',
          'actions',
          'cost_per_action_type',
          'date_start',
          'date_stop'
        ].join(','),
        level: 'campaign',
        time_increment: 1,
        limit: 1000
      };

      // Data range padrão: últimos 7 dias
      if (!params.time_range) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);
        
        params.time_range = JSON.stringify({
          since: startDate.toISOString().split('T')[0],
          until: endDate.toISOString().split('T')[0]
        });
      }

      return await this.apiRequest(endpoint, { ...defaultParams, ...params }, hotelUuid);
    } catch (error) {
      throw error;
    }
  }

  // Obter Ad Sets
  async getAdSets(hotelUuid, campaignId = null, params = {}) {
    try {
      const credentials = await this.getCredentials(hotelUuid);
      
      let endpoint;
      if (campaignId) {
        endpoint = `/${campaignId}/adsets`;
      } else {
        endpoint = `/act_${credentials.ad_account_id}/adsets`;
      }

      const defaultParams = {
        fields: 'id,name,status,campaign_id,created_time,updated_time,start_time,end_time',
        limit: 100
      };

      return await this.apiRequest(endpoint, { ...defaultParams, ...params }, hotelUuid);
    } catch (error) {
      throw error;
    }
  }

  // Obter Ads
  async getAds(hotelUuid, adSetId = null, params = {}) {
    try {
      const credentials = await this.getCredentials(hotelUuid);
      
      let endpoint;
      if (adSetId) {
        endpoint = `/${adSetId}/ads`;
      } else {
        endpoint = `/act_${credentials.ad_account_id}/ads`;
      }

      const defaultParams = {
        fields: 'id,name,status,adset_id,campaign_id,created_time,updated_time',
        limit: 100
      };

      return await this.apiRequest(endpoint, { ...defaultParams, ...params }, hotelUuid);
    } catch (error) {
      throw error;
    }
  }

  // Sincronizar dados completos
  async syncAllData(hotelUuid, dateRange = null) {
    try {
      console.log('🔄 Starting complete Meta data sync for hotel:', hotelUuid);
      
      // 1. Obter campanhas
      const campaigns = await this.getCampaigns(hotelUuid);
      console.log(`📊 Found ${campaigns.data.length} campaigns`);

      // 2. Obter insights
      const insights = await this.getCampaignInsights(hotelUuid, null, {
        time_range: dateRange
      });
      console.log(`📈 Found ${insights.data.length} insight records`);

      // 3. Processar e salvar dados
      const processedData = this.processInsightsData(insights.data, campaigns.data);
      await this.saveReportData(hotelUuid, processedData, dateRange);

      console.log('✅ Meta data sync completed');
      return processedData;

    } catch (error) {
      console.error('❌ Error syncing Meta data:', error);
      throw error;
    }
  }

  // Processar dados de insights
  processInsightsData(insights, campaigns) {
    const campaignMap = new Map();
    campaigns.forEach(campaign => {
      campaignMap.set(campaign.id, campaign);
    });

    return insights.map(insight => {
      const campaign = campaignMap.get(insight.campaign_id);
      
      return {
        campaign_id: insight.campaign_id,
        campaign_name: insight.campaign_name || campaign?.name || 'Unknown',
        impressions: parseInt(insight.impressions) || 0,
        clicks: parseInt(insight.clicks) || 0,
        spend: parseFloat(insight.spend) || 0,
        conversions: this.extractConversions(insight),
        ctr: parseFloat(insight.ctr) || 0,
        cpc: parseFloat(insight.cpc) || 0,
        cpm: parseFloat(insight.cpm) || 0,
        reach: parseInt(insight.reach) || 0,
        frequency: parseFloat(insight.frequency) || 0,
        date_start: insight.date_start,
        date_stop: insight.date_stop,
        raw_insight: insight
      };
    });
  }

  // Extrair conversões dos dados de ações
  extractConversions(insight) {
    if (!insight.actions) return 0;
    
    const conversionActions = insight.actions.filter(action => 
      action.action_type === 'purchase' || 
      action.action_type === 'lead' ||
      action.action_type === 'complete_registration'
    );

    return conversionActions.reduce((total, action) => 
      total + parseInt(action.value), 0
    );
  }

  // Salvar dados do relatório
  async saveReportData(hotelUuid, processedData, dateRange) {
    try {
      // Calcular métricas de resumo
      const summaryMetrics = this.calculateSummaryMetrics(processedData);
      
      // Salvar relatório
      const reportName = `Meta Ads Sync - ${new Date().toLocaleDateString('pt-BR')}`;
      
      await db.query(`
        INSERT INTO manual_reports (
          hotel_uuid, report_name, report_type, meta_data, 
          summary_metrics, report_period_start, report_period_end,
          created_by, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      `, [
        hotelUuid,
        reportName,
        'META_ADS',
        JSON.stringify(processedData),
        JSON.stringify(summaryMetrics),
        dateRange?.since || null,
        dateRange?.until || null,
        null, // Sistema automático
        'ACTIVE'
      ]);

      console.log('✅ Report data saved to database');
    } catch (error) {
      console.error('❌ Error saving report data:', error);
      throw error;
    }
  }

  // Calcular métricas de resumo
  calculateSummaryMetrics(data) {
    const totalImpressions = data.reduce((sum, item) => sum + item.impressions, 0);
    const totalClicks = data.reduce((sum, item) => sum + item.clicks, 0);
    const totalSpend = data.reduce((sum, item) => sum + item.spend, 0);
    const totalConversions = data.reduce((sum, item) => sum + item.conversions, 0);

    return {
      total_impressions: totalImpressions,
      total_clicks: totalClicks,
      total_spend: totalSpend,
      total_conversions: totalConversions,
      avg_ctr: totalImpressions > 0 ? (totalClicks / totalImpressions * 100) : 0,
      avg_cpc: totalClicks > 0 ? (totalSpend / totalClicks) : 0,
      conversion_rate: totalClicks > 0 ? (totalConversions / totalClicks * 100) : 0,
      total_campaigns: new Set(data.map(item => item.campaign_id)).size
    };
  }

  // Renovar access token
  async refreshAccessToken(hotelUuid) {
    try {
      const credentials = await this.getCredentials(hotelUuid);
      
      const response = await axios.get(`${this.baseUrl}/oauth/access_token`, {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: credentials.app_id,
          client_secret: credentials.app_secret,
          fb_exchange_token: credentials.access_token
        }
      });

      // Salvar novo token
      await db.query(`
        UPDATE meta_credentials 
        SET access_token = $1, token_expires_at = DATE_ADD(NOW(), INTERVAL 60 DAY)
        WHERE hotel_uuid = $2
      `, [response.data.access_token, hotelUuid]);

      console.log('✅ Access token refreshed for hotel:', hotelUuid);
      return response.data.access_token;

    } catch (error) {
      console.error('❌ Error refreshing access token:', error);
      throw error;
    }
  }

  // Tratar erros da API
  handleApiError(error) {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          return new Error('Access token inválido ou expirado');
        case 403:
          return new Error('Permissões insuficientes');
        case 429:
          return new Error('Rate limit excedido');
        default:
          return new Error(data.error?.message || 'Erro na API do Meta');
      }
    }
    
    return error;
  }
}

module.exports = new MetaAdsAPI();