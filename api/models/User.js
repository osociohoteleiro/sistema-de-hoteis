const db = require('../config/database');
const bcrypt = require('bcryptjs');
const cacheService = require('../services/cacheService');
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
    const rows = result.rows || result;
    return rows.length > 0 ? new User(rows[0]) : null;
  }

  static async findByUuid(uuid) {
    const result = await db.query('SELECT * FROM users WHERE uuid = $1', [uuid]);
    const rows = result.rows || result;
    return rows.length > 0 ? new User(rows[0]) : null;
  }

  static async findByEmail(email) {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const rows = result.rows || result;
    return rows.length > 0 ? new User(rows[0]) : null;
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
      
      const rows = result.rows || result;
      if (rows && rows.length > 0) {
        const newUser = rows[0];
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

  // Get user hotels with cache
  async getHotels(useCache = true) {
    if (useCache) {
      const cached = await cacheService.getUserHotels(this.id);
      if (cached) {
        return cached;
      }
    }

    const result = await db.query(`
      SELECT
        h.id, h.hotel_uuid, h.name as hotel_nome, h.created_at as hotel_criado_em,
        h.cover_image as hotel_capa, h.checkin_time as hora_checkin, h.checkout_time as hora_checkout,
        h.status as hotel_status, h.description as hotel_description,
        uh.role, uh.permissions, uh.active as user_active,
        (SELECT COUNT(*) FROM workspaces w WHERE w.hotel_id = h.id AND w.active = true) as workspaces_count
      FROM hotels h
      JOIN user_hotels uh ON h.id = uh.hotel_id
      WHERE uh.user_id = $1 AND uh.active = true
      ORDER BY h.name
    `, [this.id]);

    const hotels = result.rows || result;

    // Cache por 5 minutos
    if (useCache && hotels.length > 0) {
      await cacheService.setUserHotels(this.id, hotels, 300);
    }

    return hotels;
  }

  // Add user to hotel
  async addToHotel(hotelId, role = 'STAFF', permissions = null) {
    const result = await db.query(
      'INSERT INTO user_hotels (user_id, hotel_id, role, permissions) VALUES ($1, $2, $3, $4)',
      [this.id, hotelId, role, permissions ? JSON.stringify(permissions) : null]
    );

    // Invalidar cache
    await cacheService.invalidateUserCache(this.id);
    await cacheService.invalidateHotelCache(hotelId);

    return result;
  }

  // Remove user from hotel
  async removeFromHotel(hotelId) {
    const result = await db.query(
      'DELETE FROM user_hotels WHERE user_id = $1 AND hotel_id = $2',
      [this.id, hotelId]
    );

    // Invalidar cache
    await cacheService.invalidateUserCache(this.id);
    await cacheService.invalidateHotelCache(hotelId);

    return result;
  }

  // Get user permissions
  async getPermissions() {
    try {
      const result = await db.query(
        'SELECT permission FROM user_permissions WHERE user_id = $1',
        [this.id]
      );
      const rows = result.rows || result;
      return rows.map(row => row.permission);
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

  // Lazy loading methods
  async loadHotelsDetailed(useCache = true) {
    if (this._hotels) return this._hotels;

    this._hotels = await this.getHotels(useCache);
    return this._hotels;
  }

  async loadWorkspaces(useCache = true) {
    if (this._workspaces) return this._workspaces;

    const cacheKey = `user:${this.id}:workspaces:lazy`;
    if (useCache) {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        this._workspaces = cached;
        return this._workspaces;
      }
    }

    // Carregar workspaces através dos hotéis do usuário
    const hotels = await this.getHotels(useCache);
    const Workspace = require('./Workspace');

    const allWorkspaces = [];
    for (const hotel of hotels) {
      const workspaces = await Workspace.findByHotel(hotel.id, { active: true }, useCache);
      allWorkspaces.push(...workspaces);
    }

    this._workspaces = allWorkspaces;

    if (useCache) {
      await cacheService.set(cacheKey, this._workspaces, 300);
    }

    return this._workspaces;
  }

  async loadPermissionsDetailed(useCache = true) {
    if (this._permissions) return this._permissions;

    const cacheKey = `user:${this.id}:permissions:lazy`;
    if (useCache) {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        this._permissions = cached;
        return this._permissions;
      }
    }

    this._permissions = await this.getPermissions();

    if (useCache) {
      await cacheService.set(cacheKey, this._permissions, 600); // Cache permissões por mais tempo
    }

    return this._permissions;
  }

  toJSON() {
    const user = { ...this };
    delete user.password_hash; // Never expose password hash

    // Include loaded relationships if available
    if (this._hotels) user.hotels = this._hotels;
    if (this._workspaces) user.workspaces = this._workspaces;
    if (this._permissions) user.permissions = this._permissions;

    return user;
  }
}

module.exports = User;