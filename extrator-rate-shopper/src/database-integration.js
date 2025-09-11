const { Pool } = require('pg');
const { logger } = require('./logger');
const path = require('path');
const axios = require('axios');

// Configurar dotenv para carregar do diretório correto
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

/**
 * Classe para integrar o extrator com o banco de dados da API (PostgreSQL)
 */
class DatabaseIntegration {
  constructor() {
    this.pool = null;
    this.isConnected = false;
  }

  /**
   * Conecta ao banco de dados PostgreSQL
   */
  async connect() {
    try {
      console.log('🔄 Conectando ao PostgreSQL para extração...');
      
      const config = {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT) || 5432,
        user: process.env.POSTGRES_USER || 'osh_user',
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DB || 'osh_db',
        min: 2,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        // Usar SSL apenas se não estiver explicitamente desabilitado
        ssl: process.env.PGSSLDISABLE === 'true' ? false : 
             (process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false)
      };

      this.pool = new Pool(config);
      
      // Teste de conexão
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      this.isConnected = true;
      logger.info('Connected to PostgreSQL successfully');
      console.log('✅ Conectado ao banco de dados PostgreSQL');
    } catch (error) {
      logger.error('Failed to connect to database', { error: error.message });
      console.error('❌ Erro ao conectar:', error.message);
      throw error;
    }
  }

  /**
   * Busca searches PENDING no banco de dados
   * @param {string} hotelId - Filtrar por hotel específico (opcional)
   * @param {string} searchIds - IDs específicos de buscas separados por vírgula (opcional)
   */
  async getPendingSearches(hotelId = null, searchIds = null) {
    try {
      let whereConditions = ["rs.status = 'PENDING'"];
      let queryParams = [];
      let paramCounter = 1;

      // Filtro por hotel específico
      if (hotelId) {
        whereConditions.push(`rs.hotel_id = $${paramCounter++}`);
        queryParams.push(parseInt(hotelId));
      }

      // Filtro por IDs específicos de buscas
      if (searchIds) {
        const ids = searchIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
        if (ids.length > 0) {
          whereConditions.push(`rs.id = ANY($${paramCounter++})`);
          queryParams.push(ids);
        }
      }

      const query = `
        SELECT 
          rs.id,
          rs.uuid,
          rs.hotel_id,
          rs.property_id,
          rs.start_date,
          rs.end_date,
          rs.total_dates,
          rsp.property_name,
          rsp.booking_url,
          rsp.max_bundle_size,
          h.name as hotel_name
        FROM rate_shopper_searches rs
        JOIN rate_shopper_properties rsp ON rs.property_id = rsp.id
        JOIN hotels h ON rs.hotel_id = h.id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY rs.created_at ASC
        LIMIT 10
      `;

      const result = await this.pool.query(query, queryParams);
      const rows = result.rows;

      logger.info(`Found ${rows.length} pending searches${hotelId ? ` for hotel ${hotelId}` : ''}${searchIds ? ` with IDs ${searchIds}` : ''}`);
      return rows;
    } catch (error) {
      logger.error('Failed to get pending searches', { error: error.message });
      throw error;
    }
  }

  /**
   * Atualiza status da busca
   */
  async updateSearchStatus(searchId, status, additionalData = {}) {
    try {
      let query = 'UPDATE rate_shopper_searches SET status = $1, updated_at = NOW()';
      const params = [status];
      let paramCounter = 2;

      if (status === 'RUNNING') {
        query += ', started_at = NOW()';
      } else if (status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED') {
        query += ', completed_at = NOW()';
      }

      if (additionalData.processed_dates !== undefined) {
        query += `, processed_dates = $${paramCounter++}`;
        params.push(additionalData.processed_dates);
      }

      if (additionalData.total_prices_found !== undefined) {
        query += `, total_prices_found = $${paramCounter++}`;
        params.push(additionalData.total_prices_found);
      }

      if (additionalData.error_log) {
        query += `, error_log = $${paramCounter++}`;
        params.push(additionalData.error_log);
      }

      if (additionalData.duration_seconds) {
        query += `, duration_seconds = $${paramCounter++}`;
        params.push(additionalData.duration_seconds);
      }

      query += ` WHERE id = $${paramCounter}`;
      params.push(searchId);

      await this.pool.query(query, params);
      logger.info(`Updated search ${searchId} to status ${status}`, { additionalData });

      // Notificar a API quando a extração terminar
      if (status === 'COMPLETED' || status === 'FAILED') {
        await this.notifyExtractionComplete(searchId, status, additionalData);
      }
    } catch (error) {
      logger.error('Failed to update search status', { 
        searchId, 
        status, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Notifica a API sobre a conclusão da extração
   */
  async notifyExtractionComplete(searchId, status, additionalData = {}) {
    try {
      // Buscar dados da busca para obter hotel_id
      const searchResult = await this.pool.query(`
        SELECT rs.*, rsp.property_name 
        FROM rate_shopper_searches rs 
        LEFT JOIN rate_shopper_properties rsp ON rs.property_id = rsp.id 
        WHERE rs.id = $1
      `, [searchId]);

      if (searchResult.rows.length === 0) {
        logger.warn(`Search ${searchId} not found for notification`);
        return;
      }

      const searchData = searchResult.rows[0];
      
      // Buscar UUID do hotel
      const hotelResult = await this.pool.query('SELECT hotel_uuid FROM hotels WHERE id = $1', [searchData.hotel_id]);
      
      if (hotelResult.rows.length === 0) {
        logger.warn(`Hotel ${searchData.hotel_id} not found for notification`);
        return;
      }

      const hotelUuid = hotelResult.rows[0].hotel_uuid;

      // Preparar dados da notificação
      const notificationData = {
        status,
        processed_dates: additionalData.processed_dates || searchData.processed_dates,
        total_dates: searchData.total_dates,
        total_prices_found: additionalData.total_prices_found || searchData.total_prices_found,
        property_name: searchData.property_name,
        started_at: searchData.started_at,
        completed_at: new Date().toISOString(),
        error_log: additionalData.error_log || searchData.error_log
      };

      // Fazer chamada HTTP para a API
      const axios = require('axios');
      const baseApiUrl = process.env.API_URL || 'http://localhost:3001';
      const apiUrl = `${baseApiUrl}/api/rate-shopper/${hotelUuid}/searches/${searchId}/complete`;
      
      console.log(`🔍 Notifying completion to API:`);
      console.log(`   API URL: ${baseApiUrl}`);
      console.log(`   Full URL: ${apiUrl}`);
      
      await axios.put(apiUrl, notificationData, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      logger.info(`Notified API about search ${searchId} completion`, { 
        searchId, 
        status, 
        hotelUuid 
      });

    } catch (error) {
      // Log do erro mas não falhar o processo principal
      console.log(`❌ Erro na notificação de conclusão: ${error.message}`);
      console.log(`🔍 Stack trace:`, error.stack);
      logger.error('Failed to notify API about extraction completion', {
        searchId,
        status,
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Converte data do formato brasileiro (DD/MM/YYYY) para ISO (YYYY-MM-DD)
   */
  convertDateToISO(dateStr) {
    try {
      if (!dateStr) return null;
      
      // Se já estiver no formato YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
      }
      
      // Se estiver no formato DD/MM/YYYY
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
      
      // Se estiver no formato DD-MM-YYYY
      if (dateStr.includes('-') && dateStr.length === 10) {
        const parts = dateStr.split('-');
        if (parts.length === 3 && parts[0].length === 2) {
          return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }
      
      return dateStr;
    } catch (error) {
      logger.error('Failed to convert date format', { dateStr, error: error.message });
      return dateStr;
    }
  }

  /**
   * Salva preço extraído no banco
   */
  async savePrice(searchId, propertyId, priceData) {
    try {
      // Obter hotel_id da busca
      const searchResult = await this.pool.query('SELECT hotel_id FROM rate_shopper_searches WHERE id = $1', [searchId]);
      if (searchResult.rows.length === 0) {
        throw new Error(`Search ${searchId} not found`);
      }
      const hotelId = searchResult.rows[0].hotel_id;

      // Converter datas para formato correto (YYYY-MM-DD)
      const checkinDate = this.convertDateToISO(priceData.check_in_date);
      const checkoutDate = this.convertDateToISO(priceData.check_out_date);
      
      const result = await this.pool.query(`
        INSERT INTO rate_shopper_prices (
          search_id, property_id, hotel_id, check_in_date, check_out_date,
          price, currency, room_type, max_guests, is_bundle, bundle_size,
          original_price, availability_status, extraction_method, scraped_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
        RETURNING id
      `, [
        searchId,
        propertyId,
        hotelId,
        checkinDate,
        checkoutDate,
        priceData.price,
        priceData.currency || 'BRL',
        priceData.room_type || 'Standard',
        priceData.max_guests || 2,
        priceData.is_bundle || false,
        priceData.bundle_size || 1,
        priceData.original_price || priceData.price,
        priceData.availability_status || 'AVAILABLE',
        priceData.extraction_method || 'JS_VARS'
      ]);

      const priceId = result.rows[0].id;

      logger.info('Price saved to database', {
        price_id: priceId,
        searchId,
        propertyId,
        hotelId,
        price: priceData.price,
        checkIn: priceData.check_in_date
      });

      return priceId;
    } catch (error) {
      logger.error('Failed to save price', { 
        searchId, 
        propertyId, 
        priceData,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Conta quantos preços foram salvos para uma busca específica
   */
  async getSearchPricesCount(searchId) {
    try {
      const result = await this.pool.query('SELECT COUNT(*) as count FROM rate_shopper_prices WHERE search_id = $1', [searchId]);
      return parseInt(result.rows[0]?.count || 0);
    } catch (error) {
      logger.error('Failed to get prices count', { searchId, error: error.message });
      return 0;
    }
  }

  /**
   * Converte search do banco para formato do extrator
   */
  searchToExtractorFormat(dbSearch) {
    return {
      id: dbSearch.id,
      name: dbSearch.property_name,
      url: dbSearch.booking_url,
      start_date: this.formatDate(dbSearch.start_date),
      end_date: this.formatDate(dbSearch.end_date),
      max_bundle_size: dbSearch.max_bundle_size || 7,
      hotel_id: dbSearch.hotel_id,
      property_id: dbSearch.property_id
    };
  }

  /**
   * Formata data para o formato esperado pelo extrator
   */
  formatDate(date) {
    if (!date) return null;
    
    try {
      if (date instanceof Date) {
        return date.toISOString().split('T')[0];
      }
      if (typeof date === 'string') {
        return new Date(date).toISOString().split('T')[0];
      }
      // Se for timestamp do mysql
      if (typeof date === 'object' && date.toString) {
        return new Date(date).toISOString().split('T')[0];
      }
      return date;
    } catch (error) {
      logger.error('Date formatting error', { date, error: error.message });
      return null;
    }
  }

  /**
   * Atualiza o progresso da extração via API
   */
  async updateExtractionProgress(searchId, hotelId, processedDates, totalDates, totalPricesFound = null) {
    try {
      const apiUrl = process.env.API_URL || 'http://localhost:3001';
      const progressData = {
        processed_dates: processedDates
      };

      if (totalPricesFound !== null) {
        progressData.total_prices_found = totalPricesFound;
      }

      // Debug da requisição
      const url = `${apiUrl}/api/rate-shopper/${hotelId}/searches/${searchId}/progress`;
      console.log(`🔍 Debug API Call:`);
      console.log(`   URL: ${url}`);
      console.log(`   Hotel ID: ${hotelId} (${typeof hotelId})`);
      console.log(`   Search ID: ${searchId} (${typeof searchId})`);
      console.log(`   Payload:`, JSON.stringify(progressData, null, 2));

      await axios.put(url, progressData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log(`📡 Progresso atualizado via API: ${processedDates}/${totalDates} datas`);
      logger.info('Progress updated via API', { searchId, hotelId, processedDates, totalDates, totalPricesFound });
    } catch (error) {
      logger.error('Failed to update progress via API', { 
        searchId, 
        hotelId, 
        processedDates, 
        totalDates,
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: `${apiUrl}/api/rate-shopper/${hotelId}/searches/${searchId}/progress`,
        payload: progressData
      });
      console.log(`⚠️  Erro ao atualizar progresso via API: ${error.message}`);
      if (error.response) {
        console.log(`📊 Status: ${error.response.status}`);
        console.log(`📊 URL: ${apiUrl}/api/rate-shopper/${hotelId}/searches/${searchId}/progress`);
        console.log(`📊 Payload:`, JSON.stringify(progressData, null, 2));
        console.log(`📊 Response:`, JSON.stringify(error.response.data, null, 2));
      }
      // Não propagar o erro para não interromper a extração
    }
  }

  /**
   * Fecha conexão
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.isConnected = false;
      logger.info('PostgreSQL connection closed');
      console.log('🔒 Conexão PostgreSQL fechada');
    }
  }
}

module.exports = DatabaseIntegration;