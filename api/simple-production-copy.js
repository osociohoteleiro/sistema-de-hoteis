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

async function simpleProductionCopy() {
  console.log('🚀 CÓPIA SIMPLES: Local → Produção');
  
  try {
    console.log('🔌 Testando conexões...');
    await localPool.query('SELECT 1');
    await prodPool.query('SELECT 1');
    console.log('✅ Conexões OK');
    
    // 1. Reset completo do banco de produção
    console.log('🧹 Resetando produção...');
    await prodPool.query('DROP SCHEMA IF EXISTS public CASCADE');
    await prodPool.query('CREATE SCHEMA public');
    await prodPool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await prodPool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    console.log('✅ Produção resetada');
    
    // 2. Copiar ENUMs
    console.log('📋 Copiando ENUMs...');
    const enums = await localPool.query(`
      SELECT t.typname, string_agg(e.enumlabel, ',' ORDER BY e.enumsortorder) as labels
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      WHERE t.typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      GROUP BY t.typname
    `);
    
    for (const en of enums.rows) {
      const labels = en.labels.split(',').map(l => `'${l.trim()}'`).join(',');
      await prodPool.query(`CREATE TYPE ${en.typname} AS ENUM (${labels})`);
    }
    console.log(`✅ ${enums.rows.length} ENUMs copiados`);
    
    // 3. Criar função
    await prodPool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);
    
    // 4. Lista de tabelas em ordem de dependência
    const tableOrder = [
      'users',
      'hotels', 
      'workspaces',
      'folders',
      'flows', 
      'bots',
      'user_hotels',
      'user_permissions',
      'app_config',
      'app_configurations',
      'site_themes',
      'site_templates', 
      'rate_shopper_properties',
      'rate_shopper_configs',
      'rate_shopper_searches',
      'rate_shopper_prices',
      'rate_shopper_price_history',
      'meta_available_accounts',
      'meta_connected_accounts',
      'onenode_bot_fields'
    ];
    
    // 5. Copiar cada tabela
    for (const tableName of tableOrder) {
      console.log(`🏗️  Tabela: ${tableName}`);
      
      // Verificar se tabela existe
      const exists = await localPool.query(`
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = $1 AND table_schema = 'public'
      `, [tableName]);
      
      if (exists.rows.length === 0) {
        console.log(`   ⏩ Não existe, pulando...`);
        continue;
      }
      
      // Obter estrutura
      const columns = await localPool.query(`
        SELECT column_name, data_type, udt_name, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [tableName]);
      
      // Criar tabela simples
      const columnDefs = columns.rows.map(col => {
        let def = `${col.column_name} `;
        
        if (col.data_type === 'USER-DEFINED') {
          def += col.udt_name;
        } else if (col.data_type === 'character varying') {
          def += 'TEXT'; // Simplificar como TEXT
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
        console.log(`   📊 ${data.rows.length} registros`);
        
        const columnNames = columns.rows.map(c => c.column_name);
        const placeholders = columnNames.map((_, i) => `$${i+1}`).join(',');
        const insertSQL = `INSERT INTO ${tableName} (${columnNames.join(',')}) VALUES (${placeholders})`;
        
        for (const row of data.rows) {
          const values = columnNames.map(col => row[col]);
          try {
            await prodPool.query(insertSQL, values);
          } catch (err) {
            console.log(`   ⚠️  Erro linha: ${err.message}`);
          }
        }
      }
    }
    
    // 6. Verificação final
    const finalCount = await prodPool.query(`
      SELECT COUNT(*) FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const samples = await Promise.all([
      prodPool.query('SELECT COUNT(*) FROM users').catch(() => ({rows: [{count: 0}]})),
      prodPool.query('SELECT COUNT(*) FROM hotels').catch(() => ({rows: [{count: 0}]})),
      prodPool.query('SELECT COUNT(*) FROM rate_shopper_prices').catch(() => ({rows: [{count: 0}]}))
    ]);
    
    console.log(`\\n🎉 MIGRAÇÃO FINALIZADA!`);
    console.log(`📊 Tabelas: ${finalCount.rows[0].count}`);
    console.log(`👥 Users: ${samples[0].rows[0].count}`);
    console.log(`🏨 Hotels: ${samples[1].rows[0].count}`); 
    console.log(`💰 Prices: ${samples[2].rows[0].count}`);
    console.log(`\\n🚀 Banco pronto em: ep.osociohoteleiro.com.br:5432/osh_hotels`);
    
  } catch (error) {
    console.error('❌ ERRO:', error.message);
  } finally {
    await localPool.end();
    await prodPool.end();
  }
}

simpleProductionCopy();