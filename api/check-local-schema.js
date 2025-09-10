// Script para verificar estrutura da tabela local
require('dotenv').config();
const { Pool } = require('pg');

const localConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT) || 5432,
  user: process.env.POSTGRES_USER || 'osh_user',
  password: process.env.POSTGRES_PASSWORD || 'osh_password_2024',
  database: process.env.POSTGRES_DB || 'osh_db',
  max: 10
};

async function checkLocalSchema() {
  const pool = new Pool(localConfig);
  
  try {
    console.log('🔍 Verificando estrutura da tabela rate_shopper_properties LOCAL...\n');
    
    // Verificar estrutura da tabela
    const schemaQuery = `
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'rate_shopper_properties' 
      ORDER BY ordinal_position;
    `;
    
    const schema = await pool.query(schemaQuery);
    
    console.log('📋 Estrutura da tabela LOCAL:');
    schema.rows.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    // Buscar uma propriedade existente como exemplo
    console.log('\n📋 Exemplo de propriedade LOCAL:');
    const example = await pool.query(`
      SELECT * FROM rate_shopper_properties 
      WHERE hotel_id = 17 
      LIMIT 1
    `);
    
    if (example.rows.length > 0) {
      console.log('✅ Campos disponíveis:');
      Object.keys(example.rows[0]).forEach((field, index) => {
        console.log(`   ${index + 1}. ${field}: ${example.rows[0][field]}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

checkLocalSchema().catch(console.error);