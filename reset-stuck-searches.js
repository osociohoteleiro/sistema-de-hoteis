const db = require('./api/config/database');

async function resetStuckSearches() {
  try {
    console.log('🔧 Resetando buscas travadas...');
    
    // Buscar searches travadas (RUNNING por muito tempo)
    console.log('📋 Identificando buscas travadas...');
    
    const stuckSearches = await db.query(`
      SELECT 
        rs.id, rs.uuid, rs.status, rs.created_at, rs.started_at, rs.start_date, rs.end_date,
        rs.processed_dates, rs.total_dates, rsp.property_name
      FROM rate_shopper_searches rs
      LEFT JOIN rate_shopper_properties rsp ON rs.property_id = rsp.id
      WHERE rs.hotel_id = 2 
        AND rs.status = 'RUNNING'
        AND rs.started_at < NOW() - INTERVAL '10 minutes'
      ORDER BY rs.created_at DESC
    `);

    console.log(`\n🎯 Encontradas ${stuckSearches.length} buscas travadas:`);
    
    if (stuckSearches.length === 0) {
      console.log('✅ Nenhuma busca travada encontrada!');
      return;
    }

    // Mostrar as buscas que serão resetadas
    stuckSearches.forEach((search, i) => {
      console.log(`\n${i+1}. ID: ${search.id} | Status: ${search.status}`);
      console.log(`   Propriedade: ${search.property_name || 'N/A'}`);
      console.log(`   Período: ${search.start_date} → ${search.end_date}`);
      console.log(`   Progresso: ${search.processed_dates || 0}/${search.total_dates || 0} datas`);
      console.log(`   Criada: ${new Date(search.created_at).toLocaleString('pt-BR')}`);
      console.log(`   Iniciada: ${search.started_at ? new Date(search.started_at).toLocaleString('pt-BR') : 'N/A'}`);
    });

    // Resetar as buscas para PENDING
    console.log(`\n🔄 Resetando ${stuckSearches.length} buscas para PENDING...`);
    
    const searchIds = stuckSearches.map(s => s.id);
    
    if (searchIds.length > 0) {
      const result = await db.query(`
        UPDATE rate_shopper_searches 
        SET 
          status = 'PENDING',
          started_at = NULL,
          updated_at = NOW()
        WHERE id = ANY($1)
      `, [searchIds]);
      
      console.log(`✅ ${result.rowCount || searchIds.length} buscas resetadas com sucesso!`);
    }

    // Mostrar searches após reset
    console.log('\n📋 Searches após reset:');
    const updatedSearches = await db.query(`
      SELECT 
        rs.id, rs.status, rs.processed_dates, rs.total_dates, rsp.property_name,
        rs.created_at
      FROM rate_shopper_searches rs
      LEFT JOIN rate_shopper_properties rsp ON rs.property_id = rsp.id
      WHERE rs.hotel_id = 2
      ORDER BY rs.created_at DESC
    `);

    if (updatedSearches.length === 0) {
      console.log('❌ Nenhuma busca encontrada');
    } else {
      updatedSearches.forEach((search, i) => {
        const status = search.status === 'COMPLETED' ? '✅' : 
                      search.status === 'RUNNING' ? '🔄' : 
                      search.status === 'PENDING' ? '⏳' : '❌';
        console.log(`${i+1}. ${status} ID: ${search.id} | ${search.property_name} | ${search.processed_dates || 0}/${search.total_dates || 0} datas`);
      });
    }

    console.log('\n🎉 Reset concluído!');
    console.log('💡 Agora execute: npm run process-database');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

resetStuckSearches();