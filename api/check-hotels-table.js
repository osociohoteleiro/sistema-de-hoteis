const { Client } = require('pg');

async function checkHotelsTable() {
  const client = new Client({
    host: 'ep.osociohoteleiro.com.br',
    port: 5432,
    user: 'postgres',
    password: 'OSH4040()Xx!..nn',
    database: 'osh_sistemas',
    ssl: false
  });

  try {
    console.log('🔄 Conectando ao banco de PRODUÇÃO...');
    await client.connect();
    console.log('✅ CONECTADO AO BANCO DE PRODUÇÃO!');

    // Verificar estrutura da tabela hotels
    console.log('\n🔍 ESTRUTURA DA TABELA hotels:');
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'hotels'
      ORDER BY ordinal_position
    `);

    console.log(`   Total de colunas: ${columns.rows.length}`);
    columns.rows.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Verificar se existe alguma coluna com UUID
    const uuidColumns = columns.rows.filter(col =>
      col.column_name.includes('uuid') ||
      col.data_type.includes('uuid') ||
      col.column_name === 'id' && col.data_type === 'uuid'
    );

    console.log('\n🎯 COLUNAS COM UUID NA TABELA HOTELS:');
    if (uuidColumns.length > 0) {
      uuidColumns.forEach(col => {
        console.log(`   ✅ ${col.column_name}: ${col.data_type}`);
      });
    } else {
      console.log('   ❌ Nenhuma coluna UUID encontrada');
    }

    // Verificar alguns registros
    const sampleHotels = await client.query(`
      SELECT * FROM hotels LIMIT 3
    `);

    console.log('\n📋 AMOSTRA DOS HOTÉIS:');
    sampleHotels.rows.forEach((hotel, index) => {
      console.log(`   ${index + 1}. ${JSON.stringify(hotel, null, 2)}`);
    });

    // Verificar registros da active_extractions para entender o relacionamento
    console.log('\n🔍 VERIFICANDO ACTIVE_EXTRACTIONS:');
    const activeExtractions = await client.query(`
      SELECT hotel_id, status, created_at
      FROM active_extractions
      LIMIT 3
    `);

    console.log('📋 REGISTROS EM ACTIVE_EXTRACTIONS:');
    activeExtractions.rows.forEach((record, index) => {
      console.log(`   ${index + 1}. hotel_id: ${record.hotel_id}, status: ${record.status}`);
    });

  } catch (error) {
    console.error('❌ ERRO:', error.message);
    console.error('   Code:', error.code);
  } finally {
    await client.end();
    console.log('\n🔌 Conexão fechada');
  }
}

checkHotelsTable().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});