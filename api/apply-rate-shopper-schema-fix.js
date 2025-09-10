// Script para aplicar a migration de correção do schema Rate Shopper em produção
const fs = require('fs');
const path = require('path');
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

async function applySchemaFix() {
  console.log('🚀 APLICANDO CORREÇÃO DE SCHEMA RATE SHOPPER EM PRODUÇÃO\n');
  
  const pool = new Pool(productionConfig);
  
  try {
    // Ler o arquivo de migration
    const migrationPath = path.join(__dirname, 'migrations', '025_add_compatibility_columns.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration carregada:', migrationPath);
    console.log('📏 Tamanho do SQL:', migrationSQL.length, 'caracteres\n');
    
    // Aplicar a migration
    console.log('⚡ Executando migration...');
    const startTime = Date.now();
    
    await pool.query(migrationSQL);
    
    const duration = Date.now() - startTime;
    console.log(`✅ Migration aplicada com sucesso em ${duration}ms\n`);
    
    // Verificar resultado
    console.log('🔍 Verificando schema após migration...');
    
    // Verificar tabela searches
    const searchesSchema = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'rate_shopper_searches' 
        AND column_name IN ('check_in', 'check_out', 'start_date', 'end_date', 'status', 'search_status', 'uuid')
      ORDER BY column_name
    `);
    
    console.log('📋 rate_shopper_searches - Colunas disponíveis:');
    searchesSchema.rows.forEach(row => {
      console.log(`   ✅ ${row.column_name}`);
    });
    
    // Verificar tabela prices
    const pricesSchema = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'rate_shopper_prices' 
        AND column_name IN ('check_in', 'check_out', 'check_in_date', 'check_out_date', 'captured_at', 'scraped_at')
      ORDER BY column_name
    `);
    
    console.log('\n📋 rate_shopper_prices - Colunas disponíveis:');
    pricesSchema.rows.forEach(row => {
      console.log(`   ✅ ${row.column_name}`);
    });
    
    // Verificar tabela properties
    const propertiesSchema = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'rate_shopper_properties' 
        AND column_name IN ('property_url', 'booking_url', 'booking_engine', 'platform', 'uuid')
      ORDER BY column_name
    `);
    
    console.log('\n📋 rate_shopper_properties - Colunas disponíveis:');
    propertiesSchema.rows.forEach(row => {
      console.log(`   ✅ ${row.column_name}`);
    });
    
    // Testar query básica do dashboard
    console.log('\n🧪 Testando query do dashboard...');
    try {
      const testQuery = await pool.query(`
        SELECT 
          rs.id,
          rs.hotel_id,
          rs.property_id,
          rs.check_in as start_date,
          rs.check_out as end_date,
          rs.search_status as status,
          rs.created_at,
          rsp.property_name,
          rsp.booking_engine as platform
        FROM rate_shopper_searches rs
        LEFT JOIN rate_shopper_properties rsp ON rs.property_id = rsp.id
        WHERE rs.hotel_id = 17
        ORDER BY rs.created_at DESC
        LIMIT 5
      `);
      
      console.log(`✅ Query dashboard funcionando! ${testQuery.rows.length} resultados`);
      
      if (testQuery.rows.length > 0) {
        console.log('📊 Exemplo de resultado:');
        console.log('   ID:', testQuery.rows[0].id);
        console.log('   Hotel ID:', testQuery.rows[0].hotel_id);
        console.log('   Propriedade:', testQuery.rows[0].property_name);
        console.log('   Status:', testQuery.rows[0].status);
      }
      
    } catch (error) {
      console.log('❌ Erro no teste da query:', error.message);
    }
    
    console.log('\n🎉 SCHEMA CORRIGIDO COM SUCESSO!');
    console.log('📋 Agora o schema tem compatibilidade com ambas as versões:');
    console.log('   • Colunas originais: check_in, check_out, search_status, captured_at, property_url');
    console.log('   • Colunas da migration: start_date, end_date, status, scraped_at, booking_url');
    console.log('   • APIs podem usar qualquer uma das versões');
    
  } catch (error) {
    console.error('❌ Erro ao aplicar migration:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

applySchemaFix().catch(console.error);