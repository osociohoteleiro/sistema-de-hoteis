const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'osh_user',
  password: 'osh_password_2024',
  database: 'osh_db'
});

async function checkLocalData() {
  try {
    // Primeiro, verificar estrutura da tabela
    const tableStructure = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'rate_shopper_prices'
      ORDER BY ordinal_position;
    `);

    console.log('=== ESTRUTURA DA TABELA ===');
    console.table(tableStructure.rows);

    // Verificar se existe a tabela e dados
    const totalCount = await pool.query(`
      SELECT COUNT(*) as total 
      FROM rate_shopper_prices 
      WHERE hotel_id = 17
    `);

    console.log('\n=== TOTAL DE REGISTROS ===');
    console.log('Total preços hotel 17:', totalCount.rows[0].total);

    // Agora consultar distribuição de datas com a coluna correta
    const dateDistribution = await pool.query(`
      SELECT 
        DATE(scraped_at) as data_extracao, 
        COUNT(*) as total_precos,
        MIN(scraped_at) as primeira_extracao,
        MAX(scraped_at) as ultima_extracao
      FROM rate_shopper_prices 
      WHERE hotel_id = 17 
      GROUP BY DATE(scraped_at) 
      ORDER BY data_extracao DESC 
      LIMIT 30
    `);

    // Consultar resumo geral
    const summary = await pool.query(`
      SELECT 
        COUNT(*) as total_precos,
        MIN(DATE(scraped_at)) as primeira_data,
        MAX(DATE(scraped_at)) as ultima_data,
        COUNT(DISTINCT DATE(scraped_at)) as total_dias_com_dados
      FROM rate_shopper_prices 
      WHERE hotel_id = 17
    `);

    console.log('\n=== RESUMO GERAL ===');
    console.log(summary.rows[0]);
    console.log('\n=== DISTRIBUIÇÃO POR DATA ===');
    console.table(dateDistribution.rows);

  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await pool.end();
  }
}

checkLocalData();