const mysql = require('mysql2/promise');
const { logger } = require('./logger');

/**
 * Classe para integrar o extrator com o banco de dados da API
 */
class DatabaseIntegration {
  constructor() {
    this.connection = null;
  }

  /**
   * Conecta ao banco de dados
   */
  async connect() {
    try {
      this.connection = await mysql.createConnection({
        host: 'ep.osociohoteleiro.com.br',
        user: 'mariadb',
        password: 'OSH4040()Xx!..n',
        database: 'osh-ia',
        port: 3306
      });

      logger.info('Connected to database successfully');
      console.log('✅ Conectado ao banco de dados');
    } catch (error) {
      logger.error('Failed to connect to database', { error: error.message });
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

      // Filtro por hotel específico
      if (hotelId) {
        whereConditions.push("rs.hotel_id = ?");
        queryParams.push(hotelId);
      }

      // Filtro por IDs específicos de buscas
      if (searchIds) {
        const ids = searchIds.split(',').map(id => id.trim()).filter(id => id);
        if (ids.length > 0) {
          whereConditions.push(`rs.id IN (${ids.map(() => '?').join(',')})`);
          queryParams.push(...ids);
        }
      }

      const [rows] = await this.connection.execute(`
        SELECT 
          rs.id,
          rs.uuid,
          rs.hotel_id,
          rs.property_id,
          rs.start_date,
          rs.end_date,
          rs.max_bundle_size,
          rs.total_dates,
          rsp.property_name,
          rsp.booking_url,
          h.hotel_nome
        FROM rate_shopper_searches rs
        JOIN rate_shopper_properties rsp ON rs.property_id = rsp.id
        JOIN hotels h ON rs.hotel_id = h.id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY rs.created_at ASC
        LIMIT 10
      `, queryParams);

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
      let query = 'UPDATE rate_shopper_searches SET status = ?';
      const params = [status, searchId];

      if (status === 'RUNNING') {
        query += ', started_at = CURRENT_TIMESTAMP';
      } else if (status === 'COMPLETED' || status === 'FAILED') {
        query += ', completed_at = CURRENT_TIMESTAMP';
      }

      if (additionalData.processed_dates !== undefined) {
        query += ', processed_dates = ?';
        params.splice(-1, 0, additionalData.processed_dates);
      }

      if (additionalData.total_prices_found !== undefined) {
        query += ', total_prices_found = ?';
        params.splice(-1, 0, additionalData.total_prices_found);
      }

      if (additionalData.error_log) {
        query += ', error_log = ?';
        params.splice(-1, 0, additionalData.error_log);
      }

      query += ' WHERE id = ?';

      await this.connection.execute(query, params);
      logger.info(`Updated search ${searchId} to status ${status}`);
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
   * Converte data do formato brasileiro (DD/MM/YYYY) para MySQL (YYYY-MM-DD)
   */
  convertDateToMysql(dateStr) {
    try {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD
      }
      return dateStr; // Se já estiver no formato correto
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
      // Adicionar scraped_date (data atual) e converter datas para formato MySQL
      const scrapedDate = new Date().toISOString().split('T')[0];
      const checkinDate = this.convertDateToMysql(priceData.check_in_date);
      const checkoutDate = this.convertDateToMysql(priceData.check_out_date);
      
      await this.connection.execute(`
        INSERT INTO rate_shopper_prices (
          search_id, property_id, scraped_date, checkin_date, checkout_date, 
          price, scraped_at
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        searchId,
        propertyId,
        scrapedDate,
        checkinDate,
        checkoutDate,
        priceData.price
      ]);

      logger.info('Price saved to database', {
        searchId,
        propertyId,
        price: priceData.price,
        checkIn: priceData.check_in_date
      });
    } catch (error) {
      logger.error('Failed to save price', { 
        searchId, 
        propertyId, 
        error: error.message 
      });
      throw error;
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
   * Fecha conexão
   */
  async close() {
    if (this.connection) {
      await this.connection.end();
      logger.info('Database connection closed');
    }
  }
}

module.exports = DatabaseIntegration;