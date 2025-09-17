const { Client } = require('pg');

async function checkSearchesStructure() {
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

    // Verificar estrutura da tabela rate_shopper_searches
    console.log('🔍 ESTRUTURA DA TABELA rate_shopper_searches:');
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'rate_shopper_searches'
      ORDER BY ordinal_position
    `);

    if (columns.rows.length > 0) {
      console.log(`   Total de colunas: ${columns.rows.length}`);
      columns.rows.forEach((col, index) => {
        console.log(`   ${index + 1}. ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });

      // Verificar se há hotel_id ao invés de hotel_uuid
      const hasHotelId = columns.rows.find(col => col.column_name === 'hotel_id');
      const hasHotelUuid = columns.rows.find(col => col.column_name === 'hotel_uuid');

      console.log('\n🎯 VERIFICAÇÃO DE COLUNAS:');
      console.log(`   hotel_id: ${hasHotelId ? '✅ EXISTE' : '❌ NÃO EXISTE'}`);
      console.log(`   hotel_uuid: ${hasHotelUuid ? '✅ EXISTE' : '❌ NÃO EXISTE'}`);

      // Se só tem hotel_id, verificar os registros
      if (hasHotelId && !hasHotelUuid) {
        console.log('\n📋 AMOSTRA DOS REGISTROS (usando hotel_id):');
        const sample = await client.query(`
          SELECT hotel_id, destination, checkin_date, checkout_date, status
          FROM rate_shopper_searches
          LIMIT 5
        `);

        if (sample.rows.length > 0) {
          sample.rows.forEach((row, index) => {
            console.log(`   ${index + 1}. hotel_id: ${row.hotel_id}, destino: ${row.destination}, status: ${row.status}`);
          });

          // Verificar se há searches para hotel ID 17 (Eco Encanto Pousada)
          const ecoEncantoSearches = await client.query(`
            SELECT COUNT(*) as total
            FROM rate_shopper_searches
            WHERE hotel_id = 17
          `);

          console.log(`\n🏨 SEARCHES PARA ECO ENCANTO POUSADA (hotel_id=17): ${ecoEncantoSearches.rows[0].total}`);
        } else {
          console.log('   ❌ Tabela está vazia');
        }
      }

    } else {
      console.log('❌ Tabela rate_shopper_searches não encontrada!');
    }

  } catch (error) {
    console.error('❌ ERRO:', error.message);
  } finally {
    await client.end();
  }
}

checkSearchesStructure().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});