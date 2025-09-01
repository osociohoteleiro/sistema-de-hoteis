const db = require('../config/database');

class Flow {
  constructor(data = {}) {
    this.id = data.id;
    this.flow_uuid = data.flow_uuid;
    this.bot_id = data.bot_id;
    this.bot_uuid = data.bot_uuid;
    this.workspace_id = data.workspace_id;
    this.workspace_uuid = data.workspace_uuid;
    this.hotel_id = data.hotel_id;
    this.hotel_uuid = data.hotel_uuid;
    this.folder_id = data.folder_id;
    this.name = data.name;
    this.description = data.description;
    this.flow_type = data.flow_type || 'CONVERSATION';
    this.status = data.status || 'DRAFT';
    this.version = data.version || '1.0.0';
    this.flow_data = data.flow_data;
    this.variables = data.variables;
    this.settings = data.settings;
    this.triggers = data.triggers;
    this.priority = data.priority || 0;
    this.is_default = data.is_default || false;
    this.execution_count = data.execution_count || 0;
    this.last_executed_at = data.last_executed_at;
    this.sort_order = data.sort_order || 0;
    this.active = data.active !== undefined ? data.active : true;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async findById(id) {
    const result = await db.query('SELECT * FROM flows WHERE id = ?', [id]);
    return result.length > 0 ? new Flow(result[0]) : null;
  }

  static async findByUuid(uuid) {
    const result = await db.query('SELECT * FROM flows WHERE flow_uuid = ?', [uuid]);
    return result.length > 0 ? new Flow(result[0]) : null;
  }

  static async findAll(filters = {}) {
    let query = `
      SELECT f.*, b.name as bot_name, h.hotel_nome, fo.name as folder_name, fo.color as folder_color
      FROM flows f 
      LEFT JOIN bots b ON f.bot_id = b.id 
      LEFT JOIN hotels h ON f.hotel_id = h.id 
      LEFT JOIN folders fo ON f.folder_id = fo.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.active !== undefined) {
      query += ' AND f.active = ?';
      params.push(filters.active);
    }

    if (filters.bot_id) {
      query += ' AND f.bot_id = ?';
      params.push(filters.bot_id);
    }

    if (filters.bot_uuid) {
      query += ' AND f.bot_uuid = ?';
      params.push(filters.bot_uuid);
    }

    if (filters.workspace_id) {
      query += ' AND f.workspace_id = ?';
      params.push(filters.workspace_id);
    }

    if (filters.folder_id !== undefined) {
      if (filters.folder_id === null) {
        query += ' AND f.folder_id IS NULL';
      } else {
        query += ' AND f.folder_id = ?';
        params.push(filters.folder_id);
      }
    }

    if (filters.flow_type) {
      query += ' AND f.flow_type = ?';
      params.push(filters.flow_type);
    }

    if (filters.status) {
      query += ' AND f.status = ?';
      params.push(filters.status);
    }

    if (filters.is_default !== undefined) {
      query += ' AND f.is_default = ?';
      params.push(filters.is_default);
    }

    if (filters.search) {
      query += ' AND (f.name LIKE ? OR f.description LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY f.priority DESC, f.sort_order, f.name';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));
    }

    const result = await db.query(query, params);
    return result.map(row => {
      const flow = new Flow(row);
      flow.bot_name = row.bot_name;
      flow.hotel_nome = row.hotel_nome;
      flow.folder_name = row.folder_name;
      flow.folder_color = row.folder_color;
      return flow;
    });
  }

  static async findByBot(botId, filters = {}) {
    let query = `
      SELECT f.*, b.name as bot_name, h.hotel_nome, fo.name as folder_name, fo.color as folder_color
      FROM flows f 
      LEFT JOIN bots b ON f.bot_id = b.id 
      LEFT JOIN hotels h ON f.hotel_id = h.id 
      LEFT JOIN folders fo ON f.folder_id = fo.id
      WHERE f.bot_id = ?
    `;
    const params = [botId];

    if (filters.active !== undefined) {
      query += ' AND f.active = ?';
      params.push(filters.active);
    }

    if (filters.folder_id !== undefined) {
      if (filters.folder_id === null) {
        query += ' AND f.folder_id IS NULL';
      } else {
        query += ' AND f.folder_id = ?';
        params.push(filters.folder_id);
      }
    }

    if (filters.flow_type) {
      query += ' AND f.flow_type = ?';
      params.push(filters.flow_type);
    }

    if (filters.status) {
      query += ' AND f.status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY f.priority DESC, f.sort_order, f.name';

    const result = await db.query(query, params);
    return result.map(row => {
      const flow = new Flow(row);
      flow.bot_name = row.bot_name;
      flow.hotel_nome = row.hotel_nome;
      flow.folder_name = row.folder_name;
      flow.folder_color = row.folder_color;
      return flow;
    });
  }

  static async findByBotUuid(botUuid, filters = {}) {
    let query = `
      SELECT f.*, b.name as bot_name, h.hotel_nome, fo.name as folder_name, fo.color as folder_color
      FROM flows f 
      LEFT JOIN bots b ON f.bot_id = b.id 
      LEFT JOIN hotels h ON f.hotel_id = h.id 
      LEFT JOIN folders fo ON f.folder_id = fo.id
      WHERE f.bot_uuid = ?
    `;
    const params = [botUuid];

    if (filters.active !== undefined) {
      query += ' AND f.active = ?';
      params.push(filters.active);
    }

    if (filters.folder_id !== undefined) {
      if (filters.folder_id === null) {
        query += ' AND f.folder_id IS NULL';
      } else {
        query += ' AND f.folder_id = ?';
        params.push(filters.folder_id);
      }
    }

    if (filters.flow_type) {
      query += ' AND f.flow_type = ?';
      params.push(filters.flow_type);
    }

    if (filters.status) {
      query += ' AND f.status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY f.priority DESC, f.sort_order, f.name';

    const result = await db.query(query, params);
    return result.map(row => {
      const flow = new Flow(row);
      flow.bot_name = row.bot_name;
      flow.hotel_nome = row.hotel_nome;
      flow.folder_name = row.folder_name;
      flow.folder_color = row.folder_color;
      return flow;
    });
  }

  static async findByFolder(folderId, filters = {}) {
    let query = `
      SELECT f.*, b.name as bot_name, h.hotel_nome, fo.name as folder_name, fo.color as folder_color
      FROM flows f 
      LEFT JOIN bots b ON f.bot_id = b.id 
      LEFT JOIN hotels h ON f.hotel_id = h.id 
      LEFT JOIN folders fo ON f.folder_id = fo.id
      WHERE f.folder_id = ?
    `;
    const params = [folderId];

    if (filters.active !== undefined) {
      query += ' AND f.active = ?';
      params.push(filters.active);
    }

    if (filters.flow_type) {
      query += ' AND f.flow_type = ?';
      params.push(filters.flow_type);
    }

    if (filters.status) {
      query += ' AND f.status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY f.priority DESC, f.sort_order, f.name';

    const result = await db.query(query, params);
    return result.map(row => {
      const flow = new Flow(row);
      flow.bot_name = row.bot_name;
      flow.hotel_nome = row.hotel_nome;
      flow.folder_name = row.folder_name;
      flow.folder_color = row.folder_color;
      return flow;
    });
  }

  async save() {
    if (this.id) {
      // Update existing flow
      const result = await db.query(`
        UPDATE flows SET 
        name = ?, description = ?, flow_type = ?, status = ?, version = ?,
        flow_data = ?, variables = ?, settings = ?, triggers = ?, priority = ?,
        is_default = ?, sort_order = ?, active = ?, folder_id = ?
        WHERE id = ?
      `, [
        this.name,
        this.description,
        this.flow_type,
        this.status,
        this.version,
        this.flow_data ? JSON.stringify(this.flow_data) : null,
        this.variables ? JSON.stringify(this.variables) : null,
        this.settings ? JSON.stringify(this.settings) : null,
        this.triggers ? JSON.stringify(this.triggers) : null,
        this.priority,
        this.is_default,
        this.sort_order,
        this.active,
        this.folder_id,
        this.id
      ]);
      return result;
    } else {
      // Create new flow
      const result = await db.query(`
        INSERT INTO flows (bot_id, bot_uuid, workspace_id, workspace_uuid, hotel_id, hotel_uuid, 
                          folder_id, name, description, flow_type, status, version, flow_data, 
                          variables, settings, triggers, priority, is_default, sort_order, active) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        this.bot_id,
        this.bot_uuid,
        this.workspace_id,
        this.workspace_uuid,
        this.hotel_id,
        this.hotel_uuid,
        this.folder_id,
        this.name,
        this.description,
        this.flow_type,
        this.status,
        this.version,
        this.flow_data ? JSON.stringify(this.flow_data) : null,
        this.variables ? JSON.stringify(this.variables) : null,
        this.settings ? JSON.stringify(this.settings) : null,
        this.triggers ? JSON.stringify(this.triggers) : null,
        this.priority,
        this.is_default,
        this.sort_order,
        this.active
      ]);
      
      this.id = result.insertId;
      
      // Get the generated UUID
      const newFlow = await Flow.findById(this.id);
      this.flow_uuid = newFlow.flow_uuid;
      
      return result;
    }
  }

  async delete() {
    if (!this.id) {
      throw new Error('Cannot delete flow without ID');
    }
    return await db.query('DELETE FROM flows WHERE id = ?', [this.id]);
  }

  async softDelete() {
    if (!this.id) {
      throw new Error('Cannot delete flow without ID');
    }
    this.active = false;
    return await this.save();
  }

  async activate() {
    if (!this.id) {
      throw new Error('Cannot activate flow without ID');
    }
    this.active = true;
    this.status = 'ACTIVE';
    return await this.save();
  }

  async deactivate() {
    if (!this.id) {
      throw new Error('Cannot deactivate flow without ID');
    }
    this.status = 'INACTIVE';
    return await this.save();
  }

  async setStatus(status) {
    if (!this.id) {
      throw new Error('Cannot set status of flow without ID');
    }
    this.status = status;
    return await this.save();
  }

  async setAsDefault() {
    if (!this.id) {
      throw new Error('Cannot set default flow without ID');
    }
    
    // Remove default from other flows of the same bot
    await db.query('UPDATE flows SET is_default = FALSE WHERE bot_id = ? AND id != ?', [this.bot_id, this.id]);
    
    this.is_default = true;
    return await this.save();
  }

  async incrementExecutionCount() {
    if (!this.id) return;
    
    this.execution_count += 1;
    this.last_executed_at = new Date();
    
    await db.query(
      'UPDATE flows SET execution_count = ?, last_executed_at = ? WHERE id = ?',
      [this.execution_count, this.last_executed_at, this.id]
    );
  }

  // Move flow to another folder
  async moveToFolder(folderId = null) {
    // Validate folder exists and belongs to same bot
    if (folderId) {
      const Folder = require('./Folder');
      const folder = await Folder.findById(folderId);
      if (!folder) {
        throw new Error('Folder not found');
      }
      if (folder.bot_id !== this.bot_id) {
        throw new Error('Cannot move flow to folder of different bot');
      }
    }
    
    this.folder_id = folderId;
    return await this.save();
  }

  // Update flow data
  async updateFlowData(flowData) {
    this.flow_data = flowData;
    return await this.save();
  }

  // Update variables
  async updateVariables(variables) {
    this.variables = { ...this.variables, ...variables };
    return await this.save();
  }

  // Update settings
  async updateSettings(settings) {
    this.settings = { ...this.settings, ...settings };
    return await this.save();
  }

  // Update triggers
  async updateTriggers(triggers) {
    this.triggers = triggers;
    return await this.save();
  }

  // Get bot associated with flow
  async getBot() {
    const Bot = require('./Bot');
    return await Bot.findById(this.bot_id);
  }

  // Get folder associated with flow
  async getFolder() {
    if (!this.folder_id) return null;
    const Folder = require('./Folder');
    return await Folder.findById(this.folder_id);
  }

  // Count flows by bot
  static async countByBot(botId) {
    const result = await db.query(
      'SELECT COUNT(*) as count FROM flows WHERE bot_id = ? AND active = true',
      [botId]
    );
    return result[0].count;
  }

  // Count flows by folder
  static async countByFolder(folderId) {
    const result = await db.query(
      'SELECT COUNT(*) as count FROM flows WHERE folder_id = ? AND active = true',
      [folderId]
    );
    return result[0].count;
  }

  // Get flow stats
  static async getStats() {
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_flows,
        COUNT(CASE WHEN active = true THEN 1 END) as active_flows,
        COUNT(CASE WHEN active = false THEN 1 END) as inactive_flows,
        COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as running_flows,
        COUNT(CASE WHEN status = 'DRAFT' THEN 1 END) as draft_flows,
        COUNT(CASE WHEN flow_type = 'CONVERSATION' THEN 1 END) as conversation_flows,
        COUNT(CASE WHEN flow_type = 'AUTOMATION' THEN 1 END) as automation_flows,
        COUNT(CASE WHEN is_default = true THEN 1 END) as default_flows,
        SUM(execution_count) as total_executions,
        COUNT(DISTINCT bot_id) as bots_with_flows
      FROM flows
    `);
    return result[0];
  }

  // Get flow types available
  static getFlowTypes() {
    return ['CONVERSATION', 'AUTOMATION', 'WEBHOOK', 'TRIGGER', 'ACTION'];
  }

  // Get flow statuses available
  static getFlowStatuses() {
    return ['ACTIVE', 'INACTIVE', 'DRAFT', 'TESTING'];
  }

  // Parse JSON fields
  parseFlowData() {
    if (typeof this.flow_data === 'string') {
      try {
        this.flow_data = JSON.parse(this.flow_data);
      } catch (error) {
        this.flow_data = {};
      }
    }
    return this.flow_data || {};
  }

  parseVariables() {
    if (typeof this.variables === 'string') {
      try {
        this.variables = JSON.parse(this.variables);
      } catch (error) {
        this.variables = {};
      }
    }
    return this.variables || {};
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

  parseTriggers() {
    if (typeof this.triggers === 'string') {
      try {
        this.triggers = JSON.parse(this.triggers);
      } catch (error) {
        this.triggers = [];
      }
    }
    return this.triggers || [];
  }

  // Convert to JSON for API response
  toJSON() {
    return {
      id: this.id,
      flow_uuid: this.flow_uuid,
      bot_id: this.bot_id,
      bot_uuid: this.bot_uuid,
      workspace_id: this.workspace_id,
      workspace_uuid: this.workspace_uuid,
      hotel_id: this.hotel_id,
      hotel_uuid: this.hotel_uuid,
      folder_id: this.folder_id,
      name: this.name,
      description: this.description,
      flow_type: this.flow_type,
      status: this.status,
      version: this.version,
      flow_data: this.parseFlowData(),
      variables: this.parseVariables(),
      settings: this.parseSettings(),
      triggers: this.parseTriggers(),
      priority: this.priority,
      is_default: this.is_default,
      execution_count: this.execution_count,
      last_executed_at: this.last_executed_at,
      sort_order: this.sort_order,
      active: this.active,
      created_at: this.created_at,
      updated_at: this.updated_at,
      bot_name: this.bot_name,
      hotel_nome: this.hotel_nome,
      folder_name: this.folder_name,
      folder_color: this.folder_color
    };
  }
}

module.exports = Flow;