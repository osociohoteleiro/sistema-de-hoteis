const { Client } = require('pg');

async function checkProductionAutoProcessor() {
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
    console.log('🔍 VERIFICANDO AUTO-PROCESSOR EM PRODUÇÃO\n');

    // 1. Verificar se há searches PENDING aguardando processamento
    console.log('📋 1. VERIFICANDO SEARCHES PENDING:');
    const pendingSearches = await client.query(`
      SELECT
        rs.id,
        rs.hotel_id,
        h.name as hotel_name,
        h.hotel_uuid,
        rs.property_id,
        rsp.property_name,
        rs.start_date,
        rs.end_date,
        rs.status,
        rs.created_at,
        EXTRACT(EPOCH FROM (NOW() - rs.created_at))/60 as minutes_waiting
      FROM rate_shopper_searches rs
      JOIN hotels h ON rs.hotel_id = h.id
      LEFT JOIN rate_shopper_properties rsp ON rs.property_id = rsp.id
      WHERE rs.status = 'PENDING'
      ORDER BY rs.created_at DESC
    `);

    if (pendingSearches.rows.length > 0) {
      console.log(`   ✅ ${pendingSearches.rows.length} searches PENDING encontradas:`);
      pendingSearches.rows.forEach((search, index) => {
        console.log(`   ${index + 1}. Search ${search.id} - ${search.hotel_name} (${search.property_name})`);
        console.log(`      Status: ${search.status}, Aguardando: ${Math.round(search.minutes_waiting)} minutos`);
        console.log(`      Hotel UUID: ${search.hotel_uuid}`);
        console.log('');
      });
    } else {
      console.log('   ❌ Nenhuma search PENDING encontrada');
    }

    // 2. Verificar extrações ativas
    console.log('🔄 2. VERIFICANDO EXTRAÇÕES ATIVAS:');
    const activeExtractions = await client.query(`
      SELECT
        hotel_uuid,
        status,
        created_at,
        EXTRACT(EPOCH FROM (NOW() - created_at))/60 as minutes_running
      FROM active_extractions
      WHERE status = 'RUNNING'
      ORDER BY created_at DESC
    `);

    if (activeExtractions.rows.length > 0) {
      console.log(`   🔄 ${activeExtractions.rows.length} extrações ativas:`);
      activeExtractions.rows.forEach((extraction, index) => {
        console.log(`   ${index + 1}. Hotel UUID: ${extraction.hotel_uuid}`);
        console.log(`      Status: ${extraction.status}`);
        console.log(`      Rodando há: ${Math.round(extraction.minutes_running)} minutos`);
        console.log('');
      });
    } else {
      console.log('   ✅ Nenhuma extração ativa (normal se auto-processor não estiver rodando)');
    }

    // 3. Verificar searches RUNNING (sendo processadas)
    console.log('⚡ 3. VERIFICANDO SEARCHES RUNNING:');
    const runningSearches = await client.query(`
      SELECT
        rs.id,
        h.name as hotel_name,
        h.hotel_uuid,
        rs.status,
        rs.started_at,
        rs.processed_dates,
        rs.total_dates,
        EXTRACT(EPOCH FROM (NOW() - rs.started_at))/60 as minutes_running
      FROM rate_shopper_searches rs
      JOIN hotels h ON rs.hotel_id = h.id
      WHERE rs.status = 'RUNNING'
      ORDER BY rs.started_at DESC
    `);

    if (runningSearches.rows.length > 0) {
      console.log(`   ⚡ ${runningSearches.rows.length} searches RUNNING:`);
      runningSearches.rows.forEach((search, index) => {
        console.log(`   ${index + 1}. Search ${search.id} - ${search.hotel_name}`);
        console.log(`      Progresso: ${search.processed_dates}/${search.total_dates} datas`);
        console.log(`      Rodando há: ${Math.round(search.minutes_running)} minutos`);
        console.log('');
      });
    } else {
      console.log('   ✅ Nenhuma search RUNNING (auto-processor pode não estar ativo)');
    }

    // 4. Verificar últimas searches COMPLETED para ver se o sistema está processando
    console.log('✅ 4. VERIFICANDO ÚLTIMAS SEARCHES COMPLETED:');
    const recentCompleted = await client.query(`
      SELECT
        rs.id,
        h.name as hotel_name,
        rs.status,
        rs.completed_at,
        rs.duration_seconds,
        rs.total_prices_found,
        EXTRACT(EPOCH FROM (NOW() - rs.completed_at))/60 as minutes_ago
      FROM rate_shopper_searches rs
      JOIN hotels h ON rs.hotel_id = h.id
      WHERE rs.status = 'COMPLETED'
      ORDER BY rs.completed_at DESC
      LIMIT 5
    `);

    if (recentCompleted.rows.length > 0) {
      console.log(`   📊 Últimas 5 searches COMPLETED:`);
      recentCompleted.rows.forEach((search, index) => {
        console.log(`   ${index + 1}. Search ${search.id} - ${search.hotel_name}`);
        console.log(`      Completada há: ${Math.round(search.minutes_ago)} minutos`);
        console.log(`      Duração: ${search.duration_seconds}s, Preços: ${search.total_prices_found}`);
        console.log('');
      });
    } else {
      console.log('   ❌ Nenhuma search COMPLETED encontrada');
    }

    // 5. Diagnóstico final
    console.log('🎯 5. DIAGNÓSTICO DO AUTO-PROCESSOR:');

    const hasPending = pendingSearches.rows.length > 0;
    const hasRunning = runningSearches.rows.length > 0;
    const hasRecentCompleted = recentCompleted.rows.length > 0 && recentCompleted.rows[0].minutes_ago < 60;

    if (hasPending && !hasRunning) {
      console.log('❌ PROBLEMA: Searches PENDING não estão sendo processadas');
      console.log('💡 CAUSA PROVÁVEL: Auto-processor não está rodando ou não está funcionando');
      console.log('🔧 SOLUÇÕES:');
      console.log('   1. Verificar se o container do extrator está rodando em produção');
      console.log('   2. Verificar logs do auto-processor');
      console.log('   3. Reiniciar o serviço do extrator');
      console.log('   4. Verificar variáveis de ambiente do auto-processor');
    } else if (hasRunning) {
      console.log('✅ OK: Auto-processor está ativo e processando searches');
    } else if (!hasPending && hasRecentCompleted) {
      console.log('✅ OK: Auto-processor funcionando (não há trabalho pendente)');
    } else {
      console.log('⚠️  INCONCLUSIVO: Não há searches suficientes para diagnosticar');
    }

    // 6. Verificar configuração de produção
    console.log('\n🔧 6. INFORMAÇÕES PARA DEBUG:');
    console.log('   Para verificar se o auto-processor está rodando:');
    console.log('   - Verificar containers ativos: docker ps | grep extrator');
    console.log('   - Verificar logs: docker logs <container_id>');
    console.log('   - Verificar processo: ps aux | grep node');
    console.log('   - Testar manualmente: cd extrator-rate-shopper && npm run process-database:saas');

  } catch (error) {
    console.error('❌ ERRO:', error.message);
  } finally {
    await client.end();
  }
}

console.log('🔍 DIAGNÓSTICO DO AUTO-PROCESSOR EM PRODUÇÃO');
console.log('=' * 60);
checkProductionAutoProcessor().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});