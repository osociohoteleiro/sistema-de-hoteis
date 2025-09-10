// Script para verificar foreign keys e relacionamentos
const { Pool } = require('pg');

const productionConfig = {
  host: 'ep.osociohoteleiro.com.br',
  port: 5432,
  user: 'postgres',
  password: 'OSH4040()Xx!..nn',
  database: 'osh_hotels',
  ssl: false,
  connectionTimeoutMillis: 30000,
  max: 5
};

async function checkForeignKeys() {
  console.log('🔗 VERIFICANDO FOREIGN KEYS E RELACIONAMENTOS\n');
  
  const pool = new Pool(productionConfig);
  
  try {
    // 1. Verificar foreign keys existentes
    console.log('📋 FOREIGN KEYS EXISTENTES:');
    
    const fks = await pool.query(`
      SELECT 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name LIKE 'rate_shopper%'
      ORDER BY tc.table_name, kcu.column_name
    `);
    
    if (fks.rows.length === 0) {
      console.log('   ❌ Nenhuma foreign key encontrada!\n');
    } else {
      fks.rows.forEach(fk => {
        console.log(`   ✅ ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      });
      console.log('');
    }

    // 2. Verificar índices existentes  
    console.log('📊 ÍNDICES EXISTENTES:');
    
    const indexes = await pool.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE tablename LIKE 'rate_shopper%'
      ORDER BY tablename, indexname
    `);
    
    indexes.rows.forEach(idx => {
      console.log(`   • ${idx.tablename}: ${idx.indexname}`);
    });
    console.log('');

    // 3. Verificar integridade dos dados
    console.log('🔍 VERIFICAÇÃO DE INTEGRIDADE:');

    // Verificar se todos os search_id em prices existem em searches
    const orphanPrices = await pool.query(`
      SELECT COUNT(*) as count
      FROM rate_shopper_prices p
      LEFT JOIN rate_shopper_searches s ON p.search_id = s.id
      WHERE s.id IS NULL
    `);
    
    if (parseInt(orphanPrices.rows[0].count) > 0) {
      console.log(`   ❌ ${orphanPrices.rows[0].count} preços órfãos (search_id inexistente)`);
    } else {
      console.log('   ✅ Todos os preços têm search_id válido');
    }

    // Verificar se todos os property_id em searches existem em properties  
    const orphanSearches = await pool.query(`
      SELECT COUNT(*) as count
      FROM rate_shopper_searches s
      LEFT JOIN rate_shopper_properties p ON s.property_id = p.id
      WHERE s.property_id IS NOT NULL AND p.id IS NULL
    `);
    
    if (parseInt(orphanSearches.rows[0].count) > 0) {
      console.log(`   ❌ ${orphanSearches.rows[0].count} buscas órfãs (property_id inexistente)`);
    } else {
      console.log('   ✅ Todas as buscas têm property_id válido');
    }

    // Verificar se todos os hotel_id existem na tabela hotels
    const orphanHotels = await pool.query(`
      SELECT 
        'properties' as table_name,
        COUNT(*) as count
      FROM rate_shopper_properties p
      LEFT JOIN hotels h ON p.hotel_id = h.id
      WHERE h.id IS NULL
      
      UNION ALL
      
      SELECT 
        'searches' as table_name,
        COUNT(*) as count
      FROM rate_shopper_searches s
      LEFT JOIN hotels h ON s.hotel_id = h.id
      WHERE h.id IS NULL
    `);
    
    orphanHotels.rows.forEach(result => {
      if (parseInt(result.count) > 0) {
        console.log(`   ❌ ${result.count} registros em ${result.table_name} com hotel_id inexistente`);
      } else {
        console.log(`   ✅ Todos os registros em ${result.table_name} têm hotel_id válido`);
      }
    });

    console.log('');

    // 4. Verificar dados específicos que podem estar causando problemas na listagem
    console.log('🎯 VERIFICAÇÃO ESPECÍFICA DA LISTAGEM:');

    // Testar query similar à que é usada no dashboard
    const testQuery = await pool.query(`
      SELECT 
        rs.id,
        rs.hotel_id,
        rs.property_id,
        rs.check_in as start_date,
        rs.check_out as end_date,
        rs.search_status as status,
        rs.total_results,
        rs.duration_seconds,
        rs.created_at,
        rsp.property_name,
        rsp.booking_engine as platform
      FROM rate_shopper_searches rs
      LEFT JOIN rate_shopper_properties rsp ON rs.property_id = rsp.id
      ORDER BY rs.created_at DESC
      LIMIT 5
    `);
    
    console.log(`   • Query de dashboard retornou ${testQuery.rows.length} resultados`);
    
    if (testQuery.rows.length > 0) {
      console.log('   • Exemplo de resultado:');
      const sample = testQuery.rows[0];
      console.log(`     - ID: ${sample.id}, Hotel: ${sample.hotel_id}, Property: ${sample.property_name}`);
      console.log(`     - Datas: ${sample.start_date} a ${sample.end_date}`);
      console.log(`     - Status: ${sample.status}, Platform: ${sample.platform}`);
    }

    // Testar query de preços
    const priceQuery = await pool.query(`
      SELECT 
        p.id,
        p.search_id,
        p.hotel_id,
        p.property_id,
        p.check_in,
        p.check_out,
        p.price,
        p.currency,
        p.captured_at,
        prop.property_name
      FROM rate_shopper_prices p
      LEFT JOIN rate_shopper_properties prop ON p.property_id = prop.id
      ORDER BY p.captured_at DESC
      LIMIT 5
    `);
    
    console.log(`   • Query de preços retornou ${priceQuery.rows.length} resultados`);
    
    if (priceQuery.rows.length > 0) {
      console.log('   • Exemplo de preço:');
      const sample = priceQuery.rows[0];
      console.log(`     - ID: ${sample.id}, Property: ${sample.property_name}`);
      console.log(`     - Preço: ${sample.currency} ${sample.price}`);
      console.log(`     - Check-in: ${sample.check_in}, Capturado: ${sample.captured_at}`);
    }

    console.log('\n===== DIAGNÓSTICO FINAL =====');
    
    if (fks.rows.length === 0) {
      console.log('🚨 PROBLEMA CRÍTICO: Nenhuma foreign key definida!');
      console.log('   • Isso pode causar problemas de integridade de dados');
      console.log('   • Recomendação: Aplicar migration que cria as foreign keys');
    } else {
      console.log('✅ Foreign keys estão definidas corretamente');
    }
    
    if (testQuery.rows.length === 0) {
      console.log('🚨 PROBLEMA: Não há dados de busca para mostrar');
    } else if (priceQuery.rows.length === 0) {  
      console.log('🚨 PROBLEMA: Não há dados de preços para mostrar');
    } else {
      console.log('✅ Há dados suficientes para mostrar na interface');
    }
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error.message);
  } finally {
    await pool.end();
  }
}

checkForeignKeys().catch(console.error);