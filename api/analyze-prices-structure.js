// Script para analisar estrutura de preços do Rate Shopper
const { Pool } = require('pg');

const localConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT) || 5432,
  user: process.env.POSTGRES_USER || 'osh_user',
  password: process.env.POSTGRES_PASSWORD || 'osh_password_2024',
  database: process.env.POSTGRES_DB || 'osh_db',
  max: 10
};

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

async function analyzePricesStructure() {
  console.log('🔍 Analisando estrutura de preços do Rate Shopper...\n');
  
  const localPool = new Pool(localConfig);
  const prodPool = new Pool(productionConfig);
  
  try {
    console.log('📋 === ANÁLISE DO BANCO LOCAL ===');
    
    // 1. Verificar tabelas de preços no local
    const localTables = await localPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%rate_shopper%'
      AND table_name LIKE '%price%'
      ORDER BY table_name
    `);
    
    console.log('🏠 Tabelas de preços no LOCAL:');
    localTables.rows.forEach(table => {
      console.log(`   ✅ ${table.table_name}`);
    });
    
    // 2. Analisar estrutura das tabelas de preços
    for (const table of localTables.rows) {
      console.log(`\n📊 Estrutura da tabela LOCAL: ${table.table_name}`);
      
      const schema = await localPool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table.table_name]);
      
      schema.rows.forEach((col, index) => {
        console.log(`   ${index + 1}. ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
      });
      
      // Contar registros
      const count = await localPool.query(`SELECT COUNT(*) as total FROM ${table.table_name}`);
      console.log(`   📊 Total de registros: ${count.rows[0].total}`);
    }
    
    // 3. Buscar preços do hotel Eco Encanto Pousada
    console.log('\n💰 === PREÇOS DO ECO ENCANTO POUSADA (LOCAL) ===');
    
    const pricesQuery = `
      SELECT 
        rsp.property_name,
        rsp.platform,
        COUNT(rspr.id) as total_prices,
        MIN(rspr.price) as min_price,
        MAX(rspr.price) as max_price,
        AVG(rspr.price) as avg_price,
        MIN(rspr.check_in_date) as earliest_date,
        MAX(rspr.check_in_date) as latest_date
      FROM rate_shopper_properties rsp
      LEFT JOIN rate_shopper_prices rspr ON rsp.id = rspr.property_id
      WHERE rsp.hotel_id = 17
      GROUP BY rsp.id, rsp.property_name, rsp.platform
      ORDER BY total_prices DESC
    `;
    
    const localPrices = await localPool.query(pricesQuery);
    
    console.log('📈 Resumo de preços por propriedade (LOCAL):');
    localPrices.rows.forEach((prop, index) => {
      console.log(`   ${index + 1}. ${prop.property_name} (${prop.platform})`);
      console.log(`      Preços: ${prop.total_prices} | Min: R$ ${prop.min_price} | Max: R$ ${prop.max_price} | Média: R$ ${parseFloat(prop.avg_price || 0).toFixed(2)}`);
      if (prop.earliest_date && prop.latest_date) {
        console.log(`      Período: ${prop.earliest_date.toISOString().split('T')[0]} até ${prop.latest_date.toISOString().split('T')[0]}`);
      }
    });
    
    // 4. Buscar alguns exemplos de preços
    console.log('\n💡 Exemplos de preços (LOCAL):');
    const samplePrices = await localPool.query(`
      SELECT 
        rsp.property_name,
        rspr.check_in_date,
        rspr.price,
        rspr.currency,
        rspr.availability_status,
        rspr.scraped_at
      FROM rate_shopper_prices rspr
      JOIN rate_shopper_properties rsp ON rspr.property_id = rsp.id
      WHERE rsp.hotel_id = 17
      ORDER BY rspr.scraped_at DESC
      LIMIT 5
    `);
    
    samplePrices.rows.forEach((price, index) => {
      console.log(`   ${index + 1}. ${price.property_name} - ${price.check_in_date.toISOString().split('T')[0]}`);
      console.log(`      Preço: ${price.currency} ${price.price} | Status: ${price.availability_status}`);
      console.log(`      Coletado em: ${price.scraped_at.toISOString()}`);
    });
    
    console.log('\n🌐 === ANÁLISE DO BANCO DE PRODUÇÃO ===');
    
    // 5. Verificar tabelas de preços na produção
    const prodTables = await prodPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%rate_shopper%'
      AND table_name LIKE '%price%'
      ORDER BY table_name
    `);
    
    console.log('🏭 Tabelas de preços na PRODUÇÃO:');
    if (prodTables.rows.length === 0) {
      console.log('   ❌ Nenhuma tabela de preços encontrada');
    } else {
      prodTables.rows.forEach(table => {
        console.log(`   ✅ ${table.table_name}`);
      });
    }
    
    // 6. Analisar estrutura das tabelas de produção
    for (const table of prodTables.rows) {
      console.log(`\n📊 Estrutura da tabela PRODUÇÃO: ${table.table_name}`);
      
      const schema = await prodPool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table.table_name]);
      
      schema.rows.forEach((col, index) => {
        console.log(`   ${index + 1}. ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
      });
      
      // Contar registros
      const count = await prodPool.query(`SELECT COUNT(*) as total FROM ${table.table_name}`);
      console.log(`   📊 Total de registros: ${count.rows[0].total}`);
    }
    
    console.log('\n📈 === RESUMO DA ANÁLISE ===');
    const totalLocalPrices = localPrices.rows.reduce((sum, prop) => sum + parseInt(prop.total_prices || 0), 0);
    console.log(`💰 Total de preços no LOCAL: ${totalLocalPrices}`);
    console.log(`🏨 Propriedades com preços: ${localPrices.rows.filter(p => p.total_prices > 0).length}`);
    console.log(`📅 Período de dados: ${localPrices.rows.length > 0 ? 'Identificado' : 'Sem dados'}`);
    
  } catch (error) {
    console.error('❌ Erro na análise:', error.message);
  } finally {
    await localPool.end();
    await prodPool.end();
  }
}

analyzePricesStructure().catch(console.error);