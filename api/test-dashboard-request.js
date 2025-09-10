// Script para testar requests do dashboard Rate Shopper
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

async function testDashboardRequest() {
  console.log('🔍 TESTANDO REQUESTS DO DASHBOARD RATE SHOPPER\n');
  
  const pool = new Pool(productionConfig);
  
  try {
    console.log('📊 1. Testando com hotel_id = 17 (ID numérico)...');
    
    // Simular a mesma query do dashboard
    const recentSearches = await pool.query(`
      SELECT rs.*, rsp.property_name, rsp.booking_engine
      FROM rate_shopper_searches rs
      LEFT JOIN rate_shopper_properties rsp ON rs.property_id = rsp.id
      WHERE rs.hotel_id = $1
      ORDER BY rs.created_at DESC
      LIMIT 10
    `, [17]);
    
    console.log(`✅ Searches encontradas: ${recentSearches.length}`);
    if (recentSearches.length > 0) {
      console.log('🔍 Primeiras 3 searches:');
      recentSearches.slice(0, 3).forEach((search, index) => {
        console.log(`   ${index + 1}. ID: ${search.id} | Propriedade: ${search.property_name} | Status: ${search.status}`);
      });
    }
    
    // Testar summary statistics
    const summary = await pool.query(`
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
    `, [17]);
    
    const stats = summary[0];
    console.log('📈 Estatísticas do dashboard:');
    console.log(`   Propriedades: ${stats.total_properties}`);
    console.log(`   Searches: ${stats.total_searches}`);
    console.log(`   Preços: ${stats.total_prices}`);
    console.log(`   Searches executando: ${stats.running_searches}`);
    console.log(`   Preço médio: R$ ${parseFloat(stats.avg_price || 0).toFixed(2)}`);
    
    // Testar properties with prices
    const propertiesWithPrices = await pool.query(`
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
    `, [17]);
    
    console.log(`📋 Propriedades com preços: ${propertiesWithPrices.length}`);
    propertiesWithPrices.forEach((prop, index) => {
      console.log(`   ${index + 1}. ${prop.property_name} - Último preço: R$ ${parseFloat(prop.latest_price || 0).toFixed(2)}`);
    });
    
    console.log('\n🔍 2. Testando com UUID do hotel...');
    
    // Buscar o UUID do hotel 17
    const hotelData = await pool.query('SELECT hotel_uuid FROM hotels WHERE id = 17');
    if (hotelData.length > 0) {
      const hotelUuid = hotelData[0].hotel_uuid;
      console.log(`✅ UUID do hotel 17: ${hotelUuid}`);
      
      // Testar busca por UUID (como o frontend pode estar fazendo)
      const hotel = await pool.query('SELECT id FROM hotels WHERE hotel_uuid = $1', [hotelUuid]);
      if (hotel.length > 0) {
        console.log(`✅ Conversão UUID->ID: ${hotelUuid} -> ${hotel[0].id}`);
      }
    }
    
    console.log('\n💡 3. DIAGNÓSTICO FINAL...');
    console.log('🎯 Se os dados aparecem aqui mas não no frontend, o problema pode ser:');
    console.log('   1. Frontend usando UUID diferente nas requests');
    console.log('   2. Frontend não conseguindo converter UUID para ID');
    console.log('   3. Cache do navegador/interface');
    console.log('   4. Erro de JavaScript no frontend');
    
    console.log('\n🔗 URL para testar diretamente:');
    console.log('   https://pms.osociohoteleiro.com.br/api/rate-shopper/17/dashboard');
    console.log('   https://pms.osociohoteleiro.com.br/api/rate-shopper/3e74f4e5-8763-11f0-bd40-02420a0b00b1/dashboard');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  } finally {
    await pool.end();
  }
}

testDashboardRequest().catch(console.error);