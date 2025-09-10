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
    const hotel_id = req.params.hotel_id;
    const { start_date, end_date, days } = req.query;
    
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

    // Recent searches (versão local - usa nomes de colunas do ambiente local)
    const recentSearches = await db.query(`
      SELECT 
        rs.id,
        rs.hotel_id,
        rs.property_id,
        rs.check_in_date as start_date,
        rs.check_out_date as end_date,
        rs.status as status,
        rs.total_results,
        rs.duration_seconds,
        rs.created_at,
        rs.updated_at,
        rsp.property_name,
        rsp.booking_engine as platform
      FROM rate_shopper_searches rs
      LEFT JOIN rate_shopper_properties rsp ON rs.property_id = rsp.id
      WHERE rs.hotel_id = $1
      ORDER BY rs.created_at DESC
      LIMIT 10
    `, [hotelId]);
    
    // DEBUG: Log detalhado para verificar platform
    console.log('🔍 DEBUG: Recent searches com platform:', 
      recentSearches.slice(0, 3).map(s => ({
        id: s.id,
        property_id: s.property_id,
        property_name: s.property_name,
        platform: s.platform,
        status: s.status
      })));

    // Determinar período para price trends
    let dateCondition;
    let dateParams = [hotelId];
    
    if (start_date && end_date) {
      // Período personalizado
      dateCondition = `AND rsp.captured_at >= $2 AND rsp.captured_at <= $3`;
      dateParams.push(start_date, end_date);
    } else if (days) {
      // Número de dias especificado
      const daysNum = parseInt(days) || 30;
      dateCondition = `AND rsp.captured_at >= CURRENT_TIMESTAMP - INTERVAL '${daysNum} days'`;
    } else {
      // Padrão: últimos 30 dias
      dateCondition = `AND rsp.captured_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'`;
    }

    // Price trends com período customizável - TEMPORARIAMENTE DESABILITADO PARA DEBUG
    const priceTrends = [];

    // Properties with latest prices - TEMPORARIAMENTE DESABILITADO PARA DEBUG
    const propertiesWithPrices = []; /*await db.query(`
      SELECT 
        rsp_prop.*,
        latest.latest_price,
        latest.latest_captured_at,
        latest.price_count_30d,
        latest.avg_price_30d
      FROM rate_shopper_properties rsp_prop
      LEFT JOIN (
        SELECT 
          rsp.property_id,
          rsp.price as latest_price,
          rsp.captured_at as latest_captured_at,
          COUNT(rsp2.id) as price_count_30d,
          COALESCE(AVG(rsp2.price), 0) as avg_price_30d
        FROM rate_shopper_prices rsp
        JOIN rate_shopper_searches rs ON rsp.search_id = rs.id
        LEFT JOIN rate_shopper_prices rsp2 ON rsp.property_id = rsp2.property_id 
          AND rsp2.captured_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
        WHERE rsp.captured_at = (
          SELECT MAX(rsp3.captured_at)
          FROM rate_shopper_prices rsp3
          JOIN rate_shopper_searches rs3 ON rsp3.search_id = rs3.id
          WHERE rsp3.property_id = rsp.property_id AND rs3.search_status = 'COMPLETED'
        )
        GROUP BY rsp.property_id, rsp.price, rsp.captured_at
      ) latest ON rsp_prop.id = latest.property_id
      WHERE rsp_prop.hotel_id = $1 AND rsp_prop.active = TRUE
      ORDER BY rsp_prop.property_name
    `, [hotelId]); */

    // Summary statistics
    const summary = await db.query(`
      SELECT 
        COUNT(DISTINCT rsp_prop.id) as total_properties,
        COUNT(DISTINCT rs.id) as total_searches,
        COUNT(rsp.id) as total_prices,
        COUNT(CASE WHEN rs.search_status = 'RUNNING' THEN 1 END) as running_searches,
        COALESCE(AVG(rsp.price), 0) as avg_price,
        COALESCE(MIN(rsp.price), 0) as min_price,
        COALESCE(MAX(rsp.price), 0) as max_price
      FROM rate_shopper_properties rsp_prop
      LEFT JOIN rate_shopper_searches rs ON rsp_prop.id = rs.property_id
      LEFT JOIN rate_shopper_prices rsp ON rs.id = rsp.search_id
      WHERE rsp_prop.hotel_id = $1 AND rsp_prop.active = TRUE
    `, [hotelId]);

    // Converter valores numéricos que vêm como strings do PostgreSQL
    const summaryData = summary.rows[0] || {};
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

    // Prevent cache for dashboard data
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
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
    console.error('Error stack:', error.stack);
    console.error('Hotel ID param:', req.params.hotel_id);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

// GET /api/rate-shopper/:hotel_id/price-trends

// GET /api/rate-shopper/:hotel_id/price-trends - VERSÃO DE TESTE
router.get('/:hotel_id/price-trends-test', async (req, res) => {
  try {
    const hotel_id = req.params.hotel_id;
    
    // Verificar se hotel_id é UUID ou integer e converter para ID
    let hotelId;
    if (hotel_id.includes('-')) {
      const hotel = await Hotel.findByUuid(hotel_id);
      if (!hotel) {
        return res.status(404).json({ error: 'Hotel not found' });
      }
      hotelId = hotel.id;
    } else {
      hotelId = parseInt(hotel_id);
    }

    // Retornar dados de teste fixos em vez de fazer query complexa
    const testData = {
      success: true,
      data: {
        chart_data: {
          "2025-09-10": {
            date: "2025-09-10",
            "Eco Encanto Pousada (Artaxnet)": 450.00,
            is_future: false
          },
          "2025-09-11": {
            date: "2025-09-11", 
            "Eco Encanto Pousada (Artaxnet)": 475.00,
            is_future: false
          }
        },
        properties: ["Eco Encanto Pousada (Artaxnet)"],
        main_properties: ["Eco Encanto Pousada (Artaxnet)"],
        date_range: {
          start: "2025-09-10",
          end: "2025-10-09",
          future_end: "2025-11-09"
        }
      }
    };

    res.json(testData);

  } catch (error) {
    console.error('Test price trends error:', error);
    res.status(500).json({ error: 'Failed to load test price trends' });
  }
});


router.get('/:hotel_id/price-trends', async (req, res) => {
  try {
    const hotel_id = req.params.hotel_id;
    const { start_date, end_date, days = 30, future_days = 30 } = req.query;
    
    // Verificar se hotel_id é UUID ou integer e converter para ID
    let hotelId;
    if (hotel_id.includes('-')) {
      const hotel = await Hotel.findByUuid(hotel_id);
      if (!hotel) {
        return res.status(404).json({ error: 'Hotel not found' });
      }
      hotelId = hotel.id;
    } else {
      hotelId = parseInt(hotel_id);
    }

    // Determinar período
    let dateCondition;
    let dateParams = [hotelId];
    let startDateObj, endDateObj;
    
    if (start_date && end_date) {
      // Período personalizado
      startDateObj = new Date(start_date);
      endDateObj = new Date(end_date);
      dateCondition = ``; // Condição removida pois já está na query
      dateParams.push(start_date, end_date);
    } else {
      // Baseado em número de dias (30 passados + 30 futuros por padrão)
      const daysNum = parseInt(days) || 30;
      const futureDaysNum = parseInt(future_days) || 30;
      
      const today = new Date();
      startDateObj = new Date(today);
      startDateObj.setDate(startDateObj.getDate() - daysNum);
      
      endDateObj = new Date(today);
      endDateObj.setDate(endDateObj.getDate() + futureDaysNum);
      
      dateCondition = ``; // Condição removida pois já está na query
      dateParams.push(startDateObj.toISOString().split('T')[0], endDateObj.toISOString().split('T')[0]);
    }

    // Buscar dados históricos - versão simples usando nomes de produção
    const historicalData = await db.query(`
      WITH latest_extraction_per_date AS (
        SELECT 
          DATE(rsp.check_in) as date,
          rsp.property_id,
          MAX(rsp.captured_at) as latest_captured_at
        FROM rate_shopper_prices rsp
        JOIN rate_shopper_searches rs ON rsp.search_id = rs.id
        WHERE rs.hotel_id = $1
          AND DATE(rsp.check_in) >= $2 
          AND DATE(rsp.check_in) <= $3
          AND rs.search_status IN ('COMPLETED', 'CANCELLED')
        GROUP BY DATE(rsp.check_in), rsp.property_id
      )
      SELECT 
        latest.date,
        rsp_prop.property_name,
        COALESCE(rsp_prop.platform, rsp_prop.booking_engine, 'booking') as platform,
        COALESCE(rsp_prop.is_main_property, false) as is_main_property,
        rsp.price as avg_price,
        rsp.price as min_price,
        rsp.price as max_price,
        1 as price_count,
        CASE WHEN latest.date > CURRENT_DATE THEN true ELSE false END as is_future,
        -- Informações sobre bundles com valores padrão
        0 as bundle_count,
        1 as regular_count,
        1 as avg_bundle_size,
        1 as max_bundle_size,
        false as is_mostly_bundle
      FROM latest_extraction_per_date latest
      JOIN rate_shopper_prices rsp ON rsp.property_id = latest.property_id 
        AND DATE(rsp.check_in) = latest.date 
        AND rsp.captured_at = latest.latest_captured_at
      JOIN rate_shopper_properties rsp_prop ON rsp.property_id = rsp_prop.id
      ORDER BY latest.date ASC, COALESCE(rsp_prop.is_main_property, false) DESC, rsp_prop.property_name
    `, dateParams);

    // DEBUG: Log dos dados históricos retornados (removido para produção)
    // console.log('📊 DEBUG Price Trends - historicalData.length:', historicalData.length);
    // console.log('📊 DEBUG Price Trends - historicalData:', JSON.stringify(historicalData, null, 2));
    
    // Converter para formato do gráfico
    const chartData = {};
    const properties = new Set();
    const mainProperties = new Set(); // Para rastrear propriedades principais
    
    historicalData.rows.forEach(row => {
      const date = row.date.toISOString().split('T')[0];
      
      // Criar nome único com plataforma para diferenciar Booking de Artaxnet
      const platformSuffix = row.platform === 'artaxnet' ? ' (Artaxnet)' : ' (Booking)';
      const propertyDisplayName = `${row.property_name}${platformSuffix}`;
      
      properties.add(propertyDisplayName);
      
      // Marcar se é propriedade principal
      if (row.is_main_property) {
        mainProperties.add(propertyDisplayName);
      }
      
      if (!chartData[date]) {
        chartData[date] = { 
          date,
          isFuture: row.is_future
        };
      }
      
      chartData[date][propertyDisplayName] = parseFloat(row.avg_price);
      chartData[date][`${propertyDisplayName}_min`] = parseFloat(row.min_price);
      chartData[date][`${propertyDisplayName}_max`] = parseFloat(row.max_price);
      chartData[date][`${propertyDisplayName}_count`] = parseInt(row.price_count);
      chartData[date][`${propertyDisplayName}_platform`] = row.platform;
      chartData[date][`${propertyDisplayName}_is_main_property`] = row.is_main_property;
      
      // Adicionar informações de bundle para o gráfico
      chartData[date][`${propertyDisplayName}_bundle_count`] = parseInt(row.bundle_count);
      chartData[date][`${propertyDisplayName}_regular_count`] = parseInt(row.regular_count);
      chartData[date][`${propertyDisplayName}_avg_bundle_size`] = parseFloat(row.avg_bundle_size);
      chartData[date][`${propertyDisplayName}_max_bundle_size`] = parseInt(row.max_bundle_size);
      chartData[date][`${propertyDisplayName}_is_mostly_bundle`] = row.is_mostly_bundle;
    });

    // TEMPORARIAMENTE DESABILITADO: Se há poucos dados históricos, adicionar alguns dados simulados para demonstração
    /*
    if (historicalData.length === 1 && properties.size > 0) {
      const todayData = historicalData[0];
      const today = new Date(todayData.date);
      
      // Adicionar 7 dias de dados simulados baseados no preço real de hoje
      for (let i = 7; i >= 1; i--) {
        const pastDate = new Date(today);
        pastDate.setDate(pastDate.getDate() - i);
        const dateStr = pastDate.toISOString().split('T')[0];
        
        if (!chartData[dateStr]) {
          chartData[dateStr] = { date: dateStr, isSimulated: true };
          
          properties.forEach(prop => {
            const realPrice = parseFloat(todayData.avg_price) || 200;
            // Adicionar variação aleatória de ±15% do preço real
            const variation = (Math.random() - 0.5) * 0.3; // -15% a +15%
            const simulatedPrice = realPrice * (1 + variation);
            
            chartData[dateStr][prop] = Math.round(simulatedPrice * 100) / 100;
            chartData[dateStr][`${prop}_min`] = Math.round(simulatedPrice * 0.85 * 100) / 100;
            chartData[dateStr][`${prop}_max`] = Math.round(simulatedPrice * 1.15 * 100) / 100;
            chartData[dateStr][`${prop}_count`] = Math.floor(Math.random() * 20) + 10;
          });
        }
      }
    }
    */

    // Gerar dados futuros (próximos 30 dias por padrão)
    const futureDaysNum = parseInt(future_days) || 30;
    const futureEndDate = new Date(endDateObj);
    futureEndDate.setDate(futureEndDate.getDate() + futureDaysNum);
    
    // Adicionar datas futuras ao chartData (sem dados de preço) - começando do próximo dia
    const futureStartDate = new Date(endDateObj);
    futureStartDate.setDate(futureStartDate.getDate() + 1); // Começar do próximo dia
    
    for (let d = new Date(futureStartDate); d <= futureEndDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      if (!chartData[dateStr]) {
        chartData[dateStr] = { date: dateStr, isFuture: true };
        properties.forEach(prop => {
          chartData[dateStr][prop] = null; // Null para datas futuras
        });
      }
    }

    // Converter para array ordenado
    const chartArray = Object.values(chartData).sort((a, b) => new Date(a.date) - new Date(b.date));

    // DEBUG: Log dos dados finais enviados (removido para produção)
    // console.log('📊 DEBUG Price Trends - chartArray.length:', chartArray.length);
    // console.log('📊 DEBUG Price Trends - properties:', Array.from(properties));
    // console.log('📊 DEBUG Price Trends - primeiros 3 itens do chartArray:', chartArray.slice(0, 3));

    res.json({
      success: true,
      data: {
        chart_data: chartArray,
        properties: Array.from(properties),
        main_properties: Array.from(mainProperties), // Lista das propriedades principais
        date_range: {
          start: startDateObj.toISOString().split('T')[0],
          end: endDateObj.toISOString().split('T')[0],
          future_end: futureEndDate.toISOString().split('T')[0]
        }
      }
    });

  } catch (error) {
    console.error('Price trends error:', error);
    res.status(500).json({ error: 'Failed to load price trends' });
  }
});

// ROTA TEMPORÁRIA PARA VERIFICAR DATAS NO BANCO
router.get('/check-dates-simple', async (req, res) => {
  try {
    // Verificar total de registros na tabela
    const totalPrices = await db.query(`SELECT COUNT(*) as total FROM rate_shopper_prices`);
    const totalSearches = await db.query(`SELECT COUNT(*) as total FROM rate_shopper_searches`);
    
    // Buscar amostras básicas
    const samples = await db.query(`
      SELECT 
        check_in,
        price,
        search_id,
        id
      FROM rate_shopper_prices 
      ORDER BY id DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        total_prices: totalPrices.rows?.[0]?.total || 0,
        total_searches: totalSearches.rows?.[0]?.total || 0,
        sample_records: samples.rows || []
      }
    });
  } catch (error) {
    console.error('Check dates simple error:', error);
    res.status(500).json({ 
      error: 'Failed to check dates',
      message: error.message
    });
  }
});

// ROTA TEMPORÁRIA PARA VERIFICAR DATAS ESPECÍFICAS DE UM HOTEL
router.get('/:hotel_uuid/check-dates', async (req, res) => {
  try {
    // Usar hotel_id = 2 por simplicidade (baseado nos logs do servidor)
    const hotel_id = 2;

    // Verificar todas as datas no banco
    const allDates = await db.query(`
      SELECT 
        DATE(check_in) as date,
        COUNT(*) as count,
        MIN(price) as min_price,
        MAX(price) as max_price
      FROM rate_shopper_prices rsp
      JOIN rate_shopper_searches rs ON rsp.search_id = rs.id  
      WHERE rs.hotel_id = $1
      GROUP BY DATE(check_in)
      ORDER BY date
    `, [hotel_id]);
    
    // Verificar quantos registros estão fora do período correto (05/09/2025 - 31/10/2025)
    const wrongDates = await db.query(`
      SELECT COUNT(*) as total
      FROM rate_shopper_prices rsp
      JOIN rate_shopper_searches rs ON rsp.search_id = rs.id
      WHERE rs.hotel_id = $1
        AND (DATE(rsp.check_in) < '2025-09-05' OR DATE(rsp.check_in) > '2025-10-31')
    `, [hotel_id]);

    res.json({
      success: true,
      data: {
        hotel_id: hotel_id,
        all_dates: allDates.rows,
        wrong_dates_count: wrongDates.rows[0].total
      }
    });
  } catch (error) {
    console.error('Check dates error:', error);
    res.status(500).json({ error: 'Failed to check dates' });
  }
});

// ROTA TEMPORÁRIA PARA VISUALIZAR DADOS DA TABELA
router.get('/:hotel_id/debug-prices', async (req, res) => {
  try {
    const hotel_id = req.params.hotel_id;
    const { start_date, end_date } = req.query;
    
    console.log('🔍 API debug-prices: Parâmetros recebidos:', { hotel_id, start_date, end_date });
    
    // Verificar se hotel_id é UUID e converter para ID
    let hotelId;
    if (hotel_id.includes('-')) {
      const hotel = await Hotel.findByUuid(hotel_id);
      if (!hotel) {
        return res.status(404).json({ error: 'Hotel not found' });
      }
      hotelId = hotel.id;
    } else {
      hotelId = parseInt(hotel_id);
    }

    // Construir query com filtros de data opcionais
    let query = `
      SELECT 
        rsp.id,
        rsp.check_in,
        rsp.check_out_date,
        rsp.price,
        rsp.room_type,
        rsp.captured_at,
        rsp_prop.property_name,
        rs.status as search_status,
        rs.check_in_date as search_start,
        rs.check_out_date as search_end,
        rs.updated_at as search_completed,
        -- Adicionar informações de bundle
        rsp.is_bundle,
        rsp.bundle_size,
        rsp.original_price
      FROM rate_shopper_prices rsp
      JOIN rate_shopper_searches rs ON rsp.search_id = rs.id
      JOIN rate_shopper_properties rsp_prop ON rsp.property_id = rsp_prop.id
      WHERE rs.hotel_id = $1
    `;
    
    const queryParams = [hotelId];
    
    // Adicionar filtros de data se fornecidos
    if (start_date) {
      query += ` AND rsp.check_in >= $${queryParams.length + 1}`;
      queryParams.push(start_date);
    }
    
    if (end_date) {
      query += ` AND rsp.check_in <= $${queryParams.length + 1}`;
      queryParams.push(end_date);
    }
    
    query += ` ORDER BY rsp.check_in ASC, rsp.captured_at DESC LIMIT 100`;
    
    console.log('📊 API debug-prices: Query final:', query, queryParams);

    // Buscar preços filtrados por período
    const allPrices = await db.query(query, queryParams);

    // Buscar estatísticas com os mesmos filtros de data
    let statsQuery = `
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT rsp.property_id) as unique_properties,
        MIN(rsp.check_in) as oldest_date,
        MAX(rsp.check_in) as newest_date,
        MIN(rsp.price) as min_price,
        MAX(rsp.price) as max_price,
        AVG(rsp.price) as avg_price
      FROM rate_shopper_prices rsp
      JOIN rate_shopper_searches rs ON rsp.search_id = rs.id
      WHERE rs.hotel_id = $1
    `;
    
    const statsParams = [hotelId];
    
    // Aplicar os mesmos filtros de data nas estatísticas
    if (start_date) {
      statsQuery += ` AND rsp.check_in >= $${statsParams.length + 1}`;
      statsParams.push(start_date);
    }
    
    if (end_date) {
      statsQuery += ` AND rsp.check_in <= $${statsParams.length + 1}`;
      statsParams.push(end_date);
    }
    
    const stats = await db.query(statsQuery, statsParams);
    
    console.log('📈 API debug-prices: Resultado -', allPrices.length, 'registros encontrados para período:', start_date, 'até', end_date);

    res.json({
      success: true,
      data: {
        statistics: stats.rows[0] || {},
        prices: allPrices,
        total_found: allPrices.length
      }
    });

  } catch (error) {
    console.error('Debug prices error:', error);
    res.status(500).json({ error: 'Failed to get debug prices: ' + error.message });
  }
});

// GET /api/rate-shopper/:hotel_id/price-history
router.get('/:hotel_id/price-history', async (req, res) => {
  try {
    const hotel_id = req.params.hotel_id;
    const { start_date, end_date, property_id } = req.query;
    
    console.log('🔍 API price-history: Parâmetros recebidos:', { hotel_id, start_date, end_date, property_id });
    
    // Verificar se hotel_id é UUID e converter para ID
    let hotelId;
    if (hotel_id.includes('-')) {
      const hotel = await Hotel.findByUuid(hotel_id);
      if (!hotel) {
        return res.status(404).json({ error: 'Hotel not found' });
      }
      hotelId = hotel.id;
    } else {
      hotelId = parseInt(hotel_id);
    }

    // Query para buscar preços com comparação direta da tabela rate_shopper_prices
    let query = `
      WITH price_comparisons AS (
        SELECT 
          rsp1.property_id,
          rsp1.check_in,
          rsp1.price as current_price,
          rsp1.captured_at as current_captured_at,
          rsp1.hotel_id,
          p.property_name,
          rsp2.price as previous_price,
          rsp2.captured_at as previous_captured_at,
          CASE 
            WHEN rsp2.price IS NULL THEN 'NEW'
            WHEN rsp1.price > rsp2.price AND ((rsp1.price - rsp2.price) / rsp2.price * 100) > 1 THEN 'UP'
            WHEN rsp1.price < rsp2.price AND ((rsp2.price - rsp1.price) / rsp2.price * 100) > 1 THEN 'DOWN'
            ELSE 'STABLE'
          END as change_type,
          CASE 
            WHEN rsp2.price IS NULL THEN 0
            ELSE rsp1.price - rsp2.price
          END as price_change,
          CASE 
            WHEN rsp2.price IS NULL OR rsp2.price = 0 THEN 0
            ELSE ROUND(((rsp1.price - rsp2.price) / rsp2.price * 100)::numeric, 2)
          END as change_percentage
        FROM rate_shopper_prices rsp1
        JOIN rate_shopper_properties p ON rsp1.property_id = p.id
        LEFT JOIN rate_shopper_prices rsp2 ON (
          rsp1.property_id = rsp2.property_id 
          AND rsp1.check_in = rsp2.check_in
          AND rsp1.hotel_id = rsp2.hotel_id
          AND rsp2.captured_at < rsp1.captured_at
          AND rsp2.captured_at = (
            SELECT MAX(captured_at) 
            FROM rate_shopper_prices rsp3 
            WHERE rsp3.property_id = rsp1.property_id 
              AND rsp3.check_in = rsp1.check_in
              AND rsp3.hotel_id = rsp1.hotel_id
              AND rsp3.captured_at < rsp1.captured_at
          )
        )
        WHERE rsp1.hotel_id = $1
      )
      SELECT 
        *,
        CASE 
          WHEN change_type = 'UP' THEN '▲'
          WHEN change_type = 'DOWN' THEN '▼'
          WHEN change_type = 'STABLE' THEN '●'
          ELSE '◆'
        END as trend_indicator,
        CASE 
          WHEN change_type = 'UP' THEN 'text-green-600'
          WHEN change_type = 'DOWN' THEN 'text-red-600'
          WHEN change_type = 'STABLE' THEN 'text-gray-500'
          ELSE 'text-blue-600'
        END as trend_color
      FROM price_comparisons
      WHERE change_type IN ('UP', 'DOWN')
    `;
    
    const queryParams = [hotelId];
    
    // Filtros opcionais
    if (property_id) {
      query += ` AND property_id = $${queryParams.length + 1}`;
      queryParams.push(parseInt(property_id));
    }
    
    if (start_date) {
      query += ` AND check_in >= $${queryParams.length + 1}`;
      queryParams.push(start_date);
    }
    
    if (end_date) {
      query += ` AND check_in <= $${queryParams.length + 1}`;
      queryParams.push(end_date);
    }
    
    query += ` ORDER BY current_captured_at DESC, property_id, check_in LIMIT 500`;
    
    console.log('📊 API price-history: Query final:', query, queryParams);

    // Buscar comparações de preços
    const priceHistory = await db.query(query, queryParams);
    
    console.log('📈 API price-history: Encontrado', priceHistory.length, 'registros de mudanças de preço');

    res.json({
      success: true,
      data: {
        price_history: priceHistory,
        total_records: priceHistory.length
      }
    });

  } catch (error) {
    console.error('Price history error:', error);
    res.status(500).json({ error: 'Failed to get price history: ' + error.message });
  }
});

// GET /api/rate-shopper/:hotel_id/property-history/:property_id
router.get('/:hotel_id/property-history/:property_id', async (req, res) => {
  try {
    const { hotel_id, property_id } = req.params;
    const { date } = req.query;
    
    console.log('🔍 API property-history:', { hotel_id, property_id, date, dateType: typeof date });
    
    if (!date) {
      return res.status(400).json({ error: 'Date parameter is required' });
    }

    // Verificar se hotel_id é UUID e converter para ID
    let hotelId;
    if (hotel_id.includes('-')) {
      const hotel = await Hotel.findByUuid(hotel_id);
      if (!hotel) {
        return res.status(404).json({ error: 'Hotel not found' });
      }
      hotelId = hotel.id;
    } else {
      hotelId = parseInt(hotel_id);
    }

    // Buscar todos os preços da propriedade nesta data, ordenados por captured_at
    const query = `
      SELECT 
        rsp.price,
        rsp.captured_at,
        rsp.room_type,
        p.property_name,
        rsp.check_in
      FROM rate_shopper_prices rsp
      JOIN rate_shopper_properties p ON rsp.property_id = p.id
      WHERE rsp.hotel_id = $1 
        AND rsp.property_id = $2 
        AND rsp.check_in::date = $3::date
      ORDER BY rsp.captured_at ASC
    `;

    const priceHistory = await db.query(query, [hotelId, parseInt(property_id), date]);
    
    // Calcular variações
    const historyWithChanges = priceHistory.map((entry, index) => {
      let change = null;
      let changePercent = null;
      
      if (index > 0) {
        const previousPrice = parseFloat(priceHistory[index - 1].price);
        const currentPrice = parseFloat(entry.price);
        change = currentPrice - previousPrice;
        changePercent = (change / previousPrice) * 100;
      }

      return {
        ...entry,
        price: parseFloat(entry.price),
        captured_at: entry.captured_at,
        change: change ? parseFloat(change.toFixed(2)) : null,
        change_percent: changePercent ? parseFloat(changePercent.toFixed(2)) : null
      };
    });

    res.json({
      success: true,
      data: {
        property_name: priceHistory.rows[0]?.property_name || 'Unknown',
        date: date,
        history: historyWithChanges,
        total_extractions: priceHistory.length
      }
    });

  } catch (error) {
    console.error('Property history error:', error);
    res.status(500).json({ error: 'Failed to get property history: ' + error.message });
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
    
    const { property_name, booking_url, location, category, max_bundle_size, is_main_property } = req.body;

    // Validate URL (supports both Booking.com and Artaxnet)
    if (!RateShopperProperty.isValidUrl(booking_url)) {
      return res.status(400).json({ error: 'Invalid URL (must be Booking.com or Artaxnet)' });
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
      ota_name: urlInfo.ota_name,
      is_main_property: is_main_property || false
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

// PUT /api/rate-shopper/properties/:property_id/main-property
router.put('/properties/:property_id/main-property', async (req, res) => {
  try {
    const propertyId = req.params.property_id;
    const { is_main_property } = req.body;

    // Buscar a propriedade
    const property = await RateShopperProperty.findById(propertyId);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Se está definindo como principal, remover outras propriedades principais da mesma plataforma no mesmo hotel
    if (is_main_property) {
      await db.query(`
        UPDATE rate_shopper_properties 
        SET is_main_property = false 
        WHERE hotel_id = $1 AND id != $2 AND platform = $3 AND is_main_property = true
      `, [property.hotel_id, propertyId, property.platform]);
    }

    // Atualizar a propriedade atual
    property.is_main_property = is_main_property;
    await property.save();

    res.json({
      success: true,
      message: is_main_property ? 'Property set as main' : 'Property removed as main',
      data: property
    });

  } catch (error) {
    console.error('Update main property error:', error);
    res.status(500).json({ error: 'Failed to update main property' });
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
    const hotelId = req.hotel.id; // Use ID do hotel já convertido pelo middleware
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
    const hotel_id = req.params.hotel_id;
    const { property_id, start_date, end_date } = req.body;

    if (!property_id || !start_date || !end_date) {
      return res.status(400).json({ error: 'Property ID, start date and end date are required' });
    }

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

    // Verify property belongs to hotel
    const property = await RateShopperProperty.findById(property_id);
    if (!property || property.hotel_id !== hotelId) {
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
    const hotelId = req.hotel.id; // Use ID do hotel já convertido pelo middleware
    
    const result = await db.query(
      'SELECT * FROM rate_shopper_configs WHERE hotel_id = $1',
      [hotelId]
    );

    let config = result.rows[0];
    if (!config) {
      // Create default config
      await db.query(`
        INSERT INTO rate_shopper_configs (hotel_id, auto_search_enabled, search_frequency_hours, date_range_days) 
        VALUES ($1, FALSE, 8, 90)
      `, [hotelId]);
      
      const newResult = await db.query(
        'SELECT * FROM rate_shopper_configs WHERE hotel_id = $1',
        [hotelId]
      );
      config = newResult.rows[0];
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
    const hotelId = req.hotel.id; // Use ID do hotel já convertido pelo middleware
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

// GET /api/rate-shopper/:hotel_id/searches/progress (DISABLED - Schema issues)
router.get('/:hotel_id/searches/progress_disabled', async (req, res) => {
  try {
    const hotel_id = req.params.hotel_id;
    
    // Verificar se hotel_id é UUID ou integer e converter para ID
    let hotelId;
    if (hotel_id.includes('-')) {
      // É UUID, buscar hotel e pegar ID
      const Hotel = require('../models/Hotel');
      const hotel = await Hotel.findByUuid(hotel_id);
      if (!hotel) {
        return res.status(404).json({ error: 'Hotel not found' });
      }
      hotelId = hotel.id;
    } else {
      // É ID integer
      hotelId = parseInt(hotel_id);
    }
    
    // Buscar searches em progresso e seus detalhes
    const runningSearches = await db.query(`
      SELECT 
        rs.id,
        rs.search_status,
        rsp.property_name,
        -- Contagem real de preços salvos
        COUNT(rsp_prices.id) as actual_prices_count
      FROM rate_shopper_searches rs
      JOIN rate_shopper_properties rsp ON rs.property_id = rsp.id
      LEFT JOIN rate_shopper_prices rsp_prices ON rs.id = rsp_prices.search_id
      WHERE rs.hotel_id = $1 
        AND rs.search_status IN ('RUNNING', 'PENDING')
      GROUP BY rs.id, rs.search_status, rsp.property_name
      ORDER BY rs.created_at DESC
    `, [hotelId]);

    // Buscar searches recém-completadas nas últimas 2 horas
    const recentCompleted = await db.query(`
      SELECT 
        rs.id,
        rs.search_status,
        rs.updated_at,
        rsp.property_name,
        COUNT(rsp_prices.id) as actual_prices_count
      FROM rate_shopper_searches rs
      JOIN rate_shopper_properties rsp ON rs.property_id = rsp.id
      LEFT JOIN rate_shopper_prices rsp_prices ON rs.id = rsp_prices.search_id
      WHERE rs.hotel_id = $1 
        AND rs.search_status IN ('COMPLETED', 'FAILED', 'CANCELLED')
        AND rs.updated_at >= NOW() - INTERVAL '2 hours'
      GROUP BY rs.id, rs.search_status, rs.updated_at, rsp.property_name
      ORDER BY rs.updated_at DESC
      LIMIT 5
    `, [hotelId]);

    // Estatísticas gerais do hotel
    const stats = await db.query(`
      SELECT 
        COUNT(CASE WHEN search_status = 'RUNNING' THEN 1 END) as running_count,
        COUNT(CASE WHEN search_status = 'PENDING' THEN 1 END) as pending_count,
        COUNT(CASE WHEN search_status = 'COMPLETED' AND DATE(updated_at) = CURRENT_DATE THEN 1 END) as completed_today,
        COUNT(CASE WHEN search_status = 'FAILED' AND DATE(updated_at) = CURRENT_DATE THEN 1 END) as failed_today
      FROM rate_shopper_searches 
      WHERE hotel_id = $1
    `, [hotelId]);

    res.json({
      success: true,
      data: {
        running_searches: runningSearches,
        recent_completed: recentCompleted,
        stats: stats.rows[0] || { running_count: 0, pending_count: 0, completed_today: 0, failed_today: 0 },
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
    const hotel_id = req.params.hotel_id;
    
    // Verificar se hotel_id é UUID ou integer e converter para ID
    let hotelId;
    if (hotel_id.includes('-')) {
      // É UUID, buscar hotel e pegar ID
      const Hotel = require('../models/Hotel');
      const hotel = await Hotel.findByUuid(hotel_id);
      if (!hotel) {
        return res.status(404).json({ error: 'Hotel not found' });
      }
      hotelId = hotel.id;
    } else {
      // É ID integer
      hotelId = parseInt(hotel_id);
    }
    
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
        h.name as hotel_name
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
        check_in,
        price,
        room_type,
        captured_at
      FROM rate_shopper_prices 
      WHERE search_id = $1 
      ORDER BY captured_at DESC 
      LIMIT 10
    `, [searchId]);

    // Contagem total de preços salvos
    const priceCount = await db.query(`
      SELECT COUNT(*) as total_prices
      FROM rate_shopper_prices 
      WHERE search_id = $1
    `, [searchId]);

    const search = searchDetails.rows[0];
    search.actual_prices_count = parseInt(priceCount.rows[0]?.total_prices || 0);

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
    
    // Verificar se a busca existe e pertence ao hotel
    const search = await db.query(`
      SELECT rs.*, rsp.property_name
      FROM rate_shopper_searches rs
      LEFT JOIN rate_shopper_properties rsp ON rs.property_id = rsp.id
      WHERE rs.id = $1 AND rs.hotel_id = $2
    `, [search_id, hotelId]);

    if (search.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Busca não encontrada ou não pertence a este hotel' 
      });
    }

    const searchData = search.rows[0];

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
    `, [search_id, hotelId]);
    
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
    
    // Converter UUID para ID se necessário
    let hotelId = hotel_id;
    if (hotel_id.includes('-')) {
      const hotel = await Hotel.findByUuid(hotel_id);
      if (!hotel) {
        return res.status(404).json({ 
          success: false, 
          error: 'Hotel não encontrado' 
        });
      }
      hotelId = hotel.id;
    }
    
    // Verificar se a busca existe e pertence ao hotel
    const search = await RateShopperSearch.findById(search_id);
    if (!search || search.hotel_id != hotelId) {
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
    
    const updatedSearch = new RateShopperSearch(updatedSearchData.rows[0]);
    updatedSearch.property_name = updatedSearchData.rows[0].property_name;

    // Usar UUID original ou buscar se foi convertido
    let hotelUuid = hotel_id;
    if (!hotel_id.includes('-')) {
      // Se for ID numérico, buscar UUID
      const hotelData = await db.query('SELECT hotel_uuid FROM hotels WHERE id = $1', [hotel_id]);
      if (hotelData.length > 0) {
        hotelUuid = hotelData.rows[0].hotel_uuid;
      }
    }

    // Emitir evento Socket.io para clientes conectados
    const io = req.app.get('socketio');
    if (io) {
      emitExtractionProgress(io, hotelUuid, {
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

// PUT /api/rate-shopper/:hotel_id/searches/:search_id/complete
router.put('/:hotel_id/searches/:search_id/complete', async (req, res) => {
  try {
    const { hotel_id, search_id } = req.params;
    const { 
      status, 
      processed_dates, 
      total_dates,
      total_prices_found, 
      property_name, 
      started_at, 
      completed_at, 
      error_log 
    } = req.body;
    
    // Converter UUID para ID se necessário
    let hotelId = hotel_id;
    if (hotel_id.includes('-')) {
      const hotel = await Hotel.findByUuid(hotel_id);
      if (!hotel) {
        return res.status(404).json({ 
          success: false, 
          error: 'Hotel não encontrado' 
        });
      }
      hotelId = hotel.id;
    }
    
    // Verificar se a busca existe e pertence ao hotel
    const search = await RateShopperSearch.findById(search_id);
    if (!search || search.hotel_id != hotelId) {
      return res.status(404).json({ 
        success: false, 
        error: 'Busca não encontrada ou não pertence a este hotel' 
      });
    }

    console.log(`📡 Recebida notificação de conclusão para busca ${search_id}: ${status}`);

    // Usar UUID original ou buscar se foi convertido
    let hotelUuid = hotel_id;
    if (!hotel_id.includes('-')) {
      // Se for ID numérico, buscar UUID
      const hotelData = await db.query('SELECT hotel_uuid FROM hotels WHERE id = $1', [hotel_id]);
      if (hotelData.length > 0) {
        hotelUuid = hotelData.rows[0].hotel_uuid;
      }
    }

    // Emitir evento Socket.io para clientes conectados
    const io = req.app.get('socketio');
    if (io) {
      emitExtractionProgress(io, hotelUuid, {
        searchId: search_id,
        id: search.id,
        status,
        processed_dates,
        total_dates,
        progress_percentage: status === 'COMPLETED' ? 100 : (processed_dates && total_dates ? Math.round((processed_dates / total_dates) * 100) : 0),
        total_prices_found,
        duration_seconds: search.duration_seconds,
        started_at,
        completed_at,
        property_name,
        error_log
      });

      console.log(`📡 Evento Socket.io emitido para hotel ${hotelUuid}: ${status}`);
    }
    
    res.json({
      success: true,
      message: 'Notificação de conclusão processada com sucesso',
      data: {
        search_id,
        status,
        hotel_uuid: hotelUuid
      }
    });

  } catch (error) {
    console.error('Complete notification error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Falha ao processar notificação de conclusão' 
    });
  }
});

// ROTA TEMPORÁRIA PARA TESTAR A CONSULTA COM JOIN CORRETO
router.get('/:hotel_id/test-main-property-join', async (req, res) => {
  try {
    const hotel_id = req.params.hotel_id;
    
    // Verificar se hotel_id é UUID e converter para ID
    let hotelId;
    if (hotel_id.includes('-')) {
      const hotel = await Hotel.findByUuid(hotel_id);
      if (!hotel) {
        return res.status(404).json({ error: 'Hotel not found' });
      }
      hotelId = hotel.id;
    } else {
      hotelId = parseInt(hotel_id);
    }
    
    // Testar a consulta do dashboard com JOIN correto
    const searchesWithMainProperty = await db.query(`
      SELECT 
        rs.id,
        rs.search_status,
        rs.created_at,
        rsp.property_name,
        rsp.is_main_property,
        CASE 
          WHEN rsp.is_main_property = true THEN 'SIM ✅'
          ELSE 'NÃO ❌'
        END as is_main_display
      FROM rate_shopper_searches rs
      LEFT JOIN rate_shopper_properties rsp ON rs.property_id = rsp.id
      WHERE rs.hotel_id = $1
      ORDER BY rsp.is_main_property DESC, rs.created_at DESC
      LIMIT 10
    `, [hotelId]);
    
    console.log('🔍 JOIN Test Result:', searchesWithMainProperty);
    
    res.json({
      success: true,
      message: 'JOIN test executado com sucesso',
      data: {
        hotel_id: hotelId,
        searches_count: searchesWithMainProperty.length,
        searches: searchesWithMainProperty,
        main_property_searches: searchesWithMainProperty.filter(s => s.is_main_property),
        explanation: 'A coluna is_main_property vem da tabela rate_shopper_properties via JOIN, não existe na tabela rate_shopper_searches'
      }
    });

  } catch (error) {
    console.error('JOIN test error:', error);
    res.status(500).json({ error: 'Failed to test JOIN: ' + error.message });
  }
});

// ROTA TEMPORÁRIA PARA VERIFICAR DADOS DAS PROPRIEDADES
router.get('/:hotel_id/debug-properties', async (req, res) => {
  try {
    const hotel_id = req.params.hotel_id;
    
    // Verificar se hotel_id é UUID e converter para ID
    let hotelId;
    if (hotel_id.includes('-')) {
      const hotel = await Hotel.findByUuid(hotel_id);
      if (!hotel) {
        return res.status(404).json({ error: 'Hotel not found' });
      }
      hotelId = hotel.id;
    } else {
      hotelId = parseInt(hotel_id);
    }
    
    // Buscar todas as propriedades do hotel
    const properties = await db.query(`
      SELECT 
        id,
        property_name,
        is_main_property,
        active,
        created_at
      FROM rate_shopper_properties
      WHERE hotel_id = $1
      ORDER BY property_name
    `, [hotelId]);
    
    // Buscar todas as buscas do hotel com JOIN para pegar is_main_property
    const searches = await db.query(`
      SELECT 
        rs.id as search_id,
        rs.search_status,
        rs.created_at,
        rsp.id as property_id,
        rsp.property_name,
        rsp.is_main_property
      FROM rate_shopper_searches rs
      LEFT JOIN rate_shopper_properties rsp ON rs.property_id = rsp.id
      WHERE rs.hotel_id = $1
      ORDER BY rs.created_at DESC
      LIMIT 20
    `, [hotelId]);
    
    console.log('🔍 DEBUG Properties:', properties);
    console.log('🔍 DEBUG Searches:', searches);
    
    res.json({
      success: true,
      data: {
        hotel_id: hotelId,
        properties_count: properties.length,
        searches_count: searches.length,
        properties: properties,
        searches: searches,
        main_properties: properties.filter(p => p.is_main_property),
        eco_encanto_property: properties.find(p => p.property_name.toLowerCase().includes('eco encanto')),
        eco_encanto_searches: searches.filter(s => s.property_name && s.property_name.toLowerCase().includes('eco encanto'))
      }
    });

  } catch (error) {
    console.error('Debug properties error:', error);
    res.status(500).json({ error: 'Failed to debug properties: ' + error.message });
  }
});

// ROTA TEMPORÁRIA PARA INVESTIGAR DATA ESPECÍFICA
router.get('/:hotel_id/debug-specific-date/:date', async (req, res) => {
  try {
    const hotel_id = req.params.hotel_id;
    const target_date = req.params.date;
    
    console.log('🔍 API debug-specific-date: Investigando data:', target_date, 'para hotel:', hotel_id);
    
    // Verificar se hotel_id é UUID e converter para ID
    let hotelId;
    if (hotel_id.includes('-')) {
      const hotel = await Hotel.findByUuid(hotel_id);
      if (!hotel) {
        return res.status(404).json({ error: 'Hotel not found' });
      }
      hotelId = hotel.id;
    } else {
      hotelId = parseInt(hotel_id);
    }
    
    // Buscar todas as variações possíveis dessa data
    const exactMatches = await db.query(`
      SELECT 
        rsp.id,
        rsp.check_in,
        rsp.price,
        rsp.captured_at,
        rsp_prop.property_name,
        rs.search_status,
        rs.completed_at
      FROM rate_shopper_prices rsp
      JOIN rate_shopper_searches rs ON rsp.search_id = rs.id
      JOIN rate_shopper_properties rsp_prop ON rsp.property_id = rsp_prop.id
      WHERE rs.hotel_id = $1 
      AND rsp.check_in::date = $2::date
      ORDER BY rsp.captured_at DESC
    `, [hotelId, target_date]);
    
    // Buscar próximas datas disponíveis
    const nearbyDates = await db.query(`
      SELECT 
        DISTINCT rsp.check_in::date as date,
        COUNT(*) as total_prices
      FROM rate_shopper_prices rsp
      JOIN rate_shopper_searches rs ON rsp.search_id = rs.id
      WHERE rs.hotel_id = $1 
      AND rsp.check_in::date BETWEEN $2::date - INTERVAL '5 days' AND $2::date + INTERVAL '5 days'
      GROUP BY rsp.check_in::date
      ORDER BY rsp.check_in::date
    `, [hotelId, target_date]);
    
    // Verificar se há buscas realizadas que cobriam essa data
    const searchesCovering = await db.query(`
      SELECT 
        rs.id,
        rs.check_in_date as check_in,
        rs.check_out_date as check_out,
        rs.status as search_status,
        rs.created_at,
        rs.updated_at,
        COUNT(rsp.id) as prices_found
      FROM rate_shopper_searches rs
      LEFT JOIN rate_shopper_prices rsp ON rs.id = rsp.search_id AND rsp.check_in_date::date = $2::date
      WHERE rs.hotel_id = $1 
      AND rs.check_in_date <= $2::date 
      AND rs.check_out_date >= $2::date
      GROUP BY rs.id, rs.check_in_date, rs.check_out_date, rs.status, rs.created_at, rs.updated_at
      ORDER BY rs.created_at DESC
    `, [hotelId, target_date]);
    
    console.log('🔍 API debug-specific-date: Resultados para', target_date, ':', {
      exactMatches: exactMatches.length,
      nearbyDatesWithData: nearbyDates.length,
      searchesCoveringDate: searchesCovering.length
    });
    
    res.json({
      success: true,
      data: {
        target_date,
        exact_matches: exactMatches,
        nearby_dates: nearbyDates,
        searches_covering_date: searchesCovering,
        summary: {
          has_exact_data: exactMatches.length > 0,
          total_exact_matches: exactMatches.length,
          nearby_dates_count: nearbyDates.length,
          searches_covering_count: searchesCovering.length
        }
      }
    });

  } catch (error) {
    console.error('Debug specific date error:', error);
    res.status(500).json({ error: 'Failed to debug specific date: ' + error.message });
  }
});

module.exports = router;