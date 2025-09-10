// Script para criar propriedades diretamente no banco local
require('dotenv').config();
const { Pool } = require('pg');

const localConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT) || 5432,
  user: process.env.POSTGRES_USER || 'osh_user',
  password: process.env.POSTGRES_PASSWORD || 'osh_password_2024',
  database: process.env.POSTGRES_DB || 'osh_db',
  max: 10
};

async function createProperties() {
  const pool = new Pool(localConfig);
  
  try {
    console.log('🔄 Conectando ao banco local...');
    
    // Verificar se o hotel existe
    const hotelCheck = await pool.query(
      'SELECT id, name FROM hotels WHERE hotel_uuid = $1',
      ['0cf84c30-82cb-11f0-bd40-02420a0b00b1']
    );

    if (hotelCheck.rows.length === 0) {
      console.log('❌ Hotel não encontrado');
      return;
    }

    const hotel = hotelCheck.rows[0];
    console.log(`✅ Hotel encontrado: ${hotel.name} (ID: ${hotel.id})`);

    // Propriedades para criar
    const properties = [
      {
        property_name: "Eco Encanto Pousada",
        booking_url: "https://eco-encanto-pousada.artaxnet.com/#/",
        location: "Ubatuba", 
        category: "Pousada",
        competitor_type: "DIRECT",
        ota_name: "Artaxnet",
        platform: "artaxnet",
        max_bundle_size: 7,
        is_main_property: true,
        active: true
      },
      {
        property_name: "Pousada Aquária",
        booking_url: "https://www.booking.com/hotel/br/pousada-aquaria.pt-br.html",
        location: "Ubatuba",
        category: "Pousada",
        competitor_type: "OTA",
        ota_name: "Booking.com",
        platform: "booking",
        max_bundle_size: 7,
        is_main_property: false,
        active: true
      },
      {
        property_name: "Chalés Four Seasons",
        booking_url: "https://www.booking.com/hotel/br/chales-four-seasons.pt-br.html",
        location: "Ubatuba",
        category: "Pousada",
        competitor_type: "OTA",
        ota_name: "Booking.com",
        platform: "booking",
        max_bundle_size: 7,
        is_main_property: false,
        active: true
      }
    ];

    let insertedCount = 0;

    for (const prop of properties) {
      try {
        // Verificar se já existe
        const existingCheck = await pool.query(
          'SELECT id FROM rate_shopper_properties WHERE hotel_id = $1 AND property_name = $2 AND platform = $3',
          [hotel.id, prop.property_name, prop.platform]
        );

        if (existingCheck.rows.length > 0) {
          console.log(`⚠️ Propriedade já existe: ${prop.property_name} (${prop.platform})`);
          continue;
        }

        // Inserir a propriedade
        const result = await pool.query(`
          INSERT INTO rate_shopper_properties (
            hotel_id, property_name, booking_url, location, category, 
            competitor_type, ota_name, platform, max_bundle_size, 
            is_main_property, active, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
          RETURNING id
        `, [
          hotel.id,
          prop.property_name,
          prop.booking_url,
          prop.location,
          prop.category,
          prop.competitor_type,
          prop.ota_name,
          prop.platform,
          prop.max_bundle_size,
          prop.is_main_property,
          prop.active
        ]);

        const propertyId = result.rows[0].id;
        console.log(`✅ Propriedade criada: ${prop.property_name} (${prop.platform}) - ID: ${propertyId}`);
        insertedCount++;

      } catch (error) {
        console.error(`❌ Erro ao criar ${prop.property_name}:`, error.message);
      }
    }

    // Verificar resultado final
    const finalCount = await pool.query(
      'SELECT COUNT(*) as total FROM rate_shopper_properties WHERE hotel_id = $1',
      [hotel.id]
    );

    console.log(`\n🎉 Processo concluído!`);
    console.log(`📊 Resumo:`);
    console.log(`   - Propriedades inseridas: ${insertedCount}`);
    console.log(`   - Total de propriedades no hotel: ${finalCount.rows[0].total}`);

  } catch (error) {
    console.error('💥 Erro:', error.message);
  } finally {
    await pool.end();
  }
}

createProperties().catch(console.error);