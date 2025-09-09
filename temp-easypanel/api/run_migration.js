const { Client } = require('pg');
const fs = require('fs').promises;
const path = require('path');

async function runMigration() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'osh_db', // conforme visto no health check
    password: '', // sem senha no desenvolvimento
    port: 5432,
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao PostgreSQL');

    // Ler o arquivo de migration
    const migrationPath = path.join(__dirname, 'migrations', '021_add_platform_to_rate_shopper_properties.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');

    console.log('🔄 Executando migration...');
    await client.query(migrationSQL);
    console.log('✅ Migration executada com sucesso!');

    // Verificar se a coluna foi criada
    const result = await client.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'rate_shopper_properties' 
      AND column_name = 'platform'
    `);

    if (result.rows.length > 0) {
      console.log('✅ Coluna platform criada:', result.rows[0]);
    } else {
      console.log('⚠️  Coluna platform não encontrada');
    }

    // Verificar dados existentes
    const dataCheck = await client.query(`
      SELECT platform, COUNT(*) as count 
      FROM rate_shopper_properties 
      GROUP BY platform
    `);

    console.log('📊 Distribuição de plataformas:');
    dataCheck.rows.forEach(row => {
      console.log(`   ${row.platform}: ${row.count} propriedades`);
    });

  } catch (error) {
    console.error('❌ Erro na migration:', error.message);
  } finally {
    await client.end();
    console.log('🔌 Desconectado do PostgreSQL');
  }
}

runMigration();