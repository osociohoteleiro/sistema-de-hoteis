const db = require('../config/database');
const cacheService = require('../services/cacheService');

class Workspace {
  constructor(data = {}) {
    this.id = data.id;
    this.workspace_uuid = data.uuid || data.workspace_uuid;
    this.hotel_id = data.hotel_id;
    this.hotel_uuid = data.hotel_uuid;
    this.name = data.name;
    this.description = data.description;
    this.settings = data.settings;
    this.active = data.active !== undefined ? data.active : true;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async findById(id) {
    const result = await db.query('SELECT * FROM workspaces WHERE id = $1', [id]);
    return result.length > 0 ? new Workspace(result[0]) : null;
  }

  static async findByUuid(uuid) {
    const result = await db.query('SELECT * FROM workspaces WHERE uuid = $1', [uuid]);
    return result.length > 0 ? new Workspace(result[0]) : null;
  }

  static async findAll(filters = {}) {
    let query = `
      SELECT
        w.*,
        h.name as hotel_nome,
        h.hotel_uuid as hotel_uuid_full,
        h.status as hotel_status,
        (SELECT COUNT(*) FROM bots b WHERE b.workspace_id = w.id AND b.active = true) as bots_count,
        (SELECT COUNT(*) FROM workspace_instances wi WHERE wi.workspace_uuid = w.uuid) as instances_count
      FROM workspaces w
      LEFT JOIN hotels h ON w.hotel_id = h.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (filters.active !== undefined) {
      paramCount++;
      query += ` AND w.active = $${paramCount}`;
      params.push(filters.active);
    }

    if (filters.hotel_id) {
      paramCount++;
      query += ` AND w.hotel_id = $${paramCount}`;
      params.push(filters.hotel_id);
    }

    if (filters.hotel_uuid) {
      paramCount++;
      query += ` AND w.hotel_uuid = $${paramCount}`;
      params.push(filters.hotel_uuid);
    }

    if (filters.search) {
      paramCount++;
      const searchParam1 = paramCount;
      paramCount++;
      const searchParam2 = paramCount;
      paramCount++;
      const searchParam3 = paramCount;
      query += ` AND (w.name ILIKE $${searchParam1} OR w.description ILIKE $${searchParam2} OR h.name ILIKE $${searchParam3})`;
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY w.created_at DESC';

    if (filters.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(parseInt(filters.limit));
    }

    const result = await db.query(query, params);
    return result.map(row => {
      const workspace = new Workspace(row);
      workspace.hotel_nome = row.hotel_nome;
      workspace.hotel_status = row.hotel_status;
      workspace.bots_count = parseInt(row.bots_count) || 0;
      workspace.instances_count = parseInt(row.instances_count) || 0;
      return workspace;
    });
  }

  static async findByHotel(hotelId, filters = {}, useCache = true) {
    const cacheKey = `hotel:${hotelId}:workspaces:${JSON.stringify(filters)}`;

    if (useCache) {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return cached.map(data => {
          const workspace = new Workspace(data);
          workspace.hotel_nome = data.hotel_nome;
          workspace.hotel_status = data.hotel_status;
          workspace.bots_count = data.bots_count;
          workspace.instances_count = data.instances_count;
          return workspace;
        });
      }
    }

    let query = `
      SELECT
        w.*,
        h.name as hotel_nome,
        h.hotel_uuid as hotel_uuid_full,
        h.status as hotel_status,
        (SELECT COUNT(*) FROM bots b WHERE b.workspace_id = w.id AND b.active = true) as bots_count,
        (SELECT COUNT(*) FROM workspace_instances wi WHERE wi.workspace_uuid = w.uuid) as instances_count
      FROM workspaces w
      LEFT JOIN hotels h ON w.hotel_id = h.id
      WHERE w.hotel_id = $1
    `;
    const params = [hotelId];
    let paramCount = 1;

    if (filters.active !== undefined) {
      paramCount++;
      query += ` AND w.active = $${paramCount}`;
      params.push(filters.active);
    }

    if (filters.search) {
      paramCount++;
      const searchParam1 = paramCount;
      paramCount++;
      const searchParam2 = paramCount;
      query += ` AND (w.name ILIKE $${searchParam1} OR w.description ILIKE $${searchParam2})`;
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY w.created_at DESC';

    const result = await db.query(query, params);
    const workspaces = result.map(row => {
      const workspace = new Workspace(row);
      workspace.hotel_nome = row.hotel_nome;
      workspace.hotel_status = row.hotel_status;
      workspace.bots_count = parseInt(row.bots_count) || 0;
      workspace.instances_count = parseInt(row.instances_count) || 0;
      return workspace;
    });

    // Cache por 5 minutos
    if (useCache && workspaces.length > 0) {
      await cacheService.set(cacheKey, workspaces.map(w => w.toJSON()), 300);
    }

    return workspaces;
  }

  static async findByHotelUuid(hotelUuid, filters = {}) {
    let query = `
      SELECT
        w.*,
        h.name as hotel_nome,
        h.hotel_uuid as hotel_uuid_full,
        h.status as hotel_status,
        (SELECT COUNT(*) FROM bots b WHERE b.workspace_id = w.id AND b.active = true) as bots_count,
        (SELECT COUNT(*) FROM workspace_instances wi WHERE wi.workspace_uuid = w.uuid) as instances_count
      FROM workspaces w
      LEFT JOIN hotels h ON w.hotel_id = h.id
      WHERE w.hotel_uuid = $1
    `;
    const params = [hotelUuid];
    let paramCount = 1;

    if (filters.active !== undefined) {
      paramCount++;
      query += ` AND w.active = $${paramCount}`;
      params.push(filters.active);
    }

    if (filters.search) {
      paramCount++;
      const searchParam1 = paramCount;
      paramCount++;
      const searchParam2 = paramCount;
      query += ` AND (w.name ILIKE $${searchParam1} OR w.description ILIKE $${searchParam2})`;
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY w.created_at DESC';

    const result = await db.query(query, params);
    return result.map(row => {
      const workspace = new Workspace(row);
      workspace.hotel_nome = row.hotel_nome;
      workspace.hotel_status = row.hotel_status;
      workspace.bots_count = parseInt(row.bots_count) || 0;
      workspace.instances_count = parseInt(row.instances_count) || 0;
      return workspace;
    });
  }

  async save() {
    if (this.id) {
      // Update existing workspace
      const result = await db.query(`
        UPDATE workspaces SET
        name = $1, description = $2, settings = $3, active = $4
        WHERE id = $5
      `, [
        this.name,
        this.description,
        this.settings ? JSON.stringify(this.settings) : null,
        this.active,
        this.id
      ]);

      // Invalidar cache
      await cacheService.invalidateWorkspaceCache(this.id, this.workspace_uuid);
      await cacheService.invalidateHotelCache(this.hotel_id);

      return result;
    } else {
      // Create new workspace
      const result = await db.query(`
        INSERT INTO workspaces (hotel_id, hotel_uuid, name, description, settings, active)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        this.hotel_id,
        this.hotel_uuid,
        this.name,
        this.description,
        this.settings ? JSON.stringify(this.settings) : null,
        this.active
      ]);

      this.id = result.insertId;

      // Get the generated UUID
      const newWorkspace = await Workspace.findById(this.id);
      this.workspace_uuid = newWorkspace.workspace_uuid;

      // Invalidar cache
      await cacheService.invalidateHotelCache(this.hotel_id);

      return result;
    }
  }

  async delete() {
    if (!this.id) {
      throw new Error('Cannot delete workspace without ID');
    }
    return await db.query('DELETE FROM workspaces WHERE id = $1', [this.id]);
  }

  async softDelete() {
    if (!this.id) {
      throw new Error('Cannot delete workspace without ID');
    }
    this.active = false;
    return await this.save();
  }

  async activate() {
    if (!this.id) {
      throw new Error('Cannot activate workspace without ID');
    }
    this.active = true;
    return await this.save();
  }

  // Get hotel associated with workspace
  async getHotel() {
    const Hotel = require('./Hotel');
    return await Hotel.findById(this.hotel_id);
  }

  // Bot methods
  async getBots(filters = {}) {
    const Bot = require('./Bot');
    return await Bot.findByWorkspace(this.id, filters);
  }

  async createBot(name, description = null, bot_type = 'CHATBOT', configuration = {}, settings = {}) {
    const Bot = require('./Bot');
    const bot = new Bot({
      workspace_id: this.id,
      workspace_uuid: this.workspace_uuid,
      hotel_id: this.hotel_id,
      hotel_uuid: this.hotel_uuid,
      name,
      description,
      bot_type,
      status: 'DRAFT',
      configuration,
      settings,
      active: true
    });
    await bot.save();
    return bot;
  }

  async countBots() {
    const Bot = require('./Bot');
    return await Bot.countByWorkspace(this.id);
  }

  async getActiveBots() {
    const Bot = require('./Bot');
    return await Bot.findByWorkspace(this.id, { active: true, status: 'ACTIVE' });
  }

  async getBotsByType(bot_type) {
    const Bot = require('./Bot');
    return await Bot.findByWorkspace(this.id, { bot_type });
  }

  // Update settings
  async updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    return await this.save();
  }

  // Get setting by key
  getSetting(key, defaultValue = null) {
    if (!this.settings || typeof this.settings !== 'object') {
      return defaultValue;
    }
    return this.settings[key] !== undefined ? this.settings[key] : defaultValue;
  }

  // Set setting by key
  async setSetting(key, value) {
    if (!this.settings || typeof this.settings !== 'object') {
      this.settings = {};
    }
    this.settings[key] = value;
    return await this.save();
  }

  // Static method to create default workspace for a hotel
  static async createDefaultForHotel(hotelId, hotelUuid, hotelName) {
    const workspace = new Workspace({
      hotel_id: hotelId,
      hotel_uuid: hotelUuid,
      name: `Workspace Principal - ${hotelName}`,
      description: `Workspace principal para gerenciamento de automações do hotel ${hotelName}`,
      settings: {
        isDefault: true,
        theme: 'default',
        notifications: true
      },
      active: true
    });

    await workspace.save();
    return workspace;
  }

  // Count workspaces by hotel
  static async countByHotel(hotelId) {
    const result = await db.query(
      'SELECT COUNT(*) as count FROM workspaces WHERE hotel_id = $1 AND active = true',
      [hotelId]
    );
    return result[0].count;
  }

  // Get workspace stats
  static async getStats() {
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_workspaces,
        COUNT(CASE WHEN active = true THEN 1 END) as active_workspaces,
        COUNT(CASE WHEN active = false THEN 1 END) as inactive_workspaces,
        COUNT(DISTINCT hotel_id) as hotels_with_workspaces
      FROM workspaces
    `);
    return result[0];
  }

  // Parse settings from JSON string if needed
  parseSettings() {
    if (typeof this.settings === 'string') {
      try {
        this.settings = JSON.parse(this.settings);
      } catch (error) {
        this.settings = {};
      }
    }
    return this.settings || {};
  }

  // Lazy loading methods
  async loadBots(useCache = true) {
    if (this._bots) return this._bots;

    const cacheKey = `workspace:${this.id}:bots:lazy`;
    if (useCache) {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        this._bots = cached;
        return this._bots;
      }
    }

    const Bot = require('./Bot');
    this._bots = await Bot.findByWorkspace(this.id, { active: true });

    if (useCache) {
      await cacheService.set(cacheKey, this._bots, 300);
    }

    return this._bots;
  }

  async loadInstances(useCache = true) {
    if (this._instances) return this._instances;

    const cacheKey = `workspace:${this.workspace_uuid}:instances:lazy`;
    if (useCache) {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        this._instances = cached;
        return this._instances;
      }
    }

    const result = await db.query(`
      SELECT instance_name, created_at, updated_at
      FROM workspace_instances
      WHERE workspace_uuid = $1
      ORDER BY created_at DESC
    `, [this.workspace_uuid]);

    this._instances = result.rows || result;

    if (useCache) {
      await cacheService.set(cacheKey, this._instances, 300);
    }

    return this._instances;
  }

  async loadHotel(useCache = true) {
    if (this._hotel) return this._hotel;

    const cacheKey = `hotel:${this.hotel_id}:data:lazy`;
    if (useCache) {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        this._hotel = cached;
        return this._hotel;
      }
    }

    const Hotel = require('./Hotel');
    this._hotel = await Hotel.findById(this.hotel_id);

    if (useCache) {
      await cacheService.set(cacheKey, this._hotel, 600); // Cache hotel por mais tempo
    }

    return this._hotel;
  }

  // Convert to JSON for API response
  toJSON() {
    const json = {
      id: this.id,
      workspace_uuid: this.workspace_uuid,
      hotel_id: this.hotel_id,
      hotel_uuid: this.hotel_uuid,
      name: this.name,
      description: this.description,
      settings: this.parseSettings(),
      active: this.active,
      created_at: this.created_at,
      updated_at: this.updated_at,
      hotel_nome: this.hotel_nome,
      hotel_status: this.hotel_status,
      bots_count: this.bots_count,
      instances_count: this.instances_count
    };

    // Include loaded relationships if available
    if (this._bots) json.bots = this._bots;
    if (this._instances) json.instances = this._instances;
    if (this._hotel) json.hotel = this._hotel;

    return json;
  }
}

module.exports = Workspace;