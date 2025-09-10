const db = require('../config/database');
const bcrypt = require('bcryptjs');
// Fixed uuid column references

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
    const result = await db.query('SELECT * FROM users WHERE uuid = $1', [uuid]);
    return result.length > 0 ? new User(result[0]) : null;
  }

  static async findByEmail(email) {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.length > 0 ? new User(result[0]) : null;
  }

  static async findAll(filters = {}) {
    let query = 'SELECT * FROM users WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (filters.user_type) {
      if (Array.isArray(filters.user_type)) {
        // Se for array, usar IN clause
        const placeholders = filters.user_type.map((_, index) => `$${paramCount + index}`).join(', ');
        query += ` AND user_type IN (${placeholders})`;
        filters.user_type.forEach(type => params.push(type));
        paramCount += filters.user_type.length;
      } else {
        // Se for string, usar = clause
        query += ` AND user_type = $${paramCount}`;
        params.push(filters.user_type);
        paramCount++;
      }
    }

    if (filters.active !== undefined) {
      query += ` AND active = $${paramCount}`;
      params.push(filters.active);
      paramCount++;
    }

    if (filters.search) {
      query += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount + 1})`;
      params.push(`%${filters.search}%`, `%${filters.search}%`);
      paramCount += 2;
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ` LIMIT $${paramCount}`;
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
         name = $1, email = $2, user_type = $3, active = $4, email_verified = $5
         WHERE id = $6`,
        [this.name, this.email, this.user_type, this.active, this.email_verified, this.id]
      );
      return result;
    } else {
      // Create new user - Generate UUID and return new user data
      const result = await db.query(
        `INSERT INTO users (uuid, name, email, password_hash, user_type, active, email_verified) 
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6) RETURNING *`,
        [this.name, this.email, this.password_hash, this.user_type, this.active, this.email_verified]
      );
      
      if (result && result.length > 0) {
        const newUser = result[0];
        this.id = newUser.id;
        this.uuid = newUser.uuid;
      }
      
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
    return await db.query('DELETE FROM users WHERE id = $1', [this.id]);
  }

  // Get user hotels
  async getHotels() {
    const result = await db.query(`
      SELECT h.id, h.id as hotel_uuid, h.name as hotel_nome, h.created_at as hotel_criado_em, 
             h.cover_image as hotel_capa, h.checkin_time as hora_checkin, h.checkout_time as hora_checkout, 
             uh.role, uh.permissions, uh.active as user_active
      FROM hotels h
      JOIN user_hotels uh ON h.id = uh.hotel_id
      WHERE uh.user_id = $1 AND uh.active = true
      ORDER BY h.name
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

  // Get user permissions
  async getPermissions() {
    try {
      const result = await db.query(
        'SELECT permission FROM user_permissions WHERE user_id = $1',
        [this.id]
      );
      return result.map(row => row.permission);
    } catch (error) {
      console.error('Erro ao buscar permissões do usuário:', error);
      return [];
    }
  }

  // Set user permissions (replace all existing permissions)
  async setPermissions(permissions) {
    try {
      // Iniciar transação
      await db.query('BEGIN');

      // Remover todas as permissões existentes
      await db.query('DELETE FROM user_permissions WHERE user_id = $1', [this.id]);

      // Adicionar novas permissões
      if (permissions && permissions.length > 0) {
        for (const permission of permissions) {
          await db.query(
            'INSERT INTO user_permissions (user_id, permission) VALUES ($1, $2)',
            [this.id, permission]
          );
        }
      }

      // Confirmar transação
      await db.query('COMMIT');
      return true;
    } catch (error) {
      // Desfazer transação em caso de erro
      await db.query('ROLLBACK');
      console.error('Erro ao definir permissões do usuário:', error);
      throw error;
    }
  }

  toJSON() {
    const user = { ...this };
    delete user.password_hash; // Never expose password hash
    return user;
  }
}

module.exports = User;