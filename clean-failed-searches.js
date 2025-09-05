const db = require('./api/config/database');

async function cleanFailedSearches() {
  try {
    console.log('🧹 Limpando buscas mal sucedidas...');
    
    // Listar searches mal sucedidas (FAILED ou sem preços)
    console.log('📋 Identificando buscas mal sucedidas...');
    
    const failedSearches = await db.query(`
      SELECT 
        rs.id, rs.uuid, rs.status, rs.created_at, rs.start_date, rs.end_date,
        rs.total_prices_found, rsp.property_name
      FROM rate_shopper_searches rs
      LEFT JOIN rate_shopper_properties rsp ON rs.property_id = rsp.id
      WHERE rs.hotel_id = 2 
        AND (rs.status = 'FAILED' OR rs.total_prices_found = 0 OR rs.total_prices_found IS NULL)
        AND rs.id != 9999
      ORDER BY rs.created_at DESC
    `);

    console.log(`\n🎯 Encontradas ${failedSearches.length} buscas mal sucedidas:`);
    
    if (failedSearches.length === 0) {
      console.log('✅ Nenhuma busca mal sucedida encontrada!');
      return;
    }

    // Mostrar as buscas que serão excluídas
    failedSearches.forEach((search, i) => {
      console.log(`\n${i+1}. ID: ${search.id} | Status: ${search.status}`);
      console.log(`   Propriedade: ${search.property_name || 'N/A'}`);
      console.log(`   Período: ${search.start_date} → ${search.end_date}`);
      console.log(`   Preços: ${search.total_prices_found || 0}`);
      console.log(`   Criada: ${new Date(search.created_at).toLocaleString('pt-BR')}`);
    });

    // Excluir as buscas mal sucedidas
    console.log(`\n🗑️  Excluindo ${failedSearches.length} buscas mal sucedidas...`);
    
    const searchIds = failedSearches.map(s => s.id);
    
    if (searchIds.length > 0) {
      // Excluir preços relacionados primeiro (se houver)
      await db.query(`
        DELETE FROM rate_shopper_prices 
        WHERE search_id = ANY($1)
      `, [searchIds]);
      
      // Excluir as searches
      const result = await db.query(`
        DELETE FROM rate_shopper_searches 
        WHERE id = ANY($1)
      `, [searchIds]);
      
      console.log(`✅ ${result.rowCount || searchIds.length} buscas excluídas com sucesso!`);
    }

    // Mostrar searches restantes
    console.log('\n📋 Searches restantes:');
    const remainingSearches = await db.query(`
      SELECT 
        rs.id, rs.status, rs.total_prices_found, rsp.property_name,
        rs.created_at
      FROM rate_shopper_searches rs
      LEFT JOIN rate_shopper_properties rsp ON rs.property_id = rsp.id
      WHERE rs.hotel_id = 2
      ORDER BY rs.created_at DESC
    `);

    if (remainingSearches.length === 0) {
      console.log('❌ Nenhuma busca restante');
    } else {
      remainingSearches.forEach((search, i) => {
        const status = search.status === 'COMPLETED' ? '✅' : 
                      search.status === 'RUNNING' ? '🔄' : 
                      search.status === 'PENDING' ? '⏳' : '❌';
        console.log(`${i+1}. ${status} ID: ${search.id} | ${search.property_name} | ${search.total_prices_found || 0} preços`);
      });
    }

    console.log('\n🎉 Limpeza concluída!');
    console.log('💡 O frontend agora deve mostrar apenas buscas válidas');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

cleanFailedSearches();