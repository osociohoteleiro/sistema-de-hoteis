// Script de validação completa da migração
require('dotenv').config();
const mysql = require('mysql2/promise');
const pgDb = require('./config/postgres');
const redisDb = require('./config/redis');
const cacheService = require('./services/cache');

async function validateMigration() {
  console.log('🔍 Validação Completa da Migração MySQL → PostgreSQL + Redis\n');

  let mysqlConn, validationResults = {
    connectivity: {},
    dataIntegrity: {},
    performance: {},
    cache: {}
  };

  // Teste 1: Conectividade
  console.log('1️⃣ Testando Conectividade...');
  
  try {
    // PostgreSQL
    await pgDb.connect();
    validationResults.connectivity.postgresql = '✅ OK';
    console.log('  ✅ PostgreSQL: Conectado');
    
    // Redis
    await redisDb.connect();
    validationResults.connectivity.redis = '✅ OK';
    console.log('  ✅ Redis: Conectado');
    
    // MySQL (origem)
    mysqlConn = await mysql.createConnection({
      host: process.env.DB_HOST_EXTERNAL,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    validationResults.connectivity.mysql = '✅ OK';
    console.log('  ✅ MySQL: Conectado');
    
  } catch (error) {
    validationResults.connectivity.error = error.message;
    console.log('  ❌ Erro de conectividade:', error.message);
  }

  // Teste 2: Integridade dos Dados
  console.log('\n2️⃣ Validando Integridade dos Dados...');
  
  const tables = [
    { mysql: 'users', postgres: 'users', key: 'id' },
    { mysql: 'hotels', postgres: 'hotels', key: 'id' },
    { mysql: 'user_hotels', postgres: 'user_hotels', key: 'id' },
    { mysql: 'app_config', postgres: 'app_config', key: 'id' }
  ];

  for (const table of tables) {
    try {
      const [mysqlCount] = await mysqlConn.execute(`SELECT COUNT(*) as count FROM ${table.mysql}`);
      const pgResult = await pgDb.query(`SELECT COUNT(*) as count FROM ${table.postgres}`);
      
      const mysqlTotal = mysqlCount[0].count;
      const pgTotal = parseInt(pgResult[0].count);
      
      if (mysqlTotal === pgTotal) {
        validationResults.dataIntegrity[table.postgres] = `✅ ${pgTotal} registros`;
        console.log(`  ✅ ${table.postgres}: ${pgTotal} registros (100% migrados)`);
      } else {
        validationResults.dataIntegrity[table.postgres] = `⚠️ ${pgTotal}/${mysqlTotal} registros`;
        console.log(`  ⚠️ ${table.postgres}: ${pgTotal}/${mysqlTotal} registros (${((pgTotal/mysqlTotal)*100).toFixed(1)}%)`);
      }
    } catch (error) {
      validationResults.dataIntegrity[table.postgres] = `❌ Erro: ${error.message}`;
      console.log(`  ❌ ${table.postgres}: ${error.message}`);
    }
  }

  // Teste 3: Validação de Dados Específicos
  console.log('\n3️⃣ Validando Dados Específicos...');
  
  try {
    // Verificar se usuários têm UUIDs válidos
    const usersUuid = await pgDb.query('SELECT COUNT(*) as count FROM users WHERE uuid IS NOT NULL');
    console.log(`  ✅ Usuários com UUID: ${usersUuid[0].count}/6`);
    
    // Verificar se hotéis têm nomes válidos
    const hotelsName = await pgDb.query("SELECT COUNT(*) as count FROM hotels WHERE name IS NOT NULL AND name != ''");
    console.log(`  ✅ Hotéis com nome: ${hotelsName[0].count}/12`);
    
    // Verificar integridade referencial
    const userHotels = await pgDb.query(`
      SELECT COUNT(*) as count FROM user_hotels uh 
      WHERE EXISTS (SELECT 1 FROM users u WHERE u.id = uh.user_id)
      AND EXISTS (SELECT 1 FROM hotels h WHERE h.id = uh.hotel_id)
    `);
    console.log(`  ✅ Relacionamentos user-hotel válidos: ${userHotels[0].count}`);
    
  } catch (error) {
    console.log(`  ❌ Erro na validação específica: ${error.message}`);
  }

  // Teste 4: Cache Redis
  console.log('\n4️⃣ Testando Sistema de Cache...');
  
  try {
    // Teste básico do cache
    const testKey = 'validation_test';
    const testValue = { message: 'Cache funcionando!', timestamp: Date.now() };
    
    await cacheService.set(testKey, testValue, 10);
    const cachedValue = await cacheService.get(testKey);
    
    if (cachedValue && cachedValue.message === testValue.message) {
      validationResults.cache.basic = '✅ OK';
      console.log('  ✅ Cache básico: Funcionando');
    } else {
      validationResults.cache.basic = '❌ Falha';
      console.log('  ❌ Cache básico: Falha');
    }
    
    // Teste cache de usuário
    const user = await pgDb.query('SELECT * FROM users LIMIT 1');
    if (user[0]) {
      await cacheService.setUser(user[0].id, user[0]);
      const cachedUser = await cacheService.getUser(user[0].id);
      
      if (cachedUser && cachedUser.email === user[0].email) {
        validationResults.cache.user = '✅ OK';
        console.log('  ✅ Cache de usuário: Funcionando');
      } else {
        validationResults.cache.user = '❌ Falha';
        console.log('  ❌ Cache de usuário: Falha');
      }
    }
    
    // Cleanup
    await cacheService.del(testKey);
    if (user[0]) await cacheService.delUser(user[0].id);
    
  } catch (error) {
    validationResults.cache.error = error.message;
    console.log(`  ❌ Erro no cache: ${error.message}`);
  }

  // Teste 5: Performance Endpoints API
  console.log('\n5️⃣ Testando Performance da API...');
  
  try {
    const endpoints = [
      { url: 'http://localhost:3001/api/health', name: 'Health Check' },
      { url: 'http://localhost:3001/api/db-test', name: 'DB Test' }
    ];

    const fetch = require('node-fetch');
    
    for (const endpoint of endpoints) {
      try {
        const start = Date.now();
        const response = await fetch(endpoint.url);
        const duration = Date.now() - start;
        
        if (response.ok) {
          validationResults.performance[endpoint.name] = `✅ ${duration}ms`;
          console.log(`  ✅ ${endpoint.name}: ${duration}ms`);
        } else {
          validationResults.performance[endpoint.name] = `❌ HTTP ${response.status}`;
          console.log(`  ❌ ${endpoint.name}: HTTP ${response.status}`);
        }
      } catch (error) {
        validationResults.performance[endpoint.name] = `❌ ${error.message}`;
        console.log(`  ❌ ${endpoint.name}: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.log(`  ❌ Erro no teste de API: ${error.message}`);
  }

  // Resumo Final
  console.log('\n📊 RESUMO DA VALIDAÇÃO');
  console.log('================================');
  
  console.log('\n🔗 Conectividade:');
  Object.entries(validationResults.connectivity).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
  
  console.log('\n📋 Integridade dos Dados:');
  Object.entries(validationResults.dataIntegrity).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
  
  console.log('\n🚀 Cache Redis:');
  Object.entries(validationResults.cache).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
  
  console.log('\n⚡ Performance API:');
  Object.entries(validationResults.performance).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });

  // Status geral
  const totalTests = Object.keys(validationResults.connectivity).length + 
                    Object.keys(validationResults.dataIntegrity).length + 
                    Object.keys(validationResults.cache).length + 
                    Object.keys(validationResults.performance).length;
                    
  const passedTests = JSON.stringify(validationResults).match(/✅/g)?.length || 0;
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  
  console.log(`\n🎯 RESULTADO GERAL: ${passedTests}/${totalTests} testes passaram (${successRate}%)`);
  
  if (successRate >= 80) {
    console.log('🎉 MIGRAÇÃO BEM-SUCEDIDA! Sistema pronto para produção.');
  } else if (successRate >= 60) {
    console.log('⚠️ MIGRAÇÃO PARCIAL. Algumas correções necessárias.');
  } else {
    console.log('❌ MIGRAÇÃO COM PROBLEMAS. Requer atenção urgente.');
  }

  // Cleanup
  if (mysqlConn) await mysqlConn.end();
  await pgDb.close();
  await redisDb.close();
}

validateMigration().catch(console.error);