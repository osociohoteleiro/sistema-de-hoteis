const db = require('../config/database');

class Bot {
  constructor(data = {}) {
    this.id = data.id;
    this.bot_uuid = data.uuid || data.bot_uuid;
    this.workspace_id = data.workspace_id;
    this.workspace_uuid = data.workspace_uuid;
    this.hotel_id = data.hotel_id;
    this.hotel_uuid = data.hotel_uuid;
    this.name = data.name;
    this.description = data.description;
    this.bot_type = data.bot_type || 'CHATBOT';
    this.status = data.status || 'DRAFT';
    this.configuration = data.configuration;
    this.settings = data.settings;
    this.active = data.active !== undefined ? data.active : true;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async findById(id) {
    const result = await db.query('SELECT * FROM bots WHERE id = $1', [id]);
    return result.length > 0 ? new Bot(result[0]) : null;
  }

  static async findByUuid(uuid) {
    const result = await db.query('SELECT * FROM bots WHERE uuid = $1', [uuid]);
    return result.length > 0 ? new Bot(result[0]) : null;
  }

  static async findAll(filters = {}) {
    let query = `
      SELECT
        b.*,
        w.name as workspace_name,
        w.uuid as workspace_uuid_full,
        w.active as workspace_active,
        h.name as hotel_nome,
        h.hotel_uuid as hotel_uuid_full,
        h.status as hotel_status,
        (SELECT COUNT(*) FROM flows f WHERE f.bot_id = b.id AND f.active = true) as flows_count,
        (SELECT COUNT(*) FROM folders fd WHERE fd.bot_id = b.id AND fd.active = true) as folders_count
      FROM bots b
      LEFT JOIN workspaces w ON b.workspace_id = w.id
      LEFT JOIN hotels h ON b.hotel_id = h.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (filters.active !== undefined) {
      paramCount++;
      query += ` AND b.active = $${paramCount}`;
      params.push(filters.active);
    }

    if (filters.workspace_id) {
      paramCount++;
      query += ` AND b.workspace_id = $${paramCount}`;
      params.push(filters.workspace_id);
    }

    if (filters.workspace_uuid) {
      paramCount++;
      query += ` AND b.workspace_uuid = $${paramCount}`;
      params.push(filters.workspace_uuid);
    }

    if (filters.hotel_id) {
      paramCount++;
      query += ` AND b.hotel_id = $${paramCount}`;
      params.push(filters.hotel_id);
    }

    if (filters.hotel_uuid) {
      paramCount++;
      query += ` AND b.hotel_uuid = $${paramCount}`;
      params.push(filters.hotel_uuid);
    }

    if (filters.bot_type) {
      paramCount++;
      query += ` AND b.bot_type = $${paramCount}`;
      params.push(filters.bot_type);
    }

    if (filters.status) {
      paramCount++;
      query += ` AND b.status = $${paramCount}`;
      params.push(filters.status);
    }

    if (filters.search) {
      paramCount++;
      const searchParam1 = paramCount;
      paramCount++;
      const searchParam2 = paramCount;
      paramCount++;
      const searchParam3 = paramCount;
      query += ` AND (b.name ILIKE $${searchParam1} OR b.description ILIKE $${searchParam2} OR h.name ILIKE $${searchParam3})`;
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY b.created_at DESC';

    if (filters.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(parseInt(filters.limit));
    }

    const result = await db.query(query, params);
    return result.map(row => {
      const bot = new Bot(row);
      bot.workspace_name = row.workspace_name;
      bot.workspace_active = row.workspace_active;
      bot.hotel_nome = row.hotel_nome;
      bot.hotel_status = row.hotel_status;
      bot.flows_count = parseInt(row.flows_count) || 0;
      bot.folders_count = parseInt(row.folders_count) || 0;
      return bot;
    });
  }

  static async findByWorkspace(workspaceId, filters = {}) {
    let query = `
      SELECT
        b.*,
        w.name as workspace_name,
        w.uuid as workspace_uuid_full,
        w.active as workspace_active,
        h.name as hotel_nome,
        h.hotel_uuid as hotel_uuid_full,
        h.status as hotel_status,
        (SELECT COUNT(*) FROM flows f WHERE f.bot_id = b.id AND f.active = true) as flows_count,
        (SELECT COUNT(*) FROM folders fd WHERE fd.bot_id = b.id AND fd.active = true) as folders_count
      FROM bots b
      LEFT JOIN workspaces w ON b.workspace_id = w.id
      LEFT JOIN hotels h ON b.hotel_id = h.id
      WHERE b.workspace_id = $1
    `;
    const params = [workspaceId];
    let paramCount = 1;

    if (filters.active !== undefined) {
      paramCount++;
      query += ` AND b.active = $${paramCount}`;
      params.push(filters.active);
    }

    if (filters.bot_type) {
      query += ' AND b.bot_type = ?';
      params.push(filters.bot_type);
    }

    if (filters.status) {
      query += ' AND b.status = ?';
      params.push(filters.status);
    }

    if (filters.search) {
      query += ' AND (b.name LIKE ? OR b.description LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY b.created_at DESC';

    const result = await db.query(query, params);
    return result.map(row => {
      const bot = new Bot(row);
      bot.workspace_name = row.workspace_name;
      bot.hotel_nome = row.hotel_nome;
      return bot;
    });
  }

  static async findByWorkspaceUuid(workspaceUuid, filters = {}) {
    let query = `
      SELECT b.*, w.name as workspace_name, h.name as hotel_nome 
      FROM bots b 
      LEFT JOIN workspaces w ON b.workspace_id = w.id 
      LEFT JOIN hotels h ON b.hotel_id = h.id 
      WHERE b.workspace_uuid = ?
    `;
    const params = [workspaceUuid];

    if (filters.active !== undefined) {
      query += ' AND b.active = ?';
      params.push(filters.active);
    }

    if (filters.bot_type) {
      query += ' AND b.bot_type = ?';
      params.push(filters.bot_type);
    }

    if (filters.status) {
      query += ' AND b.status = ?';
      params.push(filters.status);
    }

    if (filters.search) {
      query += ' AND (b.name LIKE ? OR b.description LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY b.created_at DESC';

    const result = await db.query(query, params);
    return result.map(row => {
      const bot = new Bot(row);
      bot.workspace_name = row.workspace_name;
      bot.hotel_nome = row.hotel_nome;
      return bot;
    });
  }

  async save() {
    if (this.id) {
      // Update existing bot
      const result = await db.query(`
        UPDATE bots SET 
        name = $1, description = $2, bot_type = $3, status = $4, 
        configuration = $5, settings = $6, active = $7
        WHERE id = $8
      `, [
        this.name,
        this.description,
        this.bot_type,
        this.status,
        this.configuration ? JSON.stringify(this.configuration) : null,
        this.settings ? JSON.stringify(this.settings) : null,
        this.active,
        this.id
      ]);
      return result;
    } else {
      // Create new bot
      const result = await db.query(`
        INSERT INTO bots (workspace_id, workspace_uuid, hotel_id, hotel_uuid, name, description, bot_type, status, configuration, settings, active) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        this.workspace_id,
        this.workspace_uuid,
        this.hotel_id,
        this.hotel_uuid,
        this.name,
        this.description,
        this.bot_type,
        this.status,
        this.configuration ? JSON.stringify(this.configuration) : null,
        this.settings ? JSON.stringify(this.settings) : null,
        this.active
      ]);
      
      this.id = result.insertId;
      
      // Get the generated UUID
      const newBot = await Bot.findById(this.id);
      this.bot_uuid = newBot.bot_uuid;
      
      return result;
    }
  }

  async delete() {
    if (!this.id) {
      throw new Error('Cannot delete bot without ID');
    }
    return await db.query('DELETE FROM bots WHERE id = $1', [this.id]);
  }

  async softDelete() {
    if (!this.id) {
      throw new Error('Cannot delete bot without ID');
    }
    this.active = false;
    return await this.save();
  }

  async activate() {
    if (!this.id) {
      throw new Error('Cannot activate bot without ID');
    }
    this.active = true;
    this.status = 'ACTIVE';
    return await this.save();
  }

  async deactivate() {
    if (!this.id) {
      throw new Error('Cannot deactivate bot without ID');
    }
    this.status = 'INACTIVE';
    return await this.save();
  }

  async setStatus(status) {
    if (!this.id) {
      throw new Error('Cannot set status of bot without ID');
    }
    this.status = status;
    return await this.save();
  }

  // Get workspace associated with bot
  async getWorkspace() {
    const Workspace = require('./Workspace');
    return await Workspace.findById(this.workspace_id);
  }

  // Get hotel associated with bot
  async getHotel() {
    const Hotel = require('./Hotel');
    return await Hotel.findById(this.hotel_id);
  }

  // Update configuration
  async updateConfiguration(newConfig) {
    this.configuration = { ...this.configuration, ...newConfig };
    return await this.save();
  }

  // Update settings
  async updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    return await this.save();
  }

  // Get configuration by key
  getConfiguration(key, defaultValue = null) {
    if (!this.configuration || typeof this.configuration !== 'object') {
      return defaultValue;
    }
    return this.configuration[key] !== undefined ? this.configuration[key] : defaultValue;
  }

  // Set configuration by key
  async setConfiguration(key, value) {
    if (!this.configuration || typeof this.configuration !== 'object') {
      this.configuration = {};
    }
    this.configuration[key] = value;
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

  // Count bots by workspace
  static async countByWorkspace(workspaceId) {
    const result = await db.query(
      'SELECT COUNT(*) as count FROM bots WHERE workspace_id = $1 AND active = true',
      [workspaceId]
    );
    return result[0].count;
  }

  // Count bots by hotel
  static async countByHotel(hotelId) {
    const result = await db.query(
      'SELECT COUNT(*) as count FROM bots WHERE hotel_id = $1 AND active = true',
      [hotelId]
    );
    return result[0].count;
  }

  // Get bot stats
  static async getStats() {
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_bots,
        COUNT(CASE WHEN active = true THEN 1 END) as active_bots,
        COUNT(CASE WHEN active = false THEN 1 END) as inactive_bots,
        COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as running_bots,
        COUNT(CASE WHEN status = 'DRAFT' THEN 1 END) as draft_bots,
        COUNT(CASE WHEN bot_type = 'CHATBOT' THEN 1 END) as chatbots,
        COUNT(CASE WHEN bot_type = 'AUTOMATION' THEN 1 END) as automation_bots,
        COUNT(DISTINCT workspace_id) as workspaces_with_bots,
        COUNT(DISTINCT hotel_id) as hotels_with_bots
      FROM bots
    `);
    return result[0];
  }

  // Get bot types available
  static getBotTypes() {
    return ['CHATBOT', 'AUTOMATION', 'WEBHOOK', 'SCHEDULER', 'INTEGRATION'];
  }

  // Get bot statuses available
  static getBotStatuses() {
    return ['ACTIVE', 'INACTIVE', 'DRAFT', 'ERROR'];
  }

  // Parse configuration and settings from JSON strings if needed
  parseConfiguration() {
    if (typeof this.configuration === 'string') {
      try {
        this.configuration = JSON.parse(this.configuration);
      } catch (error) {
        this.configuration = {};
      }
    }
    return this.configuration || {};
  }

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
      bot_uuid: this.bot_uuid,
      workspace_id: this.workspace_id,
      workspace_uuid: this.workspace_uuid,
      hotel_id: this.hotel_id,
      hotel_uuid: this.hotel_uuid,
      name: this.name,
      description: this.description,
      bot_type: this.bot_type,
      status: this.status,
      configuration: this.parseConfiguration(),
      settings: this.parseSettings(),
      active: this.active,
      created_at: this.created_at,
      updated_at: this.updated_at,
      workspace_name: this.workspace_name,
      hotel_nome: this.hotel_nome
    };
  }
}

module.exports = Bot;