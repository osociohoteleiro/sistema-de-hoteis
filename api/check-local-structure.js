// Script para verificar estrutura local
const { Pool } = require('pg');

const localConfig = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'osh_db',
  ssl: false
};

async function checkLocalStructure() {
  console.log('🔍 VERIFICANDO ESTRUTURA LOCAL\n');
  
  const pool = new Pool(localConfig);
  
  try {
    // Verificar tabelas Rate Shopper existentes
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name LIKE 'rate_shopper%'
      ORDER BY table_name
    `);
    
    console.log('📋 Tabelas Rate Shopper locais:');
    if (tables.rows.length === 0) {
      console.log('   ❌ NENHUMA TABELA RATE SHOPPER ENCONTRADA!');
      console.log('   💡 Isso explica o erro - as tabelas não existem localmente');
      console.log('   💡 Você pode aplicar a migration 007_rate_shopper_tables_postgres.sql');
      return;
    }
    
    tables.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name}`);
    });
    
    // Para cada tabela, verificar estrutura
    for (const table of tables.rows) {
      console.log(`\n📊 Estrutura da tabela: ${table.table_name}`);
      
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
    
    // Verificar especificamente rate_shopper_prices
    console.log('\n🎯 VERIFICAÇÃO ESPECÍFICA - rate_shopper_prices:');
    
    const pricesCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'rate_shopper_prices'
        AND column_name IN ('check_in', 'check_in_date', 'captured_at', 'scraped_at')
      ORDER BY column_name
    `);
    
    if (pricesCheck.rows.length === 0) {
      console.log('   ❌ Nenhuma das colunas de data encontrada!');
    } else {
      console.log('   ✅ Colunas de data encontradas:');
      pricesCheck.rows.forEach(row => {
        console.log(`      • ${row.column_name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

checkLocalStructure().catch(console.error);