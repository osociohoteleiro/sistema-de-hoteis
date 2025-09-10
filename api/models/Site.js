const db = require('../config/database');

class Site {
  constructor(data = {}) {
    this.id = data.id;
    this.site_uuid = data.site_uuid;
    this.hotel_id = data.hotel_id;
    this.subdomain = data.subdomain;
    this.custom_domain = data.custom_domain;
    this.theme_id = data.theme_id;
    this.settings = data.settings ? (typeof data.settings === 'string' ? JSON.parse(data.settings) : data.settings) : {};
    this.seo_config = data.seo_config ? (typeof data.seo_config === 'string' ? JSON.parse(data.seo_config) : data.seo_config) : {};
    this.analytics_config = data.analytics_config ? (typeof data.analytics_config === 'string' ? JSON.parse(data.analytics_config) : data.analytics_config) : {};
    this.published_at = data.published_at;
    this.status = data.status || 'DRAFT';
    this.plan_type = data.plan_type || 'STARTER';
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // CRUD Methods
  static async findById(id) {
    const result = await db.query('SELECT * FROM hotel_sites WHERE id = $1', [id]);
    return result.length > 0 ? new Site(result[0]) : null;
  }

  static async findByUuid(uuid) {
    const result = await db.query('SELECT * FROM hotel_sites WHERE site_uuid = $1', [uuid]);
    return result.length > 0 ? new Site(result[0]) : null;
  }

  static async findBySubdomain(subdomain) {
    const result = await db.query('SELECT * FROM hotel_sites WHERE subdomain = $1', [subdomain]);
    return result.length > 0 ? new Site(result[0]) : null;
  }

  static async findByCustomDomain(domain) {
    const result = await db.query('SELECT * FROM hotel_sites WHERE custom_domain = $1', [domain]);
    return result.length > 0 ? new Site(result[0]) : null;
  }

  static async findByDomain(domain) {
    // First try custom domain, then subdomain
    let site = await Site.findByCustomDomain(domain);
    if (!site) {
      // Extract subdomain from domain like "hotel-name.seusite.com"
      const subdomain = domain.split('.')[0];
      site = await Site.findBySubdomain(subdomain);
    }
    return site;
  }

  static async findByHotel(hotelId, filters = {}) {
    let query = 'SELECT * FROM hotel_sites WHERE hotel_id = ?';
    const params = [hotelId];
    
    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    
    if (filters.plan_type) {
      query += ' AND plan_type = ?';
      params.push(filters.plan_type);
    }
    
    query += ' ORDER BY created_at DESC';
    
    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));
    }

    const result = await db.query(query, params);
    return result.map(row => new Site(row));
  }

  static async findAll(filters = {}) {
    let query = 'SELECT * FROM hotel_sites WHERE 1=1';
    const params = [];
    
    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    
    if (filters.plan_type) {
      query += ' AND plan_type = ?';
      params.push(filters.plan_type);
    }
    
    if (filters.search) {
      query += ' AND (subdomain LIKE ? OR custom_domain LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }
    
    query += ' ORDER BY created_at DESC';
    
    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));
    }

    const result = await db.query(query, params);
    return result.map(row => new Site(row));
  }

  async save() {
    if (this.id) {
      // Update existing site
      const result = await db.query(`
        UPDATE hotel_sites SET 
        subdomain = $1, custom_domain = $2, theme_id = $3, settings = $4, 
        seo_config = $5, analytics_config = $6, status = $7, plan_type = $8
        WHERE id = $9
      `, [
        this.subdomain, this.custom_domain, this.theme_id,
        JSON.stringify(this.settings), JSON.stringify(this.seo_config),
        JSON.stringify(this.analytics_config), this.status, this.plan_type, this.id
      ]);
      return result;
    } else {
      // Create new site
      const result = await db.query(`
        INSERT INTO hotel_sites (hotel_id, name, subdomain, custom_domain, description, theme_id, 
                                settings, seo_title, seo_description, seo_keywords, seo_config, 
                                analytics_config, published, active, plan_type) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id, site_uuid
      `, [
        this.hotel_id, this.name, this.subdomain, this.custom_domain, this.description, this.theme_id,
        JSON.stringify(this.settings), this.seo_title, this.seo_description, this.seo_keywords,
        JSON.stringify(this.seo_config), JSON.stringify(this.analytics_config),
        this.published, this.active, this.plan_type
      ]);
      
      this.id = result.rows[0].id;
      this.site_uuid = result.rows[0].site_uuid;
      
      return result;
    }
  }

  async delete() {
    if (!this.id) {
      throw new Error('Cannot delete site without ID');
    }
    return await db.query('DELETE FROM hotel_sites WHERE id = $1', [this.id]);
  }

  // Status Management
  async publish() {
    this.status = 'PUBLISHED';
    this.published_at = new Date().toISOString();
    await db.query(
      'UPDATE hotel_sites SET status = $1, published_at = $2 WHERE id = $3',
      [this.status, this.published_at, this.id]
    );
  }

  async unpublish() {
    this.status = 'DRAFT';
    await db.query('UPDATE hotel_sites SET status = $1 WHERE id = $2', [this.status, this.id]);
  }

  async setMaintenance() {
    this.status = 'MAINTENANCE';
    await db.query('UPDATE hotel_sites SET status = $1 WHERE id = $2', [this.status, this.id]);
  }

  // Pages Management
  async getPages(filters = {}) {
    const SitePage = require('./SitePage');
    return await SitePage.findBySite(this.id, filters);
  }

  async createPage(data) {
    const SitePage = require('./SitePage');
    const page = new SitePage({
      ...data,
      site_id: this.id
    });
    await page.save();
    return page;
  }

  async getHomepage() {
    const SitePage = require('./SitePage');
    const pages = await SitePage.findBySite(this.id, { is_homepage: true });
    return pages[0] || null;
  }

  async setHomepage(pageId) {
    const SitePage = require('./SitePage');
    
    // Remove homepage flag from all pages
    await db.query('UPDATE site_pages SET is_homepage = FALSE WHERE site_id = $1', [this.id]);
    
    // Set new homepage
    await db.query('UPDATE site_pages SET is_homepage = TRUE WHERE id = $1 AND site_id = $2', [pageId, this.id]);
  }

  // Theme Management
  async getTheme() {
    if (!this.theme_id) return null;
    
    const SiteTheme = require('./SiteTheme');
    return await SiteTheme.findById(this.theme_id);
  }

  async setTheme(themeId) {
    this.theme_id = themeId;
    await db.query('UPDATE hotel_sites SET theme_id = $1 WHERE id = $2', [themeId, this.id]);
  }

  // Hotel Information
  async getHotel() {
    const Hotel = require('./Hotel');
    return await Hotel.findById(this.hotel_id);
  }

  // Media Management
  async getMedia(filters = {}) {
    let query = 'SELECT * FROM site_media WHERE site_id = ?';
    const params = [this.id];
    
    if (filters.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }
    
    if (filters.folder) {
      query += ' AND folder = ?';
      params.push(filters.folder);
    }
    
    query += ' ORDER BY created_at DESC';
    
    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));
    }

    return await db.query(query, params);
  }

  async addMedia(data) {
    const result = await db.query(`
      INSERT INTO site_media (site_id, hotel_id, url, type, alt_text, folder, size, dimensions)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      this.id, this.hotel_id, data.url, data.type || 'IMAGE',
      data.alt_text, data.folder, data.size, JSON.stringify(data.dimensions || {})
    ]);
    
    return result.insertId;
  }

  // Analytics
  async getAnalytics(startDate = null, endDate = null) {
    let query = 'SELECT * FROM site_analytics WHERE site_id = ?';
    const params = [this.id];
    
    if (startDate) {
      query += ' AND date >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND date <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY date DESC';
    
    const result = await db.query(query, params);
    return result.map(row => ({
      ...row,
      top_pages: row.top_pages ? JSON.parse(row.top_pages) : [],
      traffic_sources: row.traffic_sources ? JSON.parse(row.traffic_sources) : []
    }));
  }

  async recordAnalytics(date, data) {
    const existingRecord = await db.query(
      'SELECT id FROM site_analytics WHERE site_id = $1 AND date = $2',
      [this.id, date]
    );

    if (existingRecord.length > 0) {
      // Update existing record
      await db.query(`
        UPDATE site_analytics SET 
        page_views = $1, unique_visitors = $2, bookings_count = $3,
        conversion_rate = $4, revenue = $5, top_pages = $6, traffic_sources = $7
        WHERE site_id = $8 AND date = $9
      `, [
        data.page_views, data.unique_visitors, data.bookings_count,
        data.conversion_rate, data.revenue,
        JSON.stringify(data.top_pages || []),
        JSON.stringify(data.traffic_sources || []),
        this.id, date
      ]);
    } else {
      // Create new record
      await db.query(`
        INSERT INTO site_analytics 
        (site_id, date, page_views, unique_visitors, bookings_count, 
         conversion_rate, revenue, top_pages, traffic_sources)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        this.id, date, data.page_views, data.unique_visitors, data.bookings_count,
        data.conversion_rate, data.revenue,
        JSON.stringify(data.top_pages || []),
        JSON.stringify(data.traffic_sources || [])
      ]);
    }
  }

  // Bookings
  async getBookings(filters = {}) {
    const SiteBooking = require('./SiteBooking');
    return await SiteBooking.findBySite(this.id, filters);
  }

  // Validation
  static validateSubdomain(subdomain) {
    // Check format: only letters, numbers, and hyphens, 3-50 chars
    const regex = /^[a-zA-Z0-9-]{3,50}$/;
    if (!regex.test(subdomain)) {
      return false;
    }
    
    // Check for reserved words
    const reserved = [
      'www', 'api', 'admin', 'app', 'mail', 'ftp', 'blog', 'shop',
      'store', 'test', 'dev', 'staging', 'dashboard', 'panel', 'support'
    ];
    
    return !reserved.includes(subdomain.toLowerCase());
  }

  static validateDomain(domain) {
    // Basic domain validation
    const regex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    return regex.test(domain);
  }

  // Utility methods
  getSetting(key, defaultValue = null) {
    return this.settings && this.settings[key] !== undefined ? this.settings[key] : defaultValue;
  }

  setSetting(key, value) {
    if (!this.settings) this.settings = {};
    this.settings[key] = value;
  }

  getSeoConfig(key, defaultValue = null) {
    return this.seo_config && this.seo_config[key] !== undefined ? this.seo_config[key] : defaultValue;
  }

  setSeoConfig(key, value) {
    if (!this.seo_config) this.seo_config = {};
    this.seo_config[key] = value;
  }

  isPublished() {
    return this.status === 'PUBLISHED';
  }

  isDraft() {
    return this.status === 'DRAFT';
  }

  isInMaintenance() {
    return this.status === 'MAINTENANCE';
  }
}

module.exports = Site;