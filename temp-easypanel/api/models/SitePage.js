const db = require('../config/database');

class SitePage {
  constructor(data = {}) {
    this.id = data.id;
    this.page_uuid = data.page_uuid;
    this.site_id = data.site_id;
    this.slug = data.slug;
    this.title = data.title;
    this.meta_description = data.meta_description;
    this.content_blocks = data.content_blocks ? (typeof data.content_blocks === 'string' ? JSON.parse(data.content_blocks) : data.content_blocks) : [];
    this.template = data.template;
    this.layout_config = data.layout_config ? (typeof data.layout_config === 'string' ? JSON.parse(data.layout_config) : data.layout_config) : {};
    this.is_homepage = data.is_homepage || false;
    this.is_system_page = data.is_system_page || false;
    this.published_at = data.published_at;
    this.status = data.status || 'DRAFT';
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // CRUD Methods
  static async findById(id) {
    const result = await db.query('SELECT * FROM site_pages WHERE id = ?', [id]);
    return result.length > 0 ? new SitePage(result[0]) : null;
  }

  static async findByUuid(uuid) {
    const result = await db.query('SELECT * FROM site_pages WHERE page_uuid = ?', [uuid]);
    return result.length > 0 ? new SitePage(result[0]) : null;
  }

  static async findBySlug(siteId, slug) {
    const result = await db.query('SELECT * FROM site_pages WHERE site_id = ? AND slug = ?', [siteId, slug]);
    return result.length > 0 ? new SitePage(result[0]) : null;
  }

  static async findBySite(siteId, filters = {}) {
    let query = 'SELECT * FROM site_pages WHERE site_id = ?';
    const params = [siteId];
    
    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    
    if (filters.is_homepage !== undefined) {
      query += ' AND is_homepage = ?';
      params.push(filters.is_homepage);
    }
    
    if (filters.is_system_page !== undefined) {
      query += ' AND is_system_page = ?';
      params.push(filters.is_system_page);
    }
    
    if (filters.template) {
      query += ' AND template = ?';
      params.push(filters.template);
    }
    
    if (filters.search) {
      query += ' AND (title LIKE ? OR slug LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }
    
    // Order by homepage first, then by creation date
    query += ' ORDER BY is_homepage DESC, created_at DESC';
    
    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));
    }

    const result = await db.query(query, params);
    return result.map(row => new SitePage(row));
  }

  static async findAll(filters = {}) {
    let query = 'SELECT * FROM site_pages WHERE 1=1';
    const params = [];
    
    if (filters.site_id) {
      query += ' AND site_id = ?';
      params.push(filters.site_id);
    }
    
    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    
    if (filters.template) {
      query += ' AND template = ?';
      params.push(filters.template);
    }
    
    if (filters.search) {
      query += ' AND (title LIKE ? OR slug LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }
    
    query += ' ORDER BY created_at DESC';
    
    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));
    }

    const result = await db.query(query, params);
    return result.map(row => new SitePage(row));
  }

  async save() {
    if (this.id) {
      // Update existing page
      const result = await db.query(`
        UPDATE site_pages SET 
        slug = ?, title = ?, meta_description = ?, content_blocks = ?, 
        template = ?, layout_config = ?, is_homepage = ?, is_system_page = ?, status = ?
        WHERE id = ?
      `, [
        this.slug, this.title, this.meta_description,
        JSON.stringify(this.content_blocks), this.template,
        JSON.stringify(this.layout_config), this.is_homepage,
        this.is_system_page, this.status, this.id
      ]);
      return result;
    } else {
      // Create new page
      const result = await db.query(`
        INSERT INTO site_pages (site_id, slug, title, meta_description, content_blocks, 
                               template, layout_config, is_homepage, is_system_page, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        this.site_id, this.slug, this.title, this.meta_description,
        JSON.stringify(this.content_blocks), this.template,
        JSON.stringify(this.layout_config), this.is_homepage,
        this.is_system_page, this.status
      ]);
      
      this.id = result.insertId;
      
      // Get the generated UUID
      const newPage = await SitePage.findById(this.id);
      this.page_uuid = newPage.page_uuid;
      
      return result;
    }
  }

  async delete() {
    if (!this.id) {
      throw new Error('Cannot delete page without ID');
    }
    return await db.query('DELETE FROM site_pages WHERE id = ?', [this.id]);
  }

  // Status Management
  async publish() {
    this.status = 'PUBLISHED';
    this.published_at = new Date().toISOString();
    await db.query(
      'UPDATE site_pages SET status = ?, published_at = ? WHERE id = ?',
      [this.status, this.published_at, this.id]
    );
  }

  async unpublish() {
    this.status = 'DRAFT';
    await db.query('UPDATE site_pages SET status = ? WHERE id = ?', [this.status, this.id]);
  }

  // Content Block Management
  addBlock(block) {
    if (!this.content_blocks) this.content_blocks = [];
    
    const newBlock = {
      id: this.generateBlockId(),
      type: block.type,
      data: block.data || {},
      style: block.style || {},
      position: this.content_blocks.length,
      ...block
    };
    
    this.content_blocks.push(newBlock);
    return newBlock.id;
  }

  updateBlock(blockId, updates) {
    if (!this.content_blocks) return false;
    
    const blockIndex = this.content_blocks.findIndex(block => block.id === blockId);
    if (blockIndex === -1) return false;
    
    this.content_blocks[blockIndex] = {
      ...this.content_blocks[blockIndex],
      ...updates
    };
    
    return true;
  }

  removeBlock(blockId) {
    if (!this.content_blocks) return false;
    
    const blockIndex = this.content_blocks.findIndex(block => block.id === blockId);
    if (blockIndex === -1) return false;
    
    this.content_blocks.splice(blockIndex, 1);
    
    // Reorder positions
    this.content_blocks.forEach((block, index) => {
      block.position = index;
    });
    
    return true;
  }

  moveBlock(blockId, newPosition) {
    if (!this.content_blocks) return false;
    
    const blockIndex = this.content_blocks.findIndex(block => block.id === blockId);
    if (blockIndex === -1) return false;
    
    const block = this.content_blocks.splice(blockIndex, 1)[0];
    this.content_blocks.splice(newPosition, 0, block);
    
    // Update positions
    this.content_blocks.forEach((block, index) => {
      block.position = index;
    });
    
    return true;
  }

  getBlock(blockId) {
    if (!this.content_blocks) return null;
    return this.content_blocks.find(block => block.id === blockId);
  }

  getBlocksByType(type) {
    if (!this.content_blocks) return [];
    return this.content_blocks.filter(block => block.type === type);
  }

  // Template and Layout
  async getSite() {
    const Site = require('./Site');
    return await Site.findById(this.site_id);
  }

  async getTheme() {
    const site = await this.getSite();
    return site ? await site.getTheme() : null;
  }

  // Homepage Management
  async setAsHomepage() {
    // First, remove homepage flag from all other pages in the site
    await db.query(
      'UPDATE site_pages SET is_homepage = FALSE WHERE site_id = ? AND id != ?',
      [this.site_id, this.id]
    );
    
    // Then set this page as homepage
    this.is_homepage = true;
    await db.query(
      'UPDATE site_pages SET is_homepage = TRUE WHERE id = ?',
      [this.id]
    );
  }

  async removeFromHomepage() {
    this.is_homepage = false;
    await db.query('UPDATE site_pages SET is_homepage = FALSE WHERE id = ?', [this.id]);
  }

  // System Pages (About, Contact, etc.)
  static async createSystemPage(siteId, type, data = {}) {
    const systemPages = {
      'about': {
        title: 'Sobre Nós',
        slug: 'sobre',
        template: 'about',
        meta_description: 'Conheça nossa história e nossa equipe'
      },
      'contact': {
        title: 'Contato',
        slug: 'contato',
        template: 'contact',
        meta_description: 'Entre em contato conosco'
      },
      'rooms': {
        title: 'Acomodações',
        slug: 'acomodacoes',
        template: 'rooms',
        meta_description: 'Conheça nossas acomodações'
      },
      'gallery': {
        title: 'Galeria',
        slug: 'galeria',
        template: 'gallery',
        meta_description: 'Veja fotos de nossas instalações'
      },
      'services': {
        title: 'Serviços',
        slug: 'servicos',
        template: 'services',
        meta_description: 'Conheça nossos serviços'
      }
    };

    const pageConfig = systemPages[type];
    if (!pageConfig) {
      throw new Error(`System page type '${type}' not supported`);
    }

    const page = new SitePage({
      site_id: siteId,
      ...pageConfig,
      ...data,
      is_system_page: true,
      status: 'PUBLISHED'
    });

    await page.save();
    return page;
  }

  // Validation
  static validateSlug(slug) {
    // Check format: only letters, numbers, and hyphens, 1-100 chars
    const regex = /^[a-zA-Z0-9-]{1,100}$/;
    if (!regex.test(slug)) {
      return false;
    }
    
    // Check for reserved words
    const reserved = [
      'api', 'admin', 'app', 'blog', 'shop', 'store', 'test', 'dev',
      'staging', 'dashboard', 'panel', 'support', 'www', 'mail', 'ftp'
    ];
    
    return !reserved.includes(slug.toLowerCase());
  }

  // SEO
  generateMetaDescription() {
    if (this.meta_description) return this.meta_description;
    
    // Try to generate from content blocks
    const textBlocks = this.getBlocksByType('text');
    if (textBlocks.length > 0) {
      const text = textBlocks[0].data.content || '';
      // Strip HTML and limit to 155 characters
      const plainText = text.replace(/<[^>]*>/g, '');
      return plainText.substring(0, 155) + (plainText.length > 155 ? '...' : '');
    }
    
    return `${this.title} - Página do nosso site`;
  }

  // Utility methods
  generateBlockId() {
    return 'block_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  getLayoutSetting(key, defaultValue = null) {
    return this.layout_config && this.layout_config[key] !== undefined ? this.layout_config[key] : defaultValue;
  }

  setLayoutSetting(key, value) {
    if (!this.layout_config) this.layout_config = {};
    this.layout_config[key] = value;
  }

  isPublished() {
    return this.status === 'PUBLISHED';
  }

  isDraft() {
    return this.status === 'DRAFT';
  }

  isHomepage() {
    return this.is_homepage;
  }

  isSystemPage() {
    return this.is_system_page;
  }

  // URL generation
  getUrl(baseUrl = '') {
    if (this.is_homepage) {
      return baseUrl + '/';
    }
    return baseUrl + '/' + this.slug;
  }

  getEditUrl(builderBaseUrl = '') {
    return builderBaseUrl + '/pages/' + this.id + '/edit';
  }
}

module.exports = SitePage;