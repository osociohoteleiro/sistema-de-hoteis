const { Client } = require('pg');

async function debugExtractorQuery() {
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

    const hotelUuid = '3e74f4e5-8763-11f0-bd40-02420a0b00b1';

    console.log('🔍 TESTANDO QUERY EXATA DO EXTRATOR');
    console.log(`🏨 Hotel UUID: ${hotelUuid}`);

    // Esta é a query exata que o extrator está fazendo
    const query = `
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
      WHERE rs.status = 'PENDING' AND h.hotel_uuid = $1
      ORDER BY rs.created_at ASC
      LIMIT 10
    `;

    console.log('\n📋 EXECUTANDO QUERY:');
    console.log(query);
    console.log(`\n🔍 Parâmetros: hotelUuid = ${hotelUuid}`);

    const result = await client.query(query, [hotelUuid]);

    console.log(`\n📊 RESULTADO: ${result.rows.length} searches encontradas`);

    if (result.rows.length > 0) {
      console.log('\n✅ SEARCHES ENCONTRADAS:');
      result.rows.forEach((search, index) => {
        console.log(`   ${index + 1}. ID: ${search.id}`);
        console.log(`      - Property ID: ${search.property_id} (${search.property_name})`);
        console.log(`      - Hotel ID: ${search.hotel_id} (${search.hotel_name})`);
        console.log(`      - Hotel UUID: ${search.hotel_uuid}`);
        console.log(`      - Período: ${search.start_date} a ${search.end_date}`);
        console.log(`      - Total dates: ${search.total_dates}`);
        console.log(`      - Booking URL: ${search.booking_url?.substring(0, 50)}...`);
        console.log('');
      });
    } else {
      console.log('\n❌ NENHUMA SEARCH ENCONTRADA!');

      console.log('\n🔍 DEBUGANDO...');

      // Verificar se o hotel UUID está correto
      const hotelCheck = await client.query(`
        SELECT id, hotel_uuid, name
        FROM hotels
        WHERE hotel_uuid = $1
      `, [hotelUuid]);

      if (hotelCheck.rows.length === 0) {
        console.log('❌ HOTEL UUID NÃO ENCONTRADO!');
      } else {
        console.log('✅ Hotel encontrado:', hotelCheck.rows[0]);

        // Verificar searches para este hotel_id
        const searchCheck = await client.query(`
          SELECT id, hotel_id, property_id, status
          FROM rate_shopper_searches
          WHERE hotel_id = $1 AND status = 'PENDING'
        `, [hotelCheck.rows[0].id]);

        console.log(`\n📋 Searches PENDING para hotel_id ${hotelCheck.rows[0].id}:`, searchCheck.rows.length);

        if (searchCheck.rows.length > 0) {
          // Verificar o JOIN com properties
          const joinCheck = await client.query(`
            SELECT rs.id, rs.property_id, rsp.property_name, rsp.id as prop_id
            FROM rate_shopper_searches rs
            LEFT JOIN rate_shopper_properties rsp ON rs.property_id = rsp.id
            WHERE rs.hotel_id = $1 AND rs.status = 'PENDING'
          `, [hotelCheck.rows[0].id]);

          console.log('\n🔗 Verificando JOIN com properties:');
          joinCheck.rows.forEach(row => {
            console.log(`   Search ${row.id} -> Property ${row.property_id} (${row.property_name || 'NULL'})`);
            if (!row.prop_id) {
              console.log(`   ❌ PROBLEMA: Property ${row.property_id} não existe!`);
            }
          });
        }
      }
    }

  } catch (error) {
    console.error('❌ ERRO:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
  }
}

debugExtractorQuery().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});