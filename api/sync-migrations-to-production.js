const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuração flexível - pode ser adaptada para diferentes ambientes
const getPoolConfig = (environment = 'local') => {
  if (environment === 'production') {
    return {
      // Configurações de produção - adaptar conforme necessário
      host: process.env.PROD_POSTGRES_HOST || 'ep.osociohoteleiro.com.br',
      port: process.env.PROD_POSTGRES_PORT || 5432,
      user: process.env.PROD_POSTGRES_USER || 'osh_user',
      password: process.env.PROD_POSTGRES_PASSWORD || 'osh_password_2024',
      database: process.env.PROD_POSTGRES_DB || 'osh_db'
    };
  }
  
  // Configuração local/desenvolvimento
  return {
    host: 'localhost',
    port: 5432,
    user: 'osh_user',
    password: 'osh_password_2024',
    database: 'osh_db'
  };
};

async function syncMigrations(environment = 'local') {
  const pool = new Pool(getPoolConfig(environment));
  
  try {
    console.log(`🚀 Sincronizando migrations para ambiente: ${environment}\n`);

    // 1. Criar tabela de controle de migrations se não existir
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        version VARCHAR(255) UNIQUE NOT NULL,
        filename VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        checksum VARCHAR(64),
        execution_time_ms INTEGER
      );
    `);

    // 2. Listar migrations executadas
    const executedResult = await pool.query('SELECT version FROM schema_migrations ORDER BY version');
    const executedMigrations = new Set(executedResult.rows.map(row => row.version));

    console.log('📋 Migrations já executadas:', executedMigrations.size);
    if (executedMigrations.size > 0) {
      console.log(Array.from(executedMigrations).join(', '), '\n');
    }

    // 3. Listar migrations disponíveis
    const migrationsDir = './migrations';
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log('📂 Migrations disponíveis:', migrationFiles.length);

    // 4. Executar migrations pendentes
    const pendingMigrations = migrationFiles.filter(file => {
      const version = file.replace('.sql', '');
      return !executedMigrations.has(version);
    });

    console.log('⏳ Migrations pendentes:', pendingMigrations.length);
    
    if (pendingMigrations.length === 0) {
      console.log('✅ Todas as migrations já foram executadas!');
      return;
    }

    console.log('\n🔄 Executando migrations pendentes...\n');

    for (const file of pendingMigrations) {
      const version = file.replace('.sql', '');
      const filePath = path.join(migrationsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');

      console.log(`📝 Executando: ${file}`);
      
      const startTime = Date.now();
      
      try {
        // Executar em transação
        await pool.query('BEGIN');
        
        // Executar a migration
        await pool.query(content);
        
        // Registrar na tabela de controle
        await pool.query(`
          INSERT INTO schema_migrations (version, filename, execution_time_ms) 
          VALUES ($1, $2, $3)
        `, [version, file, Date.now() - startTime]);
        
        await pool.query('COMMIT');
        
        console.log(`✅ ${file} executada com sucesso (${Date.now() - startTime}ms)`);
        
      } catch (error) {
        await pool.query('ROLLBACK');
        console.error(`❌ Erro ao executar ${file}:`, error.message);
        
        // Se uma migration falhar, parar o processo
        throw new Error(`Migration ${file} falhou: ${error.message}`);
      }
    }

    console.log('\n🎉 Sincronização de migrations concluída com sucesso!');

    // 5. Relatório final
    const finalResult = await pool.query('SELECT COUNT(*) as total FROM schema_migrations');
    console.log(`📊 Total de migrations executadas: ${finalResult.rows[0].total}`);

  } catch (error) {
    console.error('❌ Erro na sincronização:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Executar com argumento de ambiente
const environment = process.argv[2] || 'local';
syncMigrations(environment);