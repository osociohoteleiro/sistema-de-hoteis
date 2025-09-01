const db = require('../config/database');

class Hotel {
  constructor(data = {}) {
    this.id = data.id;
    this.uuid = data.uuid;
    this.name = data.name;
    this.checkin_time = data.checkin_time || '14:00:00';
    this.checkout_time = data.checkout_time || '12:00:00';
    this.cover_image = data.cover_image;
    this.description = data.description;
    this.address = data.address;
    this.phone = data.phone;
    this.email = data.email;
    this.website = data.website;
    this.status = data.status || 'ACTIVE';
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async findById(id) {
    const result = await db.query('SELECT * FROM hotels WHERE id = ?', [id]);
    return result.length > 0 ? new Hotel(result[0]) : null;
  }

  static async findByUuid(uuid) {
    const result = await db.query('SELECT * FROM hotels WHERE hotel_uuid = ?', [uuid]);
    return result.length > 0 ? new Hotel(result[0]) : null;
  }

  static async findAll(filters = {}) {
    let query = 'SELECT * FROM hotels WHERE 1=1';
    const params = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.search) {
      query += ' AND (name LIKE ? OR description LIKE ? OR address LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));
    }

    const result = await db.query(query, params);
    return result.map(row => new Hotel(row));
  }

  static async findByUser(userId, filters = {}) {
    let query = `
      SELECT h.*, uh.role, uh.permissions, uh.active as user_active
      FROM hotels h
      JOIN user_hotels uh ON h.id = uh.hotel_id
      WHERE uh.user_id = ? AND uh.active = true
    `;
    const params = [userId];

    if (filters.status) {
      query += ' AND h.status = ?';
      params.push(filters.status);
    }

    if (filters.role) {
      query += ' AND uh.role = ?';
      params.push(filters.role);
    }

    query += ' ORDER BY h.name';

    const result = await db.query(query, params);
    return result.map(row => {
      const hotel = new Hotel(row);
      hotel.user_role = row.role;
      hotel.user_permissions = row.permissions ? JSON.parse(row.permissions) : null;
      hotel.user_active = row.user_active;
      return hotel;
    });
  }

  async save() {
    if (this.id) {
      // Update existing hotel
      const result = await db.query(`
        UPDATE hotels SET 
        name = ?, checkin_time = ?, checkout_time = ?, cover_image = ?,
        description = ?, address = ?, phone = ?, email = ?, website = ?, status = ?
        WHERE id = ?
      `, [
        this.name, this.checkin_time, this.checkout_time, this.cover_image,
        this.description, this.address, this.phone, this.email, this.website,
        this.status, this.id
      ]);
      return result;
    } else {
      // Create new hotel
      const result = await db.query(`
        INSERT INTO hotels (name, checkin_time, checkout_time, cover_image, description, 
                           address, phone, email, website, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        this.name, this.checkin_time, this.checkout_time, this.cover_image,
        this.description, this.address, this.phone, this.email, this.website, this.status
      ]);
      
      this.id = result.insertId;
      
      // Get the generated UUID
      const newHotel = await Hotel.findById(this.id);
      this.uuid = newHotel.uuid;
      
      return result;
    }
  }

  async delete() {
    if (!this.id) {
      throw new Error('Cannot delete hotel without ID');
    }
    return await db.query('DELETE FROM hotels WHERE id = ?', [this.id]);
  }

  // Get hotel users
  async getUsers() {
    const result = await db.query(`
      SELECT u.id, u.uuid, u.name, u.email, u.user_type, u.active, u.email_verified,
             uh.role, uh.permissions, uh.active as hotel_active, uh.created_at as joined_at
      FROM users u
      JOIN user_hotels uh ON u.id = uh.user_id
      WHERE uh.hotel_id = ? AND uh.active = true
      ORDER BY uh.role, u.name
    `, [this.id]);
    
    return result.map(row => ({
      ...row,
      permissions: row.permissions ? JSON.parse(row.permissions) : null
    }));
  }

  // Add user to hotel
  async addUser(userId, role = 'STAFF', permissions = null) {
    return await db.query(
      'INSERT INTO user_hotels (user_id, hotel_id, role, permissions) VALUES (?, ?, ?, ?)',
      [userId, this.id, role, permissions ? JSON.stringify(permissions) : null]
    );
  }

  // Remove user from hotel
  async removeUser(userId) {
    return await db.query(
      'DELETE FROM user_hotels WHERE user_id = ? AND hotel_id = ?',
      [userId, this.id]
    );
  }

  // Update user role/permissions
  async updateUserRole(userId, role, permissions = null) {
    return await db.query(
      'UPDATE user_hotels SET role = ?, permissions = ? WHERE user_id = ? AND hotel_id = ?',
      [role, permissions ? JSON.stringify(permissions) : null, userId, this.id]
    );
  }

  // Get hotel configurations
  async getConfigs() {
    const result = await db.query(
      'SELECT * FROM app_config WHERE hotel_id = ? ORDER BY config_key',
      [this.id]
    );
    
    return result.map(config => ({
      ...config,
      config_value: this.parseConfigValue(config.config_value, config.config_type)
    }));
  }

  // Set hotel configuration
  async setConfig(key, value, type = 'STRING', description = null) {
    const serializedValue = this.serializeConfigValue(value, type);
    
    const result = await db.query(`
      INSERT INTO app_config (hotel_id, config_key, config_value, config_type, description) 
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
      config_value = VALUES(config_value), 
      config_type = VALUES(config_type),
      description = VALUES(description)
    `, [this.id, key, serializedValue, type, description]);
    
    return result;
  }

  // Get hotel API endpoints
  async getApiEndpoints() {
    return await db.query(
      'SELECT * FROM api_endpoints WHERE hotel_id = ? AND active = true ORDER BY endpoint_name',
      [this.id]
    );
  }

  // AI Knowledge methods
  async getKnowledge(category = null) {
    let query = 'SELECT * FROM ai_knowledge WHERE hotel_id = ? AND active = true';
    const params = [this.id];
    
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY priority DESC, created_at DESC';
    
    return await db.query(query, params);
  }

  async addKnowledge(question, answer, category = null, priority = 0) {
    return await db.query(
      'INSERT INTO ai_knowledge (hotel_id, question, answer, category, priority) VALUES (?, ?, ?, ?, ?)',
      [this.id, question, answer, category, priority]
    );
  }

  // Bot Fields methods
  async getBotFields() {
    return await db.query(
      'SELECT * FROM bot_fields WHERE hotel_id = ? AND active = true ORDER BY category, field_key',
      [this.id]
    );
  }

  async setBotField(key, value, type = 'STRING', category = null, description = null) {
    const result = await db.query(`
      INSERT INTO bot_fields (hotel_id, field_key, field_value, field_type, category, description) 
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
      field_value = VALUES(field_value), 
      field_type = VALUES(field_type),
      category = VALUES(category),
      description = VALUES(description)
    `, [this.id, key, value, type, category, description]);
    
    return result;
  }

  // Utility methods
  parseConfigValue(value, type) {
    switch (type) {
      case 'JSON':
        return JSON.parse(value || '{}');
      case 'BOOLEAN':
        return value === 'true' || value === '1' || value === 1;
      case 'NUMBER':
        return parseFloat(value) || 0;
      default:
        return value;
    }
  }

  serializeConfigValue(value, type) {
    switch (type) {
      case 'JSON':
        return JSON.stringify(value);
      case 'BOOLEAN':
        return value ? '1' : '0';
      case 'NUMBER':
        return value.toString();
      default:
        return value;
    }
  }
}

module.exports = Hotel;