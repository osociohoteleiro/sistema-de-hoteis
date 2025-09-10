const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Endpoint para importar propriedades via API remota
router.post('/import-properties', async (req, res) => {
  try {
    console.log('🚀 Iniciando importação de propriedades via API');
    
    const { properties } = req.body;
    
    if (!properties || !Array.isArray(properties)) {
      return res.status(400).json({
        success: false,
        error: 'Array de propriedades é obrigatório'
      });
    }

    let importedCount = 0;
    let skippedCount = 0;
    const results = [];

    for (const prop of properties) {
      try {
        // Verificar se o hotel existe
        const hotelCheck = await db.query(
          'SELECT id FROM hotels WHERE hotel_uuid = $1',
          [prop.hotel_uuid]
        );

        if (hotelCheck.length === 0) {
          console.log(`⚠️ Hotel não encontrado: ${prop.hotel_uuid}`);
          skippedCount++;
          results.push({
            property_name: prop.property_name,
            status: 'skipped',
            reason: 'Hotel não encontrado'
          });
          continue;
        }

        const prodHotelId = hotelCheck[0].id;

        // Inserir ou atualizar propriedade
        const insertQuery = `
          INSERT INTO rate_shopper_properties 
          (hotel_id, property_name, booking_url, location, category, competitor_type, 
           ota_name, max_bundle_size, platform, is_main_property, active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (hotel_id, property_name) DO UPDATE SET
            booking_url = EXCLUDED.booking_url,
            location = EXCLUDED.location,
            category = EXCLUDED.category,
            competitor_type = EXCLUDED.competitor_type,
            ota_name = EXCLUDED.ota_name,
            max_bundle_size = EXCLUDED.max_bundle_size,
            platform = EXCLUDED.platform,
            is_main_property = EXCLUDED.is_main_property,
            active = EXCLUDED.active,
            updated_at = EXCLUDED.updated_at
        `;

        await db.query(insertQuery, [
          prodHotelId,
          prop.property_name,
          prop.booking_url,
          prop.location,
          prop.category,
          prop.competitor_type,
          prop.ota_name,
          prop.max_bundle_size || 7,
          prop.platform || 'booking',
          prop.is_main_property || false,
          prop.active !== undefined ? prop.active : true,
          prop.created_at || new Date(),
          new Date()
        ]);

        importedCount++;
        results.push({
          property_name: prop.property_name,
          status: 'imported',
          hotel_id: prodHotelId
        });

        console.log(`✅ Importada: ${prop.property_name}`);

      } catch (error) {
        console.error(`❌ Erro ao importar ${prop.property_name}:`, error.message);
        skippedCount++;
        results.push({
          property_name: prop.property_name,
          status: 'error',
          reason: error.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Importação concluída',
      statistics: {
        total: properties.length,
        imported: importedCount,
        skipped: skippedCount
      },
      results
    });

  } catch (error) {
    console.error('Erro na importação:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para listar propriedades atuais
router.get('/current-properties', async (req, res) => {
  try {
    const properties = await db.query(`
      SELECT 
        rsp.*,
        h.name as hotel_name,
        h.hotel_uuid
      FROM rate_shopper_properties rsp
      JOIN hotels h ON rsp.hotel_id = h.id
      ORDER BY h.name, rsp.property_name
    `);

    res.json({
      success: true,
      data: properties,
      total: properties.length
    });

  } catch (error) {
    console.error('Erro ao listar propriedades:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;