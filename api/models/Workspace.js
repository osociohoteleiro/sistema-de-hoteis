const db = require('../config/database');

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
    const result = await db.query('SELECT * FROM workspaces WHERE id = ?', [id]);
    return result.length > 0 ? new Workspace(result[0]) : null;
  }

  static async findByUuid(uuid) {
    const result = await db.query('SELECT * FROM workspaces WHERE uuid = ?', [uuid]);
    return result.length > 0 ? new Workspace(result[0]) : null;
  }

  static async findAll(filters = {}) {
    let query = `
      SELECT w.*, h.name as hotel_nome 
      FROM workspaces w 
      LEFT JOIN hotels h ON w.hotel_id = h.id 
      WHERE 1=1
    `;
    const params = [];

    if (filters.active !== undefined) {
      query += ' AND w.active = ?';
      params.push(filters.active);
    }

    if (filters.hotel_id) {
      query += ' AND w.hotel_id = ?';
      params.push(filters.hotel_id);
    }

    if (filters.hotel_uuid) {
      query += ' AND w.hotel_uuid = ?';
      params.push(filters.hotel_uuid);
    }

    if (filters.search) {
      query += ' AND (w.name LIKE ? OR w.description LIKE ? OR h.name LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY w.created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));
    }

    const result = await db.query(query, params);
    return result.map(row => {
      const workspace = new Workspace(row);
      workspace.hotel_nome = row.hotel_nome;
      return workspace;
    });
  }

  static async findByHotel(hotelId, filters = {}) {
    let query = `
      SELECT w.*, h.name as hotel_nome 
      FROM workspaces w 
      LEFT JOIN hotels h ON w.hotel_id = h.id 
      WHERE w.hotel_id = ?
    `;
    const params = [hotelId];

    if (filters.active !== undefined) {
      query += ' AND w.active = ?';
      params.push(filters.active);
    }

    if (filters.search) {
      query += ' AND (w.name LIKE ? OR w.description LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY w.created_at DESC';

    const result = await db.query(query, params);
    return result.map(row => {
      const workspace = new Workspace(row);
      workspace.hotel_nome = row.hotel_nome;
      return workspace;
    });
  }

  static async findByHotelUuid(hotelUuid, filters = {}) {
    let query = `
      SELECT w.*, h.name as hotel_nome 
      FROM workspaces w 
      LEFT JOIN hotels h ON w.hotel_id = h.id 
      WHERE w.hotel_uuid = ?
    `;
    const params = [hotelUuid];

    if (filters.active !== undefined) {
      query += ' AND w.active = ?';
      params.push(filters.active);
    }

    if (filters.search) {
      query += ' AND (w.name LIKE ? OR w.description LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY w.created_at DESC';

    const result = await db.query(query, params);
    return result.map(row => {
      const workspace = new Workspace(row);
      workspace.hotel_nome = row.hotel_nome;
      return workspace;
    });
  }

  async save() {
    if (this.id) {
      // Update existing workspace
      const result = await db.query(`
        UPDATE workspaces SET 
        name = ?, description = ?, settings = ?, active = ?
        WHERE id = ?
      `, [
        this.name,
        this.description, 
        this.settings ? JSON.stringify(this.settings) : null,
        this.active,
        this.id
      ]);
      return result;
    } else {
      // Create new workspace
      const result = await db.query(`
        INSERT INTO workspaces (hotel_id, hotel_uuid, name, description, settings, active) 
        VALUES (?, ?, ?, ?, ?, ?)
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
      
      return result;
    }
  }

  async delete() {
    if (!this.id) {
      throw new Error('Cannot delete workspace without ID');
    }
    return await db.query('DELETE FROM workspaces WHERE id = ?', [this.id]);
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
      'SELECT COUNT(*) as count FROM workspaces WHERE hotel_id = ? AND active = true',
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

  // Convert to JSON for API response
  toJSON() {
    return {
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
      hotel_nome: this.hotel_nome
    };
  }
}

module.exports = Workspace;