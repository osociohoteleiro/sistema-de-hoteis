const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const RateShopperProperty = require('../models/RateShopperProperty');
const RateShopperSearch = require('../models/RateShopperSearch');
const Hotel = require('../models/Hotel');
const db = require('../config/database');

// Middleware para verificar se o usuário tem acesso ao hotel
async function checkHotelAccess(req, res, next) {
  try {
    const { hotel_id } = req.params;
    const userId = req.user.id;
    
    // Verificar se o usuário tem acesso ao hotel
    const hotel = await Hotel.findById(hotel_id);
    if (!hotel) {
      return res.status(404).json({ error: 'Hotel not found' });
    }

    // Se for SUPER_ADMIN, tem acesso total
    if (req.user.user_type === 'SUPER_ADMIN') {
      req.hotel = hotel;
      return next();
    }

    // Verificar acesso do usuário ao hotel
    const userHotels = await hotel.getUsers();
    const hasAccess = userHotels.some(uh => uh.id === userId && uh.hotel_active);
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this hotel' });
    }

    req.hotel = hotel;
    next();
  } catch (error) {
    console.error('Hotel access check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ============================================
// DASHBOARD & ANALYTICS
// ============================================

// GET /api/rate-shopper/:hotel_id/dashboard (TEMPORARY - REMOVE AUTH FOR TESTING)
router.get('/:hotel_id/dashboard', async (req, res) => {
  try {
    const hotelId = req.params.hotel_id;

    // Summary stats
    const summary = await db.query(`
      SELECT 
        COUNT(DISTINCT rsp.id) as total_properties,
        COUNT(DISTINCT rs.id) as total_searches,
        COUNT(DISTINCT rsp_prices.id) as total_prices,
        COUNT(DISTINCT CASE WHEN rs.status = 'RUNNING' THEN rs.id END) as running_searches,
        COALESCE(AVG(rsp_prices.price), 0) as avg_price,
        COALESCE(MIN(rsp_prices.price), 0) as min_price,
        COALESCE(MAX(rsp_prices.price), 0) as max_price
      FROM hotels h
      LEFT JOIN rate_shopper_properties rsp ON h.id = rsp.hotel_id AND rsp.active = TRUE
      LEFT JOIN rate_shopper_searches rs ON h.id = rs.hotel_id
      LEFT JOIN rate_shopper_prices rsp_prices ON rs.id = rsp_prices.search_id
      WHERE h.id = ? AND rsp_prices.scraped_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `, [hotelId]);

    // Recent searches
    const recentSearches = await RateShopperSearch.findByHotel(hotelId, { limit: 10 });

    // Price trends (last 30 days)
    const priceTrends = await db.query(`
      SELECT 
        DATE(rsp.scraped_at) as date,
        rsp_prop.property_name,
        COALESCE(AVG(rsp.price), 0) as avg_price,
        COUNT(rsp.id) as price_count
      FROM rate_shopper_prices rsp
      JOIN rate_shopper_searches rs ON rsp.search_id = rs.id
      JOIN rate_shopper_properties rsp_prop ON rsp.property_id = rsp_prop.id
      WHERE rs.hotel_id = ?
        AND rsp.scraped_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND rs.status = 'COMPLETED'
      GROUP BY DATE(rsp.scraped_at), rsp.property_id
      ORDER BY date DESC, rsp_prop.property_name
    `, [hotelId]);

    // Properties with latest prices
    const propertiesWithPrices = await db.query(`
      SELECT 
        rsp_prop.*,
        latest.latest_price,
        latest.latest_scraped_at,
        latest.price_count_30d,
        latest.avg_price_30d
      FROM rate_shopper_properties rsp_prop
      LEFT JOIN (
        SELECT 
          rsp.property_id,
          rsp.price as latest_price,
          rsp.scraped_at as latest_scraped_at,
          COUNT(rsp2.id) as price_count_30d,
          COALESCE(AVG(rsp2.price), 0) as avg_price_30d
        FROM rate_shopper_prices rsp
        JOIN rate_shopper_searches rs ON rsp.search_id = rs.id
        LEFT JOIN rate_shopper_prices rsp2 ON rsp.property_id = rsp2.property_id 
          AND rsp2.scraped_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        WHERE rsp.scraped_at = (
          SELECT MAX(rsp3.scraped_at)
          FROM rate_shopper_prices rsp3
          JOIN rate_shopper_searches rs3 ON rsp3.search_id = rs3.id
          WHERE rsp3.property_id = rsp.property_id AND rs3.status = 'COMPLETED'
        )
        GROUP BY rsp.property_id, rsp.price, rsp.scraped_at
      ) latest ON rsp_prop.id = latest.property_id
      WHERE rsp_prop.hotel_id = ? AND rsp_prop.active = TRUE
      ORDER BY rsp_prop.property_name
    `, [hotelId]);

    // Converter valores numéricos que vêm como strings do MySQL
    const summaryData = summary[0] || {};
    if (summaryData.avg_price !== undefined) {
      summaryData.avg_price = parseFloat(summaryData.avg_price) || 0;
      summaryData.min_price = parseFloat(summaryData.min_price) || 0;
      summaryData.max_price = parseFloat(summaryData.max_price) || 0;
    }

    // Converter preços em price_trends
    priceTrends.forEach(trend => {
      if (trend.avg_price) {
        trend.avg_price = parseFloat(trend.avg_price);
      }
    });

    // Converter preços em properties
    propertiesWithPrices.forEach(prop => {
      if (prop.latest_price) {
        prop.latest_price = parseFloat(prop.latest_price);
      }
      if (prop.avg_price_30d) {
        prop.avg_price_30d = parseFloat(prop.avg_price_30d);
      }
    });

    res.json({
      success: true,
      data: {
        summary: summaryData,
        recent_searches: recentSearches,
        price_trends: priceTrends,
        properties: propertiesWithPrices
      }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

// ============================================
// PROPERTIES MANAGEMENT
// ============================================

// GET /api/rate-shopper/:hotel_id/properties (TEMPORARY - REMOVE AUTH FOR TESTING)
router.get('/:hotel_id/properties', async (req, res) => {
  try {
    const hotelId = req.params.hotel_id;
    const { active, competitor_type } = req.query;
    
    const filters = {};
    if (active !== undefined) filters.active = active === 'true';
    if (competitor_type) filters.competitor_type = competitor_type;

    const properties = await RateShopperProperty.findByHotel(hotelId, filters);

    res.json({
      success: true,
      data: properties
    });
  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({ error: 'Failed to get properties' });
  }
});

// POST /api/rate-shopper/:hotel_id/properties
router.post('/:hotel_id/properties', authenticateToken, checkHotelAccess, async (req, res) => {
  try {
    const hotelId = req.params.hotel_id;
    const { property_name, booking_url, location, category, max_bundle_size } = req.body;

    // Validate URL
    if (!RateShopperProperty.isValidBookingUrl(booking_url)) {
      return res.status(400).json({ error: 'Invalid Booking.com URL' });
    }

    // Extract info from URL if not provided
    const urlInfo = RateShopperProperty.extractInfoFromUrl(booking_url);
    
    const property = new RateShopperProperty({
      hotel_id: hotelId,
      property_name: property_name || urlInfo.property_name,
      booking_url,
      location,
      category,
      max_bundle_size: max_bundle_size || 7,
      competitor_type: urlInfo.competitor_type,
      ota_name: urlInfo.ota_name
    });

    const errors = property.validate();
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    await property.save();

    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data: property
    });

  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({ error: 'Failed to create property' });
  }
});

// PUT /api/rate-shopper/properties/:property_id
router.put('/properties/:property_id', authenticateToken, async (req, res) => {
  try {
    const property = await RateShopperProperty.findById(req.params.property_id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Check hotel access
    const hotel = await Hotel.findById(property.hotel_id);
    if (!hotel) {
      return res.status(404).json({ error: 'Hotel not found' });
    }

    // Update property data
    Object.assign(property, req.body);

    const errors = property.validate();
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    await property.save();

    res.json({
      success: true,
      message: 'Property updated successfully',
      data: property
    });

  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({ error: 'Failed to update property' });
  }
});

// DELETE /api/rate-shopper/properties/:property_id
router.delete('/properties/:property_id', authenticateToken, async (req, res) => {
  try {
    const property = await RateShopperProperty.findById(req.params.property_id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    await property.delete();

    res.json({
      success: true,
      message: 'Property deleted successfully'
    });

  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({ error: 'Failed to delete property' });
  }
});

// ============================================
// SEARCHES
// ============================================

// GET /api/rate-shopper/:hotel_id/searches
router.get('/:hotel_id/searches', authenticateToken, checkHotelAccess, async (req, res) => {
  try {
    const hotelId = req.params.hotel_id;
    const { status, search_type, property_id, limit } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    if (search_type) filters.search_type = search_type;
    if (property_id) filters.property_id = parseInt(property_id);
    if (limit) filters.limit = parseInt(limit);

    const searches = await RateShopperSearch.findByHotel(hotelId, filters);

    res.json({
      success: true,
      data: searches
    });
  } catch (error) {
    console.error('Get searches error:', error);
    res.status(500).json({ error: 'Failed to get searches' });
  }
});

// POST /api/rate-shopper/:hotel_id/searches (TEMPORARY - REMOVE AUTH FOR TESTING)
router.post('/:hotel_id/searches', async (req, res) => {
  try {
    const hotelId = req.params.hotel_id;
    const { property_id, start_date, end_date } = req.body;

    if (!property_id || !start_date || !end_date) {
      return res.status(400).json({ error: 'Property ID, start date and end date are required' });
    }

    // Verify property belongs to hotel
    const property = await RateShopperProperty.findById(property_id);
    if (!property || property.hotel_id !== parseInt(hotelId)) {
      return res.status(404).json({ error: 'Property not found or does not belong to this hotel' });
    }

    const search = await RateShopperSearch.createFromProperty(property_id, {
      start: start_date,
      end: end_date
    }, 'MANUAL');

    // TODO: Add to queue for processing
    console.log('Search created, should be added to queue:', search.id);

    res.status(201).json({
      success: true,
      message: 'Search created and queued for processing',
      data: search
    });

  } catch (error) {
    console.error('Create search error:', error);
    res.status(500).json({ error: 'Failed to create search' });
  }
});

// GET /api/rate-shopper/searches/:search_id
router.get('/searches/:search_id', authenticateToken, async (req, res) => {
  try {
    const search = await RateShopperSearch.findById(req.params.search_id);
    if (!search) {
      return res.status(404).json({ error: 'Search not found' });
    }

    // Get additional data
    const [statistics, prices] = await Promise.all([
      search.getStatistics(),
      search.getPrices({ limit: 100 })
    ]);

    res.json({
      success: true,
      data: {
        ...search.toJSON(),
        statistics,
        recent_prices: prices
      }
    });

  } catch (error) {
    console.error('Get search error:', error);
    res.status(500).json({ error: 'Failed to get search' });
  }
});

// PUT /api/rate-shopper/searches/:search_id/cancel
router.put('/searches/:search_id/cancel', authenticateToken, async (req, res) => {
  try {
    const search = await RateShopperSearch.findById(req.params.search_id);
    if (!search) {
      return res.status(404).json({ error: 'Search not found' });
    }

    await search.cancel('Cancelled by user');

    res.json({
      success: true,
      message: 'Search cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel search error:', error);
    res.status(500).json({ error: 'Failed to cancel search' });
  }
});

// ============================================
// PRICES & ANALYTICS
// ============================================

// GET /api/rate-shopper/properties/:property_id/prices
router.get('/properties/:property_id/prices', authenticateToken, async (req, res) => {
  try {
    const property = await RateShopperProperty.findById(req.params.property_id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const { date_from, date_to, limit } = req.query;
    const dateRange = {};
    if (date_from) dateRange.start = date_from;
    if (date_to) dateRange.end = date_to;
    if (limit) dateRange.limit = parseInt(limit);

    const prices = await property.getLatestPrices(dateRange);

    res.json({
      success: true,
      data: prices
    });

  } catch (error) {
    console.error('Get prices error:', error);
    res.status(500).json({ error: 'Failed to get prices' });
  }
});

// GET /api/rate-shopper/properties/:property_id/analytics
router.get('/properties/:property_id/analytics', authenticateToken, async (req, res) => {
  try {
    const property = await RateShopperProperty.findById(req.params.property_id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const days = parseInt(req.query.days) || 30;
    const analytics = await property.getPriceAnalytics(days);

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

// ============================================
// CONFIGURATION
// ============================================

// GET /api/rate-shopper/:hotel_id/config
router.get('/:hotel_id/config', authenticateToken, checkHotelAccess, async (req, res) => {
  try {
    const hotelId = req.params.hotel_id;
    
    const result = await db.query(
      'SELECT * FROM rate_shopper_configs WHERE hotel_id = ?',
      [hotelId]
    );

    let config = result[0];
    if (!config) {
      // Create default config
      await db.query(`
        INSERT INTO rate_shopper_configs (hotel_id, auto_search_enabled, search_frequency_hours, date_range_days) 
        VALUES (?, FALSE, 8, 90)
      `, [hotelId]);
      
      const newResult = await db.query(
        'SELECT * FROM rate_shopper_configs WHERE hotel_id = ?',
        [hotelId]
      );
      config = newResult[0];
    }

    // Parse JSON fields
    if (config.notification_emails) {
      config.notification_emails = JSON.parse(config.notification_emails);
    }

    res.json({
      success: true,
      data: config
    });

  } catch (error) {
    console.error('Get config error:', error);
    res.status(500).json({ error: 'Failed to get configuration' });
  }
});

// PUT /api/rate-shopper/:hotel_id/config
router.put('/:hotel_id/config', authenticateToken, checkHotelAccess, async (req, res) => {
  try {
    const hotelId = req.params.hotel_id;
    const {
      auto_search_enabled,
      search_frequency_hours,
      date_range_days,
      max_bundle_size,
      notification_enabled,
      notification_emails,
      price_alert_threshold
    } = req.body;

    const updateData = {
      auto_search_enabled,
      search_frequency_hours,
      date_range_days,
      max_bundle_size,
      notification_enabled,
      price_alert_threshold
    };

    // Handle JSON fields
    if (notification_emails) {
      updateData.notification_emails = JSON.stringify(notification_emails);
    }

    const setClause = Object.keys(updateData)
      .filter(key => updateData[key] !== undefined)
      .map(key => `${key} = ?`)
      .join(', ');

    const values = Object.keys(updateData)
      .filter(key => updateData[key] !== undefined)
      .map(key => updateData[key]);

    await db.query(`
      UPDATE rate_shopper_configs 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE hotel_id = ?
    `, [...values, hotelId]);

    res.json({
      success: true,
      message: 'Configuration updated successfully'
    });

  } catch (error) {
    console.error('Update config error:', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

// ============================================
// SYSTEM STATUS
// ============================================

// GET /api/rate-shopper/status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const runningSearches = await RateShopperSearch.findRunning();
    
    const queueStatus = await db.query(`
      SELECT 
        job_type,
        status,
        COUNT(*) as count
      FROM rate_shopper_queue
      WHERE status IN ('PENDING', 'PROCESSING')
      GROUP BY job_type, status
    `);

    res.json({
      success: true,
      data: {
        running_searches: runningSearches,
        queue_status: queueStatus,
        system_status: 'healthy' // TODO: Add actual health checks
      }
    });

  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({ error: 'Failed to get system status' });
  }
});

// ============================================
// SCHEDULER MANAGEMENT
// ============================================

// GET /api/rate-shopper/:hotel_id/scheduler/status
router.get('/:hotel_id/scheduler/status', authenticateToken, checkHotelAccess, async (req, res) => {
  try {
    const { exec } = require('child_process');
    const path = require('path');
    const scraperPath = path.join(__dirname, '../../extrator-rate-shopper');
    
    exec('npm run scheduler:status', { cwd: scraperPath }, (error, stdout, stderr) => {
      if (error) {
        return res.status(500).json({ 
          success: false,
          error: 'Failed to get scheduler status',
          details: error.message
        });
      }
      
      res.json({
        success: true,
        data: {
          status: stdout,
          timestamp: new Date()
        }
      });
    });

  } catch (error) {
    console.error('Scheduler status error:', error);
    res.status(500).json({ error: 'Failed to get scheduler status' });
  }
});

// POST /api/rate-shopper/:hotel_id/scheduler/start
router.post('/:hotel_id/scheduler/start', authenticateToken, checkHotelAccess, async (req, res) => {
  try {
    const { exec } = require('child_process');
    const path = require('path');
    const scraperPath = path.join(__dirname, '../../extrator-rate-shopper');
    
    // Start scheduler in background
    const child = exec('npm run scheduler:start', { 
      cwd: scraperPath,
      detached: true,
      stdio: 'ignore'
    });
    
    child.unref();
    
    res.json({
      success: true,
      message: 'Scheduler started successfully',
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Scheduler start error:', error);
    res.status(500).json({ error: 'Failed to start scheduler' });
  }
});

// POST /api/rate-shopper/:hotel_id/scheduler/run-now
router.post('/:hotel_id/scheduler/run-now', authenticateToken, checkHotelAccess, async (req, res) => {
  try {
    const { exec } = require('child_process');
    const path = require('path');
    const scraperPath = path.join(__dirname, '../../extrator-rate-shopper');
    
    exec('npm run scheduler:run', { cwd: scraperPath }, (error, stdout, stderr) => {
      if (error) {
        return res.status(500).json({ 
          success: false,
          error: 'Failed to run extraction',
          details: error.message
        });
      }
      
      res.json({
        success: true,
        message: 'Manual extraction completed',
        output: stdout,
        timestamp: new Date()
      });
    });

  } catch (error) {
    console.error('Manual extraction error:', error);
    res.status(500).json({ error: 'Failed to run manual extraction' });
  }
});

// GET /api/rate-shopper/:hotel_id/scheduler/config
router.get('/:hotel_id/scheduler/config', authenticateToken, checkHotelAccess, async (req, res) => {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    const configPath = path.join(__dirname, '../../extrator-rate-shopper/src/scheduler-config.json');
    
    try {
      const configData = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(configData);
      
      res.json({
        success: true,
        data: config,
        timestamp: new Date()
      });
    } catch (fileError) {
      if (fileError.code === 'ENOENT') {
        res.json({
          success: true,
          data: null,
          message: 'No configuration file found. Run scheduler once to create default config.',
          timestamp: new Date()
        });
      } else {
        throw fileError;
      }
    }

  } catch (error) {
    console.error('Scheduler config error:', error);
    res.status(500).json({ error: 'Failed to get scheduler config' });
  }
});

// PUT /api/rate-shopper/:hotel_id/scheduler/config
router.put('/:hotel_id/scheduler/config', authenticateToken, checkHotelAccess, async (req, res) => {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    const configPath = path.join(__dirname, '../../extrator-rate-shopper/src/scheduler-config.json');
    const newConfig = req.body;
    
    // Validate config structure
    if (!newConfig || typeof newConfig !== 'object') {
      return res.status(400).json({ error: 'Invalid configuration format' });
    }
    
    await fs.writeFile(configPath, JSON.stringify(newConfig, null, 2));
    
    res.json({
      success: true,
      message: 'Configuration updated successfully',
      data: newConfig,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Update scheduler config error:', error);
    res.status(500).json({ error: 'Failed to update scheduler config' });
  }
});

// GET /api/rate-shopper/:hotel_id/scheduler/logs
router.get('/:hotel_id/scheduler/logs', authenticateToken, checkHotelAccess, async (req, res) => {
  try {
    const { exec } = require('child_process');
    const path = require('path');
    const scraperPath = path.join(__dirname, '../../extrator-rate-shopper');
    const lines = req.query.lines || 50;
    
    exec(`npm run scheduler:logs -- -n ${lines}`, { cwd: scraperPath }, (error, stdout, stderr) => {
      if (error) {
        return res.status(500).json({ 
          success: false,
          error: 'Failed to get scheduler logs',
          details: error.message
        });
      }
      
      res.json({
        success: true,
        data: {
          logs: stdout,
          lines: parseInt(lines),
          timestamp: new Date()
        }
      });
    });

  } catch (error) {
    console.error('Scheduler logs error:', error);
    res.status(500).json({ error: 'Failed to get scheduler logs' });
  }
});

module.exports = router;