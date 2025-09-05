const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const RateShopperProperty = require('../models/RateShopperProperty');
const RateShopperSearch = require('../models/RateShopperSearch');
const Hotel = require('../models/Hotel');
const db = require('../config/database');
const { emitExtractionProgress, emitExtractionStatus, emitNewSearch, emitSearchDeleted } = require('../utils/socketEmitters');

// Middleware para verificar se o usuário tem acesso ao hotel
async function checkHotelAccess(req, res, next) {
  try {
    const { hotel_id } = req.params;
    const userId = req.user.id;
    
    // Verificar se hotel_id é UUID ou integer
    let hotel;
    if (hotel_id.includes('-')) {
      // É UUID, buscar por UUID
      hotel = await Hotel.findByUuid(hotel_id);
    } else {
      // É ID integer, buscar por ID
      hotel = await Hotel.findById(hotel_id);
    }
    
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
      WHERE rs.hotel_id = $1
        AND rsp.scraped_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
        AND rs.status = 'COMPLETED'
      GROUP BY DATE(rsp.scraped_at), rsp.property_id, rsp_prop.property_name
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
          AND rsp2.scraped_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
        WHERE rsp.scraped_at = (
          SELECT MAX(rsp3.scraped_at)
          FROM rate_shopper_prices rsp3
          JOIN rate_shopper_searches rs3 ON rsp3.search_id = rs3.id
          WHERE rsp3.property_id = rsp.property_id AND rs3.status = 'COMPLETED'
        )
        GROUP BY rsp.property_id, rsp.price, rsp.scraped_at
      ) latest ON rsp_prop.id = latest.property_id
      WHERE rsp_prop.hotel_id = $1 AND rsp_prop.active = TRUE
      ORDER BY rsp_prop.property_name
    `, [hotelId]);

    // Summary statistics
    const summary = await db.query(`
      SELECT 
        COUNT(DISTINCT rsp_prop.id) as total_properties,
        COUNT(DISTINCT rs.id) as total_searches,
        COUNT(rsp.id) as total_prices,
        COUNT(CASE WHEN rs.status = 'RUNNING' THEN 1 END) as running_searches,
        COALESCE(AVG(rsp.price), 0) as avg_price,
        COALESCE(MIN(rsp.price), 0) as min_price,
        COALESCE(MAX(rsp.price), 0) as max_price
      FROM rate_shopper_properties rsp_prop
      LEFT JOIN rate_shopper_searches rs ON rsp_prop.id = rs.property_id
      LEFT JOIN rate_shopper_prices rsp ON rs.id = rsp.search_id
      WHERE rsp_prop.hotel_id = $1 AND rsp_prop.active = TRUE
    `, [hotelId]);

    // Converter valores numéricos que vêm como strings do PostgreSQL
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
    const hotel_id = req.params.hotel_id;
    const { active, competitor_type } = req.query;
    
    // Verificar se hotel_id é UUID ou integer e converter para ID
    let hotelId;
    if (hotel_id.includes('-')) {
      // É UUID, buscar hotel e pegar ID
      const hotel = await Hotel.findByUuid(hotel_id);
      if (!hotel) {
        return res.status(404).json({ error: 'Hotel not found' });
      }
      hotelId = hotel.id;
    } else {
      // É ID integer
      hotelId = parseInt(hotel_id);
    }
    
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

// POST /api/rate-shopper/:hotel_id/properties (TEMPORARY - REMOVE AUTH FOR TESTING)
router.post('/:hotel_id/properties', async (req, res) => {
  try {
    const hotel_id = req.params.hotel_id;
    
    // Verificar se hotel_id é UUID ou integer e converter para ID
    let hotelId;
    if (hotel_id.includes('-')) {
      // É UUID, buscar hotel e pegar ID
      const hotel = await Hotel.findByUuid(hotel_id);
      if (!hotel) {
        return res.status(404).json({ error: 'Hotel not found' });
      }
      hotelId = hotel.id;
    } else {
      // É ID integer
      hotelId = parseInt(hotel_id);
    }
    
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
      'SELECT * FROM rate_shopper_configs WHERE hotel_id = $1',
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
        'SELECT * FROM rate_shopper_configs WHERE hotel_id = $1',
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
      WHERE hotel_id = $1
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

// ============================================
// REAL-TIME PROGRESS TRACKING
// ============================================

// GET /api/rate-shopper/:hotel_id/searches/progress
router.get('/:hotel_id/searches/progress', async (req, res) => {
  try {
    const hotelId = req.params.hotel_id;
    
    // Buscar searches em progresso e seus detalhes
    const runningSearches = await db.query(`
      SELECT 
        rs.id,
        rs.uuid,
        rs.status,
        rs.started_at,
        rs.total_dates,
        rs.processed_dates,
        rs.total_prices_found,
        rs.error_log,
        rsp.property_name,
        rsp.booking_url,
        -- Progresso calculado
        CASE 
          WHEN rs.total_dates > 0 THEN ROUND((COALESCE(rs.processed_dates, 0)::DECIMAL / rs.total_dates::DECIMAL) * 100, 2)
          ELSE 0 
        END as progress_percent,
        -- Tempo decorrido
        EXTRACT(EPOCH FROM (NOW() - rs.started_at)) as elapsed_seconds,
        -- Contagem real de preços salvos
        COUNT(rsp_prices.id) as actual_prices_count
      FROM rate_shopper_searches rs
      JOIN rate_shopper_properties rsp ON rs.property_id = rsp.id
      LEFT JOIN rate_shopper_prices rsp_prices ON rs.id = rsp_prices.search_id
      WHERE rs.hotel_id = $1 
        AND rs.status IN ('RUNNING', 'PENDING')
      GROUP BY rs.id, rs.uuid, rs.status, rs.started_at, rs.total_dates, 
               rs.processed_dates, rs.total_prices_found, rs.error_log,
               rsp.property_name, rsp.booking_url
      ORDER BY rs.started_at DESC
    `, [hotelId]);

    // Buscar searches recém-completadas nas últimas 2 horas
    const recentCompleted = await db.query(`
      SELECT 
        rs.id,
        rs.uuid,
        rs.status,
        rs.completed_at,
        rs.total_dates,
        rs.processed_dates,
        rs.total_prices_found,
        rsp.property_name,
        COUNT(rsp_prices.id) as actual_prices_count,
        EXTRACT(EPOCH FROM (rs.completed_at - rs.started_at)) as duration_seconds
      FROM rate_shopper_searches rs
      JOIN rate_shopper_properties rsp ON rs.property_id = rsp.id
      LEFT JOIN rate_shopper_prices rsp_prices ON rs.id = rsp_prices.search_id
      WHERE rs.hotel_id = $1 
        AND rs.status IN ('COMPLETED', 'FAILED', 'CANCELLED')
        AND rs.completed_at >= NOW() - INTERVAL '2 hours'
      GROUP BY rs.id, rs.uuid, rs.status, rs.completed_at, rs.total_dates,
               rs.processed_dates, rs.total_prices_found, rsp.property_name,
               rs.started_at
      ORDER BY rs.completed_at DESC
      LIMIT 5
    `, [hotelId]);

    // Estatísticas gerais do hotel
    const stats = await db.query(`
      SELECT 
        COUNT(CASE WHEN status = 'RUNNING' THEN 1 END) as running_count,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'COMPLETED' AND DATE(completed_at) = CURRENT_DATE THEN 1 END) as completed_today,
        COUNT(CASE WHEN status = 'FAILED' AND DATE(completed_at) = CURRENT_DATE THEN 1 END) as failed_today
      FROM rate_shopper_searches 
      WHERE hotel_id = $1
    `, [hotelId]);

    res.json({
      success: true,
      data: {
        running_searches: runningSearches,
        recent_completed: recentCompleted,
        stats: stats[0] || { running_count: 0, pending_count: 0, completed_today: 0, failed_today: 0 },
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Get searches progress error:', error);
    res.status(500).json({ error: 'Failed to get searches progress' });
  }
});

// DELETE /api/rate-shopper/:hotel_id/searches/failed
router.delete('/:hotel_id/searches/failed', async (req, res) => {
  try {
    const hotelId = req.params.hotel_id;
    
    // Identificar buscas mal sucedidas (FAILED ou sem preços)
    const failedSearches = await db.query(`
      SELECT id FROM rate_shopper_searches 
      WHERE hotel_id = $1 
        AND (status = 'FAILED' OR total_prices_found = 0 OR total_prices_found IS NULL)
        AND status != 'RUNNING'
    `, [hotelId]);
    
    if (failedSearches.length === 0) {
      return res.json({
        success: true,
        message: 'No failed searches found',
        deleted_count: 0
      });
    }
    
    const searchIds = failedSearches.map(s => s.id);
    
    // Excluir preços relacionados primeiro
    await db.query(`
      DELETE FROM rate_shopper_prices 
      WHERE search_id = ANY($1)
    `, [searchIds]);
    
    // Excluir as searches
    const result = await db.query(`
      DELETE FROM rate_shopper_searches 
      WHERE id = ANY($1)
    `, [searchIds]);
    
    res.json({
      success: true,
      message: `${searchIds.length} failed searches deleted successfully`,
      deleted_count: searchIds.length,
      deleted_ids: searchIds
    });

  } catch (error) {
    console.error('Delete failed searches error:', error);
    res.status(500).json({ error: 'Failed to delete failed searches' });
  }
});

// GET /api/rate-shopper/searches/:search_id/live-progress
router.get('/searches/:search_id/live-progress', async (req, res) => {
  try {
    const searchId = req.params.search_id;
    
    // Detalhes da busca específica
    const searchDetails = await db.query(`
      SELECT 
        rs.*,
        rsp.property_name,
        rsp.booking_url,
        h.name as hotel_name,
        -- Progresso calculado
        CASE 
          WHEN rs.total_dates > 0 THEN ROUND((COALESCE(rs.processed_dates, 0)::DECIMAL / rs.total_dates::DECIMAL) * 100, 2)
          ELSE 0 
        END as progress_percent,
        -- Tempo decorrido
        CASE 
          WHEN rs.started_at IS NOT NULL THEN EXTRACT(EPOCH FROM (NOW() - rs.started_at))
          ELSE 0 
        END as elapsed_seconds,
        -- ETA estimado (se houver progresso)
        CASE 
          WHEN rs.processed_dates > 0 AND rs.total_dates > rs.processed_dates THEN 
            ROUND(
              (EXTRACT(EPOCH FROM (NOW() - rs.started_at)) / rs.processed_dates) * 
              (rs.total_dates - rs.processed_dates)
            )
          ELSE 0 
        END as eta_seconds
      FROM rate_shopper_searches rs
      JOIN rate_shopper_properties rsp ON rs.property_id = rsp.id
      JOIN hotels h ON rs.hotel_id = h.id
      WHERE rs.id = $1
    `, [searchId]);

    if (searchDetails.length === 0) {
      return res.status(404).json({ error: 'Search not found' });
    }

    // Últimos preços extraídos (top 10)
    const latestPrices = await db.query(`
      SELECT 
        check_in_date,
        price,
        room_type,
        scraped_at
      FROM rate_shopper_prices 
      WHERE search_id = $1 
      ORDER BY scraped_at DESC 
      LIMIT 10
    `, [searchId]);

    // Contagem total de preços salvos
    const priceCount = await db.query(`
      SELECT COUNT(*) as total_prices
      FROM rate_shopper_prices 
      WHERE search_id = $1
    `, [searchId]);

    const search = searchDetails[0];
    search.actual_prices_count = parseInt(priceCount[0]?.total_prices || 0);

    res.json({
      success: true,
      data: {
        search: search,
        latest_prices: latestPrices,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Get live progress error:', error);
    res.status(500).json({ error: 'Failed to get live progress' });
  }
});

// DELETE /api/rate-shopper/:hotel_id/searches/:search_id
router.delete('/:hotel_id/searches/:search_id', async (req, res) => {
  try {
    const { hotel_id, search_id } = req.params;
    
    // Verificar se a busca existe e pertence ao hotel
    const search = await db.query(`
      SELECT rs.*, rsp.property_name
      FROM rate_shopper_searches rs
      LEFT JOIN rate_shopper_properties rsp ON rs.property_id = rsp.id
      WHERE rs.id = $1 AND rs.hotel_id = $2
    `, [search_id, hotel_id]);

    if (search.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Busca não encontrada ou não pertence a este hotel' 
      });
    }

    const searchData = search[0];

    // Não permitir deletar buscas que estão em execução
    if (searchData.status === 'RUNNING') {
      return res.status(400).json({ 
        success: false, 
        error: 'Não é possível excluir uma busca em execução. Pare a extração primeiro.' 
      });
    }

    // Deletar primeiro os preços relacionados (foreign key constraint)
    await db.query(`
      DELETE FROM rate_shopper_prices 
      WHERE search_id = $1
    `, [search_id]);
    
    // Deletar a busca
    const result = await db.query(`
      DELETE FROM rate_shopper_searches 
      WHERE id = $1 AND hotel_id = $2
    `, [search_id, hotel_id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Busca não encontrada' 
      });
    }

    res.json({
      success: true,
      message: `Busca "${searchData.property_name || `#${search_id}`}" excluída com sucesso`,
      deleted_search: {
        id: searchData.id,
        property_name: searchData.property_name,
        status: searchData.status
      }
    });

  } catch (error) {
    console.error('Delete search error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Falha ao excluir busca' 
    });
  }
});

// PUT /api/rate-shopper/:hotel_id/searches/:search_id/progress
router.put('/:hotel_id/searches/:search_id/progress', async (req, res) => {
  try {
    const { hotel_id, search_id } = req.params;
    const { processed_dates, total_prices_found } = req.body;
    
    // Verificar se a busca existe e pertence ao hotel
    const search = await RateShopperSearch.findById(search_id);
    if (!search || search.hotel_id != hotel_id) {
      return res.status(404).json({ 
        success: false, 
        error: 'Busca não encontrada ou não pertence a este hotel' 
      });
    }

    // Atualizar progresso
    await search.updateProgress(processed_dates, total_prices_found);
    
    // Buscar dados atualizados com JOIN para pegar property_name
    const updatedSearchData = await db.query(`
      SELECT rs.*, rsp.property_name
      FROM rate_shopper_searches rs
      LEFT JOIN rate_shopper_properties rsp ON rs.property_id = rsp.id
      WHERE rs.id = $1
    `, [search_id]);
    
    if (updatedSearchData.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Busca não encontrada após atualização' 
      });
    }
    
    const updatedSearch = new RateShopperSearch(updatedSearchData[0]);
    updatedSearch.property_name = updatedSearchData[0].property_name;

    // Emitir evento Socket.io para clientes conectados
    const io = req.app.get('socketio');
    if (io) {
      emitExtractionProgress(io, hotel_id, {
        searchId: search_id,
        id: updatedSearch.id,
        status: updatedSearch.status,
        processed_dates: updatedSearch.processed_dates,
        total_dates: updatedSearch.total_dates,
        progress_percentage: updatedSearch.getProgressPercentage(),
        total_prices_found: updatedSearch.total_prices_found,
        duration_seconds: updatedSearch.duration_seconds,
        started_at: updatedSearch.started_at,
        completed_at: updatedSearch.completed_at,
        property_name: updatedSearch.property_name,
        error_log: updatedSearch.error_log
      });
    }
    
    res.json({
      success: true,
      message: 'Progresso atualizado com sucesso',
      data: {
        id: updatedSearch.id,
        processed_dates: updatedSearch.processed_dates,
        total_dates: updatedSearch.total_dates,
        progress_percentage: updatedSearch.getProgressPercentage(),
        total_prices_found: updatedSearch.total_prices_found
      }
    });

  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Falha ao atualizar progresso' 
    });
  }
});

module.exports = router;