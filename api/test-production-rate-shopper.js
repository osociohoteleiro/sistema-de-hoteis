const { Pool } = require('pg');

const prodPool = new Pool({
  host: 'ep.osociohoteleiro.com.br',
  port: 5432,
  user: 'postgres',
  password: 'OSH4040()Xx!..nn',
  database: 'osh_hotels'
});

async function testProductionRateShopper() {
  console.log('🔍 Testando Rate Shopper em produção...');
  
  try {
    // 1. Verificar estrutura da tabela hotels
    const hotelStructure = await prodPool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'hotels'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Estrutura da tabela hotels:');
    hotelStructure.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    // 2. Listar todos os hotéis
    const hotels = await prodPool.query(`SELECT * FROM hotels LIMIT 5`);
    console.log(`\n🏨 Hotéis disponíveis (${hotels.rows.length}):`);
    hotels.rows.forEach(hotel => {
      console.log(`  - ID: ${hotel.id}, Nome: ${hotel.name}`);
    });
    
    // Usar o primeiro hotel para teste
    if (hotels.rows.length === 0) {
      console.log('❌ Nenhum hotel encontrado');
      return;
    }
    
    const hotelData = hotels.rows[0];
    console.log('✅ Usando hotel:', hotelData);
    
    // 2. Verificar properties do hotel
    const properties = await prodPool.query(`
      SELECT * FROM rate_shopper_properties 
      WHERE hotel_id = $1
      ORDER BY is_main_property DESC, id
    `, [hotelData.id]);
    
    console.log(`\n📋 Properties encontradas (${properties.rows.length}):`);
    properties.rows.forEach(prop => {
      console.log(`  - ID: ${prop.id}, Nome: ${prop.property_name}, Principal: ${prop.is_main_property}, Ativo: ${prop.active}`);
    });
    
    // 3. Verificar searches existentes
    const searches = await prodPool.query(`
      SELECT rs.*, rsp.property_name 
      FROM rate_shopper_searches rs
      LEFT JOIN rate_shopper_properties rsp ON rs.property_id = rsp.id
      WHERE rs.hotel_id = $1
      ORDER BY rs.created_at DESC
      LIMIT 5
    `, [hotelData.id]);
    
    console.log(`\n🔍 Searches recentes (${searches.rows.length}):`);
    searches.rows.forEach(search => {
      console.log(`  - ID: ${search.id}, Property: ${search.property_name}, Status: ${search.search_status}, Data: ${search.created_at}`);
    });
    
    // 4. Verificar preços existentes
    const prices = await prodPool.query(`
      SELECT COUNT(*) as total FROM rate_shopper_prices rsp
      JOIN rate_shopper_searches rs ON rsp.search_id = rs.id
      WHERE rs.hotel_id = $1
    `, [hotelData.id]);
    
    console.log(`\n💰 Total de preços: ${prices.rows[0].total}`);
    
    // 4.5. Verificar estrutura da tabela rate_shopper_searches
    const searchStructure = await prodPool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'rate_shopper_searches'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Estrutura da tabela rate_shopper_searches:');
    searchStructure.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    // 5. Testar criação de search se houver properties
    if (properties.rows.length > 0) {
      const mainProperty = properties.rows.find(p => p.is_main_property) || properties.rows[0];
      
      console.log(`\n🧪 Testando criação de search com property: ${mainProperty.property_name} (ID: ${mainProperty.id})`);
      
      try {
        const newSearch = await prodPool.query(`
          INSERT INTO rate_shopper_searches 
          (hotel_id, property_id, check_in_date, check_out_date, search_status, created_at, updated_at)
          VALUES ($1, $2, $3, $4, 'PENDING', NOW(), NOW())
          RETURNING *
        `, [hotelData.id, mainProperty.id, '2025-09-15', '2025-09-20']);
        
        console.log('✅ Search criada com sucesso:', newSearch.rows[0].id);
        
        // Deletar a search de teste
        await prodPool.query('DELETE FROM rate_shopper_searches WHERE id = $1', [newSearch.rows[0].id]);
        console.log('🗑️  Search de teste removida');
        
      } catch (error) {
        console.log('❌ Erro ao criar search de teste:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prodPool.end();
  }
}

testProductionRateShopper();