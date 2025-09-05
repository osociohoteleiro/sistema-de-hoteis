// Script para testar conectividade PostgreSQL + Redis
require('dotenv').config();
const pgDb = require('./config/postgres');
const redisDb = require('./config/redis');
const cacheService = require('./services/cache');

async function testDatabases() {
  console.log('🧪 Testando conectividade dos bancos de dados...\n');

  // Teste PostgreSQL
  console.log('📊 Testando PostgreSQL...');
  try {
    await pgDb.connect();
    
    // Teste de query simples
    const result = await pgDb.query('SELECT NOW() as current_time, VERSION() as version');
    console.log('✅ PostgreSQL conectado com sucesso!');
    console.log(`   Hora atual: ${result[0].current_time}`);
    console.log(`   Versão: ${result[0].version.split(' ')[0]}`);
    
    // Teste de performance
    const start = Date.now();
    await pgDb.query('SELECT COUNT(*) FROM pg_tables WHERE schemaname = $1', ['public']);
    const duration = Date.now() - start;
    console.log(`   Performance: ${duration}ms\n`);
    
  } catch (error) {
    console.error('❌ Erro PostgreSQL:', error.message);
  }

  // Teste Redis
  console.log('🔴 Testando Redis...');
  try {
    await redisDb.connect();
    
    // Teste de set/get
    const testKey = 'test:connection';
    const testValue = { message: 'Hello Redis!', timestamp: new Date() };
    
    await redisDb.set(testKey, testValue, 10);
    const retrieved = await redisDb.get(testKey);
    
    console.log('✅ Redis conectado com sucesso!');
    console.log(`   Teste set/get: ${retrieved.message}`);
    
    // Teste de TTL
    const ttl = await redisDb.ttl(testKey);
    console.log(`   TTL: ${ttl} segundos`);
    
    // Cleanup
    await redisDb.del(testKey);
    console.log('   Cleanup realizado\n');
    
  } catch (error) {
    console.error('❌ Erro Redis:', error.message);
  }

  // Teste Cache Service
  console.log('🚀 Testando Cache Service...');
  try {
    // Teste cache de usuário
    const userId = 'test-user-123';
    const userData = { name: 'Test User', email: 'test@example.com' };
    
    await cacheService.setUser(userId, userData);
    const cachedUser = await cacheService.getUser(userId);
    
    console.log('✅ Cache Service funcionando!');
    console.log(`   User cache: ${cachedUser.name}`);
    
    // Teste stats
    const stats = await cacheService.getStats();
    console.log(`   Total keys: ${stats.totalKeys}`);
    
    // Cleanup
    await cacheService.delUser(userId);
    console.log('   Cleanup realizado\n');
    
  } catch (error) {
    console.error('❌ Erro Cache Service:', error.message);
  }

  // Status final
  console.log('📋 Status final:');
  console.log(`   PostgreSQL: ${pgDb.getStatus().connected ? '🟢 Conectado' : '🔴 Desconectado'}`);
  console.log(`   Redis: ${redisDb.getStatus().connected ? '🟢 Conectado' : '🔴 Desconectado'}`);
  
  // Fechar conexões
  await pgDb.close();
  await redisDb.close();
  
  console.log('\n✅ Teste concluído!');
}

// Executar teste
testDatabases().catch(console.error);