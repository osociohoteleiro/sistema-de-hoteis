// Script para inserir propriedades diretamente na produção
const { Pool } = require('pg');

const productionConfig = {
  host: 'ep.osociohoteleiro.com.br',
  port: 5432,
  user: 'postgres',
  password: 'OSH4040()Xx!..nn',
  database: 'osh_hotels',
  ssl: false,
  connectionTimeoutMillis: 10000,
  max: 5
};

async function insertPropertiesInProduction() {
  console.log('🚀 Iniciando inserção de propriedades na produção...');
  
  const pool = new Pool(productionConfig);
  
  try {
    const client = await pool.connect();
    
    // Propriedades baseadas no banco local
    const properties = [
      {
        property_name: 'Eco Encanto Pousada',
        property_url: 'https://www.booking.com/hotel/br/eco-encanto-pousada-e-hostel.pt-br.html',
        booking_engine: 'booking',
        is_main_property: true,
        active: true
      },
      {
        property_name: 'Chalés Four Seasons',
        property_url: 'https://www.booking.com/hotel/br/chales-four-seasons.pt-br.html',
        booking_engine: 'booking',
        is_main_property: false,
        active: true
      },
      {
        property_name: 'Pousada Aldeia da Lagoinha',
        property_url: 'https://www.booking.com/hotel/br/aldeia-da-lagoinha.pt-br.html',
        booking_engine: 'booking',
        is_main_property: false,
        active: true
      },
      {
        property_name: 'Pousada Kaliman',
        property_url: 'https://www.booking.com/hotel/br/kaliman-pousada.pt-br.html',
        booking_engine: 'booking',
        is_main_property: false,
        active: true
      },
      {
        property_name: 'Venice Hotel',
        property_url: 'https://www.booking.com/hotel/br/caribe-ubatuba.pt-br.html',
        booking_engine: 'booking',
        is_main_property: false,
        active: true
      },
      {
        property_name: 'Hotel Porto do Eixo',
        property_url: 'https://www.booking.com/hotel/br/porto-do-eixo.pt-br.html',
        booking_engine: 'booking',
        is_main_property: false,
        active: true
      },
      {
        property_name: 'Pousada Aquária',
        property_url: 'https://www.booking.com/hotel/br/pousada-aquaria.pt-br.html',
        booking_engine: 'booking',
        is_main_property: false,
        active: true
      },
      {
        property_name: 'Eco Encanto Pousada',
        property_url: 'https://eco-encanto-pousada.artaxnet.com/#/',
        booking_engine: 'artaxnet',
        is_main_property: true,
        active: true
      }
    ];
    
    console.log(`📋 Inserindo ${properties.length} propriedades para hotel ID 17...`);
    
    // Limpar propriedades existentes primeiro
    await client.query('DELETE FROM rate_shopper_properties WHERE hotel_id = 17');
    console.log('🗑️ Propriedades existentes removidas');
    
    let insertedCount = 0;
    
    for (const prop of properties) {
      try {
        const result = await client.query(`
          INSERT INTO rate_shopper_properties (
            hotel_id, property_name, property_url, booking_engine, 
            is_main_property, active, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          RETURNING id
        `, [
          17, // hotel_id
          prop.property_name,
          prop.property_url,
          prop.booking_engine,
          prop.is_main_property,
          prop.active
        ]);
        
        insertedCount++;
        console.log(`✅ ${insertedCount}. ${prop.property_name} (${prop.booking_engine}) ${prop.is_main_property ? '⭐' : ''} - ID: ${result.rows[0].id}`);
        
      } catch (error) {
        console.error(`❌ Erro ao inserir ${prop.property_name}:`, error.message);
      }
    }
    
    // Verificação final
    const finalCount = await client.query(`
      SELECT COUNT(*) as total,
             COUNT(CASE WHEN is_main_property = true THEN 1 END) as main_properties
      FROM rate_shopper_properties 
      WHERE hotel_id = 17
    `);
    
    console.log('\n🎉 INSERÇÃO CONCLUÍDA!');
    console.log('📊 RESUMO:');
    console.log(`   - Propriedades inseridas: ${insertedCount}`);
    console.log(`   - Total na produção: ${finalCount.rows[0].total}`);
    console.log(`   - Propriedades principais: ${finalCount.rows[0].main_properties}`);
    
    // Listar todas as propriedades inseridas
    const listResult = await client.query(`
      SELECT id, property_name, booking_engine, is_main_property
      FROM rate_shopper_properties 
      WHERE hotel_id = 17
      ORDER BY id
    `);
    
    console.log('\n🏨 PROPRIEDADES NA PRODUÇÃO:');
    listResult.rows.forEach((prop, index) => {
      console.log(`   ${index + 1}. ${prop.property_name} (${prop.booking_engine}) ${prop.is_main_property ? '⭐ PRINCIPAL' : ''}`);
    });
    
    console.log('\n🌐 ACESSE: https://pms.osociohoteleiro.com.br/rate-shopper/properties');
    
    client.release();
    
  } catch (error) {
    console.error('💥 Erro na inserção:', error.message);
  } finally {
    await pool.end();
  }
}

insertPropertiesInProduction().catch(console.error);