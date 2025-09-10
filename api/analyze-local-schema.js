// Script para analisar schema local vs produção
const { Pool } = require('pg');

const localConfig = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'osh_db',
  ssl: false
};

const productionConfig = {
  host: 'ep.osociohoteleiro.com.br',
  port: 5432,
  user: 'postgres', 
  password: 'OSH4040()Xx!..nn',
  database: 'osh_hotels',
  ssl: false
};

async function compareSchemas() {
  console.log('🔍 COMPARANDO SCHEMAS LOCAL vs PRODUÇÃO\n');
  
  const localDb = new Pool(localConfig);
  const prodDb = new Pool(productionConfig);
  
  try {
    // Analisar tabelas Rate Shopper
    const tables = ['rate_shopper_searches', 'rate_shopper_properties', 'rate_shopper_prices'];
    
    for (const table of tables) {
      console.log(`📋 === TABELA: ${table} ===`);
      
      // Schema local
      console.log('🏠 LOCAL:');
      try {
        const localSchema = await localDb.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = $1
          ORDER BY ordinal_position
        `, [table]);
        
        localSchema.rows.forEach((col, index) => {
          console.log(`   ${index + 1}. ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
        });
      } catch (error) {
        console.log(`   ❌ Tabela não existe: ${error.message}`);
      }
      
      // Schema produção
      console.log('🌐 PRODUÇÃO:');
      try {
        const prodSchema = await prodDb.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = $1
          ORDER BY ordinal_position
        `, [table]);
        
        prodSchema.rows.forEach((col, index) => {
          console.log(`   ${index + 1}. ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
        });
      } catch (error) {
        console.log(`   ❌ Tabela não existe: ${error.message}`);
      }
      
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await localDb.end();
    await prodDb.end();
  }
}

compareSchemas().catch(console.error);