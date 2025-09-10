// Script para analisar dados atuais em produção
const { Pool } = require('pg');

const productionConfig = {
  host: 'ep.osociohoteleiro.com.br',
  port: 5432,
  user: 'postgres',
  password: 'OSH4040()Xx!..nn',
  database: 'osh_hotels',
  ssl: false,
  connectionTimeoutMillis: 30000,
  max: 5
};

async function analyzeProductionData() {
  console.log('🔍 ANALISANDO DADOS DE PRODUÇÃO\n');
  
  const pool = new Pool(productionConfig);
  
  try {
    console.log('===== DIAGNÓSTICO DE PROBLEMAS =====\n');

    // 1. Verificar quantidades de dados
    console.log('📊 CONTAGEM DE REGISTROS:');
    
    const counts = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM rate_shopper_properties'),
      pool.query('SELECT COUNT(*) as count FROM rate_shopper_searches'), 
      pool.query('SELECT COUNT(*) as count FROM rate_shopper_prices')
    ]);

    console.log(`   • Propriedades: ${counts[0].rows[0].count}`);
    console.log(`   • Buscas: ${counts[1].rows[0].count}`);  
    console.log(`   • Preços: ${counts[2].rows[0].count}\n`);

    // 2. Verificar problemas nas colunas de data em prices
    console.log('🗓️  PROBLEMAS NAS DATAS (rate_shopper_prices):');
    
    const dateIssues = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(check_in) as has_check_in,
        COUNT(check_in_date) as has_check_in_date,
        COUNT(captured_at) as has_captured_at,
        COUNT(scraped_at) as has_scraped_at
      FROM rate_shopper_prices
    `);
    
    const d = dateIssues.rows[0];
    console.log(`   • Total de preços: ${d.total}`);
    console.log(`   • Com check_in: ${d.has_check_in}`);
    console.log(`   • Com check_in_date: ${d.has_check_in_date}`);
    console.log(`   • Com captured_at: ${d.has_captured_at}`);
    console.log(`   • Com scraped_at: ${d.has_scraped_at}\n`);

    // 3. Verificar problemas nas colunas de status em searches  
    console.log('🔍 PROBLEMAS NOS STATUS (rate_shopper_searches):');
    
    const statusIssues = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(search_status) as has_search_status,
        COUNT(status) as has_status,
        COUNT(start_date) as has_start_date,
        COUNT(end_date) as has_end_date
      FROM rate_shopper_searches
    `);
    
    const s = statusIssues.rows[0];
    console.log(`   • Total de buscas: ${s.total}`);
    console.log(`   • Com search_status: ${s.has_search_status}`);
    console.log(`   • Com status: ${s.has_status}`);
    console.log(`   • Com start_date: ${s.has_start_date}`);
    console.log(`   • Com end_date: ${s.has_end_date}\n`);

    // 4. Verificar problemas nas URLs em properties
    console.log('🔗 PROBLEMAS NAS URLs (rate_shopper_properties):');
    
    const urlIssues = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(property_url) as has_property_url,
        COUNT(booking_url) as has_booking_url,
        COUNT(booking_engine) as has_booking_engine,
        COUNT(platform) as has_platform
      FROM rate_shopper_properties
    `);
    
    const u = urlIssues.rows[0];
    console.log(`   • Total de propriedades: ${u.total}`);
    console.log(`   • Com property_url: ${u.has_property_url}`);
    console.log(`   • Com booking_url: ${u.has_booking_url}`);
    console.log(`   • Com booking_engine: ${u.has_booking_engine}`);
    console.log(`   • Com platform: ${u.has_platform}\n`);

    // 5. Exemplos de dados problemáticos
    if (d.total > 0) {
      console.log('📋 AMOSTRA DE DADOS PROBLEMÁTICOS (rate_shopper_prices):');
      const sample = await pool.query(`
        SELECT 
          id, search_id, property_id,
          check_in, check_in_date,
          captured_at, scraped_at,
          price
        FROM rate_shopper_prices 
        WHERE check_in IS NULL OR check_in_date IS NULL
        LIMIT 5
      `);
      
      sample.rows.forEach((row, i) => {
        console.log(`   ${i+1}. ID ${row.id}: check_in=${row.check_in}, check_in_date=${row.check_in_date}, price=${row.price}`);
      });
    }

    // 6. Verificar Foreign Keys
    console.log('\n🔗 VERIFICAÇÃO DE FOREIGN KEYS:');
    
    const fkCheck = await pool.query(`
      SELECT 
        COUNT(DISTINCT p.property_id) as properties_with_prices,
        COUNT(DISTINCT p.search_id) as searches_with_prices,
        COUNT(DISTINCT s.property_id) as properties_with_searches
      FROM rate_shopper_prices p
      LEFT JOIN rate_shopper_searches s ON p.search_id = s.id
    `);
    
    const fk = fkCheck.rows[0];
    console.log(`   • Propriedades com preços: ${fk.properties_with_prices}`);
    console.log(`   • Buscas com preços: ${fk.searches_with_prices}`);
    console.log(`   • Propriedades com buscas: ${fk.properties_with_searches}\n`);

    console.log('===== RESUMO DE PROBLEMAS IDENTIFICADOS =====\n');
    
    const problems = [];
    
    if (parseInt(d.has_check_in) !== parseInt(d.total)) {
      problems.push(`❌ ${parseInt(d.total) - parseInt(d.has_check_in)} preços sem check_in`);
    }
    
    if (parseInt(d.has_check_in_date) !== parseInt(d.total)) {
      problems.push(`❌ ${parseInt(d.total) - parseInt(d.has_check_in_date)} preços sem check_in_date`);
    }
    
    if (parseInt(s.has_status) !== parseInt(s.total)) {
      problems.push(`❌ ${parseInt(s.total) - parseInt(s.has_status)} buscas sem status`);
    }
    
    if (parseInt(u.has_booking_url) !== parseInt(u.total)) {
      problems.push(`❌ ${parseInt(u.total) - parseInt(u.has_booking_url)} propriedades sem booking_url`);
    }

    if (problems.length === 0) {
      console.log('✅ Nenhum problema crítico encontrado nos dados!');
    } else {
      console.log('🚨 PROBLEMAS ENCONTRADOS:');
      problems.forEach(problem => console.log(`   ${problem}`));
      
      console.log('\n💡 AÇÕES RECOMENDADAS:');
      console.log('   1. Executar migration 025 para sincronizar colunas');
      console.log('   2. Executar scripts de fix para popular dados ausentes');
      console.log('   3. Verificar código que insere dados para usar nomes corretos');
    }
    
  } catch (error) {
    console.error('❌ Erro na análise:', error.message);
  } finally {
    await pool.end();
  }
}

analyzeProductionData().catch(console.error);