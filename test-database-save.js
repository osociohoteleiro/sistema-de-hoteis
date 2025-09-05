const { extract_prices_from_booking } = require('./extrator-rate-shopper/src/booking-extractor-optimized');
const DatabaseIntegration = require('./extrator-rate-shopper/src/database-integration');
const path = require('path');

async function testDatabaseSave() {
  let db = null;
  
  try {
    console.log('🎯 TESTE: Extração com salvamento DIRETO NO BANCO');
    console.log('================================================');
    
    // 1. Conectar ao banco
    console.log('🔄 Conectando ao banco de dados...');
    db = new DatabaseIntegration();
    await db.connect();
    console.log('✅ Conectado ao PostgreSQL');
    
    // 2. Criar propriedade de teste (se não existir)
    console.log('🏨 Criando/verificando propriedade...');
    await db.pool.query(`
      INSERT INTO rate_shopper_properties (
        id, hotel_id, property_name, booking_url, active, max_bundle_size
      ) VALUES (99, 2, 'COPACABANA PALACE (TESTE)', 'https://www.booking.com/hotel/br/copacabana-palace.pt-br.html', 
                true, 3)
      ON CONFLICT (id) DO UPDATE SET 
        property_name = EXCLUDED.property_name,
        booking_url = EXCLUDED.booking_url
    `);
    
    // 3. Criar busca de teste
    console.log('📅 Criando busca de teste...');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 14); // +2 semanas
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 2); // +2 dias
    
    const searchResult = await db.pool.query(`
      INSERT INTO rate_shopper_searches (
        id, hotel_id, property_id, search_type, start_date, end_date, 
        status, total_dates, uuid, created_at
      ) VALUES (9999, 2, 99, 'MANUAL', $1, $2, 'RUNNING', 3, gen_random_uuid(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        start_date = EXCLUDED.start_date,
        end_date = EXCLUDED.end_date,
        status = 'RUNNING',
        updated_at = NOW()
      RETURNING *
    `, [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]);
    
    const search = searchResult.rows[0];
    console.log(`✅ Busca: ID ${search.id}, UUID: ${search.uuid}`);
    
    // 4. Executar extração com BANCO
    console.log('\\n🚀 INICIANDO EXTRAÇÃO COM SAVE NO BANCO:');
    console.log(`🏨 Hotel: Copacabana Palace`);
    console.log(`📅 Check-in: ${startDate.toLocaleDateString('pt-BR')}`);
    console.log(`📅 Check-out: ${endDate.toLocaleDateString('pt-BR')}`);
    console.log(`🆔 Search ID: ${search.id}`);
    console.log(`🏷️  Property ID: 99`);
    console.log('');
    
    // Arquivo de backup (fallback)
    const resultsFile = path.join(__dirname, 'extrator-rate-shopper', 'results', 'extracted-data', 'csv', 'test-database-save.csv');
    
    // EXECUÇÃO COM BANCO!
    await extract_prices_from_booking(
      'https://www.booking.com/hotel/br/copacabana-palace.pt-br.html',
      startDate,
      endDate,
      3, // bundle size
      resultsFile,
      db, // CONEXÃO DO BANCO ✅
      search.id, // SEARCH ID ✅
      99 // PROPERTY ID ✅
    );
    
    // 5. Verificar se salvou no banco
    console.log('\\n🔍 VERIFICANDO PREÇOS NO BANCO:');
    console.log('===============================');
    
    const savedPrices = await db.pool.query(`
      SELECT check_in_date, check_out_date, price, room_type, currency, 
             is_bundle, bundle_size, scraped_at
      FROM rate_shopper_prices 
      WHERE search_id = $1 
      ORDER BY scraped_at DESC
    `, [search.id]);
    
    console.log(`💰 PREÇOS NO BANCO: ${savedPrices.rows.length}`);
    
    if (savedPrices.rows.length > 0) {
      console.log('\\n🎉 SUCESSO! PREÇOS SALVOS DIRETAMENTE NO BANCO:');
      console.log('===============================================');
      
      savedPrices.rows.forEach((price, i) => {
        console.log(`\\n💰 PREÇO ${i + 1}:`);
        console.log(`   📅 Data: ${price.check_in_date} → ${price.check_out_date}`);
        console.log(`   💵 Preço: R$ ${parseFloat(price.price).toFixed(2).replace('.', ',')}`);
        console.log(`   🏠 Tipo: ${price.room_type}`);
        console.log(`   💱 Moeda: ${price.currency}`);
        console.log(`   📦 Bundle: ${price.is_bundle ? price.bundle_size + ' dias' : 'Não'}`);
        console.log(`   🕐 Extraído: ${new Date(price.scraped_at).toLocaleString('pt-BR')}`);
      });
      
      console.log('\\n✅ SISTEMA FUNCIONANDO PERFEITAMENTE!');
      console.log('🔥 Preços extraídos da Booking.com e salvos DIRETAMENTE no PostgreSQL!');
      
    } else {
      console.log('\\n❌ Nenhum preço foi salvo no banco');
      
      // Verificar se salvou no CSV (fallback)
      const fs = require('fs');
      if (fs.existsSync(resultsFile)) {
        const csvContent = fs.readFileSync(resultsFile, 'utf8');
        console.log('\\n📄 Conteúdo CSV (fallback):');
        console.log(csvContent);
      }
    }
    
    // 6. Atualizar status da busca
    await db.pool.query(`
      UPDATE rate_shopper_searches 
      SET status = 'COMPLETED', completed_at = NOW(), 
          total_prices_found = $1
      WHERE id = $2
    `, [savedPrices.rows.length, search.id]);
    
    console.log(`\\n📊 Busca ${search.id} marcada como COMPLETED`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error.stack);
  } finally {
    if (db) {
      await db.close();
    }
  }
}

testDatabaseSave();