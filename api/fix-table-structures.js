const { Pool } = require('pg');

const localPool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'osh_user',
  password: 'osh_password_2024',
  database: 'osh_db'
});

const prodPool = new Pool({
  host: 'ep.osociohoteleiro.com.br',
  port: 5432,
  user: 'postgres',
  password: 'OSH4040()Xx!..nn',
  database: 'osh_hotels'
});

async function fixTableStructures() {
  console.log('🔧 Corrigindo estruturas das tabelas para ficarem EXATAMENTE iguais...');
  
  try {
    // 1. Corrigir tabela hotels - adicionar coluna uuid se não existir
    console.log('🏨 Corrigindo tabela hotels...');
    
    const hotelCols = await prodPool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'hotels' ORDER BY ordinal_position
    `);
    
    console.log('Colunas atuais em hotels:', hotelCols.rows.map(r => r.column_name));
    
    if (!hotelCols.rows.some(c => c.column_name === 'uuid')) {
      console.log('  ➕ Adicionando coluna uuid...');
      await prodPool.query('ALTER TABLE hotels ADD COLUMN uuid UUID DEFAULT gen_random_uuid()');
      
      // Copiar hotel_uuid para uuid
      await prodPool.query('UPDATE hotels SET uuid = hotel_uuid WHERE hotel_uuid IS NOT NULL');
    }
    
    // 2. Corrigir tabela rate_shopper_searches
    console.log('🔍 Corrigindo tabela rate_shopper_searches...');
    
    const searchCols = await prodPool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'rate_shopper_searches' ORDER BY ordinal_position
    `);
    
    console.log('Colunas atuais em rate_shopper_searches:', searchCols.rows.map(r => r.column_name));
    
    const localSearchCols = await localPool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'rate_shopper_searches' ORDER BY ordinal_position
    `);
    
    console.log('Colunas esperadas (local):', localSearchCols.rows.map(r => r.column_name));
    
    // Verificar e adicionar colunas que faltam
    const expectedCols = localSearchCols.rows.map(r => r.column_name);
    const currentCols = searchCols.rows.map(r => r.column_name);
    
    for (const col of expectedCols) {
      if (!currentCols.includes(col)) {
        console.log(`  ➕ Adicionando coluna ${col}...`);
        
        // Determinar tipo da coluna
        const colInfo = await localPool.query(`
          SELECT data_type, is_nullable, column_default 
          FROM information_schema.columns 
          WHERE table_name = 'rate_shopper_searches' AND column_name = $1
        `, [col]);
        
        if (colInfo.rows.length > 0) {
          const info = colInfo.rows[0];
          let colType = info.data_type.toUpperCase();
          
          if (colType === 'CHARACTER VARYING') colType = 'TEXT';
          if (colType === 'TIMESTAMP WITHOUT TIME ZONE') colType = 'TIMESTAMP';
          
          let nullable = info.is_nullable === 'YES' ? '' : ' NOT NULL';
          let defaultVal = info.column_default ? ` DEFAULT ${info.column_default}` : '';
          
          const alterSQL = `ALTER TABLE rate_shopper_searches ADD COLUMN ${col} ${colType}${nullable}${defaultVal}`;
          console.log(`    SQL: ${alterSQL}`);
          
          try {
            await prodPool.query(alterSQL);
          } catch (err) {
            console.log(`    ⚠️ Erro: ${err.message}`);
          }
        }
      }
    }
    
    // 3. Migrar dados das colunas com nomes diferentes
    console.log('📊 Migrando dados entre colunas...');
    
    // start_date -> check_in_date, end_date -> check_out_date
    const hasStartDate = currentCols.includes('start_date');
    const hasCheckInDate = currentCols.includes('check_in_date') || expectedCols.includes('check_in_date');
    
    if (hasStartDate && hasCheckInDate) {
      console.log('  🔄 Migrando start_date -> check_in_date...');
      await prodPool.query('UPDATE rate_shopper_searches SET check_in_date = start_date WHERE start_date IS NOT NULL');
      
      console.log('  🔄 Migrando end_date -> check_out_date...');
      await prodPool.query('UPDATE rate_shopper_searches SET check_out_date = end_date WHERE end_date IS NOT NULL');
    }
    
    // status -> search_status
    const hasStatus = currentCols.includes('status');
    const hasSearchStatus = currentCols.includes('search_status') || expectedCols.includes('search_status');
    
    if (hasStatus && hasSearchStatus) {
      console.log('  🔄 Migrando status -> search_status...');
      await prodPool.query('UPDATE rate_shopper_searches SET search_status = status WHERE status IS NOT NULL');
    }
    
    // 4. Verificar resultado final
    console.log('\\n📊 Verificação final...');
    
    const finalSearchCols = await prodPool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'rate_shopper_searches' ORDER BY ordinal_position
    `);
    
    console.log('Colunas finais em rate_shopper_searches:', finalSearchCols.rows.map(r => r.column_name));
    
    const finalHotelCols = await prodPool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'hotels' ORDER BY ordinal_position
    `);
    
    console.log('Colunas finais em hotels:', finalHotelCols.rows.map(r => r.column_name));
    
    console.log('\\n🎉 Estruturas das tabelas corrigidas!');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir estruturas:', error.message);
  } finally {
    await localPool.end();
    await prodPool.end();
  }
}

fixTableStructures();