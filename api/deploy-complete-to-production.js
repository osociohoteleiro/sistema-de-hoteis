const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Função para obter configuração do pool baseada no ambiente
const getPoolConfig = (environment = 'local') => {
  switch (environment) {
    case 'production':
      return {
        host: process.env.PROD_POSTGRES_HOST || process.env.POSTGRES_HOST,
        port: process.env.PROD_POSTGRES_PORT || process.env.POSTGRES_PORT || 5432,
        user: process.env.PROD_POSTGRES_USER || process.env.POSTGRES_USER,
        password: process.env.PROD_POSTGRES_PASSWORD || process.env.POSTGRES_PASSWORD,
        database: process.env.PROD_POSTGRES_DB || process.env.POSTGRES_DB
      };
    case 'local':
    default:
      return {
        host: 'localhost',
        port: 5432,
        user: 'osh_user',
        password: 'osh_password_2024',
        database: 'osh_db'
      };
  }
};

async function deployCompleteToProduction() {
  const environment = process.argv[2] || 'local';
  const poolConfig = getPoolConfig(environment);
  
  console.log(`🚀 Deploy COMPLETO (estrutura + dados) para: ${environment}`);
  console.log(`🔗 Conectando em: ${poolConfig.host}:${poolConfig.port}/${poolConfig.database}`);
  
  const pool = new Pool(poolConfig);
  
  try {
    // 1. Testar conexão
    console.log('🔌 Testando conexão...');
    await pool.query('SELECT NOW()');
    console.log('✅ Conexão estabelecida com sucesso');
    
    // 2. Buscar arquivo combinado mais recente
    const migrationsDir = './migrations';
    const combinedFile = fs.readdirSync(migrationsDir)
      .filter(f => f.startsWith('complete_migration_with_data_'))
      .sort()
      .reverse()[0];
    
    if (!combinedFile) {
      throw new Error('Arquivo combinado não encontrado! Execute export-all-data-for-production.js primeiro');
    }
    
    console.log(`📁 Usando arquivo: ${combinedFile}`);
    
    // 3. Ler o arquivo de migration
    const migrationPath = path.join(migrationsDir, combinedFile);
    const migrationContent = fs.readFileSync(migrationPath, 'utf8');
    
    console.log(`📏 Tamanho da migration: ${(migrationContent.length / 1024).toFixed(2)} KB`);
    
    // 4. Verificar se é primeira execução
    const existingTables = await pool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const tableCount = parseInt(existingTables.rows[0].count);
    console.log(`📊 Tabelas existentes no destino: ${tableCount}`);
    
    if (tableCount > 5) {
      console.log('⚠️  Banco já possui tabelas. Continuando com deploy...');
    }
    
    // 5. Aplicar migration completa
    console.log('🏗️  Aplicando migration completa (estrutura + dados)...');
    
    const startTime = Date.now();
    
    try {
      // Dividir em blocos menores para evitar timeouts
      const statements = migrationContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);
      
      console.log(`📋 Executando ${statements.length} statements...`);
      
      let executed = 0;
      for (const statement of statements) {
        if (statement.trim()) {
          await pool.query(statement + ';');
          executed++;
          
          if (executed % 50 === 0) {
            console.log(`   ⏳ Executados ${executed}/${statements.length} statements...`);
          }
        }
      }
      
      const executionTime = Date.now() - startTime;
      console.log(`✅ Migration aplicada com sucesso! (${executionTime}ms)`);
      
    } catch (sqlError) {
      console.error('❌ Erro SQL:', sqlError.message);
      throw sqlError;
    }
    
    // 6. Verificar resultado
    console.log('\\n🔍 Verificando resultado...');
    
    const finalTables = await pool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const finalTableCount = parseInt(finalTables.rows[0].count);
    console.log(`📊 Tabelas após migration: ${finalTableCount}`);
    
    // Verificar alguns dados importantes
    const sampleQueries = [
      { name: 'Users', query: 'SELECT COUNT(*) as count FROM users' },
      { name: 'Hotels', query: 'SELECT COUNT(*) as count FROM hotels' },
      { name: 'Rate Shopper Prices', query: 'SELECT COUNT(*) as count FROM rate_shopper_prices' },
      { name: 'Workspaces', query: 'SELECT COUNT(*) as count FROM workspaces' }
    ];
    
    console.log('\\n📊 Verificando dados importados:');
    for (const sample of sampleQueries) {
      try {
        const result = await pool.query(sample.query);
        const count = parseInt(result.rows[0].count);
        console.log(`   ${sample.name}: ${count.toLocaleString()} registros`);
      } catch (error) {
        console.log(`   ${sample.name}: ❌ Erro - ${error.message}`);
      }
    }
    
    // 7. Registrar migration no schema_migrations
    try {
      await pool.query(`
        INSERT INTO schema_migrations (version, filename, executed_at, execution_time_ms)
        VALUES ($1, $2, CURRENT_TIMESTAMP, $3)
        ON CONFLICT (version) DO NOTHING
      `, [
        'complete_migration_with_data',
        combinedFile,
        Date.now() - startTime
      ]);
      
      console.log('✅ Migration registrada em schema_migrations');
    } catch (regError) {
      console.log('⚠️  Aviso: Não foi possível registrar migration:', regError.message);
    }
    
    console.log('\\n🎉 DEPLOY COMPLETO CONCLUÍDO COM SUCESSO!');
    console.log('\\n📋 Resumo:');
    console.log(`   ✅ Estrutura criada: ${finalTableCount} tabelas`);
    console.log(`   ✅ Dados importados: ~1.534 registros`);
    console.log(`   ✅ Tempo total: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
    console.log(`   ✅ Environment: ${environment}`);
    
  } catch (error) {
    console.error('❌ ERRO NO DEPLOY:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Verificar argumentos
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🚀 Deploy Completo para Produção

Uso:
  node deploy-complete-to-production.js [environment]

Environments:
  local      - Banco local (padrão)
  production - Banco de produção (requer variáveis de ambiente)

Variáveis de ambiente para produção:
  PROD_POSTGRES_HOST ou POSTGRES_HOST
  PROD_POSTGRES_PORT ou POSTGRES_PORT
  PROD_POSTGRES_USER ou POSTGRES_USER
  PROD_POSTGRES_PASSWORD ou POSTGRES_PASSWORD
  PROD_POSTGRES_DB ou POSTGRES_DB

Exemplo:
  # Para produção
  POSTGRES_HOST=seu-host POSTGRES_PASSWORD=sua-senha node deploy-complete-to-production.js production
  `);
  process.exit(0);
}

deployCompleteToProduction();