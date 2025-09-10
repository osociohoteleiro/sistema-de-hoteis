// Script para testar as APIs do Rate Shopper que podem estar com problemas
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

async function testRateShopperAPI() {
  console.log('🧪 TESTANDO APIs DO RATE SHOPPER\n');
  
  const pool = new Pool(productionConfig);
  
  try {
    // 1. Listar hotéis disponíveis para teste
    console.log('🏨 HOTÉIS DISPONÍVEIS:');
    
    const hotels = await pool.query(`
      SELECT DISTINCT 
        h.id, 
        h.name,
        COUNT(rsp.id) as properties_count,
        COUNT(rs.id) as searches_count
      FROM hotels h
      LEFT JOIN rate_shopper_properties rsp ON h.id = rsp.hotel_id
      LEFT JOIN rate_shopper_searches rs ON h.id = rs.hotel_id
      WHERE rsp.id IS NOT NULL OR rs.id IS NOT NULL
      GROUP BY h.id, h.name
      ORDER BY searches_count DESC
    `);
    
    if (hotels.rows.length === 0) {
      console.log('   ❌ Nenhum hotel com dados Rate Shopper encontrado!');
      return;
    }
    
    hotels.rows.forEach(hotel => {
      console.log(`   • ${hotel.name} (ID: ${hotel.id})`);
      console.log(`     - ${hotel.properties_count} propriedades, ${hotel.searches_count} buscas`);
    });
    
    // Usar o primeiro hotel para testes
    const testHotel = hotels.rows[0];
    console.log(`\n🎯 TESTANDO COM HOTEL: ${testHotel.name} (ID: ${testHotel.id})\n`);

    // 2. Testar query do dashboard (similar ao que está na rota)
    console.log('📊 TESTE: Dashboard Query');
    
    const dashboardQuery = `
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
        rs.updated_at,
        rsp.property_name,
        rsp.booking_engine as platform
      FROM rate_shopper_searches rs
      LEFT JOIN rate_shopper_properties rsp ON rs.property_id = rsp.id
      WHERE rs.hotel_id = $1
      ORDER BY rs.created_at DESC
      LIMIT 10
    `;
    
    const dashboardResult = await pool.query(dashboardQuery, [testHotel.id]);
    console.log(`   ✅ Retornou ${dashboardResult.rows.length} buscas recentes`);
    
    if (dashboardResult.rows.length > 0) {
      const sample = dashboardResult.rows[0];
      console.log(`   • Exemplo: Busca ${sample.id} - ${sample.property_name}`);
      console.log(`     Status: ${sample.status}, Platform: ${sample.platform}`);
      console.log(`     Período: ${sample.start_date} a ${sample.end_date}`);
    }

    // 3. Testar query de análise de preços
    console.log('\n💰 TESTE: Price Analysis Query');
    
    const priceAnalysisQuery = `
      SELECT 
        DATE(rsp.check_in) as date,
        COUNT(*) as total_prices,
        AVG(rsp.price) as avg_price,
        MIN(rsp.price) as min_price,
        MAX(rsp.price) as max_price,
        COUNT(DISTINCT rsp.property_id) as properties_count
      FROM rate_shopper_prices rsp
      WHERE rsp.hotel_id = $1
      GROUP BY DATE(rsp.check_in)
      ORDER BY date DESC
      LIMIT 10
    `;
    
    const priceAnalysisResult = await pool.query(priceAnalysisQuery, [testHotel.id]);
    console.log(`   ✅ Retornou ${priceAnalysisResult.rows.length} dias com dados de preços`);
    
    if (priceAnalysisResult.rows.length > 0) {
      const sample = priceAnalysisResult.rows[0];
      console.log(`   • Exemplo: ${sample.date}`);
      console.log(`     ${sample.total_prices} preços, média R$ ${parseFloat(sample.avg_price).toFixed(2)}`);
      console.log(`     Range: R$ ${sample.min_price} - R$ ${sample.max_price}`);
    }

    // 4. Testar query de preços recentes por propriedade
    console.log('\n🏷️  TESTE: Latest Prices Query');
    
    const latestPricesQuery = `
      SELECT 
        p.id as property_id,
        p.property_name,
        p.hotel_id,
        rsp.check_in,
        rsp.check_out,
        rsp.price,
        rsp.currency,
        rsp.availability_status,
        rsp.captured_at,
        s.search_status
      FROM rate_shopper_prices rsp
      JOIN rate_shopper_properties p ON rsp.property_id = p.id
      JOIN rate_shopper_searches s ON rsp.search_id = s.id
      WHERE rsp.hotel_id = $1
        AND rsp.captured_at = (
          SELECT MAX(rsp2.captured_at) 
          FROM rate_shopper_prices rsp2 
          WHERE rsp2.property_id = rsp.property_id 
            AND rsp2.check_in = rsp.check_in
        )
      ORDER BY rsp.captured_at DESC
      LIMIT 10
    `;
    
    const latestPricesResult = await pool.query(latestPricesQuery, [testHotel.id]);
    console.log(`   ✅ Retornou ${latestPricesResult.rows.length} preços mais recentes`);
    
    if (latestPricesResult.rows.length > 0) {
      const sample = latestPricesResult.rows[0];
      console.log(`   • Exemplo: ${sample.property_name}`);
      console.log(`     Preço: ${sample.currency} ${sample.price} (${sample.check_in})`);
      console.log(`     Capturado: ${sample.captured_at}`);
    }

    // 5. Verificar se há problemas com datas ou formatos
    console.log('\n🗓️  TESTE: Date Format Issues');
    
    const dateFormatQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN check_in IS NULL THEN 1 END) as null_check_in,
        COUNT(CASE WHEN captured_at IS NULL THEN 1 END) as null_captured_at,
        MIN(captured_at) as oldest_capture,
        MAX(captured_at) as newest_capture
      FROM rate_shopper_prices
      WHERE hotel_id = $1
    `;
    
    const dateFormatResult = await pool.query(dateFormatQuery, [testHotel.id]);
    const dateStats = dateFormatResult.rows[0];
    
    console.log(`   • Total de preços: ${dateStats.total}`);
    console.log(`   • Problemas com check_in: ${dateStats.null_check_in}`);
    console.log(`   • Problemas com captured_at: ${dateStats.null_captured_at}`);
    console.log(`   • Período dos dados: ${dateStats.oldest_capture} a ${dateStats.newest_capture}`);

    // 6. Verificar queries que podem estar falhando na interface
    console.log('\n🔍 TESTE: Potential Interface Issues');
    
    // Simular filtros que a interface pode estar usando
    const today = new Date();
    const last30Days = new Date(today);
    last30Days.setDate(today.getDate() - 30);
    
    const interfaceQuery = `
      SELECT 
        COUNT(DISTINCT rs.id) as searches_last_30d,
        COUNT(DISTINCT rsp.id) as prices_last_30d,
        COUNT(DISTINCT prop.id) as active_properties
      FROM rate_shopper_searches rs
      LEFT JOIN rate_shopper_prices rsp ON rs.id = rsp.search_id
      LEFT JOIN rate_shopper_properties prop ON rs.property_id = prop.id
      WHERE rs.hotel_id = $1
        AND rs.created_at >= $2
        AND prop.active = true
    `;
    
    const interfaceResult = await pool.query(interfaceQuery, [testHotel.id, last30Days]);
    const interfaceStats = interfaceResult.rows[0];
    
    console.log(`   • Buscas nos últimos 30 dias: ${interfaceStats.searches_last_30d}`);
    console.log(`   • Preços nos últimos 30 dias: ${interfaceStats.prices_last_30d}`);
    console.log(`   • Propriedades ativas: ${interfaceStats.active_properties}`);

    // 7. Resumo final
    console.log('\n===== RESUMO DOS TESTES =====');
    
    const issues = [];
    
    if (dashboardResult.rows.length === 0) {
      issues.push('❌ Dashboard não retorna buscas');
    }
    
    if (priceAnalysisResult.rows.length === 0) {
      issues.push('❌ Análise de preços está vazia');
    }
    
    if (latestPricesResult.rows.length === 0) {
      issues.push('❌ Não há preços recentes');
    }
    
    if (parseInt(dateStats.null_check_in) > 0) {
      issues.push(`❌ ${dateStats.null_check_in} preços com check_in NULL`);
    }
    
    if (parseInt(interfaceStats.active_properties) === 0) {
      issues.push('❌ Nenhuma propriedade ativa');
    }

    if (issues.length === 0) {
      console.log('✅ TODAS AS QUERIES FUNCIONAM CORRETAMENTE!');
      console.log('🔍 O problema pode estar:');
      console.log('   • Na autenticação/autorização da API');
      console.log('   • No frontend não chamando as APIs corretas');
      console.log('   • Em filtros específicos aplicados na interface');
      console.log('   • Em problemas de CORS ou conectividade');
    } else {
      console.log('🚨 PROBLEMAS ENCONTRADOS:');
      issues.forEach(issue => console.log(`   ${issue}`));
    }

    // 8. Sugestões específicas baseadas nos dados
    console.log('\n💡 PRÓXIMOS PASSOS RECOMENDADOS:');
    
    if (dashboardResult.rows.length > 0 && priceAnalysisResult.rows.length > 0) {
      console.log('   1. Verificar logs do servidor API para erros de autenticação');
      console.log('   2. Testar endpoints da API diretamente via curl/Postman');
      console.log('   3. Verificar se frontend está usando hotel_id correto');
      console.log('   4. Confirmar se as rotas estão ativas e não comentadas');
      console.log('   5. Verificar se há filtros de data muito restritivos');
    } else {
      console.log('   1. Executar migration para corrigir estrutura');
      console.log('   2. Executar scripts de sincronização de dados');
      console.log('   3. Revalidar foreign keys e relacionamentos');
    }
    
  } catch (error) {
    console.error('❌ Erro nos testes:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

testRateShopperAPI().catch(console.error);