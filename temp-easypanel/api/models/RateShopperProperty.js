const db = require('../config/database');

class RateShopperProperty {
  constructor(data = {}) {
    this.id = data.id;
    this.uuid = data.uuid;
    this.hotel_id = data.hotel_id;
    this.property_name = data.property_name;
    this.booking_url = data.booking_url;
    this.competitor_type = data.competitor_type || 'OTA';
    this.ota_name = data.ota_name || 'Booking.com';
    this.platform = data.platform || this.detectPlatformFromUrl(data.booking_url) || 'booking';
    this.location = data.location;
    this.category = data.category;
    this.max_bundle_size = data.max_bundle_size || 7;
    this.active = data.active !== undefined ? data.active : true;
    this.is_main_property = data.is_main_property !== undefined ? data.is_main_property : false;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async findById(id) {
    const result = await db.query('SELECT * FROM rate_shopper_properties WHERE id = $1', [id]);
    return result.length > 0 ? new RateShopperProperty(result[0]) : null;
  }

  static async findByUuid(uuid) {
    const result = await db.query('SELECT * FROM rate_shopper_properties WHERE uuid = $1', [uuid]);
    return result.length > 0 ? new RateShopperProperty(result[0]) : null;
  }

  static async findByHotel(hotelId, filters = {}) {
    let query = 'SELECT * FROM rate_shopper_properties WHERE hotel_id = $1';
    const params = [hotelId];

    let paramCount = 1;
    
    if (filters.active !== undefined) {
      paramCount++;
      query += ` AND active = $${paramCount}`;
      params.push(filters.active);
    }

    if (filters.competitor_type) {
      paramCount++;
      query += ` AND competitor_type = $${paramCount}`;
      params.push(filters.competitor_type);
    }

    if (filters.ota_name) {
      paramCount++;
      query += ` AND ota_name = $${paramCount}`;
      params.push(filters.ota_name);
    }

    query += ' ORDER BY property_name';

    const result = await db.query(query, params);
    return result.map(row => new RateShopperProperty(row));
  }

  static async findAll(filters = {}) {
    let query = 'SELECT rsp.*, h.name as hotel_name FROM rate_shopper_properties rsp JOIN hotels h ON rsp.hotel_id = h.id WHERE 1=1';
    const params = [];

    if (filters.active !== undefined) {
      query += ' AND rsp.active = $2';
      params.push(filters.active);
    }

    if (filters.hotel_id) {
      query += ' AND rsp.hotel_id = $3';
      params.push(filters.hotel_id);
    }

    query += ' ORDER BY h.name, rsp.property_name';

    const result = await db.query(query, params);
    return result.map(row => {
      const property = new RateShopperProperty(row);
      property.hotel_name = row.hotel_name;
      return property;
    });
  }

  async save() {
    if (this.id) {
      // Update existing property - PostgreSQL style
      const result = await db.query(`
        UPDATE rate_shopper_properties SET 
        property_name = $1, booking_url = $2, competitor_type = $3, ota_name = $4, platform = $5,
        location = $6, category = $7, max_bundle_size = $8, active = $9, is_main_property = $10
        WHERE id = $11
      `, [
        this.property_name, this.booking_url, this.competitor_type, this.ota_name, this.platform,
        this.location, this.category, this.max_bundle_size, this.active, this.is_main_property, this.id
      ]);
      return result;
    } else {
      // Create new property - PostgreSQL style with RETURNING
      const result = await db.query(`
        INSERT INTO rate_shopper_properties (
          hotel_id, property_name, booking_url, competitor_type, ota_name, platform,
          location, category, max_bundle_size, active, is_main_property
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id, uuid
      `, [
        this.hotel_id, this.property_name, this.booking_url, this.competitor_type,
        this.ota_name, this.platform, this.location, this.category, this.max_bundle_size, this.active, this.is_main_property
      ]);
      
      if (result && result.length > 0) {
        this.id = result[0].id;
        this.uuid = result[0].uuid;
      }
      
      return result;
    }
  }

  async delete() {
    if (!this.id) {
      throw new Error('Cannot delete property without ID');
    }
    return await db.query('DELETE FROM rate_shopper_properties WHERE id = $1', [this.id]);
  }

  // Get latest prices for this property
  async getLatestPrices(dateRange = {}) {
    let query = `
      SELECT rsp.*, rs.search_type, rs.completed_at as search_completed_at
      FROM rate_shopper_prices rsp
      JOIN rate_shopper_searches rs ON rsp.search_id = rs.id
      WHERE rsp.property_id = $1
    `;
    const params = [this.id];

    if (dateRange.start) {
      query += ' AND rsp.check_in_date >= $2';
      params.push(dateRange.start);
    }

    if (dateRange.end) {
      query += ' AND rsp.check_in_date <= $' + (params.length + 1);
      params.push(dateRange.end);
    }

    query += ' ORDER BY rsp.check_in_date, rsp.scraped_at DESC';

    if (dateRange.limit) {
      query += ' LIMIT $' + (params.length + 1);
      params.push(dateRange.limit);
    }

    return await db.query(query, params);
  }

  // Get price analytics for this property
  async getPriceAnalytics(days = 30) {
    const query = `
      SELECT 
        DATE(rsp.check_in_date) as date,
        COUNT(*) as total_prices,
        AVG(rsp.price) as avg_price,
        MIN(rsp.price) as min_price,
        MAX(rsp.price) as max_price,
        COUNT(CASE WHEN rsp.availability_status = 'AVAILABLE' THEN 1 END) as available_count
      FROM rate_shopper_prices rsp
      JOIN rate_shopper_searches rs ON rsp.search_id = rs.id
      WHERE rsp.property_id = $1
        AND rsp.check_in_date >= CURRENT_DATE - INTERVAL '$2 days'
        AND rs.status = 'COMPLETED'
      GROUP BY DATE(rsp.check_in_date)
      ORDER BY date
    `;
    
    return await db.query(query, [this.id, days]);
  }

  // Get searches for this property
  async getSearches(filters = {}) {
    let query = 'SELECT * FROM rate_shopper_searches WHERE property_id = $1';
    const params = [this.id];

    if (filters.status) {
      query += ' AND status = $' + (params.length + 1);
      params.push(filters.status);
    }

    if (filters.search_type) {
      query += ' AND search_type = $' + (params.length + 1);
      params.push(filters.search_type);
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ' LIMIT $' + (params.length + 1);
      params.push(filters.limit);
    }

    return await db.query(query, params);
  }

  // Check if URL is valid (Booking.com or Artaxnet)
  static isValidUrl(url) {
    try {
      const urlObj = new URL(url);
      return (
        // Booking.com URLs
        (urlObj.hostname.includes('booking.com') && 
         (url.includes('/hotel/') || url.includes('/property/'))) ||
        // Artaxnet URLs
        urlObj.hostname.includes('artaxnet.com')
      );
    } catch {
      return false;
    }
  }

  // Check if URL is valid Booking.com URL (manter compatibilidade)
  static isValidBookingUrl(url) {
    return this.isValidUrl(url) && url.includes('booking.com');
  }

  // Detecta plataforma baseada na URL
  detectPlatformFromUrl(url) {
    if (!url) return 'booking';
    
    try {
      const urlLower = url.toLowerCase();
      
      if (urlLower.includes('artaxnet.com') || urlLower.includes('artax')) {
        return 'artaxnet';
      }
      
      if (urlLower.includes('booking.com')) {
        return 'booking';
      }
      
      return 'booking'; // Default
    } catch (error) {
      return 'booking';
    }
  }

  // Extract property info from URL (Booking or Artaxnet)
  static extractInfoFromUrl(url) {
    try {
      if (url.toLowerCase().includes('artaxnet.com')) {
        // Para Artaxnet, extrair do subdomínio
        const urlObj = new URL(url);
        const subdomain = urlObj.hostname.split('.')[0];
        const propertyName = subdomain.replace(/-/g, ' ').replace(/_/g, ' ');
        
        return {
          property_name: propertyName.toUpperCase(),
          ota_name: 'Artaxnet',
          competitor_type: 'OTA',
          platform: 'artaxnet'
        };
      } else {
        // Para Booking.com
        const urlParts = url.split('/');
        const hotelPart = urlParts.find(part => part.includes('hotel')) || '';
        const propertyName = hotelPart.replace(/^hotel-/, '').replace(/\..*$/, '').replace(/-/g, ' ');
        
        return {
          property_name: propertyName.toUpperCase(),
          ota_name: 'Booking.com',
          competitor_type: 'OTA',
          platform: 'booking'
        };
      }
    } catch {
      return {
        property_name: 'Unknown Property',
        ota_name: 'Booking.com',
        competitor_type: 'OTA',
        platform: 'booking'
      };
    }
  }

  // Validate property data
  validate() {
    const errors = [];

    if (!this.property_name || this.property_name.trim().length === 0) {
      errors.push('Property name is required');
    }

    if (!this.booking_url || !RateShopperProperty.isValidUrl(this.booking_url)) {
      errors.push('Valid URL is required (Booking.com or Artaxnet)');
    }

    if (!this.hotel_id) {
      errors.push('Hotel ID is required');
    }

    if (this.max_bundle_size && (this.max_bundle_size < 1 || this.max_bundle_size > 30)) {
      errors.push('Max bundle size must be between 1 and 30');
    }

    return errors;
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      uuid: this.uuid,
      hotel_id: this.hotel_id,
      property_name: this.property_name,
      booking_url: this.booking_url,
      competitor_type: this.competitor_type,
      ota_name: this.ota_name,
      platform: this.platform,
      location: this.location,
      category: this.category,
      max_bundle_size: this.max_bundle_size,
      active: this.active,
      is_main_property: this.is_main_property,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = RateShopperProperty;