const db = require('./api/config/database');

async function forceRemoveSearches() {
  try {
    console.log('🗑️ FORÇANDO remoção das buscas 1 e 2...');
    
    // Primeiro, remover todos os preços relacionados às buscas 1 e 2
    console.log('🗑️ Removendo preços das buscas 1 e 2...');
    
    const pricesResult = await db.query(`
      DELETE FROM rate_shopper_prices 
      WHERE search_id IN (1, 2)
    `);
    
    console.log(`🗑️ ${pricesResult.rowCount || 0} preços removidos`);
    
    // Agora remover as buscas
    console.log('🗑️ Removendo as buscas 1 e 2...');
    
    const searchesResult = await db.query(`
      DELETE FROM rate_shopper_searches 
      WHERE id IN (1, 2) AND hotel_id = 2
    `);
    
    console.log(`🗑️ ${searchesResult.rowCount || 0} buscas removidas`);
    
    // Verificar o que sobrou
    console.log('\n📋 Verificando searches restantes:');
    const remainingSearches = await db.query(`
      SELECT 
        rs.id, rs.status, rs.total_prices_found, rsp.property_name,
        rs.created_at, rs.start_date, rs.end_date
      FROM rate_shopper_searches rs
      LEFT JOIN rate_shopper_properties rsp ON rs.property_id = rsp.id
      WHERE rs.hotel_id = 2
      ORDER BY rs.id ASC
    `);

    console.log(`\n✅ ${remainingSearches.length} buscas restantes:`);
    
    if (remainingSearches.length === 0) {
      console.log('❌ Nenhuma busca restante');
    } else {
      remainingSearches.forEach((search, i) => {
        const status = search.status === 'COMPLETED' ? '✅' : 
                      search.status === 'RUNNING' ? '🔄' : 
                      search.status === 'PENDING' ? '⏳' : '❌';
        const createdAt = search.created_at ? 
          new Date(search.created_at).toLocaleDateString('pt-BR') : 
          'Data inválida';
        const startDate = search.start_date ? 
          new Date(search.start_date).toLocaleDateString('pt-BR') : 
          'Data inválida';
        const endDate = search.end_date ? 
          new Date(search.end_date).toLocaleDateString('pt-BR') : 
          'Data inválida';
          
        console.log(`\n${i+1}. ${status} ID: ${search.id}`);
        console.log(`   Propriedade: ${search.property_name}`);
        console.log(`   Período: ${startDate} → ${endDate}`);
        console.log(`   Preços: ${search.total_prices_found || 0}`);
        console.log(`   Criada: ${createdAt}`);
      });
    }

    // Verificar preços restantes
    console.log('\n💰 Verificando preços restantes:');
    const remainingPrices = await db.query(`
      SELECT search_id, COUNT(*) as count
      FROM rate_shopper_prices rsp
      WHERE EXISTS (
        SELECT 1 FROM rate_shopper_searches rs 
        WHERE rs.id = rsp.search_id AND rs.hotel_id = 2
      )
      GROUP BY search_id
      ORDER BY search_id ASC
    `);

    if (remainingPrices.length === 0) {
      console.log('❌ Nenhum preço restante');
    } else {
      remainingPrices.forEach((price, i) => {
        console.log(`${i+1}. Search ID: ${price.search_id} - ${price.count} preços`);
      });
    }

    console.log('\n🎉 Limpeza forçada concluída!');
    console.log('💡 Agora o frontend deve mostrar apenas as buscas válidas');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

forceRemoveSearches();