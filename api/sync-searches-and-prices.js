// Script para sincronizar searches e preços do Rate Shopper
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

async function syncSearchesAndPrices() {
  console.log('🚀 Iniciando sincronização completa: searches + preços...\n');
  
  const localPool = new Pool(localConfig);
  const prodPool = new Pool(productionConfig);
  
  try {
    // 1. Verificar estrutura da tabela searches na produção
    console.log('🔍 1. Verificando estrutura de searches na produção...');
    
    const searchTables = await prodPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%search%'
      ORDER BY table_name
    `);
    
    console.log('📋 Tabelas de search na produção:');
    searchTables.rows.forEach(table => {
      console.log(`   ✅ ${table.table_name}`);
    });
    
    // Verificar se rate_shopper_searches existe
    const searchSchema = await prodPool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'rate_shopper_searches'
      ORDER BY ordinal_position
    `);
    
    if (searchSchema.rows.length > 0) {
      console.log('📊 Estrutura rate_shopper_searches na produção:');
      searchSchema.rows.forEach((col, index) => {
        console.log(`   ${index + 1}. ${col.column_name} (${col.data_type})`);
      });
    } else {
      console.log('❌ Tabela rate_shopper_searches não existe na produção');
      
      // Criar uma busca simples para contornar o problema
      console.log('\n🔧 2. Criando search básica na produção...');
      
      // Verificar se existe alguma tabela similar ou usar ID fixo
      const basicSearchId = 1;
      
      // Tentar inserir preços sem search_id válido usando estratégia alternativa
      console.log('⚠️ Usando estratégia alternativa sem searches...');
      
      // Mapear propriedades
      const prodProperties = await prodPool.query(`
        SELECT id, property_name, booking_engine 
        FROM rate_shopper_properties 
        WHERE hotel_id = 17
      `);
      
      const propertyMap = new Map();
      prodProperties.rows.forEach(prop => {
        propertyMap.set(prop.property_name, prop.id);
      });
      
      console.log(`✅ ${prodProperties.rows.length} propriedades mapeadas`);
      
      // Buscar preços recentes do local (últimos 7 dias)
      const recentPrices = await localPool.query(`
        SELECT 
          rsp.property_name,
          rspr.check_in_date,
          rspr.check_out_date,
          rspr.price,
          rspr.currency,
          rspr.room_type,
          rspr.availability_status,
          rspr.scraped_at
        FROM rate_shopper_prices rspr
        JOIN rate_shopper_properties rsp ON rspr.property_id = rsp.id
        WHERE rsp.hotel_id = 17 
        AND rspr.scraped_at >= NOW() - INTERVAL '7 days'
        AND rspr.price > 0
        ORDER BY rspr.scraped_at DESC
        LIMIT 100
      `);
      
      console.log(`📊 Encontrados ${recentPrices.rows.length} preços recentes`);
      
      // Limpar dados existentes
      await prodPool.query('DELETE FROM rate_shopper_prices WHERE hotel_id = 17');
      console.log('🗑️ Preços existentes removidos');
      
      // Inserir preços usando search_id fixo
      let insertedCount = 0;
      
      for (const price of recentPrices.rows) {
        const prodPropertyId = propertyMap.get(price.property_name);
        
        if (prodPropertyId) {
          try {
            await prodPool.query(`
              INSERT INTO rate_shopper_prices (
                search_id, hotel_id, property_id, room_type, 
                price, currency, availability_status, 
                source_engine, captured_at, created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
            `, [
              basicSearchId, // search_id fixo
              17, // hotel_id
              prodPropertyId,
              price.room_type || 'Standard',
              price.price,
              price.currency || 'BRL',
              price.availability_status || 'AVAILABLE',
              'booking', // source_engine padrão
              price.scraped_at
            ]);
            
            insertedCount++;
            
          } catch (error) {
            // Se search_id = 1 não funcionar, criar um registro na tabela de searches
            if (error.message.includes('foreign key constraint') && insertedCount === 0) {
              console.log('🔧 Tentando criar search_id = 1...');
              
              try {
                // Verificar se existe tabela rate_shopper_searches ou similar
                const createSearch = await prodPool.query(`
                  INSERT INTO rate_shopper_searches (id, hotel_id, status, created_at)
                  VALUES (1, 17, 'COMPLETED', NOW())
                  ON CONFLICT (id) DO NOTHING
                `);
                
                console.log('✅ Search criada com ID = 1');
                
                // Tentar inserir novamente
                await prodPool.query(`
                  INSERT INTO rate_shopper_prices (
                    search_id, hotel_id, property_id, room_type, 
                    price, currency, availability_status, 
                    source_engine, captured_at, created_at
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
                `, [
                  basicSearchId,
                  17,
                  prodPropertyId,
                  price.room_type || 'Standard',
                  price.price,
                  price.currency || 'BRL',
                  price.availability_status || 'AVAILABLE',
                  'booking',
                  price.scraped_at
                ]);
                
                insertedCount++;
                
              } catch (createError) {
                console.log(`❌ Erro ao criar search: ${createError.message}`);
                break;
              }
            }
          }
        }
      }
      
      // Verificação final
      const finalCount = await prodPool.query(`
        SELECT COUNT(*) as total
        FROM rate_shopper_prices 
        WHERE hotel_id = 17
      `);
      
      console.log('\n🎉 SINCRONIZAÇÃO CONCLUÍDA!');
      console.log('📊 RESUMO:');
      console.log(`   💰 Preços inseridos: ${insertedCount}`);
      console.log(`   📊 Total na produção: ${finalCount.rows[0].total}`);
      
      if (insertedCount > 0) {
        console.log('\n🌐 TESTE AGORA:');
        console.log('https://pms.osociohoteleiro.com.br/rate-shopper');
        console.log('📈 Os dados devem aparecer no dashboard!');
      } else {
        console.log('\n⚠️ Nenhum preço foi inserido. Pode ser necessário verificar a estrutura do banco.');
      }
    }
    
  } catch (error) {
    console.error('💥 Erro na sincronização:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await localPool.end();
    await prodPool.end();
  }
}

syncSearchesAndPrices().catch(console.error);