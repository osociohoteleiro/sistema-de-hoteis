const db = require('../config/database');

class Folder {
  constructor(data = {}) {
    this.id = data.id;
    this.folder_uuid = data.folder_uuid;
    this.bot_id = data.bot_id;
    this.bot_uuid = data.bot_uuid;
    this.workspace_id = data.workspace_id;
    this.workspace_uuid = data.workspace_uuid;
    this.hotel_id = data.hotel_id;
    this.hotel_uuid = data.hotel_uuid;
    this.name = data.name;
    this.description = data.description;
    this.color = data.color || '#3B82F6';
    this.icon = data.icon || 'folder';
    this.parent_folder_id = data.parent_folder_id;
    this.sort_order = data.sort_order || 0;
    this.active = data.active !== undefined ? data.active : true;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async findById(id) {
    const result = await db.query('SELECT * FROM folders WHERE id = $1', [id]);
    return result.length > 0 ? new Folder(result[0]) : null;
  }

  static async findByUuid(uuid) {
    const result = await db.query('SELECT * FROM folders WHERE folder_uuid = $1', [uuid]);
    return result.length > 0 ? new Folder(result[0]) : null;
  }

  static async findAll(filters = {}) {
    let query = `
      SELECT f.*, b.name as bot_name, h.name as hotel_nome 
      FROM folders f 
      LEFT JOIN bots b ON f.bot_id = b.id 
      LEFT JOIN hotels h ON f.hotel_id = h.id 
      WHERE 1=1
    `;
    const params = [];

    if (filters.active !== undefined) {
      query += ' AND f.active = $' + (params.length + 1);
      params.push(filters.active);
    }

    if (filters.bot_id) {
      query += ' AND f.bot_id = $' + (params.length + 1);
      params.push(filters.bot_id);
    }

    if (filters.bot_uuid) {
      query += ' AND f.bot_uuid = $' + (params.length + 1);
      params.push(filters.bot_uuid);
    }

    if (filters.workspace_id) {
      query += ' AND f.workspace_id = $' + (params.length + 1);
      params.push(filters.workspace_id);
    }

    if (filters.workspace_uuid) {
      query += ' AND f.workspace_uuid = $' + (params.length + 1);
      params.push(filters.workspace_uuid);
    }

    if (filters.hotel_id) {
      query += ' AND f.hotel_id = $' + (params.length + 1);
      params.push(filters.hotel_id);
    }

    if (filters.parent_folder_id !== undefined) {
      if (filters.parent_folder_id === null) {
        query += ' AND f.parent_folder_id IS NULL';
      } else {
        query += ' AND f.parent_folder_id = $' + (params.length + 1);
        params.push(filters.parent_folder_id);
      }
    }

    if (filters.search) {
      query += ' AND (f.name ILIKE $' + (params.length + 1) + ' OR f.description ILIKE $' + (params.length + 2) + ')';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY f.sort_order, f.name';

    if (filters.limit) {
      query += ' LIMIT $' + (params.length + 1);
      params.push(parseInt(filters.limit));
    }

    const result = await db.query(query, params);
    return result.map(row => {
      const folder = new Folder(row);
      folder.bot_name = row.bot_name;
      folder.hotel_nome = row.hotel_nome;
      return folder;
    });
  }

  static async findByBot(botId, filters = {}) {
    let query = `
      SELECT f.*, b.name as bot_name, h.name as hotel_nome 
      FROM folders f 
      LEFT JOIN bots b ON f.bot_id = b.id 
      LEFT JOIN hotels h ON f.hotel_id = h.id 
      WHERE f.bot_id = $1
    `;
    const params = [botId];

    if (filters.active !== undefined) {
      query += ' AND f.active = $' + (params.length + 1);
      params.push(filters.active);
    }

    if (filters.parent_folder_id !== undefined) {
      if (filters.parent_folder_id === null) {
        query += ' AND f.parent_folder_id IS NULL';
      } else {
        query += ' AND f.parent_folder_id = $' + (params.length + 1);
        params.push(filters.parent_folder_id);
      }
    }

    if (filters.search) {
      query += ' AND (f.name ILIKE $' + (params.length + 1) + ' OR f.description ILIKE $' + (params.length + 2) + ')';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY f.sort_order, f.name';

    const result = await db.query(query, params);
    return result.map(row => {
      const folder = new Folder(row);
      folder.bot_name = row.bot_name;
      folder.hotel_nome = row.hotel_nome;
      return folder;
    });
  }

  static async findByBotUuid(botUuid, filters = {}) {
    let query = `
      SELECT f.*, b.name as bot_name, h.name as hotel_nome 
      FROM folders f 
      LEFT JOIN bots b ON f.bot_id = b.id 
      LEFT JOIN hotels h ON f.hotel_id = h.id 
      WHERE f.bot_uuid = $1
    `;
    const params = [botUuid];

    if (filters.active !== undefined) {
      query += ' AND f.active = $' + (params.length + 1);
      params.push(filters.active);
    }

    if (filters.parent_folder_id !== undefined) {
      if (filters.parent_folder_id === null) {
        query += ' AND f.parent_folder_id IS NULL';
      } else {
        query += ' AND f.parent_folder_id = $' + (params.length + 1);
        params.push(filters.parent_folder_id);
      }
    }

    if (filters.search) {
      query += ' AND (f.name ILIKE $' + (params.length + 1) + ' OR f.description ILIKE $' + (params.length + 2) + ')';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY f.sort_order, f.name';

    const result = await db.query(query, params);
    return result.map(row => {
      const folder = new Folder(row);
      folder.bot_name = row.bot_name;
      folder.hotel_nome = row.hotel_nome;
      return folder;
    });
  }

  async save() {
    if (this.id) {
      // Update existing folder
      const result = await db.query(`
        UPDATE folders SET 
        name = $1, description = $2, color = $3, icon = $4, 
        parent_folder_id = $5, sort_order = $6, active = $7
        WHERE id = $8
        RETURNING *
      `, [
        this.name,
        this.description,
        this.color,
        this.icon,
        this.parent_folder_id,
        this.sort_order,
        this.active,
        this.id
      ]);
      
      if (result.length > 0) {
        this.folder_uuid = result[0].folder_uuid;
      }
      return result;
    } else {
      // Create new folder
      const result = await db.query(`
        INSERT INTO folders (bot_id, bot_uuid, workspace_id, workspace_uuid, hotel_id, hotel_uuid, 
                           name, description, color, icon, parent_folder_id, sort_order, active) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `, [
        this.bot_id,
        this.bot_uuid,
        this.workspace_id,
        this.workspace_uuid,
        this.hotel_id,
        this.hotel_uuid,
        this.name,
        this.description,
        this.color,
        this.icon,
        this.parent_folder_id,
        this.sort_order,
        this.active
      ]);
      
      if (result.length > 0) {
        this.id = result[0].id;
        this.folder_uuid = result[0].folder_uuid;
      }
      
      return result;
    }
  }

  async delete() {
    if (!this.id) {
      throw new Error('Cannot delete folder without ID');
    }
    
    // Check if folder has children or flows
    const children = await db.query('SELECT COUNT(*) as count FROM folders WHERE parent_folder_id = $1', [this.id]);
    const flows = await db.query('SELECT COUNT(*) as count FROM flows WHERE folder_id = $1', [this.id]);
    
    if (children[0].count > 0) {
      throw new Error('Cannot delete folder with subfolders');
    }
    
    if (flows[0].count > 0) {
      throw new Error('Cannot delete folder with flows');
    }
    
    return await db.query('DELETE FROM folders WHERE id = $1', [this.id]);
  }

  async softDelete() {
    if (!this.id) {
      throw new Error('Cannot delete folder without ID');
    }
    this.active = false;
    return await this.save();
  }

  async activate() {
    if (!this.id) {
      throw new Error('Cannot activate folder without ID');
    }
    this.active = true;
    return await this.save();
  }

  // Get bot associated with folder
  async getBot() {
    const Bot = require('./Bot');
    return await Bot.findById(this.bot_id);
  }

  // Get parent folder
  async getParentFolder() {
    if (!this.parent_folder_id) return null;
    return await Folder.findById(this.parent_folder_id);
  }

  // Get child folders
  async getChildFolders() {
    return await Folder.findAll({ parent_folder_id: this.id, active: true });
  }

  // Get flows in this folder
  async getFlows() {
    const Flow = require('./Flow');
    return await Flow.findByFolder(this.id);
  }

  // Count flows in this folder
  async countFlows() {
    const result = await db.query(
      'SELECT COUNT(*) as count FROM flows WHERE folder_id = $1 AND active = true',
      [this.id]
    );
    return result[0].count;
  }

  // Move folder to another parent
  async moveTo(parentFolderId = null) {
    // Validate parent folder exists and belongs to same bot
    if (parentFolderId) {
      const parentFolder = await Folder.findById(parentFolderId);
      if (!parentFolder) {
        throw new Error('Parent folder not found');
      }
      if (parentFolder.bot_id !== this.bot_id) {
        throw new Error('Cannot move folder to different bot');
      }
      // Prevent circular reference
      if (parentFolder.id === this.id) {
        throw new Error('Cannot move folder to itself');
      }
    }
    
    this.parent_folder_id = parentFolderId;
    return await this.save();
  }

  // Update sort order
  async updateSortOrder(newOrder) {
    this.sort_order = newOrder;
    return await this.save();
  }

  // Get folder path (breadcrumb)
  async getPath() {
    const path = [this];
    let current = this;
    
    while (current.parent_folder_id) {
      const parent = await Folder.findById(current.parent_folder_id);
      if (!parent) break;
      path.unshift(parent);
      current = parent;
    }
    
    return path;
  }

  // Count folders by bot
  static async countByBot(botId) {
    const result = await db.query(
      'SELECT COUNT(*) as count FROM folders WHERE bot_id = $1 AND active = true',
      [botId]
    );
    return result[0].count;
  }

  // Get folder stats
  static async getStats() {
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_folders,
        COUNT(CASE WHEN active = true THEN 1 END) as active_folders,
        COUNT(CASE WHEN active = false THEN 1 END) as inactive_folders,
        COUNT(CASE WHEN parent_folder_id IS NULL THEN 1 END) as root_folders,
        COUNT(DISTINCT bot_id) as bots_with_folders
      FROM folders
    `);
    return result[0];
  }

  // Get available icons
  static getAvailableIcons() {
    return [
      'folder', 'message-circle', 'calendar', 'settings', 'users',
      'phone', 'mail', 'bell', 'clock', 'star', 'heart', 'home',
      'briefcase', 'shopping-bag', 'credit-card', 'map-pin',
      'camera', 'music', 'video', 'file', 'image', 'paperclip'
    ];
  }

  // Get available colors
  static getAvailableColors() {
    return [
      '#3B82F6', // Blue
      '#10B981', // Green
      '#F59E0B', // Yellow
      '#EF4444', // Red
      '#8B5CF6', // Purple
      '#06B6D4', // Cyan
      '#84CC16', // Lime
      '#F97316', // Orange
      '#EC4899', // Pink
      '#6B7280'  // Gray
    ];
  }

  // Convert to JSON for API response
  toJSON() {
    return {
      id: this.id,
      folder_uuid: this.folder_uuid,
      bot_id: this.bot_id,
      bot_uuid: this.bot_uuid,
      workspace_id: this.workspace_id,
      workspace_uuid: this.workspace_uuid,
      hotel_id: this.hotel_id,
      hotel_uuid: this.hotel_uuid,
      name: this.name,
      description: this.description,
      color: this.color,
      icon: this.icon,
      parent_folder_id: this.parent_folder_id,
      sort_order: this.sort_order,
      active: this.active,
      created_at: this.created_at,
      updated_at: this.updated_at,
      bot_name: this.bot_name,
      hotel_nome: this.hotel_nome
    };
  }
}

module.exports = Folder;