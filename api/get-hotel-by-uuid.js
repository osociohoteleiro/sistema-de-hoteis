const { Client } = require('pg');

async function getHotelByUuid() {
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

    const result = await client.query(`
      SELECT id, hotel_uuid, name, address, status
      FROM hotels
      WHERE hotel_uuid = '3e74f4e5-8763-11f0-bd40-02420a0b00b1'
    `);

    if (result.rows.length > 0) {
      const hotel = result.rows[0];
      console.log(`🏨 HOTEL ENCONTRADO:`);
      console.log(`   Nome: ${hotel.name}`);
      console.log(`   ID: ${hotel.id}`);
      console.log(`   UUID: ${hotel.hotel_uuid}`);
      console.log(`   Endereço: ${hotel.address}`);
      console.log(`   Status: ${hotel.status}`);
    } else {
      console.log('❌ Hotel não encontrado com esse UUID');
    }

  } catch (error) {
    console.error('❌ ERRO:', error.message);
  } finally {
    await client.end();
  }
}

getHotelByUuid().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});