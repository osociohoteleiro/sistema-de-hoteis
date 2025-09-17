const { Client } = require('pg');

async function debugSearchProperty() {
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

    console.log('🔍 VERIFICANDO PROBLEM DO JOIN COM PROPERTIES\n');

    // 1. Verificar search PENDING
    const search = await client.query(`
      SELECT id, hotel_id, property_id, status, created_at
      FROM rate_shopper_searches
      WHERE status = 'PENDING'
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (search.rows.length === 0) {
      console.log('❌ Nenhuma search PENDING encontrada');
      return;
    }

    const searchData = search.rows[0];
    console.log('📋 SEARCH PENDING ENCONTRADA:');
    console.log(`   ID: ${searchData.id}`);
    console.log(`   Hotel ID: ${searchData.hotel_id}`);
    console.log(`   Property ID: ${searchData.property_id}`);
    console.log(`   Status: ${searchData.status}`);

    // 2. Verificar se a property existe
    if (searchData.property_id) {
      const property = await client.query(`
        SELECT id, property_name, active, hotel_id
        FROM rate_shopper_properties
        WHERE id = $1
      `, [searchData.property_id]);

      console.log('\n🏨 VERIFICANDO PROPERTY:');
      if (property.rows.length > 0) {
        const propData = property.rows[0];
        console.log(`   ✅ Property existe: ${propData.property_name}`);
        console.log(`   Hotel ID: ${propData.hotel_id}`);
        console.log(`   Ativa: ${propData.active}`);

        if (propData.hotel_id !== searchData.hotel_id) {
          console.log(`   ❌ PROBLEMA: Hotel ID não confere (search: ${searchData.hotel_id}, property: ${propData.hotel_id})`);
        }
      } else {
        console.log(`   ❌ PROPERTY NÃO EXISTE! (ID: ${searchData.property_id})`);
      }
    } else {
      console.log('\n❌ PROPERTY ID É NULL!');
    }

    // 3. Testar as duas queries
    console.log('\n🔍 TESTANDO QUERIES:');

    // Query simples (minha)
    const simpleQuery = await client.query(`
      SELECT COUNT(*) as total
      FROM rate_shopper_searches
      WHERE status = 'PENDING'
    `);
    console.log(`   Query simples: ${simpleQuery.rows[0].total} searches PENDING`);

    // Query com JOIN (do extrator)
    const joinQuery = await client.query(`
      SELECT COUNT(*) as total
      FROM rate_shopper_searches rs
      JOIN rate_shopper_properties rsp ON rs.property_id = rsp.id
      JOIN hotels h ON rs.hotel_id = h.id
      WHERE rs.status = 'PENDING'
    `);
    console.log(`   Query com JOIN: ${joinQuery.rows[0].total} searches PENDING`);

    // Query com LEFT JOIN (corrigida)
    const leftJoinQuery = await client.query(`
      SELECT COUNT(*) as total
      FROM rate_shopper_searches rs
      LEFT JOIN rate_shopper_properties rsp ON rs.property_id = rsp.id
      JOIN hotels h ON rs.hotel_id = h.id
      WHERE rs.status = 'PENDING'
    `);
    console.log(`   Query com LEFT JOIN: ${leftJoinQuery.rows[0].total} searches PENDING`);

    console.log('\n🎯 DIAGNÓSTICO:');
    if (simpleQuery.rows[0].total > joinQuery.rows[0].total) {
      console.log('❌ PROBLEMA CONFIRMADO: JOIN com properties está excluindo searches');
      console.log('🔧 SOLUÇÃO: Mudar JOIN para LEFT JOIN na query do extrator');
    } else {
      console.log('✅ JOIN não é o problema, investigar mais');
    }

  } catch (error) {
    console.error('❌ ERRO:', error.message);
  } finally {
    await client.end();
  }
}

debugSearchProperty().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});