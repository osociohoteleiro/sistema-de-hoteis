const { Client } = require('pg');

async function createTestSearch() {
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

    console.log('🧪 CRIANDO SEARCH DE TESTE\n');

    // Criar uma nova search PENDING para teste
    const result = await client.query(`
      INSERT INTO rate_shopper_searches (
        hotel_id,
        property_id,
        search_type,
        start_date,
        end_date,
        status,
        total_dates
      ) VALUES (
        17,
        12,
        'MANUAL',
        '2025-09-20',
        '2025-09-22',
        'PENDING',
        2
      ) RETURNING id
    `);

    const searchId = result.rows[0].id;
    console.log(`✅ Search criada com ID: ${searchId}`);

    // Testar as queries
    console.log('\n🔍 TESTANDO QUERIES:');

    // Query simples
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

    // Verificar se property 12 existe
    const propertyCheck = await client.query(`
      SELECT id, property_name, hotel_id, active
      FROM rate_shopper_properties
      WHERE id = 12
    `);

    console.log('\n🏨 VERIFICANDO PROPERTY 12:');
    if (propertyCheck.rows.length > 0) {
      const prop = propertyCheck.rows[0];
      console.log(`   ✅ Property existe: ${prop.property_name}`);
      console.log(`   Hotel ID: ${prop.hotel_id}, Ativa: ${prop.active}`);
    } else {
      console.log('   ❌ Property 12 não existe!');
    }

    console.log('\n🎯 DIAGNÓSTICO:');
    if (simpleQuery.rows[0].total > joinQuery.rows[0].total) {
      console.log('❌ PROBLEMA CONFIRMADO: JOIN com properties está excluindo searches');
      console.log('🔧 SOLUÇÃO: Corrigir JOIN no código do extrator');
    } else {
      console.log('✅ Todas as queries retornam o mesmo resultado - JOIN está OK');
    }

    // Testar query exata do extrator
    console.log('\n🔬 TESTANDO QUERY EXATA DO EXTRATOR:');
    const extractorQuery = await client.query(`
      SELECT
        rs.id,
        rs.uuid,
        rs.hotel_id,
        rs.property_id,
        rs.start_date,
        rs.end_date,
        rs.total_dates,
        rsp.property_name,
        rsp.booking_url,
        rsp.max_bundle_size,
        h.name as hotel_name,
        h.hotel_uuid
      FROM rate_shopper_searches rs
      JOIN rate_shopper_properties rsp ON rs.property_id = rsp.id
      JOIN hotels h ON rs.hotel_id = h.id
      WHERE rs.status = 'PENDING'
      ORDER BY rs.created_at ASC
      LIMIT 10
    `);

    console.log(`   Searches encontradas pela query do extrator: ${extractorQuery.rows.length}`);

    if (extractorQuery.rows.length > 0) {
      console.log('\n   📋 DETALHES:');
      extractorQuery.rows.forEach((search, index) => {
        console.log(`   ${index + 1}. Search ${search.id} - ${search.hotel_name}`);
        console.log(`      Property: ${search.property_name}`);
        console.log(`      Hotel UUID: ${search.hotel_uuid}`);
      });

      console.log('\n✅ EXTRATOR DEVERIA PROCESSAR ESSAS SEARCHES!');
    }

  } catch (error) {
    console.error('❌ ERRO:', error.message);
  } finally {
    await client.end();
  }
}

createTestSearch().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});