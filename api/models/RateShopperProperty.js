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
    this.location = data.location;
    this.category = data.category;
    this.max_bundle_size = data.max_bundle_size || 7;
    this.active = data.active !== undefined ? data.active : true;
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
      query += ' AND rsp.active = ?';
      params.push(filters.active);
    }

    if (filters.hotel_id) {
      query += ' AND rsp.hotel_id = ?';
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
        property_name = $1, booking_url = $2, competitor_type = $3, ota_name = $4,
        location = $5, category = $6, max_bundle_size = $7, active = $8
        WHERE id = $9
      `, [
        this.property_name, this.booking_url, this.competitor_type, this.ota_name,
        this.location, this.category, this.max_bundle_size, this.active, this.id
      ]);
      return result;
    } else {
      // Create new property - PostgreSQL style with RETURNING
      const result = await db.query(`
        INSERT INTO rate_shopper_properties (
          hotel_id, property_name, booking_url, competitor_type, ota_name,
          location, category, max_bundle_size, active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, uuid
      `, [
        this.hotel_id, this.property_name, this.booking_url, this.competitor_type,
        this.ota_name, this.location, this.category, this.max_bundle_size, this.active
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
    return await db.query('DELETE FROM rate_shopper_properties WHERE id = ?', [this.id]);
  }

  // Get latest prices for this property
  async getLatestPrices(dateRange = {}) {
    let query = `
      SELECT rsp.*, rs.search_type, rs.completed_at as search_completed_at
      FROM rate_shopper_prices rsp
      JOIN rate_shopper_searches rs ON rsp.search_id = rs.id
      WHERE rsp.property_id = ?
    `;
    const params = [this.id];

    if (dateRange.start) {
      query += ' AND rsp.check_in_date >= ?';
      params.push(dateRange.start);
    }

    if (dateRange.end) {
      query += ' AND rsp.check_in_date <= ?';
      params.push(dateRange.end);
    }

    query += ' ORDER BY rsp.check_in_date, rsp.scraped_at DESC';

    if (dateRange.limit) {
      query += ' LIMIT ?';
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
      WHERE rsp.property_id = ?
        AND rsp.check_in_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        AND rs.status = 'COMPLETED'
      GROUP BY DATE(rsp.check_in_date)
      ORDER BY date
    `;
    
    return await db.query(query, [this.id, days]);
  }

  // Get searches for this property
  async getSearches(filters = {}) {
    let query = 'SELECT * FROM rate_shopper_searches WHERE property_id = ?';
    const params = [this.id];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.search_type) {
      query += ' AND search_type = ?';
      params.push(filters.search_type);
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    return await db.query(query, params);
  }

  // Check if URL is valid Booking.com URL
  static isValidBookingUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.includes('booking.com') && 
             (url.includes('/hotel/') || url.includes('/property/'));
    } catch {
      return false;
    }
  }

  // Extract property info from Booking URL
  static extractInfoFromUrl(url) {
    try {
      const urlParts = url.split('/');
      const hotelPart = urlParts.find(part => part.includes('hotel')) || '';
      const propertyName = hotelPart.replace(/^hotel-/, '').replace(/\..*$/, '').replace(/-/g, ' ');
      
      return {
        property_name: propertyName.toUpperCase(),
        ota_name: 'Booking.com',
        competitor_type: 'OTA'
      };
    } catch {
      return {
        property_name: 'Unknown Property',
        ota_name: 'Booking.com',
        competitor_type: 'OTA'
      };
    }
  }

  // Validate property data
  validate() {
    const errors = [];

    if (!this.property_name || this.property_name.trim().length === 0) {
      errors.push('Property name is required');
    }

    if (!this.booking_url || !RateShopperProperty.isValidBookingUrl(this.booking_url)) {
      errors.push('Valid Booking.com URL is required');
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
      location: this.location,
      category: this.category,
      max_bundle_size: this.max_bundle_size,
      active: this.active,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = RateShopperProperty;