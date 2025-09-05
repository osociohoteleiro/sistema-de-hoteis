const db = require('./api/config/database');

async function removeInvalidSearches() {
  try {
    console.log('🗑️ Removendo buscas com dados inválidos...');
    
    // Buscar searches específicas (IDs 1 e 2) que foram mencionadas
    console.log('📋 Identificando buscas com dados inválidos (IDs 1 e 2)...');
    
    const invalidSearches = await db.query(`
      SELECT 
        rs.id, rs.uuid, rs.status, rs.created_at, rs.start_date, rs.end_date,
        rs.total_prices_found, rsp.property_name
      FROM rate_shopper_searches rs
      LEFT JOIN rate_shopper_properties rsp ON rs.property_id = rsp.id
      WHERE rs.hotel_id = 2 
        AND rs.id IN (1, 2)
      ORDER BY rs.created_at DESC
    `);

    console.log(`\n🎯 Encontradas ${invalidSearches.length} buscas para remoção:`);
    
    if (invalidSearches.length === 0) {
      console.log('✅ Nenhuma busca encontrada com IDs 1 ou 2!');
      return;
    }

    // Mostrar as buscas que serão excluídas
    invalidSearches.forEach((search, i) => {
      console.log(`\n${i+1}. ID: ${search.id} | Status: ${search.status}`);
      console.log(`   Propriedade: ${search.property_name || 'N/A'}`);
      console.log(`   Período: ${search.start_date} → ${search.end_date}`);
      console.log(`   Preços: ${search.total_prices_found || 0}`);
      console.log(`   Criada: ${search.created_at ? new Date(search.created_at).toLocaleString('pt-BR') : 'Data inválida'}`);
    });

    // Excluir as buscas
    console.log(`\n🗑️ Excluindo ${invalidSearches.length} buscas inválidas...`);
    
    const searchIds = invalidSearches.map(s => s.id);
    
    if (searchIds.length > 0) {
      // Excluir preços relacionados primeiro
      const pricesResult = await db.query(`
        DELETE FROM rate_shopper_prices 
        WHERE search_id = ANY($1)
      `, [searchIds]);
      
      console.log(`🗑️ ${pricesResult.rowCount || 0} preços relacionados removidos`);
      
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
        const createdAt = search.created_at ? 
          new Date(search.created_at).toLocaleString('pt-BR') : 
          'Data inválida';
        console.log(`${i+1}. ${status} ID: ${search.id} | ${search.property_name} | ${search.total_prices_found || 0} preços | ${createdAt}`);
      });
    }

    console.log('\n🎉 Remoção concluída!');
    console.log('💡 O frontend agora deve mostrar apenas buscas válidas');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

removeInvalidSearches();