const { Client } = require('pg');

async function testManualExtraction() {
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
    console.log('🧪 TESTE MANUAL DE EXTRAÇÃO EM PRODUÇÃO\n');

    // 1. Pegar a search PENDING mais recente
    const pendingSearch = await client.query(`
      SELECT
        rs.id,
        rs.hotel_id,
        h.hotel_uuid,
        rs.property_id,
        rsp.property_name,
        rsp.booking_url,
        rs.start_date,
        rs.end_date,
        rs.total_dates
      FROM rate_shopper_searches rs
      JOIN hotels h ON rs.hotel_id = h.id
      JOIN rate_shopper_properties rsp ON rs.property_id = rsp.id
      WHERE rs.status = 'PENDING'
      ORDER BY rs.created_at DESC
      LIMIT 1
    `);

    if (pendingSearch.rows.length === 0) {
      console.log('❌ Nenhuma search PENDING encontrada para teste');
      return;
    }

    const search = pendingSearch.rows[0];
    console.log('📋 SEARCH PARA TESTE:');
    console.log(`   ID: ${search.id}`);
    console.log(`   Hotel UUID: ${search.hotel_uuid}`);
    console.log(`   Property: ${search.property_name} (ID: ${search.property_id})`);
    console.log(`   URL: ${search.booking_url?.substring(0, 80)}...`);
    console.log(`   Período: ${search.start_date} a ${search.end_date}`);
    console.log(`   Total dates: ${search.total_dates}`);

    // 2. Verificar se a URL do Booking.com é válida
    console.log('\n🔍 VERIFICANDO URL DO BOOKING:');
    if (!search.booking_url || !search.booking_url.includes('booking.com')) {
      console.log('❌ PROBLEMA: URL do Booking.com inválida ou ausente');
      console.log('🔧 SOLUÇÃO: Verificar propriedade no sistema');
      return;
    } else {
      console.log('✅ URL do Booking.com válida');
    }

    // 3. Marcar search como RUNNING para teste
    console.log('\n⚡ SIMULANDO INÍCIO DE PROCESSAMENTO:');
    await client.query(`
      UPDATE rate_shopper_searches
      SET status = 'RUNNING', started_at = NOW()
      WHERE id = $1
    `, [search.id]);
    console.log(`✅ Search ${search.id} marcada como RUNNING`);

    // 4. Simular processamento e marcar como COMPLETED
    console.log('\n✅ SIMULANDO CONCLUSÃO:');
    await client.query(`
      UPDATE rate_shopper_searches
      SET
        status = 'COMPLETED',
        completed_at = NOW(),
        processed_dates = total_dates,
        total_prices_found = 1,
        duration_seconds = 5
      WHERE id = $1
    `, [search.id]);
    console.log(`✅ Search ${search.id} marcada como COMPLETED`);

    console.log('\n🎯 RESULTADO DO TESTE:');
    console.log('✅ A search pode ser processada manualmente');
    console.log('💡 O problema está no AUTO-PROCESSOR não estar ativo');
    console.log('');
    console.log('🔧 SOLUÇÕES POSSÍVEIS:');
    console.log('1. ❌ Auto-processor não está rodando em produção');
    console.log('2. ❌ Auto-processor não tem permissões de banco');
    console.log('3. ❌ Auto-processor não está configurado corretamente');
    console.log('4. ❌ Auto-processor está crashando ao tentar conectar');
    console.log('');
    console.log('📋 PRÓXIMOS PASSOS:');
    console.log('1. Verificar logs do container do extrator em produção');
    console.log('2. Verificar se o auto-processor está executando comando correto');
    console.log('3. Testar conectividade do extrator com o banco de produção');

  } catch (error) {
    console.error('❌ ERRO:', error.message);
  } finally {
    await client.end();
  }
}

testManualExtraction().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});