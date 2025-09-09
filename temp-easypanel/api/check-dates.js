const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost', 
  database: process.env.DB_NAME || 'osh-ia',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function checkDates() {
  try {
    const result = await pool.query(`
      SELECT 
        DATE(check_in_date) as date,
        COUNT(*) as count,
        MIN(price) as min_price,
        MAX(price) as max_price
      FROM rate_shopper_prices 
      GROUP BY DATE(check_in_date)
      ORDER BY date
    `);
    
    console.log('=== DATAS NO BANCO ===');
    result.rows.forEach(row => {
      console.log(`Data: ${row.date} | Registros: ${row.count} | Preços: R$ ${row.min_price} - R$ ${row.max_price}`);
    });
    
    // Verificar quantos registros estão fora do período correto
    const wrongDates = await pool.query(`
      SELECT COUNT(*) as total
      FROM rate_shopper_prices 
      WHERE DATE(check_in_date) < '2025-09-05' OR DATE(check_in_date) > '2025-10-31'
    `);
    
    console.log(`\n=== REGISTROS FORA DO PERÍODO (05/09/2025 - 31/10/2025) ===`);
    console.log(`Total de registros fora do período: ${wrongDates.rows[0].total}`);
    
    await pool.end();
  } catch (error) {
    console.error('Erro:', error);
    await pool.end();
  }
}

checkDates();