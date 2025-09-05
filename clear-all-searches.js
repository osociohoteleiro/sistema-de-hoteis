const db = require('./api/config/database');

async function clearAllSearches() {
  try {
    console.log('🧹 LIMPANDO TODAS AS BUSCAS DO SISTEMA...');
    console.log('⚠️  ATENÇÃO: Isso removerá TODAS as buscas e preços!');
    
    // 1. Remover TODOS os preços
    console.log('\n🗑️ Removendo TODOS os preços...');
    
    const pricesResult = await db.query(`
      DELETE FROM rate_shopper_prices 
      WHERE search_id IN (
        SELECT id FROM rate_shopper_searches WHERE hotel_id = 2
      )
    `);
    
    console.log(`🗑️ ${pricesResult.rowCount || 0} preços removidos`);
    
    // 2. Remover TODAS as buscas
    console.log('🗑️ Removendo TODAS as buscas...');
    
    const searchesResult = await db.query(`
      DELETE FROM rate_shopper_searches 
      WHERE hotel_id = 2
    `);
    
    console.log(`🗑️ ${searchesResult.rowCount || 0} buscas removidas`);
    
    // 3. Verificar se está tudo limpo
    console.log('\n🔍 Verificando limpeza...');
    
    const remainingSearches = await db.query(`
      SELECT COUNT(*) as count
      FROM rate_shopper_searches 
      WHERE hotel_id = 2
    `);
    
    const remainingPrices = await db.query(`
      SELECT COUNT(*) as count
      FROM rate_shopper_prices rsp
      WHERE EXISTS (
        SELECT 1 FROM rate_shopper_searches rs 
        WHERE rs.id = rsp.search_id AND rs.hotel_id = 2
      )
    `);
    
    console.log(`📊 Buscas restantes: ${remainingSearches.rows[0].count}`);
    console.log(`📊 Preços restantes: ${remainingPrices.rows[0].count}`);
    
    if (remainingSearches.rows[0].count == 0 && remainingPrices.rows[0].count == 0) {
      console.log('\n✅ SISTEMA COMPLETAMENTE LIMPO!');
      console.log('🎯 Pronto para testar do zero');
      
      // Mostrar propriedades disponíveis para teste
      console.log('\n🏨 Propriedades disponíveis para criar novas buscas:');
      const properties = await db.query(`
        SELECT id, property_name, booking_url, active
        FROM rate_shopper_properties 
        WHERE hotel_id = 2 AND active = true
        ORDER BY id ASC
      `);
      
      if (properties.rows.length > 0) {
        properties.rows.forEach((prop, i) => {
          console.log(`${i+1}. ID: ${prop.id} - ${prop.property_name}`);
          console.log(`   URL: ${prop.booking_url}`);
        });
      } else {
        console.log('❌ Nenhuma propriedade ativa encontrada');
      }
      
    } else {
      console.log('\n⚠️ Ainda restam dados no sistema!');
    }
    
    console.log('\n🎉 Limpeza concluída!');
    console.log('💡 Acesse http://localhost:5173/rate-shopper para criar novas buscas');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

clearAllSearches();