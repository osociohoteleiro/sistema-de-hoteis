const db = require('../config/database');

class AppConfiguration {
  constructor(data = {}) {
    this.id = data.id;
    this.hotel_id = data.hotel_id;
    this.app_name = data.app_name;
    this.app_title = data.app_title;
    this.logo_url = data.logo_url;
    this.favicon_url = data.favicon_url;
    this.description = data.description;
    this.is_active = data.is_active !== undefined ? data.is_active : true;
    this.shared_from_app = data.shared_from_app;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static VALID_APPS = ['hotel-app', 'pms', 'automacao', 'site-hoteleiro'];

  static async findByAppAndHotel(appName, hotelId = null) {
    if (!AppConfiguration.VALID_APPS.includes(appName)) {
      throw new Error(`Invalid app name: ${appName}`);
    }

    const result = await db.query(
      'SELECT * FROM app_configurations WHERE app_name = $1 AND hotel_id = $2 AND is_active = true',
      [appName, hotelId]
    );
    return result.length > 0 ? new AppConfiguration(result[0]) : null;
  }

  static async findAllByHotel(hotelId = null) {
    const result = await db.query(
      'SELECT * FROM app_configurations WHERE hotel_id = $1 AND is_active = true ORDER BY app_name',
      [hotelId]
    );
    return result.map(row => new AppConfiguration(row));
  }

  static async findAllByApp(appName) {
    if (!AppConfiguration.VALID_APPS.includes(appName)) {
      throw new Error(`Invalid app name: ${appName}`);
    }

    const result = await db.query(
      'SELECT * FROM app_configurations WHERE app_name = $1 AND is_active = true ORDER BY hotel_id',
      [appName]
    );
    return result.map(row => new AppConfiguration(row));
  }

  static async findFirstByApp(appName) {
    if (!AppConfiguration.VALID_APPS.includes(appName)) {
      throw new Error(`Invalid app name: ${appName}`);
    }

    const result = await db.query(
      'SELECT * FROM app_configurations WHERE app_name = $1 AND is_active = true AND logo_url IS NOT NULL ORDER BY hotel_id LIMIT 1',
      [appName]
    );
    return result.length > 0 ? new AppConfiguration(result[0]) : null;
  }

  static async createOrUpdate(appName, hotelId, data) {
    if (!AppConfiguration.VALID_APPS.includes(appName)) {
      throw new Error(`Invalid app name: ${appName}`);
    }

    const { app_title, logo_url, favicon_url, description, shared_from_app, is_active = true } = data;

    const result = await db.query(`
      INSERT INTO app_configurations (hotel_id, app_name, app_title, logo_url, favicon_url, description, shared_from_app, is_active) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (hotel_id, app_name) DO UPDATE SET 
      app_title = EXCLUDED.app_title, 
      logo_url = EXCLUDED.logo_url,
      favicon_url = EXCLUDED.favicon_url,
      description = EXCLUDED.description,
      shared_from_app = EXCLUDED.shared_from_app,
      is_active = EXCLUDED.is_active,
      updated_at = CURRENT_TIMESTAMP
    `, [hotelId, appName, app_title, logo_url, favicon_url, description, shared_from_app, is_active]);
    
    // Buscar o registro atualizado/criado
    return await AppConfiguration.findByAppAndHotel(appName, hotelId);
  }

  static async deleteByAppAndHotel(appName, hotelId = null) {
    if (!AppConfiguration.VALID_APPS.includes(appName)) {
      throw new Error(`Invalid app name: ${appName}`);
    }

    return await db.query(
      'UPDATE app_configurations SET is_active = false WHERE app_name = $1 AND hotel_id = $2',
      [appName, hotelId]
    );
  }

  static async shareLogoFromApp(sourceApp, targetApp, hotelId = null) {
    if (!AppConfiguration.VALID_APPS.includes(sourceApp) || !AppConfiguration.VALID_APPS.includes(targetApp)) {
      throw new Error('Invalid app names for sharing');
    }

    // Buscar configuração da aplicação fonte
    const sourceConfig = await AppConfiguration.findByAppAndHotel(sourceApp, hotelId);
    if (!sourceConfig || !sourceConfig.logo_url) {
      throw new Error('Source app does not have a logo to share');
    }

    // Atualizar aplicação destino
    return await AppConfiguration.createOrUpdate(targetApp, hotelId, {
      logo_url: sourceConfig.logo_url,
      shared_from_app: sourceApp
    });
  }

  static async getAppConfigurations(hotelId = null) {
    const result = await db.query(
      'SELECT * FROM app_configurations WHERE hotel_id = $1 AND is_active = true ORDER BY app_name',
      [hotelId]
    );

    // Organizar por aplicação
    const configs = {};
    AppConfiguration.VALID_APPS.forEach(appName => {
      const config = result.find(r => r.app_name === appName);
      configs[appName] = config ? new AppConfiguration(config) : null;
    });

    return configs;
  }

  async save() {
    if (!AppConfiguration.VALID_APPS.includes(this.app_name)) {
      throw new Error(`Invalid app name: ${this.app_name}`);
    }

    if (this.id) {
      // Atualizar existente
      const result = await db.query(`
        UPDATE app_configurations SET 
        app_title = $1, logo_url = $2, favicon_url = $3, description = $4, shared_from_app = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
      `, [this.app_title, this.logo_url, this.favicon_url, this.description, this.shared_from_app, this.is_active, this.id]);
      return result;
    } else {
      // Criar novo (com ON CONFLICT DO UPDATE)
      const result = await db.query(`
        INSERT INTO app_configurations (hotel_id, app_name, app_title, logo_url, favicon_url, description, shared_from_app, is_active) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (hotel_id, app_name) DO UPDATE SET 
        app_title = EXCLUDED.app_title, 
        logo_url = EXCLUDED.logo_url,
        favicon_url = EXCLUDED.favicon_url,
        description = EXCLUDED.description,
        shared_from_app = EXCLUDED.shared_from_app,
        is_active = EXCLUDED.is_active,
        updated_at = CURRENT_TIMESTAMP
      `, [this.hotel_id, this.app_name, this.app_title, this.logo_url, this.favicon_url, this.description, this.shared_from_app, this.is_active]);
      
      this.id = result.insertId || await this._findId();
      return result;
    }
  }

  async delete() {
    if (!this.id) {
      throw new Error('Cannot delete configuration without ID');
    }
    // Soft delete - marcar como inativo
    return await db.query('UPDATE app_configurations SET is_active = false WHERE id = $1', [this.id]);
  }

  async _findId() {
    const result = await db.query(
      'SELECT id FROM app_configurations WHERE hotel_id = $1 AND app_name = $2',
      [this.hotel_id, this.app_name]
    );
    return result.length > 0 ? result[0].id : null;
  }

  toJSON() {
    return {
      id: this.id,
      hotel_id: this.hotel_id,
      app_name: this.app_name,
      app_title: this.app_title,
      logo_url: this.logo_url,
      favicon_url: this.favicon_url,
      description: this.description,
      is_active: this.is_active,
      shared_from_app: this.shared_from_app,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = AppConfiguration;