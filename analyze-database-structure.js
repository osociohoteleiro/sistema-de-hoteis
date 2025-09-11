const { Pool } = require('pg');

// Configuração do banco baseada no .env
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'osh_user',
  password: 'osh_password_2024',
  database: 'osh_db'
});

async function analyzeDatabaseStructure() {
  try {
    console.log('🔍 Conectando ao banco PostgreSQL...');
    
    // 1. Listar todas as tabelas
    console.log('\n📋 TABELAS EXISTENTES:');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    tables.forEach((table, index) => {
      console.log(`${index + 1}. ${table}`);
    });
    
    console.log(`\n📊 Total de tabelas: ${tables.length}`);
    
    // 2. Para cada tabela, obter estrutura detalhada
    console.log('\n🏗️  ESTRUTURA DETALHADA DAS TABELAS:');
    
    for (const tableName of tables) {
      console.log(`\n--- TABELA: ${tableName.toUpperCase()} ---`);
      
      // Obter colunas
      const columnsResult = await pool.query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position;
      `, [tableName]);
      
      console.log('Colunas:');
      columnsResult.rows.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.column_default ? `DEFAULT ${col.column_default}` : '';
        const maxLength = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
        console.log(`  - ${col.column_name}: ${col.data_type}${maxLength} ${nullable} ${defaultVal}`);
      });
      
      // Obter chaves primárias
      const pkResult = await pool.query(`
        SELECT column_name
        FROM information_schema.key_column_usage k
        JOIN information_schema.table_constraints t
        ON k.constraint_name = t.constraint_name
        WHERE t.table_name = $1 AND t.constraint_type = 'PRIMARY KEY'
        ORDER BY k.ordinal_position;
      `, [tableName]);
      
      if (pkResult.rows.length > 0) {
        const pkColumns = pkResult.rows.map(row => row.column_name);
        console.log(`  PK: [${pkColumns.join(', ')}]`);
      }
      
      // Obter chaves estrangeiras
      const fkResult = await pool.query(`
        SELECT 
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_name = $1;
      `, [tableName]);
      
      if (fkResult.rows.length > 0) {
        console.log('  FK:');
        fkResult.rows.forEach(fk => {
          console.log(`    ${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        });
      }
      
      // Obter índices
      const indexResult = await pool.query(`
        SELECT 
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE tablename = $1 AND schemaname = 'public'
        ORDER BY indexname;
      `, [tableName]);
      
      if (indexResult.rows.length > 0) {
        console.log('  Índices:');
        indexResult.rows.forEach(idx => {
          console.log(`    ${idx.indexname}: ${idx.indexdef}`);
        });
      }
    }
    
    // 3. Verificar se existe tabela de controle de migrations
    console.log('\n🗂️  CONTROLE DE MIGRATIONS:');
    const migrationTables = tables.filter(table => 
      table.includes('migration') || 
      table.includes('schema_version') || 
      table.includes('flyway') ||
      table.includes('knex')
    );
    
    if (migrationTables.length > 0) {
      console.log('Tabelas de controle encontradas:', migrationTables);
      
      for (const migTable of migrationTables) {
        const migData = await pool.query(`SELECT * FROM ${migTable} ORDER BY id LIMIT 10;`);
        console.log(`\nDados em ${migTable}:`, migData.rows);
      }
    } else {
      console.log('❌ Nenhuma tabela de controle de migrations encontrada');
    }
    
  } catch (error) {
    console.error('❌ Erro ao analisar banco:', error.message);
  } finally {
    await pool.end();
  }
}

analyzeDatabaseStructure();