// Script para sincronizar preços do Rate Shopper para produção
const { Pool } = require('pg');

const localConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT) || 5432,
  user: process.env.POSTGRES_USER || 'osh_user',
  password: process.env.POSTGRES_PASSWORD || 'osh_password_2024',
  database: process.env.POSTGRES_DB || 'osh_db',
  max: 10
};

const productionConfig = {
  host: 'ep.osociohoteleiro.com.br',
  port: 5432,
  user: 'postgres',
  password: 'OSH4040()Xx!..nn',
  database: 'osh_hotels',
  ssl: false,
  connectionTimeoutMillis: 10000,
  max: 5
};

async function syncPricesToProduction() {
  console.log('🚀 Iniciando sincronização de preços do Rate Shopper...\n');
  
  const localPool = new Pool(localConfig);
  const prodPool = new Pool(productionConfig);
  
  try {
    console.log('📊 1. Coletando preços do banco local...');
    
    // Buscar preços do hotel Eco Encanto Pousada (hotel_id = 17 local)
    const localPrices = await localPool.query(`
      SELECT 
        rsp.id as local_property_id,
        rsp.property_name,
        rsp.platform,
        rspr.check_in_date,
        rspr.check_out_date,
        rspr.price,
        rspr.currency,
        rspr.room_type,
        rspr.availability_status,
        rspr.scraped_at,
        rspr.search_id
      FROM rate_shopper_prices rspr
      JOIN rate_shopper_properties rsp ON rspr.property_id = rsp.id
      WHERE rsp.hotel_id = 17 
      AND rspr.scraped_at >= NOW() - INTERVAL '30 days'
      ORDER BY rspr.scraped_at DESC
      LIMIT 500
    `);
    
    console.log(`✅ Encontrados ${localPrices.rows.length} preços dos últimos 30 dias`);
    
    // 2. Mapear propriedades local -> produção
    console.log('\n🔗 2. Mapeando propriedades local -> produção...');
    
    const prodProperties = await prodPool.query(`
      SELECT id, property_name, booking_engine 
      FROM rate_shopper_properties 
      WHERE hotel_id = 17
    `);
    
    console.log(`✅ Encontradas ${prodProperties.rows.length} propriedades na produção`);
    
    // Criar mapa de propriedades
    const propertyMap = new Map();
    for (const prodProp of prodProperties.rows) {
      // Mapear por nome da propriedade
      propertyMap.set(prodProp.property_name, prodProp.id);
    }
    
    console.log('🗺️ Mapa de propriedades criado:');
    propertyMap.forEach((prodId, name) => {
      console.log(`   "${name}" -> ID produção: ${prodId}`);
    });
    
    // 3. Filtrar e preparar preços para inserção
    console.log('\n💰 3. Preparando preços para inserção...');
    
    const validPrices = [];
    let skippedCount = 0;
    
    for (const price of localPrices.rows) {
      const prodPropertyId = propertyMap.get(price.property_name);
      
      if (prodPropertyId) {
        validPrices.push({
          property_id: prodPropertyId,
          property_name: price.property_name,
          check_in: price.check_in_date,
          check_out: price.check_out_date,
          price: price.price,
          currency: price.currency || 'BRL',
          room_type: price.room_type,
          availability_status: price.availability_status,
          source_engine: price.platform,
          captured_at: price.scraped_at,
          search_id: price.search_id || 1 // Usar search_id default se não existir
        });
      } else {
        skippedCount++;
      }
    }
    
    console.log(`✅ ${validPrices.length} preços válidos para inserção`);
    console.log(`⚠️ ${skippedCount} preços ignorados (propriedade não encontrada)`);
    
    // 4. Limpar preços existentes na produção
    console.log('\n🗑️ 4. Limpando preços existentes na produção...');
    await prodPool.query('DELETE FROM rate_shopper_prices WHERE hotel_id = 17');
    console.log('✅ Preços existentes removidos');
    
    // 5. Inserir preços na produção
    console.log('\n📊 5. Inserindo preços na produção...');
    
    let insertedCount = 0;
    let errorCount = 0;
    
    // Inserir em lotes de 50
    const batchSize = 50;
    for (let i = 0; i < validPrices.length; i += batchSize) {
      const batch = validPrices.slice(i, i + batchSize);
      
      for (const price of batch) {
        try {
          await prodPool.query(`
            INSERT INTO rate_shopper_prices (
              search_id, hotel_id, property_id, room_type, 
              price, currency, availability_status, 
              source_engine, captured_at, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
          `, [
            price.search_id,
            17, // hotel_id produção
            price.property_id,
            price.room_type,
            price.price,
            price.currency,
            price.availability_status,
            price.source_engine,
            price.captured_at
          ]);
          
          insertedCount++;
          
          if (insertedCount % 100 === 0) {
            console.log(`   📈 Inseridos ${insertedCount}/${validPrices.length} preços...`);
          }
          
        } catch (error) {
          errorCount++;
          if (errorCount <= 3) { // Mostrar apenas os primeiros erros
            console.log(`   ❌ Erro ao inserir preço: ${error.message}`);
          }
        }
      }
    }
    
    // 6. Sincronizar histórico de preços
    console.log('\n📈 6. Sincronizando histórico de preços...');
    
    const localHistory = await localPool.query(`
      SELECT 
        property_id,
        check_in_date,
        current_price,
        previous_price,
        price_change,
        change_percentage,
        change_type,
        currency,
        created_at
      FROM rate_shopper_price_history
      WHERE hotel_id = 17
      ORDER BY created_at DESC
      LIMIT 100
    `);
    
    console.log(`📊 Encontrados ${localHistory.rows.length} registros de histórico`);
    
    // Mapear e inserir histórico
    let historyInserted = 0;
    
    for (const hist of localHistory.rows) {
      // Encontrar propriedade correspondente na produção
      const localProp = await localPool.query(
        'SELECT property_name FROM rate_shopper_properties WHERE id = $1',
        [hist.property_id]
      );
      
      if (localProp.rows.length > 0) {
        const prodPropertyId = propertyMap.get(localProp.rows[0].property_name);
        
        if (prodPropertyId) {
          try {
            await prodPool.query(`
              INSERT INTO rate_shopper_price_history (
                hotel_id, property_id, check_in, check_out, 
                price, currency, price_change_percentage, 
                captured_at, created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            `, [
              17, // hotel_id produção
              prodPropertyId,
              hist.check_in_date,
              hist.check_in_date, // check_out = check_in (adaptação)
              hist.current_price,
              hist.currency || 'BRL',
              hist.change_percentage,
              hist.created_at,
            ]);
            
            historyInserted++;
            
          } catch (error) {
            // Ignorar erros do histórico silenciosamente
          }
        }
      }
    }
    
    // 7. Verificação final
    console.log('\n🔍 7. Verificação final...');
    
    const finalCount = await prodPool.query(`
      SELECT 
        COUNT(*) as total_prices,
        COUNT(DISTINCT property_id) as properties_with_prices,
        MIN(price) as min_price,
        MAX(price) as max_price,
        AVG(price) as avg_price
      FROM rate_shopper_prices 
      WHERE hotel_id = 17
    `);
    
    const finalHist = await prodPool.query(`
      SELECT COUNT(*) as total_history 
      FROM rate_shopper_price_history 
      WHERE hotel_id = 17
    `);
    
    console.log('\n🎉 SINCRONIZAÇÃO DE PREÇOS CONCLUÍDA!');
    console.log('📊 RESUMO:');
    console.log(`   💰 Preços inseridos: ${insertedCount}`);
    console.log(`   📈 Histórico inserido: ${historyInserted}`);
    console.log(`   ❌ Erros: ${errorCount}`);
    console.log(`   🏨 Propriedades com preços: ${finalCount.rows[0].properties_with_prices}`);
    console.log(`   💵 Faixa de preços: R$ ${parseFloat(finalCount.rows[0].min_price || 0).toFixed(2)} - R$ ${parseFloat(finalCount.rows[0].max_price || 0).toFixed(2)}`);
    console.log(`   📊 Preço médio: R$ ${parseFloat(finalCount.rows[0].avg_price || 0).toFixed(2)}`);
    
    console.log('\n🌐 ACESSE: https://pms.osociohoteleiro.com.br/rate-shopper');
    console.log('📈 Os gráficos e dados devem aparecer agora!');
    
  } catch (error) {
    console.error('💥 Erro na sincronização:', error.message);
  } finally {
    await localPool.end();
    await prodPool.end();
  }
}

syncPricesToProduction().catch(console.error);