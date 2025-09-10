// Script para debugar relacionamentos do Rate Shopper
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

async function debugRateShopperRelationships() {
  console.log('🔍 DEBUGANDO RELACIONAMENTOS DO RATE SHOPPER\n');
  
  const pool = new Pool(productionConfig);
  
  try {
    // 1. Verificar usuário Giandro e seus hotéis
    console.log('👤 1. Verificando usuário Giandro...');
    
    const giandroCur = await pool.query(`
      SELECT id, name, email, created_at
      FROM users 
      WHERE email LIKE '%giandro%' OR name LIKE '%Giandro%'
    `);
    
    if (giandroCur.rows.length > 0) {
      console.log('✅ Usuário Giandro encontrado:');
      giandroCur.rows.forEach(user => {
        console.log(`   ID: ${user.id} | Nome: ${user.name} | Email: ${user.email}`);
      });
      
      const userId = giandroCur.rows[0].id;
      
      // Verificar hotéis associados ao usuário
      console.log('\n🏨 2. Verificando hotéis do usuário...');
      
      const userHotels = await pool.query(`
        SELECT h.id, h.uuid, h.name, h.created_at
        FROM hotels h
        JOIN hotel_users hu ON h.id = hu.hotel_id
        WHERE hu.user_id = $1
      `, [userId]);
      
      console.log(`✅ Encontrados ${userHotels.rows.length} hotéis para o usuário:`);
      userHotels.rows.forEach((hotel, index) => {
        console.log(`   ${index + 1}. ID: ${hotel.id} | UUID: ${hotel.uuid} | Nome: ${hotel.name}`);
      });
      
      // 3. Verificar propriedades do Rate Shopper por hotel
      console.log('\n🏠 3. Verificando propriedades Rate Shopper por hotel...');
      
      for (const hotel of userHotels.rows) {
        console.log(`\n🔍 Hotel: ${hotel.name} (ID: ${hotel.id})`);
        
        const properties = await pool.query(`
          SELECT id, property_name, booking_engine, is_main_property, active, created_at
          FROM rate_shopper_properties 
          WHERE hotel_id = $1
          ORDER BY created_at DESC
        `, [hotel.id]);
        
        console.log(`   📊 Propriedades: ${properties.rows.length}`);
        properties.rows.forEach((prop, index) => {
          console.log(`     ${index + 1}. ${prop.property_name} (${prop.booking_engine}) ${prop.is_main_property ? '⭐' : ''} - Ativo: ${prop.active}`);
        });
        
        // Verificar searches para este hotel
        const searches = await pool.query(`
          SELECT COUNT(*) as total
          FROM rate_shopper_searches 
          WHERE hotel_id = $1
        `, [hotel.id]);
        
        console.log(`   🔍 Searches: ${searches.rows[0].total}`);
        
        // Verificar preços para este hotel
        const prices = await pool.query(`
          SELECT COUNT(*) as total
          FROM rate_shopper_prices 
          WHERE hotel_id = $1
        `, [hotel.id]);
        
        console.log(`   💰 Preços: ${prices.rows[0].total}`);
      }
      
    } else {
      console.log('❌ Usuário Giandro não encontrado');
      
      // Listar todos os usuários para debug
      console.log('\n👥 Listando todos os usuários:');
      const allUsers = await pool.query('SELECT id, name, email FROM users ORDER BY name LIMIT 10');
      allUsers.rows.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} (${user.email})`);
      });
    }
    
    // 4. Verificar todos os hotéis com Rate Shopper
    console.log('\n🏨 4. Verificando TODOS os hotéis com dados Rate Shopper...');
    
    const hotelsWithRateShopper = await pool.query(`
      SELECT 
        h.id,
        h.uuid,
        h.name,
        COUNT(DISTINCT rsp.id) as properties_count,
        COUNT(DISTINCT rss.id) as searches_count,
        COUNT(DISTINCT rspr.id) as prices_count
      FROM hotels h
      LEFT JOIN rate_shopper_properties rsp ON h.id = rsp.hotel_id
      LEFT JOIN rate_shopper_searches rss ON h.id = rss.hotel_id
      LEFT JOIN rate_shopper_prices rspr ON h.id = rspr.hotel_id
      GROUP BY h.id, h.uuid, h.name
      HAVING COUNT(DISTINCT rsp.id) > 0 OR COUNT(DISTINCT rss.id) > 0 OR COUNT(DISTINCT rspr.id) > 0
      ORDER BY properties_count DESC, searches_count DESC, prices_count DESC
    `);
    
    console.log(`✅ Encontrados ${hotelsWithRateShopper.rows.length} hotéis com dados Rate Shopper:`);
    hotelsWithRateShopper.rows.forEach((hotel, index) => {
      console.log(`   ${index + 1}. ${hotel.name} (ID: ${hotel.id})`);
      console.log(`      UUID: ${hotel.uuid}`);
      console.log(`      Propriedades: ${hotel.properties_count} | Searches: ${hotel.searches_count} | Preços: ${hotel.prices_count}`);
    });
    
    // 5. Verificar se há hotel_id = 17 específico
    console.log('\n🎯 5. Verificando hotel ID 17 especificamente...');
    
    const hotel17 = await pool.query(`
      SELECT id, uuid, name, created_at
      FROM hotels 
      WHERE id = 17
    `);
    
    if (hotel17.rows.length > 0) {
      const hotel = hotel17.rows[0];
      console.log(`✅ Hotel ID 17: ${hotel.name} (UUID: ${hotel.uuid})`);
      
      // Verificar usuários deste hotel
      const hotel17Users = await pool.query(`
        SELECT u.id, u.name, u.email
        FROM users u
        JOIN hotel_users hu ON u.id = hu.user_id
        WHERE hu.hotel_id = 17
      `);
      
      console.log(`👥 Usuários do hotel ID 17: ${hotel17Users.rows.length}`);
      hotel17Users.rows.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} (${user.email})`);
      });
      
    } else {
      console.log('❌ Hotel ID 17 não encontrado');
    }
    
    // 6. Verificar estrutura de autenticação/sessão
    console.log('\n🔑 6. Verificando estrutura de sessões/tokens...');
    
    const sessionTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name LIKE '%session%' OR table_name LIKE '%token%' OR table_name LIKE '%auth%')
      ORDER BY table_name
    `);
    
    console.log('📋 Tabelas de autenticação/sessão:');
    sessionTables.rows.forEach(table => {
      console.log(`   ✅ ${table.table_name}`);
    });
    
    console.log('\n📊 === RESUMO DO DIAGNÓSTICO ===');
    console.log('1. Verificar se o usuário Giandro está corretamente associado ao hotel com dados Rate Shopper');
    console.log('2. Confirmar se o hotel selecionado na interface corresponde ao hotel com os dados inseridos');
    console.log('3. Verificar se há filtros por hotel_id na API que possam estar bloqueando os dados');
    console.log('4. Analisar se a sessão do usuário está mantendo o hotel correto selecionado');
    
  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error.message);
  } finally {
    await pool.end();
  }
}

debugRateShopperRelationships().catch(console.error);