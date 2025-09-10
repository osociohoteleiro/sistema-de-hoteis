// Script para investigar estrutura usuário-hotel
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

async function investigateUserHotelStructure() {
  console.log('🔍 INVESTIGANDO ESTRUTURA USUÁRIO-HOTEL\n');
  
  const pool = new Pool(productionConfig);
  
  try {
    // 1. Listar todas as tabelas relacionadas a usuários e hotéis
    console.log('📋 1. Tabelas relacionadas a usuários e hotéis...');
    
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name LIKE '%user%' OR table_name LIKE '%hotel%' OR table_name LIKE '%member%')
      ORDER BY table_name
    `);
    
    console.log('🏗️ Tabelas encontradas:');
    tables.rows.forEach(table => {
      console.log(`   ✅ ${table.table_name}`);
    });
    
    // 2. Analisar estrutura da tabela users
    console.log('\n👤 2. Estrutura da tabela users...');
    
    const userSchema = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('📊 Colunas da tabela users:');
    userSchema.rows.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
    });
    
    // 3. Analisar estrutura da tabela hotels
    console.log('\n🏨 3. Estrutura da tabela hotels...');
    
    const hotelSchema = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'hotels'
      ORDER BY ordinal_position
    `);
    
    console.log('📊 Colunas da tabela hotels:');
    hotelSchema.rows.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
    });
    
    // 4. Verificar se usuários têm campo hotel_id direto
    console.log('\n🔗 4. Verificando relacionamento direto...');
    
    const giandrUser = await pool.query(`
      SELECT * FROM users WHERE id = 10
    `);
    
    if (giandrUser.rows.length > 0) {
      const user = giandrUser.rows[0];
      console.log('👤 Dados completos do usuário Giandro:');
      Object.keys(user).forEach(key => {
        console.log(`   ${key}: ${user[key]}`);
      });
    }
    
    // 5. Verificar todos os hotéis
    console.log('\n🏨 5. Listando todos os hotéis...');
    
    const allHotels = await pool.query(`
      SELECT id, uuid, name, created_at
      FROM hotels 
      ORDER BY id
    `);
    
    console.log(`🏨 Total de hotéis: ${allHotels.rows.length}`);
    allHotels.rows.forEach((hotel, index) => {
      console.log(`   ${index + 1}. ID: ${hotel.id} | Nome: ${hotel.name}`);
      console.log(`      UUID: ${hotel.uuid}`);
    });
    
    // 6. Verificar se há tabelas de relacionamento com nomes diferentes
    console.log('\n🔍 6. Procurando tabelas de relacionamento...');
    
    const relationTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (
        table_name LIKE '%member%' OR 
        table_name LIKE '%permission%' OR 
        table_name LIKE '%role%' OR
        table_name LIKE '%team%' OR
        table_name LIKE '%access%'
      )
      ORDER BY table_name
    `);
    
    console.log('🔗 Tabelas de relacionamento:');
    relationTables.rows.forEach(table => {
      console.log(`   ✅ ${table.table_name}`);
    });
    
    // 7. Verificar foreign keys que referenciam users ou hotels
    console.log('\n🔑 7. Verificando foreign keys...');
    
    const foreignKeys = await pool.query(`
      SELECT 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND (ccu.table_name = 'users' OR ccu.table_name = 'hotels')
      ORDER BY tc.table_name, kcu.column_name
    `);
    
    console.log('🔗 Foreign keys para users/hotels:');
    foreignKeys.rows.forEach(fk => {
      console.log(`   ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });
    
    // 8. Verificar especificamente hotel_id = 17
    console.log('\n🎯 8. Dados do hotel ID 17...');
    
    const hotel17Data = await pool.query(`
      SELECT * FROM hotels WHERE id = 17
    `);
    
    if (hotel17Data.rows.length > 0) {
      const hotel = hotel17Data.rows[0];
      console.log('🏨 Dados completos do hotel ID 17:');
      Object.keys(hotel).forEach(key => {
        console.log(`   ${key}: ${hotel[key]}`);
      });
    } else {
      console.log('❌ Hotel ID 17 não encontrado');
    }
    
    // 9. Verificar dados Rate Shopper existentes
    console.log('\n📊 9. Resumo dados Rate Shopper...');
    
    const rateShopperSummary = await pool.query(`
      SELECT 
        'properties' as type,
        hotel_id,
        COUNT(*) as count
      FROM rate_shopper_properties 
      GROUP BY hotel_id
      
      UNION ALL
      
      SELECT 
        'searches' as type,
        hotel_id,
        COUNT(*) as count
      FROM rate_shopper_searches 
      GROUP BY hotel_id
      
      UNION ALL
      
      SELECT 
        'prices' as type,
        hotel_id,
        COUNT(*) as count
      FROM rate_shopper_prices 
      GROUP BY hotel_id
      
      ORDER BY hotel_id, type
    `);
    
    console.log('📈 Dados Rate Shopper por hotel:');
    const hotelData = {};
    rateShopperSummary.rows.forEach(row => {
      if (!hotelData[row.hotel_id]) {
        hotelData[row.hotel_id] = {};
      }
      hotelData[row.hotel_id][row.type] = row.count;
    });
    
    Object.keys(hotelData).forEach(hotelId => {
      console.log(`   Hotel ID ${hotelId}:`);
      console.log(`     Propriedades: ${hotelData[hotelId].properties || 0}`);
      console.log(`     Searches: ${hotelData[hotelId].searches || 0}`);
      console.log(`     Preços: ${hotelData[hotelId].prices || 0}`);
    });
    
  } catch (error) {
    console.error('❌ Erro na investigação:', error.message);
  } finally {
    await pool.end();
  }
}

investigateUserHotelStructure().catch(console.error);