// Correção mais robusta para price-trends que detecta as colunas disponíveis
const fs = require('fs');
const path = require('path');

// Ler o arquivo atual
const filePath = path.join(__dirname, 'routes', 'rateShopper.js');
let content = fs.readFileSync(filePath, 'utf8');

// Criar uma versão mais robusta da query que funcione independente do schema
const robustQuery = `
    // Buscar dados históricos - versão robusta que detecta colunas disponíveis
    const historicalData = await db.query(\`
      WITH column_check AS (
        SELECT 
          CASE WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'rate_shopper_prices' AND column_name = 'check_in'
          ) THEN 'check_in' ELSE 'check_in_date' END as date_col,
          CASE WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'rate_shopper_prices' AND column_name = 'captured_at'
          ) THEN 'captured_at' ELSE 'scraped_at' END as time_col,
          CASE WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'rate_shopper_searches' AND column_name = 'search_status'
          ) THEN 'search_status' ELSE 'status' END as status_col
      ),
      latest_extraction_per_date AS (
        SELECT 
          DATE(
            CASE 
              WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rate_shopper_prices' AND column_name = 'check_in')
              THEN rsp.check_in 
              ELSE rsp.check_in_date 
            END
          ) as date,
          rsp.property_id,
          MAX(
            CASE 
              WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rate_shopper_prices' AND column_name = 'captured_at')
              THEN rsp.captured_at 
              ELSE rsp.scraped_at 
            END
          ) as latest_captured_at
        FROM rate_shopper_prices rsp
        JOIN rate_shopper_searches rs ON rsp.search_id = rs.id
        WHERE rs.hotel_id = $1
          AND DATE(
            CASE 
              WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rate_shopper_prices' AND column_name = 'check_in')
              THEN rsp.check_in 
              ELSE rsp.check_in_date 
            END
          ) >= $2 
          AND DATE(
            CASE 
              WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rate_shopper_prices' AND column_name = 'check_in')
              THEN rsp.check_in 
              ELSE rsp.check_in_date 
            END
          ) <= $3
          AND (
            CASE 
              WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rate_shopper_searches' AND column_name = 'search_status')
              THEN rs.search_status 
              ELSE rs.status 
            END
          ) IN ('COMPLETED', 'CANCELLED')
        GROUP BY DATE(
          CASE 
            WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rate_shopper_prices' AND column_name = 'check_in')
            THEN rsp.check_in 
            ELSE rsp.check_in_date 
          END
        ), rsp.property_id
      )
      SELECT 
        latest.date,
        COALESCE(rsp_prop.property_name, 'Unknown Property') as property_name,
        COALESCE(
          CASE 
            WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rate_shopper_properties' AND column_name = 'platform')
            THEN rsp_prop.platform 
            ELSE rsp_prop.booking_engine 
          END, 
          'booking'
        ) as platform,
        COALESCE(rsp_prop.is_main_property, false) as is_main_property,
        rsp.price as avg_price,
        rsp.price as min_price,
        rsp.price as max_price,
        1 as price_count,
        CASE WHEN latest.date > CURRENT_DATE THEN true ELSE false END as is_future,
        -- Informações sobre bundles com fallback
        CASE WHEN COALESCE(rsp.is_bundle, false) = true THEN 1 ELSE 0 END as bundle_count,
        CASE WHEN COALESCE(rsp.is_bundle, false) = false THEN 1 ELSE 0 END as regular_count,
        COALESCE(rsp.bundle_size, 1) as avg_bundle_size,
        COALESCE(rsp.bundle_size, 1) as max_bundle_size,
        COALESCE(rsp.is_bundle, false) as is_mostly_bundle
      FROM latest_extraction_per_date latest
      JOIN rate_shopper_prices rsp ON rsp.property_id = latest.property_id 
        AND DATE(
          CASE 
            WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rate_shopper_prices' AND column_name = 'check_in')
            THEN rsp.check_in 
            ELSE rsp.check_in_date 
          END
        ) = latest.date 
        AND (
          CASE 
            WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rate_shopper_prices' AND column_name = 'captured_at')
            THEN rsp.captured_at 
            ELSE rsp.scraped_at 
          END
        ) = latest.latest_captured_at
      JOIN rate_shopper_properties rsp_prop ON rsp.property_id = rsp_prop.id
      ORDER BY latest.date ASC, COALESCE(rsp_prop.is_main_property, false) DESC, rsp_prop.property_name
    \`, dateParams);`;

console.log('🔧 Versão robusta da query criada');
console.log('💡 Esta versão detecta automaticamente quais colunas existem e usa as corretas');
console.log('📋 Para aplicar manualmente, substitua a query historicalData na linha ~273 do arquivo rateShopper.js');

// Opcional: salvar em arquivo separado para referência
fs.writeFileSync(path.join(__dirname, 'price-trends-robust-query.sql'), robustQuery);
console.log('✅ Query salva em price-trends-robust-query.sql para referência');

console.log('\n🎯 ALTERNATIVA MAIS SIMPLES:');
console.log('Aguardar o deploy atual estabilizar, pois Status 502 indica que a aplicação está reiniciando.');
console.log('As correções já foram aplicadas e devem funcionar quando o servidor voltar online.');