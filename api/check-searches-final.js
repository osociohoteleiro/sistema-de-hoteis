const { Client } = require('pg');

async function checkSearchesFinal() {
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

    console.log('📋 VERIFICANDO SEARCHES PARA ECO ENCANTO POUSADA:');

    // Verificar se há searches para hotel ID 17 (Eco Encanto Pousada)
    const ecoEncantoSearches = await client.query(`
      SELECT COUNT(*) as total
      FROM rate_shopper_searches
      WHERE hotel_id = 17
    `);

    console.log(`🏨 TOTAL DE SEARCHES PARA ECO ENCANTO POUSADA (hotel_id=17): ${ecoEncantoSearches.rows[0].total}`);

    if (ecoEncantoSearches.rows[0].total === '0') {
      console.log('\n❌ PROBLEMA IDENTIFICADO: Nenhuma search cadastrada para este hotel!');

      // Verificar se há searches para outros hotéis
      const allSearches = await client.query(`
        SELECT hotel_id, COUNT(*) as total
        FROM rate_shopper_searches
        GROUP BY hotel_id
        ORDER BY total DESC
      `);

      console.log('\n📊 SEARCHES POR HOTEL:');
      if (allSearches.rows.length > 0) {
        allSearches.rows.forEach((row, index) => {
          console.log(`   ${index + 1}. hotel_id: ${row.hotel_id} - ${row.total} searches`);
        });
      } else {
        console.log('   ❌ NENHUMA SEARCH CADASTRADA NO SISTEMA!');
      }
    } else {
      // Mostrar detalhes das searches
      const detailsResult = await client.query(`
        SELECT id, uuid, search_type, start_date, end_date, status, total_dates, processed_dates
        FROM rate_shopper_searches
        WHERE hotel_id = 17
        LIMIT 5
      `);

      console.log('\n📋 DETALHES DAS SEARCHES PARA ECO ENCANTO POUSADA:');
      detailsResult.rows.forEach((search, index) => {
        console.log(`   ${index + 1}. ID: ${search.id}, Tipo: ${search.search_type}, Período: ${search.start_date} a ${search.end_date}, Status: ${search.status}`);
      });
    }

  } catch (error) {
    console.error('❌ ERRO:', error.message);
  } finally {
    await client.end();
  }
}

checkSearchesFinal().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});