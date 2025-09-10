// Script para verificar o schema atual em produção
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

async function checkProductionSchema() {
  console.log('🔍 VERIFICANDO SCHEMA ATUAL EM PRODUÇÃO\n');
  
  const pool = new Pool(productionConfig);
  
  try {
    // Verificar se as tabelas existem
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name LIKE 'rate_shopper%'
      ORDER BY table_name
    `);
    
    console.log('📋 Tabelas Rate Shopper existentes:');
    tables.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name}`);
    });
    
    if (tables.rows.length === 0) {
      console.log('❌ Nenhuma tabela Rate Shopper encontrada!');
      return;
    }
    
    // Para cada tabela, verificar as colunas
    for (const table of tables.rows) {
      console.log(`\n📊 Schema da tabela: ${table.table_name}`);
      
      const columns = await pool.query(`
        SELECT 
          column_name, 
          data_type, 
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table.table_name]);
      
      columns.rows.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        console.log(`   • ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar schema:', error.message);
  } finally {
    await pool.end();
  }
}

checkProductionSchema().catch(console.error);
