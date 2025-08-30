const db = require('../config/database');

class Config {
  constructor(data = {}) {
    this.id = data.id;
    this.hotel_id = data.hotel_id;
    this.config_key = data.config_key;
    this.config_value = data.config_value;
    this.config_type = data.config_type || 'STRING';
    this.description = data.description;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async findByKey(key, hotelId = null) {
    const result = await db.query(
      'SELECT * FROM app_config WHERE config_key = ? AND hotel_id = ?',
      [key, hotelId]
    );
    return result.length > 0 ? new Config(result[0]) : null;
  }

  static async findAllByHotel(hotelId) {
    const result = await db.query(
      'SELECT * FROM app_config WHERE hotel_id = ? ORDER BY config_key',
      [hotelId]
    );
    return result.map(row => new Config(row));
  }

  static async findGlobal() {
    const result = await db.query(
      'SELECT * FROM app_config WHERE hotel_id IS NULL ORDER BY config_key'
    );
    return result.map(row => new Config(row));
  }

  static async getValue(key, hotelId = null, defaultValue = null) {
    const config = await Config.findByKey(key, hotelId);
    if (!config) return defaultValue;
    
    return config.parsedValue;
  }

  static async setValue(key, value, type = 'STRING', hotelId = null, description = null) {
    const serializedValue = Config.serializeValue(value, type);
    
    const result = await db.query(`
      INSERT INTO app_config (hotel_id, config_key, config_value, config_type, description) 
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
      config_value = VALUES(config_value), 
      config_type = VALUES(config_type),
      description = VALUES(description)
    `, [hotelId, key, serializedValue, type, description]);
    
    return result;
  }

  static async delete(key, hotelId = null) {
    return await db.query(
      'DELETE FROM app_config WHERE config_key = ? AND hotel_id = ?',
      [key, hotelId]
    );
  }

  get parsedValue() {
    return Config.parseValue(this.config_value, this.config_type);
  }

  async save() {
    if (this.id) {
      // Update existing config
      const result = await db.query(`
        UPDATE app_config SET 
        config_value = ?, config_type = ?, description = ?
        WHERE id = ?
      `, [this.config_value, this.config_type, this.description, this.id]);
      return result;
    } else {
      // Create new config
      const result = await db.query(`
        INSERT INTO app_config (hotel_id, config_key, config_value, config_type, description) 
        VALUES (?, ?, ?, ?, ?)
      `, [this.hotel_id, this.config_key, this.config_value, this.config_type, this.description]);
      
      this.id = result.insertId;
      return result;
    }
  }

  async delete() {
    if (!this.id) {
      throw new Error('Cannot delete config without ID');
    }
    return await db.query('DELETE FROM app_config WHERE id = ?', [this.id]);
  }

  static parseValue(value, type) {
    if (value === null || value === undefined) return null;
    
    switch (type) {
      case 'JSON':
        try {
          return JSON.parse(value);
        } catch (e) {
          return {};
        }
      case 'BOOLEAN':
        return value === 'true' || value === '1' || value === 1 || value === true;
      case 'NUMBER':
        return parseFloat(value) || 0;
      default:
        return value;
    }
  }

  static serializeValue(value, type) {
    switch (type) {
      case 'JSON':
        return JSON.stringify(value);
      case 'BOOLEAN':
        return value ? '1' : '0';
      case 'NUMBER':
        return value.toString();
      default:
        return value ? value.toString() : '';
    }
  }
}

class ApiEndpoint {
  constructor(data = {}) {
    this.id = data.id;
    this.hotel_id = data.hotel_id;
    this.endpoint_name = data.endpoint_name;
    this.url = data.url;
    this.method = data.method || 'GET';
    this.headers = data.headers;
    this.active = data.active !== undefined ? data.active : true;
    this.description = data.description;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async findById(id) {
    const result = await db.query('SELECT * FROM api_endpoints WHERE id = ?', [id]);
    return result.length > 0 ? new ApiEndpoint(result[0]) : null;
  }

  static async findByName(name, hotelId = null) {
    const result = await db.query(
      'SELECT * FROM api_endpoints WHERE endpoint_name = ? AND hotel_id = ?',
      [name, hotelId]
    );
    return result.length > 0 ? new ApiEndpoint(result[0]) : null;
  }

  static async findAll(filters = {}) {
    let query = 'SELECT * FROM api_endpoints WHERE 1=1';
    const params = [];

    if (filters.hotel_id !== undefined) {
      query += ' AND hotel_id = ?';
      params.push(filters.hotel_id);
    }

    if (filters.active !== undefined) {
      query += ' AND active = ?';
      params.push(filters.active);
    }

    if (filters.method) {
      query += ' AND method = ?';
      params.push(filters.method);
    }

    query += ' ORDER BY endpoint_name';

    const result = await db.query(query, params);
    return result.map(row => new ApiEndpoint(row));
  }

  get parsedHeaders() {
    if (!this.headers) return {};
    return typeof this.headers === 'string' ? JSON.parse(this.headers) : this.headers;
  }

  set parsedHeaders(headers) {
    this.headers = JSON.stringify(headers);
  }

  async save() {
    // Ensure headers is JSON string
    if (typeof this.headers === 'object') {
      this.headers = JSON.stringify(this.headers);
    }

    if (this.id) {
      // Update existing endpoint
      const result = await db.query(`
        UPDATE api_endpoints SET 
        endpoint_name = ?, url = ?, method = ?, headers = ?, active = ?, description = ?
        WHERE id = ?
      `, [this.endpoint_name, this.url, this.method, this.headers, this.active, this.description, this.id]);
      return result;
    } else {
      // Create new endpoint
      const result = await db.query(`
        INSERT INTO api_endpoints (hotel_id, endpoint_name, url, method, headers, active, description) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [this.hotel_id, this.endpoint_name, this.url, this.method, this.headers, this.active, this.description]);
      
      this.id = result.insertId;
      return result;
    }
  }

  async delete() {
    if (!this.id) {
      throw new Error('Cannot delete endpoint without ID');
    }
    return await db.query('DELETE FROM api_endpoints WHERE id = ?', [this.id]);
  }

  async test() {
    // This method could be used to test the endpoint
    // Implementation would depend on requirements
    return {
      endpoint: this.endpoint_name,
      url: this.url,
      method: this.method,
      status: 'ready_to_test'
    };
  }
}

module.exports = {
  Config,
  ApiEndpoint
};