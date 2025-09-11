const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'osh_user',
  password: 'osh_password_2024',
  database: 'osh_db'
});

async function analyzeCurrentDatabase() {
  try {
    console.log('🔍 Analisando banco de dados atual...');
    
    // 1. Listar todas as tabelas
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Tabelas encontradas:', tablesResult.rows.length);
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // 2. Para cada tabela, obter estrutura detalhada
    console.log('\n📊 Estrutura detalhada das tabelas:');
    
    for (const table of tablesResult.rows) {
      const tableName = table.table_name;
      
      const columnsResult = await pool.query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [tableName]);
      
      console.log(`\n🏷️  ${tableName}:`);
      columnsResult.rows.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        const maxLength = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
        console.log(`    ${col.column_name}: ${col.data_type}${maxLength} ${nullable}${defaultVal}`);
      });
    }
    
    // 3. Listar migrations executadas (se a tabela existir)
    try {
      const migrationsResult = await pool.query(`
        SELECT version, filename, executed_at 
        FROM schema_migrations 
        ORDER BY executed_at
      `);
      
      console.log('\n🗄️  Migrations executadas:', migrationsResult.rows.length);
      migrationsResult.rows.forEach(mig => {
        console.log(`  - ${mig.version} (${mig.filename}) - ${mig.executed_at}`);
      });
    } catch (error) {
      console.log('\n⚠️  Tabela schema_migrations não existe');
    }
    
    console.log('\n✅ Análise concluída!');
    
  } catch (error) {
    console.error('❌ Erro na análise:', error.message);
  } finally {
    await pool.end();
  }
}

analyzeCurrentDatabase();