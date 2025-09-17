const db = require('../config/database');

class RateShopperSearch {
  constructor(data = {}) {
    this.id = data.id;
    this.uuid = data.uuid; // Removido search_uuid que não existe
    this.hotel_id = data.hotel_id;
    this.property_id = data.property_id;
    this.search_type = data.search_type || 'MANUAL';
    this.start_date = data.start_date;
    this.end_date = data.end_date;
    this.status = data.status || 'PENDING';
    this.total_dates = data.total_dates || 0;
    this.processed_dates = data.processed_dates || 0;
    this.total_prices_found = data.total_prices_found || 0;
    this.error_log = data.error_log;
    this.started_at = data.started_at;
    this.completed_at = data.completed_at;
    this.duration_seconds = data.duration_seconds || 0;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;

    // Novos campos para pause/resume
    this.last_processed_date = data.last_processed_date;
    this.pause_checkpoint = data.pause_checkpoint;
    this.paused_at = data.paused_at;
    this.pause_reason = data.pause_reason;
  }

  static async findById(id) {
    try {
      if (!id) {
        console.error('❌ findById: ID é obrigatório');
        return null;
      }

      console.log(`🔍 Buscando search por ID: ${id}`);
      const result = await db.query('SELECT * FROM rate_shopper_searches WHERE id = $1', [id]);
      
      // Normalizar acesso aos dados (compatibilidade entre diferentes versões do driver)
      const rows = result.rows || result;

      if (rows && rows.length > 0) {
        console.log(`✅ Search ${id} encontrada`);
        return new RateShopperSearch(rows[0]);
      } else {
        console.log(`⚠️ Search ${id} não encontrada`);
        return null;
      }
    } catch (error) {
      console.error(`❌ Erro ao buscar search ${id}:`, error);
      throw error;
    }
  }

  static async findByUuid(uuid) {
    const result = await db.query('SELECT * FROM rate_shopper_searches WHERE id = $1', [uuid]); // Usando ID em vez de UUID
    return result.length > 0 ? new RateShopperSearch(result[0]) : null;
  }

  static async findByHotel(hotelId, filters = {}) {
    let query = `
      SELECT rs.*, rsp.property_name, rsp.is_main_property, rsp.platform
      FROM rate_shopper_searches rs
      LEFT JOIN rate_shopper_properties rsp ON rs.property_id = rsp.id
      WHERE rs.hotel_id = $1
    `;
    const params = [hotelId];
    let paramIndex = 2;

    if (filters.status) {
      query += ` AND rs.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.search_type) {
      query += ` AND rs.search_type = $${paramIndex}`;
      params.push(filters.search_type);
      paramIndex++;
    }

    if (filters.property_id) {
      query += ` AND rs.property_id = $${paramIndex}`;
      params.push(filters.property_id);
      paramIndex++;
    }

    query += ' ORDER BY rs.created_at DESC';

    if (filters.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(filters.limit);
    }

    const result = await db.query(query, params);
    const rows = result.rows || result;
    return rows.map(row => {
      const search = new RateShopperSearch(row);
      search.property_name = row.property_name;
      search.is_main_property = row.is_main_property;
      search.platform = row.platform;
      return search;
    });
  }

  static async findRunning() {
    const result = await db.query(`
      SELECT rs.*, rsp.property_name, h.name as hotel_name
      FROM rate_shopper_searches rs
      LEFT JOIN rate_shopper_properties rsp ON rs.property_id = rsp.id
      LEFT JOIN hotels h ON rs.hotel_id = h.id
      WHERE rs.status IN ('PENDING', 'RUNNING')
      ORDER BY rs.created_at
    `);

    const rows = result.rows || result;
    return rows.map(row => {
      const search = new RateShopperSearch(row);
      search.property_name = row.property_name;
      search.hotel_name = row.hotel_name;
      return search;
    });
  }

  async save() {
    if (this.id) {
      // Update existing search
      const result = await db.query(`
        UPDATE rate_shopper_searches SET
        status = $1, total_dates = $2, processed_dates = $3, total_prices_found = $4,
        error_log = $5, started_at = $6, completed_at = $7, duration_seconds = $8,
        last_processed_date = $9, pause_checkpoint = $10, paused_at = $11, pause_reason = $12,
        updated_at = NOW()
        WHERE id = $13
      `, [
        this.status, this.total_dates, this.processed_dates, this.total_prices_found,
        this.error_log, this.started_at, this.completed_at, this.duration_seconds,
        this.last_processed_date,
        this.pause_checkpoint ? JSON.stringify(this.pause_checkpoint) : null,
        this.paused_at, this.pause_reason, this.id
      ]);
      return result;
    } else {
      // Create new search
      const result = await db.query(`
        INSERT INTO rate_shopper_searches (
          hotel_id, property_id, search_type, start_date, end_date,
          status, total_dates
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [
        this.hotel_id, this.property_id, this.search_type, this.start_date,
        this.end_date, this.status, this.total_dates
      ]);

      if (result && result.length > 0 && result[0]) {
        this.id = result[0].id;
        this.uuid = null; // UUID não é necessário para searches
      } else {
        throw new Error('Failed to create search: No result returned from database');
      }

      return result;
    }
  }

  // Update search status
  async updateStatus(status, additionalData = {}) {
    this.status = status;

    if (status === 'RUNNING' && !this.started_at) {
      this.started_at = new Date();
    }

    if (status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED') {
      this.completed_at = new Date();
      if (this.started_at) {
        this.duration_seconds = Math.round((this.completed_at - new Date(this.started_at)) / 1000);
      }
    }

    if (status === 'PAUSED') {
      this.paused_at = new Date();
    }

    // Update additional fields if provided
    Object.assign(this, additionalData);

    await this.save();
  }

  // Update progress during extraction
  async updateProgress(processedDates, totalPricesFound = null) {
    try {
      // Validar parâmetros de entrada
      if (processedDates === null || processedDates === undefined) {
        throw new Error('processedDates é obrigatório');
      }

      if (!this.id) {
        throw new Error('Search ID é obrigatório para atualizar progresso');
      }

      this.processed_dates = processedDates;
      
      if (totalPricesFound !== null) {
        this.total_prices_found = totalPricesFound;
      }

      console.log(`📊 Atualizando progresso search ${this.id}: processed_dates=${this.processed_dates}, total_prices_found=${this.total_prices_found}`);

      // Update only progress-related fields for efficiency
      const result = await db.query(`
        UPDATE rate_shopper_searches SET 
        processed_dates = $1, 
        total_prices_found = $2,
        updated_at = NOW()
        WHERE id = $3
      `, [this.processed_dates, this.total_prices_found, this.id]);
      
      // Verificar se a atualização foi bem-sucedida
      let affectedRows = 0;
      
      // Diferentes drivers PostgreSQL retornam rowCount de maneiras diferentes
      if (typeof result.rowCount !== 'undefined') {
        affectedRows = result.rowCount;
      } else if (typeof result.affectedRows !== 'undefined') {
        affectedRows = result.affectedRows;
      } else if (result.rows && Array.isArray(result.rows)) {
        affectedRows = result.rows.length;
      } else if (typeof result === 'number') {
        affectedRows = result;
      } else {
        // Se não conseguir determinar, assumir que funcionou (evitar falso negativo)
        console.warn(`⚠️ Não foi possível determinar rowCount para search ${this.id}. Assumindo sucesso.`);
        affectedRows = 1;
      }
      
      console.log(`📊 UpdateProgress result details:`, {
        search_id: this.id,
        result_type: typeof result,
        result_keys: Object.keys(result),
        rowCount: result.rowCount,
        affectedRows: result.affectedRows,
        calculated_affected_rows: affectedRows
      });
      
      if (affectedRows === 0) {
        throw new Error(`Nenhuma linha foi atualizada para search_id ${this.id}. A busca pode não existir.`);
      }

      console.log(`✅ Progresso atualizado com sucesso para search ${this.id} - ${affectedRows} linha(s) afetada(s)`);
      
      return result;
    } catch (error) {
      console.error(`❌ Erro ao atualizar progresso da search ${this.id}:`, error);
      console.error('Detalhes:', {
        search_id: this.id,
        processed_dates: processedDates,
        total_prices_found: totalPricesFound,
        error_message: error.message
      });
      throw error;
    }
  }

  // Calculate progress percentage
  getProgressPercentage() {
    if (this.total_dates === 0) return 0;
    return Math.round((this.processed_dates / this.total_dates) * 100);
  }

  // Get estimated time remaining
  getEstimatedTimeRemaining() {
    if (this.status !== 'RUNNING' || !this.started_at || this.processed_dates === 0) {
      return null;
    }

    const elapsed = (Date.now() - new Date(this.started_at).getTime()) / 1000;
    const averageTimePerDate = elapsed / this.processed_dates;
    const remainingDates = this.total_dates - this.processed_dates;
    const estimatedSeconds = Math.round(remainingDates * averageTimePerDate);

    return {
      seconds: estimatedSeconds,
      minutes: Math.round(estimatedSeconds / 60),
      formatted: this.formatDuration(estimatedSeconds)
    };
  }

  // Format duration in human readable format
  formatDuration(seconds) {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  }

  // Get prices found in this search
  async getPrices(filters = {}) {
    let query = `
      SELECT * FROM rate_shopper_prices 
      WHERE search_id = $1
    `;
    const params = [this.id];
    let paramIndex = 2;

    if (filters.date_from) {
      query += ` AND check_in_date >= $${paramIndex}`;
      params.push(filters.date_from);
      paramIndex++;
    }

    if (filters.date_to) {
      query += ` AND check_in_date <= $${paramIndex}`;
      params.push(filters.date_to);
    }

    query += ' ORDER BY check_in_date, price';

    return await db.query(query, params);
  }

  // Get search statistics
  async getStatistics() {
    const stats = await db.query(`
      SELECT 
        COUNT(*) as total_prices,
        AVG(price) as avg_price,
        MIN(price) as min_price,
        MAX(price) as max_price,
        COUNT(DISTINCT check_in_date) as unique_dates,
        COUNT(CASE WHEN availability_status = 'AVAILABLE' THEN 1 END) as available_count,
        COUNT(CASE WHEN is_bundle = TRUE THEN 1 END) as bundle_count
      FROM rate_shopper_prices 
      WHERE search_id = $1
    `, [this.id]);

    return stats[0] || {};
  }

  // Cancel search
  async cancel(reason = 'Cancelled by user') {
    if (this.status === 'COMPLETED' || this.status === 'FAILED') {
      throw new Error('Cannot cancel completed or failed search');
    }

    await this.updateStatus('CANCELLED', {
      error_log: reason
    });
  }

  // Pause search with checkpoint
  async pause(checkpointData = {}, reason = 'MANUAL_USER') {
    if (this.status !== 'RUNNING') {
      throw new Error('Can only pause running searches');
    }

    // Determinar última data processada baseada no progresso atual
    let lastProcessedDate = null;
    if (this.processed_dates > 0 && this.start_date) {
      const startDate = new Date(this.start_date);
      lastProcessedDate = new Date(startDate.getTime() + (this.processed_dates - 1) * 24 * 60 * 60 * 1000);
    }

    await this.updateStatus('PAUSED', {
      last_processed_date: lastProcessedDate,
      pause_checkpoint: checkpointData,
      paused_at: new Date(),
      pause_reason: reason
    });
  }

  // Resume paused search
  async resume() {
    if (this.status !== 'PAUSED') {
      throw new Error('Can only resume paused searches');
    }

    await this.updateStatus('RUNNING', {
      started_at: new Date() // Atualizar started_at para o momento do resume
      // Manter pause_checkpoint e last_processed_date para referência
    });
  }

  // Get resume information
  getResumeInfo() {
    if (this.status !== 'PAUSED') {
      return null;
    }

    const totalDays = this.total_dates || 0;
    const processedDays = this.processed_dates || 0;
    const remainingDays = totalDays - processedDays;

    return {
      canResume: true,
      lastProcessedDate: this.last_processed_date,
      pausedAt: this.paused_at,
      pauseReason: this.pause_reason,
      checkpoint: this.pause_checkpoint,
      progressInfo: {
        totalDays,
        processedDays,
        remainingDays,
        progressPercentage: totalDays > 0 ? Math.round((processedDays / totalDays) * 100) : 0
      }
    };
  }

  // Check if search can be paused
  canBePaused() {
    return this.status === 'RUNNING';
  }

  // Check if search can be resumed
  canBeResumed() {
    return this.status === 'PAUSED';
  }

  // Retry failed search
  async retry() {
    if (this.status !== 'FAILED') {
      throw new Error('Can only retry failed searches');
    }

    await this.updateStatus('PENDING', {
      error_log: null,
      started_at: null,
      completed_at: null,
      duration_seconds: 0,
      processed_dates: 0,
      total_prices_found: 0
    });
  }

  // Create search from property
  static async createFromProperty(propertyId, dateRange, searchType = 'MANUAL') {
    const RateShopperProperty = require('./RateShopperProperty');
    const property = await RateShopperProperty.findById(propertyId);
    
    if (!property) {
      throw new Error('Property not found');
    }

    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    
    // Calculate total dates
    const totalDates = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    const search = new RateShopperSearch({
      hotel_id: property.hotel_id,
      property_id: propertyId,
      search_type: searchType,
      start_date: startDate,
      end_date: endDate,
      status: 'PENDING',
      total_dates: totalDates
    });

    await search.save();
    return search;
  }

  // Validate search data
  validate() {
    const errors = [];

    if (!this.hotel_id) {
      errors.push('Hotel ID is required');
    }

    if (!this.start_date || !this.end_date) {
      errors.push('Start and end dates are required');
    }

    if (this.start_date && this.end_date && new Date(this.start_date) >= new Date(this.end_date)) {
      errors.push('Start date must be before end date');
    }

    const maxDays = 365; // Maximum 1 year range
    if (this.start_date && this.end_date) {
      const days = Math.ceil((new Date(this.end_date) - new Date(this.start_date)) / (1000 * 60 * 60 * 24));
      if (days > maxDays) {
        errors.push(`Date range cannot exceed ${maxDays} days`);
      }
    }

    return errors;
  }

  // Convert to JSON
  toJSON() {
    const json = {
      id: this.id,
      uuid: this.uuid,
      hotel_id: this.hotel_id,
      property_id: this.property_id,
      search_type: this.search_type,
      start_date: this.start_date,
      end_date: this.end_date,
      status: this.status,
      total_dates: this.total_dates,
      processed_dates: this.processed_dates,
      total_prices_found: this.total_prices_found,
      progress_percentage: this.getProgressPercentage(),
      duration_seconds: this.duration_seconds,
      duration_formatted: this.duration_seconds ? this.formatDuration(this.duration_seconds) : null,
      error_log: this.error_log,
      started_at: this.started_at,
      completed_at: this.completed_at,
      created_at: this.created_at,
      updated_at: this.updated_at,

      // Campos de pause/resume
      last_processed_date: this.last_processed_date,
      pause_checkpoint: this.pause_checkpoint,
      paused_at: this.paused_at,
      pause_reason: this.pause_reason,

      // Flags de controle
      can_be_paused: this.canBePaused(),
      can_be_resumed: this.canBeResumed()
    };

    // Include property_name if available (from JOINs)
    if (this.property_name) {
      json.property_name = this.property_name;
    }

    // Include hotel_name if available (from JOINs)
    if (this.hotel_name) {
      json.hotel_name = this.hotel_name;
    }

    // Include platform if available (from JOINs)
    if (this.platform) {
      json.platform = this.platform;
    }

    // Add estimated time remaining if running
    if (this.status === 'RUNNING') {
      json.estimated_time_remaining = this.getEstimatedTimeRemaining();
    }

    // Add resume information if paused
    if (this.status === 'PAUSED') {
      json.resume_info = this.getResumeInfo();
    }

    return json;
  }
}

module.exports = RateShopperSearch;