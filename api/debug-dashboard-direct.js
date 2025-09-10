// Script para debugar o dashboard diretamente
const express = require('express');
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

async function debugDashboardDirect() {
  console.log('🔍 DEBUG DIRETO DO DASHBOARD\n');
  
  const db = new Pool(productionConfig);
  
  try {
    const hotelId = 17;
    
    console.log('📊 1. Testando recent searches...');
    
    // Recent searches (exatamente como na API)
    const recentSearches = await db.query(`
      SELECT 
        rs.id,
        rs.hotel_id,
        rs.property_id,
        rs.check_in as start_date,
        rs.check_out as end_date,
        rs.search_status as status,
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
    
    console.log(`✅ Recent searches: ${recentSearches.rows.length} encontradas`);
    if (recentSearches.rows.length > 0) {
      console.log('🔍 Primeira search:');
      console.log(JSON.stringify(recentSearches.rows[0], null, 2));
    }
    
    console.log('\n📊 2. Testando summary statistics...');
    
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
    
    console.log('✅ Summary statistics:');
    console.log(JSON.stringify(summary.rows[0], null, 2));
    
    console.log('\n🎉 DASHBOARD FUNCIONANDO! O erro deve estar em outra parte do código.');
    
  } catch (error) {
    console.error('❌ Erro no debug:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await db.end();
  }
}

debugDashboardDirect().catch(console.error);