const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  constructor(data = {}) {
    this.id = data.id;
    this.uuid = data.user_uuid || data.uuid;
    this.name = data.name;
    this.email = data.email;
    this.password_hash = data.password_hash;
    this.user_type = data.user_type || 'HOTEL';
    this.active = data.active !== undefined ? data.active : true;
    this.email_verified = data.email_verified || false;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async findById(id) {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.length > 0 ? new User(result[0]) : null;
  }

  static async findByUuid(uuid) {
    const result = await db.query('SELECT * FROM users WHERE user_uuid = $1', [uuid]);
    return result.length > 0 ? new User(result[0]) : null;
  }

  static async findByEmail(email) {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.length > 0 ? new User(result[0]) : null;
  }

  static async findAll(filters = {}) {
    let query = 'SELECT * FROM users WHERE 1=1';
    const params = [];

    if (filters.user_type) {
      query += ' AND user_type = ?';
      params.push(filters.user_type);
    }

    if (filters.active !== undefined) {
      query += ' AND active = ?';
      params.push(filters.active);
    }

    if (filters.search) {
      query += ' AND (name LIKE ? OR email LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));
    }

    const result = await db.query(query, params);
    return result.map(row => new User(row));
  }

  async save() {
    if (this.id) {
      // Update existing user
      const result = await db.query(
        `UPDATE users SET 
         name = ?, email = ?, user_type = ?, active = ?, email_verified = ?
         WHERE id = ?`,
        [this.name, this.email, this.user_type, this.active, this.email_verified, this.id]
      );
      return result;
    } else {
      // Create new user
      const result = await db.query(
        `INSERT INTO users (name, email, password_hash, user_type, active, email_verified) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [this.name, this.email, this.password_hash, this.user_type, this.active, this.email_verified]
      );
      this.id = result.insertId;
      
      // Get the generated UUID
      const newUser = await User.findById(this.id);
      this.uuid = newUser.uuid;
      
      return result;
    }
  }

  async setPassword(plainPassword) {
    const salt = await bcrypt.genSalt(12);
    this.password_hash = await bcrypt.hash(plainPassword, salt);
  }

  async validatePassword(plainPassword) {
    return await bcrypt.compare(plainPassword, this.password_hash);
  }

  async delete() {
    if (!this.id) {
      throw new Error('Cannot delete user without ID');
    }
    return await db.query('DELETE FROM users WHERE id = ?', [this.id]);
  }

  // Get user hotels
  async getHotels() {
    const result = await db.query(`
      SELECT h.id, h.hotel_uuid, h.hotel_nome, h.hotel_criado_em, h.hotel_capa, 
             h.hora_checkin, h.hora_checkout, uh.role, uh.permissions, uh.active as user_active
      FROM hotels h
      JOIN user_hotels uh ON h.id = uh.hotel_id
      WHERE uh.user_id = ? AND uh.active = true
      ORDER BY h.hotel_nome
    `, [this.id]);
    
    return result;
  }

  // Add user to hotel
  async addToHotel(hotelId, role = 'STAFF', permissions = null) {
    return await db.query(
      'INSERT INTO user_hotels (user_id, hotel_id, role, permissions) VALUES (?, ?, ?, ?)',
      [this.id, hotelId, role, permissions ? JSON.stringify(permissions) : null]
    );
  }

  // Remove user from hotel
  async removeFromHotel(hotelId) {
    return await db.query(
      'DELETE FROM user_hotels WHERE user_id = ? AND hotel_id = ?',
      [this.id, hotelId]
    );
  }

  toJSON() {
    const user = { ...this };
    delete user.password_hash; // Never expose password hash
    return user;
  }
}

module.exports = User;