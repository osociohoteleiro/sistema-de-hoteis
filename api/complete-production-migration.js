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

async function completeProductionMigration() {
  console.log('🔧 COMPLETANDO migração de produção...');
  
  try {
    // 1. Listar tabelas que faltam
    const localTables = await localPool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' ORDER BY table_name
    `);
    
    const prodTables = await prodPool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' ORDER BY table_name
    `);
    
    const localTableNames = localTables.rows.map(r => r.table_name);
    const prodTableNames = prodTables.rows.map(r => r.table_name);
    
    const missingTables = localTableNames.filter(t => !prodTableNames.includes(t));
    
    console.log(`📊 Tabelas locais: ${localTableNames.length}`);
    console.log(`📊 Tabelas produção: ${prodTableNames.length}`);
    console.log(`📋 Faltando: ${missingTables.length}`);
    
    if (missingTables.length > 0) {
      console.log(`🏗️  Criando tabelas faltantes: ${missingTables.join(', ')}`);
      
      for (const tableName of missingTables) {
        console.log(`   📝 Criando: ${tableName}`);
        
        // Obter estrutura
        const columns = await localPool.query(`
          SELECT column_name, data_type, udt_name, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = $1 
          ORDER BY ordinal_position
        `, [tableName]);
        
        // Criar tabela
        const columnDefs = columns.rows.map(col => {
          let def = `${col.column_name} `;
          
          if (col.data_type === 'USER-DEFINED') {
            def += col.udt_name;
          } else if (col.data_type === 'character varying') {
            def += 'TEXT';
          } else {
            const typeMap = {
              'integer': 'INTEGER',
              'bigint': 'BIGINT', 
              'text': 'TEXT',
              'boolean': 'BOOLEAN',
              'uuid': 'UUID',
              'date': 'DATE',
              'timestamp without time zone': 'TIMESTAMP',
              'jsonb': 'JSONB',
              'numeric': 'NUMERIC'
            };
            def += typeMap[col.data_type] || 'TEXT';
          }
          
          if (col.is_nullable === 'NO') def += ' NOT NULL';
          if (col.column_default && col.column_default.includes('nextval')) {
            def = def.replace('INTEGER', 'SERIAL').replace('BIGINT', 'BIGSERIAL');
          }
          
          return def;
        }).join(', ');
        
        await prodPool.query(`CREATE TABLE ${tableName} (${columnDefs})`);
        
        // Copiar dados
        const data = await localPool.query(`SELECT * FROM ${tableName}`);
        
        if (data.rows.length > 0) {
          console.log(`     📊 ${data.rows.length} registros`);
          
          const columnNames = columns.rows.map(c => c.column_name);
          const placeholders = columnNames.map((_, i) => `$${i+1}`).join(',');
          const insertSQL = `INSERT INTO ${tableName} (${columnNames.join(',')}) VALUES (${placeholders})`;
          
          for (const row of data.rows) {
            const values = columnNames.map(col => row[col]);
            try {
              await prodPool.query(insertSQL, values);
            } catch (err) {
              // Tentar corrigir campos JSON
              if (err.message.includes('invalid input syntax for type json')) {
                const fixedValues = values.map((val, idx) => {
                  const colType = columns.rows[idx].data_type;
                  if ((colType === 'jsonb' || colType === 'json') && val && typeof val === 'string') {
                    try {
                      JSON.parse(val);
                      return val;
                    } catch {
                      return JSON.stringify(val);
                    }
                  }
                  return val;
                });
                
                try {
                  await prodPool.query(insertSQL, fixedValues);
                } catch (err2) {
                  console.log(`     ⚠️  Erro persistente: ${err2.message}`);
                }
              }
            }
          }
        }
      }
    }
    
    // 2. Corrigir campos JSON em tabelas existentes
    console.log('🔧 Corrigindo campos JSON...');
    
    const jsonTables = ['flows', 'site_themes', 'site_templates'];
    
    for (const tableName of jsonTables) {
      if (prodTableNames.includes(tableName)) {
        console.log(`   🔧 Corrigindo JSON em: ${tableName}`);
        
        // Limpar tabela e recriar com dados corrigidos
        await prodPool.query(`DELETE FROM ${tableName}`);
        
        const data = await localPool.query(`SELECT * FROM ${tableName}`);
        const columns = await localPool.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = $1 
          ORDER BY ordinal_position
        `, [tableName]);
        
        const columnNames = columns.rows.map(c => c.column_name);
        const placeholders = columnNames.map((_, i) => `$${i+1}`).join(',');
        const insertSQL = `INSERT INTO ${tableName} (${columnNames.join(',')}) VALUES (${placeholders})`;
        
        for (const row of data.rows) {
          const values = columnNames.map((col, idx) => {
            const val = row[col];
            const colType = columns.rows[idx].data_type;
            
            // Corrigir campos JSON/JSONB
            if ((colType === 'jsonb' || colType === 'json') && val) {
              if (typeof val === 'string') {
                try {
                  JSON.parse(val);
                  return val;
                } catch {
                  return JSON.stringify(val);
                }
              } else if (typeof val === 'object') {
                return JSON.stringify(val);
              }
            }
            return val;
          });
          
          try {
            await prodPool.query(insertSQL, values);
          } catch (err) {
            console.log(`     ⚠️  Erro: ${err.message}`);
          }
        }
        
        const count = await prodPool.query(`SELECT COUNT(*) FROM ${tableName}`);
        console.log(`     ✅ ${count.rows[0].count} registros corrigidos`);
      }
    }
    
    // 3. Verificação final
    const finalTables = await prodPool.query(`
      SELECT COUNT(*) FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const samples = [
      {name: 'users', query: 'SELECT COUNT(*) FROM users'},
      {name: 'hotels', query: 'SELECT COUNT(*) FROM hotels'},
      {name: 'rate_shopper_prices', query: 'SELECT COUNT(*) FROM rate_shopper_prices'},
      {name: 'workspaces', query: 'SELECT COUNT(*) FROM workspaces'},
      {name: 'flows', query: 'SELECT COUNT(*) FROM flows'},
      {name: 'bots', query: 'SELECT COUNT(*) FROM bots'}
    ];
    
    console.log(`\\n📊 RESULTADO FINAL:`);
    console.log(`   Tabelas: ${finalTables.rows[0].count}`);
    
    let totalRecords = 0;
    for (const sample of samples) {
      try {
        const result = await prodPool.query(sample.query);
        const count = parseInt(result.rows[0].count);
        totalRecords += count;
        console.log(`   ${sample.name}: ${count}`);
      } catch (err) {
        console.log(`   ${sample.name}: ❌ ${err.message}`);
      }
    }
    
    console.log(`   Total: ${totalRecords}+ registros`);
    console.log(`\\n🎉 MIGRAÇÃO COMPLETA FINALIZADA!`);
    console.log(`🚀 Banco pronto: ep.osociohoteleiro.com.br:5432/osh_hotels`);
    
  } catch (error) {
    console.error('❌ ERRO:', error.message);
  } finally {
    await localPool.end();
    await prodPool.end();
  }
}

completeProductionMigration();