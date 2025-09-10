// Script para verificar schema da tabela rate_shopper_searches
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

async function verifySearchesSchema() {
  console.log('🔍 VERIFICANDO SCHEMA DA TABELA rate_shopper_searches\n');
  
  const pool = new Pool(productionConfig);
  
  try {
    // Verificar estrutura da tabela searches
    console.log('📋 Estrutura da tabela rate_shopper_searches:');
    const searchSchema = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'rate_shopper_searches'
      ORDER BY ordinal_position
    `);
    
    searchSchema.rows.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.column_name} (${col.data_type})`);
    });
    
    // Testar uma query simples
    console.log('\n🧪 Teste de query:');
    const testQuery = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'rate_shopper_searches' 
        AND column_name IN ('check_in', 'check_in_date')
    `);
    
    console.log('✅ Colunas de data encontradas:');
    testQuery.rows.forEach(row => {
      console.log(`   - ${row.column_name}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

verifySearchesSchema().catch(console.error);