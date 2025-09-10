// Script para verificar valores válidos do enum
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

async function checkEnumValues() {
  const pool = new Pool(localConfig);
  
  try {
    console.log('🔍 Verificando valores válidos do enum...');
    
    // Buscar valores do enum
    const enumQuery = `
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid 
        FROM pg_type 
        WHERE typname = 'rate_shopper_competitor_type'
      )
      ORDER BY enumsortorder;
    `;
    
    const result = await pool.query(enumQuery);
    
    console.log('✅ Valores válidos do enum rate_shopper_competitor_type:');
    result.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. "${row.enumlabel}"`);
    });

    // Verificar propriedades existentes
    const existingProps = await pool.query(`
      SELECT property_name, competitor_type, category, platform 
      FROM rate_shopper_properties 
      WHERE hotel_id = 3
    `);

    console.log('\n📋 Propriedades existentes:');
    existingProps.rows.forEach((prop, index) => {
      console.log(`   ${index + 1}. ${prop.property_name} (${prop.platform}) - competitor_type: "${prop.competitor_type}", category: "${prop.category}"`);
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

checkEnumValues().catch(console.error);