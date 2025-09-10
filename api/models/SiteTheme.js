const db = require('../config/database');

class SiteTheme {
  constructor(data = {}) {
    this.id = data.id;
    this.theme_uuid = data.theme_uuid;
    this.name = data.name;
    this.category = data.category;
    this.thumbnail_url = data.thumbnail_url;
    this.preview_url = data.preview_url;
    this.config = data.config ? (typeof data.config === 'string' ? JSON.parse(data.config) : data.config) : {};
    this.styles = data.styles ? (typeof data.styles === 'string' ? JSON.parse(data.styles) : data.styles) : {};
    this.components = data.components ? (typeof data.components === 'string' ? JSON.parse(data.components) : data.components) : [];
    this.is_premium = data.is_premium || false;
    this.price = data.price || 0;
    this.active = data.active !== undefined ? data.active : true;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // CRUD Methods
  static async findById(id) {
    const result = await db.query('SELECT * FROM site_themes WHERE id = $1', [id]);
    return result.length > 0 ? new SiteTheme(result[0]) : null;
  }

  static async findByUuid(uuid) {
    const result = await db.query('SELECT * FROM site_themes WHERE theme_uuid = $1', [uuid]);
    return result.length > 0 ? new SiteTheme(result[0]) : null;
  }

  static async findByName(name) {
    const result = await db.query('SELECT * FROM site_themes WHERE name = $1', [name]);
    return result.length > 0 ? new SiteTheme(result[0]) : null;
  }

  static async findByCategory(category, filters = {}) {
    let query = 'SELECT * FROM site_themes WHERE category = ? AND active = TRUE';
    const params = [category];
    
    if (filters.is_premium !== undefined) {
      query += ' AND is_premium = ?';
      params.push(filters.is_premium);
    }
    
    if (filters.max_price) {
      query += ' AND price <= ?';
      params.push(filters.max_price);
    }
    
    query += ' ORDER BY is_premium ASC, price ASC, name ASC';
    
    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));
    }

    const result = await db.query(query, params);
    return result.map(row => new SiteTheme(row));
  }

  static async findAll(filters = {}) {
    let query = 'SELECT * FROM site_themes WHERE active = TRUE';
    const params = [];
    
    if (filters.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }
    
    if (filters.is_premium !== undefined) {
      query += ' AND is_premium = ?';
      params.push(filters.is_premium);
    }
    
    if (filters.max_price) {
      query += ' AND price <= ?';
      params.push(filters.max_price);
    }
    
    if (filters.search) {
      query += ' AND (name LIKE ? OR category LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }
    
    // Free themes first, then premium by price
    query += ' ORDER BY is_premium ASC, price ASC, name ASC';
    
    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));
    }

    const result = await db.query(query, params);
    return result.map(row => new SiteTheme(row));
  }

  static async findFree() {
    return await SiteTheme.findAll({ is_premium: false });
  }

  static async findPremium() {
    return await SiteTheme.findAll({ is_premium: true });
  }

  static async getCategories() {
    const result = await db.query(`
      SELECT category, COUNT(*) as count 
      FROM site_themes 
      WHERE active = TRUE 
      GROUP BY category 
      ORDER BY category ASC
    `);
    return result;
  }

  async save() {
    if (this.id) {
      // Update existing theme
      const result = await db.query(`
        UPDATE site_themes SET 
        name = $1, category = $2, thumbnail_url = $3, preview_url = $4, 
        config = $5, styles = $6, components = $7, is_premium = $8, 
        price = $9, active = $10
        WHERE id = $11
      `, [
        this.name, this.category, this.thumbnail_url, this.preview_url,
        JSON.stringify(this.config), JSON.stringify(this.styles),
        JSON.stringify(this.components), this.is_premium, this.price,
        this.active, this.id
      ]);
      return result;
    } else {
      // Create new theme
      const result = await db.query(`
        INSERT INTO site_themes (name, category, thumbnail_url, preview_url, 
                                 config, styles, components, is_premium, price, active) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        this.name, this.category, this.thumbnail_url, this.preview_url,
        JSON.stringify(this.config), JSON.stringify(this.styles),
        JSON.stringify(this.components), this.is_premium, this.price, this.active
      ]);
      
      this.id = result.insertId;
      
      // Get the generated UUID
      const newTheme = await SiteTheme.findById(this.id);
      this.theme_uuid = newTheme.theme_uuid;
      
      return result;
    }
  }

  async delete() {
    if (!this.id) {
      throw new Error('Cannot delete theme without ID');
    }
    
    // Check if theme is being used by any sites
    const sitesUsingTheme = await db.query('SELECT COUNT(*) as count FROM hotel_sites WHERE theme_id = $1', [this.id]);
    if (sitesUsingTheme[0].count > 0) {
      throw new Error('Cannot delete theme that is being used by sites');
    }
    
    return await db.query('DELETE FROM site_themes WHERE id = $1', [this.id]);
  }

  async deactivate() {
    this.active = false;
    await db.query('UPDATE site_themes SET active = FALSE WHERE id = $1', [this.id]);
  }

  async activate() {
    this.active = true;
    await db.query('UPDATE site_themes SET active = TRUE WHERE id = $1', [this.id]);
  }

  // Usage tracking
  async getSitesUsingTheme() {
    const Site = require('./Site');
    const result = await db.query(`
      SELECT hs.*, h.name as hotel_name 
      FROM hotel_sites hs 
      JOIN hotels h ON hs.hotel_id = h.id 
      WHERE hs.theme_id = $1 
      ORDER BY hs.created_at DESC
    `, [this.id]);
    
    return result.map(row => ({
      ...row,
      settings: row.settings ? JSON.parse(row.settings) : {},
      seo_config: row.seo_config ? JSON.parse(row.seo_config) : {}
    }));
  }

  async getUsageCount() {
    const result = await db.query('SELECT COUNT(*) as count FROM hotel_sites WHERE theme_id = $1', [this.id]);
    return result[0].count;
  }

  // Configuration management
  getConfigValue(key, defaultValue = null) {
    return this.config && this.config[key] !== undefined ? this.config[key] : defaultValue;
  }

  setConfigValue(key, value) {
    if (!this.config) this.config = {};
    this.config[key] = value;
  }

  getStyleValue(key, defaultValue = null) {
    return this.styles && this.styles[key] !== undefined ? this.styles[key] : defaultValue;
  }

  setStyleValue(key, value) {
    if (!this.styles) this.styles = {};
    this.styles[key] = value;
  }

  // Component management
  hasComponent(componentType) {
    return this.components && this.components.includes(componentType);
  }

  addComponent(componentType) {
    if (!this.components) this.components = [];
    if (!this.components.includes(componentType)) {
      this.components.push(componentType);
    }
  }

  removeComponent(componentType) {
    if (!this.components) return;
    this.components = this.components.filter(c => c !== componentType);
  }

  getAvailableComponents() {
    return this.components || [];
  }

  // Theme customization
  generateCustomizedTheme(customizations = {}) {
    const customizedTheme = {
      ...this.toObject(),
      config: { ...this.config, ...customizations.config },
      styles: { ...this.styles, ...customizations.styles }
    };
    
    return customizedTheme;
  }

  // Default themes creation
  static async createDefaultThemes() {
    const defaultThemes = [
      {
        name: 'Hotel Elegante',
        category: 'luxury',
        thumbnail_url: '/themes/elegante/thumbnail.jpg',
        preview_url: '/themes/elegante/preview.jpg',
        config: {
          primaryColor: '#1a365d',
          secondaryColor: '#e2e8f0',
          fontFamily: 'Inter',
          logoPosition: 'left',
          navigationStyle: 'horizontal'
        },
        styles: {
          headerHeight: '80px',
          borderRadius: '8px',
          shadows: true,
          animations: 'subtle'
        },
        components: ['hero', 'gallery', 'rooms', 'contact', 'booking', 'testimonials'],
        is_premium: false,
        price: 0.00
      },
      {
        name: 'Resort Tropical',
        category: 'resort',
        thumbnail_url: '/themes/tropical/thumbnail.jpg',
        preview_url: '/themes/tropical/preview.jpg',
        config: {
          primaryColor: '#0891b2',
          secondaryColor: '#fef3c7',
          fontFamily: 'Poppins',
          logoPosition: 'center',
          navigationStyle: 'horizontal'
        },
        styles: {
          headerHeight: '90px',
          borderRadius: '12px',
          shadows: false,
          animations: 'smooth'
        },
        components: ['hero', 'gallery', 'amenities', 'activities', 'contact', 'booking', 'weather'],
        is_premium: false,
        price: 0.00
      },
      {
        name: 'Boutique Moderno',
        category: 'boutique',
        thumbnail_url: '/themes/boutique/thumbnail.jpg',
        preview_url: '/themes/boutique/preview.jpg',
        config: {
          primaryColor: '#7c3aed',
          secondaryColor: '#f3f4f6',
          fontFamily: 'Montserrat',
          logoPosition: 'left',
          navigationStyle: 'sidebar'
        },
        styles: {
          headerHeight: '70px',
          borderRadius: '4px',
          shadows: true,
          animations: 'elegant'
        },
        components: ['hero', 'gallery', 'about', 'rooms', 'restaurant', 'contact', 'booking', 'events'],
        is_premium: true,
        price: 99.00
      }
    ];

    const createdThemes = [];
    for (const themeData of defaultThemes) {
      const existingTheme = await SiteTheme.findByName(themeData.name);
      if (!existingTheme) {
        const theme = new SiteTheme(themeData);
        await theme.save();
        createdThemes.push(theme);
      }
    }

    return createdThemes;
  }

  // Validation
  static validateThemeData(data) {
    const errors = [];

    if (!data.name || data.name.length < 2 || data.name.length > 100) {
      errors.push('Nome do tema deve ter entre 2 e 100 caracteres');
    }

    if (!data.category) {
      errors.push('Categoria é obrigatória');
    }

    const validCategories = ['luxury', 'resort', 'boutique', 'business', 'budget', 'eco', 'urban', 'beach'];
    if (data.category && !validCategories.includes(data.category)) {
      errors.push('Categoria inválida');
    }

    if (data.price && (isNaN(data.price) || data.price < 0)) {
      errors.push('Preço deve ser um número válido');
    }

    if (data.config && typeof data.config !== 'object') {
      errors.push('Configuração deve ser um objeto válido');
    }

    if (data.styles && typeof data.styles !== 'object') {
      errors.push('Estilos devem ser um objeto válido');
    }

    if (data.components && !Array.isArray(data.components)) {
      errors.push('Componentes devem ser um array');
    }

    return errors;
  }

  // Export/Import
  toObject() {
    return {
      id: this.id,
      theme_uuid: this.theme_uuid,
      name: this.name,
      category: this.category,
      thumbnail_url: this.thumbnail_url,
      preview_url: this.preview_url,
      config: this.config,
      styles: this.styles,
      components: this.components,
      is_premium: this.is_premium,
      price: this.price,
      active: this.active,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  static fromObject(data) {
    return new SiteTheme(data);
  }

  // Clone theme
  async clone(newName, customizations = {}) {
    const clonedData = {
      ...this.toObject(),
      name: newName,
      id: undefined,
      theme_uuid: undefined,
      ...customizations
    };

    const clonedTheme = new SiteTheme(clonedData);
    await clonedTheme.save();
    return clonedTheme;
  }

  // Utility methods
  isPremium() {
    return this.is_premium;
  }

  isFree() {
    return !this.is_premium;
  }

  isActive() {
    return this.active;
  }

  getPrimaryColor() {
    return this.getConfigValue('primaryColor', '#000000');
  }

  getSecondaryColor() {
    return this.getConfigValue('secondaryColor', '#ffffff');
  }

  getFontFamily() {
    return this.getConfigValue('fontFamily', 'Arial, sans-serif');
  }

  getLogoPosition() {
    return this.getConfigValue('logoPosition', 'left');
  }

  getNavigationStyle() {
    return this.getConfigValue('navigationStyle', 'horizontal');
  }
}

module.exports = SiteTheme;