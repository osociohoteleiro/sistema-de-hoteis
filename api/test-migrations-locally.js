const { Pool } = require('pg');

// Configuração para banco de teste local
const testPool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'osh_user',
  password: 'osh_password_2024',
  database: 'osh_db_test' // banco de teste
});

async function testMigrationsLocally() {
  try {
    console.log('🧪 Testando migrations em banco local de teste...');
    
    // 1. Tentar conectar (se falhar, banco não existe)
    try {
      await testPool.query('SELECT 1');
      console.log('✅ Banco de teste existe, limpando...');
      
      // Dropar todas as tabelas para teste limpo
      await testPool.query(`
        DROP SCHEMA public CASCADE;
        CREATE SCHEMA public;
        GRANT ALL ON SCHEMA public TO osh_user;
        GRANT ALL ON SCHEMA public TO public;
      `);
      
    } catch (error) {
      console.log('⚠️  Banco de teste não existe, criando...');
      
      // Conectar no banco principal para criar o de teste
      const mainPool = new Pool({
        host: 'localhost',
        port: 5432,
        user: 'osh_user',
        password: 'osh_password_2024',
        database: 'osh_db'
      });
      
      await mainPool.query('CREATE DATABASE osh_db_test');
      await mainPool.end();
    }
    
    // 2. Aplicar migrations de teste usando o sync script
    console.log('📁 Aplicando migrations no banco de teste...');
    
    const { execSync } = require('child_process');
    
    // Configurar variáveis de ambiente para o teste
    process.env.TEST_POSTGRES_HOST = 'localhost';
    process.env.TEST_POSTGRES_PORT = '5432';
    process.env.TEST_POSTGRES_USER = 'osh_user';
    process.env.TEST_POSTGRES_PASSWORD = 'osh_password_2024';
    process.env.TEST_POSTGRES_DB = 'osh_db_test';
    
    // Criar uma versão de teste do sync script
    const fs = require('fs');
    let syncScript = fs.readFileSync('./sync-migrations-to-production.js', 'utf8');
    
    // Substituir configuração para usar banco de teste
    syncScript = syncScript.replace(
      'const getPoolConfig = (environment = \'local\') => {',
      `const getPoolConfig = (environment = 'local') => {
  if (environment === 'test') {
    return {
      host: process.env.TEST_POSTGRES_HOST || 'localhost',
      port: process.env.TEST_POSTGRES_PORT || 5432,
      user: process.env.TEST_POSTGRES_USER || 'osh_user',
      password: process.env.TEST_POSTGRES_PASSWORD || 'osh_password_2024',
      database: process.env.TEST_POSTGRES_DB || 'osh_db_test'
    };
  }`
    );
    
    fs.writeFileSync('./sync-migrations-test.js', syncScript);
    
    // Executar sync para teste
    execSync('node sync-migrations-test.js test', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    // 3. Verificar se todas as tabelas foram criadas
    console.log('\\n🔍 Verificando estrutura criada...');
    
    const tablesResult = await testPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`✅ ${tablesResult.rows.length} tabelas criadas no banco de teste:`);
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // 4. Verificar se ENUMs foram criados
    const enumsResult = await testPool.query(`
      SELECT typname 
      FROM pg_type 
      WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      AND typtype = 'e'
      ORDER BY typname
    `);
    
    console.log(`\\n✅ ${enumsResult.rows.length} tipos ENUM criados:`);
    enumsResult.rows.forEach(row => {
      console.log(`  - ${row.typname}`);
    });
    
    // 5. Testar inserção de dados básicos
    console.log('\\n🧪 Testando inserção de dados básicos...');
    
    // Inserir hotel de teste
    await testPool.query(`
      INSERT INTO hotels (name, description, status) 
      VALUES ('Hotel Teste', 'Hotel para teste de migrations', 'ACTIVE')
    `);
    
    // Inserir usuário de teste
    await testPool.query(`
      INSERT INTO users (name, email, password_hash, user_type) 
      VALUES ('Usuario Teste', 'teste@teste.com', 'hash_teste', 'HOTEL')
    `);
    
    console.log('✅ Dados de teste inseridos com sucesso!');
    
    // 6. Limpar arquivo temporário
    fs.unlinkSync('./sync-migrations-test.js');
    
    console.log('\\n🎉 Teste de migrations concluído com SUCESSO!');
    console.log('✅ A migration está pronta para produção');
    
  } catch (error) {
    console.error('❌ Erro no teste de migrations:', error.message);
    process.exit(1);
  } finally {
    await testPool.end();
  }
}

testMigrationsLocally();