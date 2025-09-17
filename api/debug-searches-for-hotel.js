const { Client } = require('pg');

async function debugSearchesForHotel() {
  const client = new Client({
    host: 'ep.osociohoteleiro.com.br',
    port: 5432,
    user: 'postgres',
    password: 'OSH4040()Xx!..nn',
    database: 'osh_sistemas',
    ssl: false
  });

  try {
    await client.connect();

    console.log('🔍 VERIFICANDO SEARCHES PARA ECO ENCANTO POUSADA (hotel_id=17)');

    // Verificar total de searches
    const totalSearches = await client.query(`
      SELECT COUNT(*) as total, status, COUNT(*) as count_by_status
      FROM rate_shopper_searches
      WHERE hotel_id = 17
      GROUP BY status
      ORDER BY status
    `);

    console.log('\n📊 SEARCHES POR STATUS:');
    totalSearches.rows.forEach(row => {
      console.log(`   ${row.status}: ${row.count_by_status} searches`);
    });

    // Verificar searches PENDING específicamente
    const pendingSearches = await client.query(`
      SELECT id, property_id, start_date, end_date, status, created_at
      FROM rate_shopper_searches
      WHERE hotel_id = 17 AND status = 'PENDING'
      ORDER BY created_at DESC
      LIMIT 5
    `);

    console.log('\n🟡 SEARCHES PENDING:');
    if (pendingSearches.rows.length > 0) {
      pendingSearches.rows.forEach((search, index) => {
        console.log(`   ${index + 1}. ID: ${search.id}, Property: ${search.property_id}, Período: ${search.start_date} a ${search.end_date}, Criado: ${search.created_at}`);
      });
    } else {
      console.log('   ❌ NENHUMA SEARCH PENDING ENCONTRADA!');
    }

    // Verificar propriedades ativas para o hotel
    const activeProperties = await client.query(`
      SELECT id, property_name, active, platform
      FROM rate_shopper_properties
      WHERE hotel_id = 17 AND active = true
    `);

    console.log('\n🏨 PROPRIEDADES ATIVAS PARA O HOTEL:');
    if (activeProperties.rows.length > 0) {
      activeProperties.rows.forEach((prop, index) => {
        console.log(`   ${index + 1}. ID: ${prop.id}, Nome: ${prop.property_name}, Plataforma: ${prop.platform}`);
      });
    } else {
      console.log('   ❌ NENHUMA PROPRIEDADE ATIVA ENCONTRADA!');
    }

    // Diagnóstico final
    console.log('\n🎯 DIAGNÓSTICO:');

    if (pendingSearches.rows.length === 0) {
      console.log('❌ PROBLEMA: Não há searches PENDING para extrair!');

      if (activeProperties.rows.length === 0) {
        console.log('💡 CAUSA: Nenhuma propriedade ativa configurada para o hotel');
        console.log('🔧 SOLUÇÃO: Configurar propriedades ativas no sistema');
      } else {
        console.log('💡 CAUSA: Propriedades ativas existem mas não há searches criadas');
        console.log('🔧 SOLUÇÃO: Criar searches PENDING automaticamente ou manualmente');
        console.log('📋 Próximos passos:');
        console.log('   1. API deve criar searches automaticamente ao iniciar extração, ou');
        console.log('   2. Frontend deve permitir criar searches antes da extração');
      }
    } else {
      console.log('✅ OK: Searches PENDING existem e podem ser processadas');
    }

  } catch (error) {
    console.error('❌ ERRO:', error.message);
  } finally {
    await client.end();
  }
}

debugSearchesForHotel().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});