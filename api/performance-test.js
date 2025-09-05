// Script de teste de performance PostgreSQL vs MariaDB
require('dotenv').config();
const pgDb = require('./config/postgres');
const mysqlDb = require('./config/database');

async function performanceTest() {
  console.log('🚀 Teste de Performance: PostgreSQL vs MariaDB\n');

  const tests = [
    { name: 'SELECT simples', query: 'SELECT COUNT(*) FROM users' },
    { name: 'SELECT com JOIN', query: 'SELECT u.name, h.name FROM users u JOIN user_hotels uh ON u.id = uh.user_id JOIN hotels h ON uh.hotel_id = h.id' },
    { name: 'SELECT com filtro', query: "SELECT * FROM users WHERE user_type = 'HOTEL'" },
    { name: 'INSERT simples', query: "INSERT INTO app_config (hotel_id, config_key, config_value) VALUES (2, 'test_key', 'test_value')" },
    { name: 'UPDATE simples', query: "UPDATE app_config SET config_value = 'updated_value' WHERE config_key = 'test_key'" }
  ];

  const results = {
    postgresql: {},
    mariadb: {}
  };

  console.log('📊 Testando PostgreSQL...');
  try {
    await pgDb.connect();
    
    for (const test of tests) {
      const start = performance.now();
      try {
        if (test.name.includes('JOIN')) {
          await pgDb.query(test.query.replace(/name FROM users u/g, 'name FROM users u').replace(/h\.name/g, 'h.name'));
        } else {
          await pgDb.query(test.query);
        }
        const duration = performance.now() - start;
        results.postgresql[test.name] = duration;
        console.log(`  ✅ ${test.name}: ${duration.toFixed(2)}ms`);
      } catch (error) {
        console.log(`  ⚠️ ${test.name}: Erro - ${error.message}`);
        results.postgresql[test.name] = 'ERRO';
      }
    }
    
    await pgDb.close();
  } catch (error) {
    console.log('❌ Erro PostgreSQL:', error.message);
  }

  console.log('\n📊 Testando MariaDB...');
  // Temporariamente mudar para MariaDB
  process.env.DB_MODE = 'mariadb';
  
  try {
    await mysqlDb.connect();
    
    for (const test of tests) {
      const start = performance.now();
      try {
        if (test.name.includes('JOIN')) {
          await mysqlDb.query('SELECT u.name, h.hotel_nome FROM users u JOIN user_hotels uh ON u.id = uh.user_id JOIN hotels h ON uh.hotel_id = h.id');
        } else if (test.query.includes('hotels h ON uh.hotel_id = h.id')) {
          // Skip devido às diferenças de schema
          results.mariadb[test.name] = 'SKIP';
          continue;
        } else {
          await mysqlDb.query(test.query);
        }
        const duration = performance.now() - start;
        results.mariadb[test.name] = duration;
        console.log(`  ✅ ${test.name}: ${duration.toFixed(2)}ms`);
      } catch (error) {
        console.log(`  ⚠️ ${test.name}: Erro - ${error.message}`);
        results.mariadb[test.name] = 'ERRO';
      }
    }
    
    await mysqlDb.close();
  } catch (error) {
    console.log('❌ Erro MariaDB:', error.message);
  }

  // Restore PostgreSQL mode
  process.env.DB_MODE = 'postgres';

  console.log('\n📈 Comparativo de Performance:');
  console.log('======================================');
  
  for (const test of tests) {
    const pgTime = results.postgresql[test.name];
    const mysqlTime = results.mariadb[test.name];
    
    console.log(`\n${test.name}:`);
    console.log(`  PostgreSQL: ${typeof pgTime === 'number' ? pgTime.toFixed(2) + 'ms' : pgTime}`);
    console.log(`  MariaDB:    ${typeof mysqlTime === 'number' ? mysqlTime.toFixed(2) + 'ms' : mysqlTime}`);
    
    if (typeof pgTime === 'number' && typeof mysqlTime === 'number') {
      const improvement = ((mysqlTime - pgTime) / mysqlTime * 100);
      if (improvement > 0) {
        console.log(`  🚀 PostgreSQL ${improvement.toFixed(1)}% mais rápido`);
      } else {
        console.log(`  ⚠️ MariaDB ${Math.abs(improvement).toFixed(1)}% mais rápido`);
      }
    }
  }

  console.log('\n🎯 Teste de Conectividade Concurrent...');
  
  const concurrentTest = async (db, name) => {
    const promises = [];
    const start = performance.now();
    
    for (let i = 0; i < 10; i++) {
      promises.push(db.query('SELECT NOW()'));
    }
    
    try {
      await Promise.all(promises);
      const duration = performance.now() - start;
      console.log(`  ${name}: ${duration.toFixed(2)}ms (10 queries concorrentes)`);
      return duration;
    } catch (error) {
      console.log(`  ${name}: Erro - ${error.message}`);
      return null;
    }
  };

  try {
    await pgDb.connect();
    const pgConcurrent = await concurrentTest(pgDb, 'PostgreSQL');
    await pgDb.close();

    process.env.DB_MODE = 'mariadb';
    await mysqlDb.connect();
    const mysqlConcurrent = await concurrentTest(mysqlDb, 'MariaDB   ');
    await mysqlDb.close();
    
    process.env.DB_MODE = 'postgres';
    
    if (pgConcurrent && mysqlConcurrent) {
      const improvement = ((mysqlConcurrent - pgConcurrent) / mysqlConcurrent * 100);
      console.log(`  🏆 PostgreSQL ${improvement.toFixed(1)}% melhor em concorrência`);
    }
  } catch (error) {
    console.log('❌ Erro no teste concorrente:', error.message);
  }

  console.log('\n✅ Teste de performance concluído!');
}

performanceTest().catch(console.error);