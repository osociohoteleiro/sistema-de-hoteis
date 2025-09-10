// Script para debugar relacionamentos usuário-hotel (corrigido)
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

async function debugUserHotelFinal() {
  console.log('🔍 DEBUG RELACIONAMENTOS USUÁRIO-HOTEL (CORRIGIDO)\n');
  
  const pool = new Pool(productionConfig);
  
  try {
    // 1. Verificar todos os hotéis (com coluna correta)
    console.log('🏨 1. Listando todos os hotéis...');
    
    const allHotels = await pool.query(`
      SELECT id, hotel_uuid, name, created_at
      FROM hotels 
      ORDER BY id
    `);
    
    console.log(`🏨 Total de hotéis: ${allHotels.rows.length}`);
    allHotels.rows.forEach((hotel, index) => {
      console.log(`   ${index + 1}. ID: ${hotel.id} | Nome: ${hotel.name}`);
      console.log(`      UUID: ${hotel.hotel_uuid}`);
    });
    
    // 2. Verificar estrutura da tabela user_hotels
    console.log('\n🔗 2. Estrutura da tabela user_hotels...');
    
    const userHotelSchema = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'user_hotels'
      ORDER BY ordinal_position
    `);
    
    console.log('📊 Colunas da tabela user_hotels:');
    userHotelSchema.rows.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
    });
    
    // 3. Verificar relacionamentos do usuário Giandro
    console.log('\n👤 3. Hotéis do usuário Giandro...');
    
    const giandrHotels = await pool.query(`
      SELECT 
        h.id,
        h.hotel_uuid,
        h.name,
        uh.created_at as relationship_created
      FROM hotels h
      JOIN user_hotels uh ON h.id = uh.hotel_id
      WHERE uh.user_id = 10
      ORDER BY uh.created_at DESC
    `);
    
    console.log(`✅ Giandro está associado a ${giandrHotels.rows.length} hotéis:`);
    giandrHotels.rows.forEach((hotel, index) => {
      console.log(`   ${index + 1}. ID: ${hotel.id} | Nome: ${hotel.name}`);
      console.log(`      UUID: ${hotel.hotel_uuid}`);
      console.log(`      Relacionamento criado: ${hotel.relationship_created}`);
    });
    
    // 4. Verificar dados Rate Shopper para cada hotel do Giandro
    console.log('\n📊 4. Dados Rate Shopper para hotéis do Giandro...');
    
    for (const hotel of giandrHotels.rows) {
      console.log(`\n🏨 Hotel: ${hotel.name} (ID: ${hotel.id})`);
      
      // Propriedades
      const properties = await pool.query(`
        SELECT id, property_name, booking_engine, is_main_property, active
        FROM rate_shopper_properties 
        WHERE hotel_id = $1
        ORDER BY created_at DESC
      `, [hotel.id]);
      
      console.log(`   🏠 Propriedades: ${properties.rows.length}`);
      properties.rows.forEach((prop, index) => {
        console.log(`     ${index + 1}. ${prop.property_name} (${prop.booking_engine}) ${prop.is_main_property ? '⭐' : ''}`);
      });
      
      // Searches
      const searches = await pool.query(`
        SELECT COUNT(*) as total, MAX(created_at) as last_search
        FROM rate_shopper_searches 
        WHERE hotel_id = $1
      `, [hotel.id]);
      
      console.log(`   🔍 Searches: ${searches.rows[0].total} (última: ${searches.rows[0].last_search})`);
      
      // Preços
      const prices = await pool.query(`
        SELECT COUNT(*) as total, MAX(created_at) as last_price
        FROM rate_shopper_prices 
        WHERE hotel_id = $1
      `, [hotel.id]);
      
      console.log(`   💰 Preços: ${prices.rows[0].total} (último: ${prices.rows[0].last_price})`);
    }
    
    // 5. Verificar dados Rate Shopper hotel ID 17 especificamente
    console.log('\n🎯 5. Verificando dados Rate Shopper hotel ID 17...');
    
    const hotel17 = await pool.query(`
      SELECT id, hotel_uuid, name
      FROM hotels 
      WHERE id = 17
    `);
    
    if (hotel17.rows.length > 0) {
      const hotel = hotel17.rows[0];
      console.log(`✅ Hotel ID 17: ${hotel.name} (UUID: ${hotel.hotel_uuid})`);
      
      // Verificar se Giandro tem acesso a este hotel
      const giandrAccess = await pool.query(`
        SELECT * FROM user_hotels 
        WHERE user_id = 10 AND hotel_id = 17
      `);
      
      if (giandrAccess.rows.length > 0) {
        console.log('✅ Giandro TEM acesso ao hotel ID 17');
      } else {
        console.log('❌ Giandro NÃO tem acesso ao hotel ID 17');
        console.log('🔧 ESTE É O PROBLEMA! Vou corrigir...');
        
        // Adicionar relacionamento
        try {
          await pool.query(`
            INSERT INTO user_hotels (user_id, hotel_id, created_at)
            VALUES (10, 17, NOW())
            ON CONFLICT (user_id, hotel_id) DO NOTHING
          `);
          console.log('✅ Relacionamento usuário-hotel adicionado!');
        } catch (error) {
          console.log(`❌ Erro ao adicionar relacionamento: ${error.message}`);
        }
      }
      
      // Verificar dados Rate Shopper do hotel 17
      const hotel17Stats = await pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM rate_shopper_properties WHERE hotel_id = 17) as properties,
          (SELECT COUNT(*) FROM rate_shopper_searches WHERE hotel_id = 17) as searches,
          (SELECT COUNT(*) FROM rate_shopper_prices WHERE hotel_id = 17) as prices
      `);
      
      const stats = hotel17Stats.rows[0];
      console.log(`📊 Dados hotel ID 17:`);
      console.log(`   Propriedades: ${stats.properties}`);
      console.log(`   Searches: ${stats.searches}`);
      console.log(`   Preços: ${stats.prices}`);
      
    } else {
      console.log('❌ Hotel ID 17 não existe');
    }
    
    // 6. Verificar se há algum problema com o UUID do hotel local vs produção
    console.log('\n🔍 6. Comparando com dados locais conhecidos...');
    
    const ecoEncantoHotels = await pool.query(`
      SELECT id, hotel_uuid, name
      FROM hotels 
      WHERE name ILIKE '%eco%encanto%' OR name ILIKE '%eco encanto%'
    `);
    
    console.log('🏨 Hotéis com "Eco Encanto" no nome:');
    ecoEncantoHotels.rows.forEach((hotel, index) => {
      console.log(`   ${index + 1}. ID: ${hotel.id} | Nome: ${hotel.name}`);
      console.log(`      UUID: ${hotel.hotel_uuid}`);
    });
    
    console.log('\n📋 === DIAGNÓSTICO FINAL ===');
    console.log('🔍 Problemas identificados:');
    
    if (giandrHotels.rows.length === 0) {
      console.log('❌ Usuário Giandro não tem nenhum hotel associado');
    } else {
      const hasHotel17 = giandrHotels.rows.some(h => h.id === 17);
      if (!hasHotel17) {
        console.log('❌ Usuário Giandro não tem acesso ao hotel ID 17 (onde estão os dados Rate Shopper)');
      } else {
        console.log('✅ Relacionamento usuário-hotel está correto');
      }
    }
    
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('1. Verificar se a interface está usando o hotel_id correto');
    console.log('2. Verificar se as rotas da API filtram por hotel_id corretamente');
    console.log('3. Verificar se a sessão do usuário mantém o hotel selecionado');
    
  } catch (error) {
    console.error('❌ Erro no debug:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

debugUserHotelFinal().catch(console.error);