const { Client } = require('pg');

async function checkSearches() {
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

    // Verificar se existem searches para o hotel
    const searchesResult = await client.query(`
      SELECT COUNT(*) as total
      FROM rate_shopper_searches
      WHERE hotel_uuid = '3e74f4e5-8763-11f0-bd40-02420a0b00b1'
    `);

    console.log(`🔍 SEARCHES PARA ECO ENCANTO POUSADA:`);
    console.log(`   Total: ${searchesResult.rows[0].total}`);

    if (searchesResult.rows[0].total === '0') {
      console.log('\n❌ PROBLEMA: Nenhuma search cadastrada para este hotel!');

      // Verificar se existem searches para outros hotéis
      const allSearches = await client.query(`
        SELECT hotel_uuid, COUNT(*) as total
        FROM rate_shopper_searches
        GROUP BY hotel_uuid
        ORDER BY total DESC
      `);

      console.log('\n📊 SEARCHES POR HOTEL:');
      if (allSearches.rows.length > 0) {
        allSearches.rows.forEach((row, index) => {
          console.log(`   ${index + 1}. Hotel UUID: ${row.hotel_uuid} - ${row.total} searches`);
        });
      } else {
        console.log('   ❌ Nenhuma search cadastrada no sistema!');
      }

      // Verificar estrutura da tabela rate_shopper_searches
      console.log('\n🔍 ESTRUTURA DA TABELA rate_shopper_searches:');
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'rate_shopper_searches'
        ORDER BY ordinal_position
      `);

      columns.rows.forEach((col, index) => {
        console.log(`   ${index + 1}. ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });

    } else {
      // Mostrar detalhes das searches
      const detailsResult = await client.query(`
        SELECT id, destination, checkin_date, checkout_date, adults, children, status
        FROM rate_shopper_searches
        WHERE hotel_uuid = '3e74f4e5-8763-11f0-bd40-02420a0b00b1'
        LIMIT 5
      `);

      console.log('\n📋 DETALHES DAS SEARCHES:');
      detailsResult.rows.forEach((search, index) => {
        console.log(`   ${index + 1}. ID: ${search.id}, Destino: ${search.destination}, Check-in: ${search.checkin_date}, Status: ${search.status}`);
      });
    }

  } catch (error) {
    console.error('❌ ERRO:', error.message);
  } finally {
    await client.end();
  }
}

checkSearches().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});