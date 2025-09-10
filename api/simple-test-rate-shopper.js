// Script para teste simples do Rate Shopper
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

async function simpleTestRateShopper() {
  console.log('🔍 TESTE SIMPLES DO RATE SHOPPER\n');
  
  const pool = new Pool(productionConfig);
  
  try {
    // 1. Verificar estrutura da tabela searches
    console.log('📋 1. Estrutura da tabela rate_shopper_searches:');
    const searchSchema = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'rate_shopper_searches'
      ORDER BY ordinal_position
    `);
    
    searchSchema.rows.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.column_name} (${col.data_type})`);
    });
    
    // 2. Contar registros simples
    console.log('\n📊 2. Contagens simples:');
    
    const propertyCount = await pool.query('SELECT COUNT(*) as total FROM rate_shopper_properties WHERE hotel_id = 17');
    console.log(`   Propriedades hotel 17: ${propertyCount.rows[0].total}`);
    
    const searchCount = await pool.query('SELECT COUNT(*) as total FROM rate_shopper_searches WHERE hotel_id = 17');
    console.log(`   Searches hotel 17: ${searchCount.rows[0].total}`);
    
    const priceCount = await pool.query('SELECT COUNT(*) as total FROM rate_shopper_prices WHERE hotel_id = 17');
    console.log(`   Preços hotel 17: ${priceCount.rows[0].total}`);
    
    // 3. Amostra de dados de propriedades
    console.log('\n🏠 3. Amostra de propriedades:');
    const sampleProperties = await pool.query(`
      SELECT id, property_name, booking_engine, is_main_property, active
      FROM rate_shopper_properties 
      WHERE hotel_id = 17
      ORDER BY property_name
      LIMIT 5
    `);
    
    sampleProperties.rows.forEach((prop, index) => {
      console.log(`   ${index + 1}. ${prop.property_name} (${prop.booking_engine}) ${prop.is_main_property ? '⭐' : ''}`);
    });
    
    // 4. Amostra de dados de searches
    console.log('\n🔍 4. Amostra de searches:');
    const sampleSearches = await pool.query(`
      SELECT id, hotel_id, property_id, check_in, check_out, search_status, created_at
      FROM rate_shopper_searches 
      WHERE hotel_id = 17
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    sampleSearches.rows.forEach((search, index) => {
      console.log(`   ${index + 1}. ID: ${search.id} | Status: ${search.search_status} | Check-in: ${search.check_in}`);
    });
    
    // 5. Amostra de preços
    console.log('\n💰 5. Amostra de preços:');
    const samplePrices = await pool.query(`
      SELECT rsp.id, rsp.price, rsp.currency, rsp.captured_at, rsp_prop.property_name
      FROM rate_shopper_prices rsp
      JOIN rate_shopper_properties rsp_prop ON rsp.property_id = rsp_prop.id
      WHERE rsp.hotel_id = 17
      ORDER BY rsp.captured_at DESC
      LIMIT 5
    `);
    
    samplePrices.rows.forEach((price, index) => {
      console.log(`   ${index + 1}. ${price.property_name}: ${price.currency} ${price.price} (${price.captured_at})`);
    });
    
    // 6. Teste da URL do dashboard
    console.log('\n🌐 6. URLs para testar:');
    console.log('   Numérico: https://pms.osociohoteleiro.com.br/api/rate-shopper/17/dashboard');
    console.log('   UUID: https://pms.osociohoteleiro.com.br/api/rate-shopper/3e74f4e5-8763-11f0-bd40-02420a0b00b1/dashboard');
    console.log('   Propriedades: https://pms.osociohoteleiro.com.br/api/rate-shopper/17/properties');
    
    console.log('\n✅ DIAGNÓSTICO: Os dados estão no banco! Se não aparecem no frontend:');
    console.log('   1. Teste as URLs acima diretamente no navegador');
    console.log('   2. Verifique o console do navegador para erros JavaScript');
    console.log('   3. Verifique se o hotel correto está selecionado na interface');
    console.log('   4. Limpe o cache do navegador');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  } finally {
    await pool.end();
  }
}

simpleTestRateShopper().catch(console.error);