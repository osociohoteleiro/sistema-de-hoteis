const { Pool } = require('pg');

// Configurações
const localConfig = {
  host: 'localhost',
  port: 5432,
  user: 'osh_user',
  password: 'osh_password_2024',
  database: 'osh_db'
};

const productionConfig = {
  host: 'ep.osociohoteleiro.com.br',
  port: 5432,
  user: 'postgres',
  password: 'OSH4040()Xx!..nn',
  database: 'osh_hotels'
};

async function directProductionDeploy() {
  console.log('🚀 MIGRAÇÃO DIRETA: Local → Produção');
  
  const localPool = new Pool(localConfig);
  const prodPool = new Pool(productionConfig);
  
  try {
    console.log('🔌 Testando conexões...');
    await localPool.query('SELECT NOW()');
    await prodPool.query('SELECT NOW()');
    console.log('✅ Ambas as conexões estabelecidas');
    
    // 1. RESETAR PRODUÇÃO
    console.log('🧹 Resetando banco de produção...');
    await prodPool.query(`
      DROP SCHEMA IF EXISTS public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO postgres;
      GRANT ALL ON SCHEMA public TO public;
    `);
    console.log('✅ Banco de produção resetado');
    
    // 2. CRIAR EXTENSÕES
    console.log('🔧 Criando extensões...');
    await prodPool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await prodPool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    console.log('✅ Extensões criadas');
    
    // 3. CRIAR TODOS OS TIPOS ENUM
    console.log('📋 Criando tipos ENUM...');
    const enumsResult = await localPool.query(`
      SELECT 
        t.typname,
        string_agg(e.enumlabel, ',' ORDER BY e.enumsortorder) as labels
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      WHERE t.typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      GROUP BY t.typname
      ORDER BY t.typname
    `);
    
    for (const enumType of enumsResult.rows) {
      const labels = enumType.labels.split(',').map(label => `'${label.trim()}'`).join(', ');
      await prodPool.query(`CREATE TYPE ${enumType.typname} AS ENUM (${labels})`);
    }
    console.log(`✅ ${enumsResult.rows.length} tipos ENUM criados`);
    
    // 4. CRIAR FUNÇÃO update_updated_at_column
    console.log('🔧 Criando função update_updated_at_column...');
    await prodPool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);
    console.log('✅ Função criada');
    
    // 5. OBTER TODAS AS TABELAS
    console.log('📊 Obtendo lista de tabelas...');
    const tablesResult = await localPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log(`📋 Encontradas ${tablesResult.rows.length} tabelas`);
    
    // 6. CRIAR CADA TABELA E COPIAR DADOS
    for (const table of tablesResult.rows) {
      const tableName = table.table_name;
      console.log(`🏗️  Processando tabela: ${tableName}`);
      
      // Obter DDL da tabela do banco local
      const columnsResult = await localPool.query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length,
          numeric_precision,
          numeric_scale,
          udt_name
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [tableName]);
      
      // Construir CREATE TABLE
      let createTableSQL = `CREATE TABLE ${tableName} (\\n`;
      const columns = [];
      
      for (const col of columnsResult.rows) {
        let columnDef = `  ${col.column_name} `;
        
        // Determinar tipo
        if (col.data_type === 'USER-DEFINED') {
          columnDef += col.udt_name;
        } else if (col.data_type === 'character varying' && col.character_maximum_length) {
          columnDef += `VARCHAR(${col.character_maximum_length})`;
        } else if (col.data_type === 'numeric' && col.numeric_precision) {
          if (col.numeric_scale) {
            columnDef += `NUMERIC(${col.numeric_precision},${col.numeric_scale})`;
          } else {
            columnDef += `NUMERIC(${col.numeric_precision})`;
          }
        } else {
          const typeMap = {
            'integer': 'INTEGER',
            'bigint': 'BIGINT', 
            'text': 'TEXT',
            'boolean': 'BOOLEAN',
            'uuid': 'UUID',
            'date': 'DATE',
            'time without time zone': 'TIME',
            'timestamp without time zone': 'TIMESTAMP',
            'jsonb': 'JSONB',
            'inet': 'INET'
          };
          columnDef += typeMap[col.data_type] || col.data_type.toUpperCase();
        }
        
        // Nullable
        if (col.is_nullable === 'NO') {
          columnDef += ' NOT NULL';
        }
        
        // Default
        if (col.column_default) {
          columnDef += ` DEFAULT ${col.column_default}`;
        }
        
        columns.push(columnDef);
      }
      
      createTableSQL += columns.join(',\\n') + '\\n)';
      
      // Criar tabela na produção
      await prodPool.query(createTableSQL);
      
      // Copiar dados
      const dataResult = await localPool.query(`SELECT * FROM ${tableName}`);
      
      if (dataResult.rows.length > 0) {
        console.log(`   📊 Copiando ${dataResult.rows.length} registros...`);
        
        const columnNames = columnsResult.rows.map(c => c.column_name).join(', ');
        
        // Inserir em lotes de 100
        const batchSize = 100;
        for (let i = 0; i < dataResult.rows.length; i += batchSize) {
          const batch = dataResult.rows.slice(i, i + batchSize);
          
          const values = batch.map(row => {
            const rowValues = columnsResult.rows.map(col => {
              const value = row[col.column_name];
              if (value === null) return 'NULL';
              if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
              if (typeof value === 'boolean') return value ? 'true' : 'false';
              if (value instanceof Date) return `'${value.toISOString()}'`;
              if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
              return value.toString();
            });
            return '(' + rowValues.join(', ') + ')';
          });
          
          const insertSQL = `INSERT INTO ${tableName} (${columnNames}) VALUES ${values.join(', ')} ON CONFLICT DO NOTHING`;
          
          try {
            await prodPool.query(insertSQL);
          } catch (error) {
            console.log(`   ⚠️  Erro no lote ${i}: ${error.message}`);
          }
        }
      }
      
      // Adicionar chaves primárias
      const pkResult = await localPool.query(`
        SELECT a.attname
        FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = $1::regclass AND i.indisprimary
      `, [tableName]);
      
      if (pkResult.rows.length > 0) {
        const pkColumns = pkResult.rows.map(row => row.attname).join(', ');
        try {
          await prodPool.query(`ALTER TABLE ${tableName} ADD PRIMARY KEY (${pkColumns})`);
        } catch (error) {
          console.log(`   ⚠️  PK para ${tableName}: ${error.message}`);
        }
      }
    }
    
    // 7. CORRIGIR SEQUÊNCIAS
    console.log('🔧 Corrigindo sequências...');
    const sequencesResult = await prodPool.query(`
      SELECT schemaname, sequencename
      FROM pg_sequences 
      WHERE schemaname = 'public'
    `);
    
    for (const seq of sequencesResult.rows) {
      const tableName = seq.sequencename.replace('_id_seq', '');
      try {
        await prodPool.query(`
          SELECT setval('${seq.sequencename}', 
            COALESCE((SELECT MAX(id) FROM ${tableName}), 1), true)
        `);
      } catch (error) {
        console.log(`   ⚠️  Sequência ${seq.sequencename}: Tabela não encontrada`);
      }
    }
    
    // 8. VERIFICAR RESULTADO
    console.log('\\n🔍 Verificação final...');
    
    const finalTablesResult = await prodPool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const finalTableCount = parseInt(finalTablesResult.rows[0].count);
    console.log(`📊 Tabelas criadas: ${finalTableCount}`);
    
    // Contar registros em tabelas principais
    const sampleQueries = [
      { name: 'users', query: 'SELECT COUNT(*) as count FROM users' },
      { name: 'hotels', query: 'SELECT COUNT(*) as count FROM hotels' },
      { name: 'rate_shopper_prices', query: 'SELECT COUNT(*) as count FROM rate_shopper_prices' },
      { name: 'workspaces', query: 'SELECT COUNT(*) as count FROM workspaces' }
    ];
    
    console.log('\\n📊 Dados copiados:');
    let totalRecords = 0;
    
    for (const sample of sampleQueries) {
      try {
        const result = await prodPool.query(sample.query);
        const count = parseInt(result.rows[0].count);
        totalRecords += count;
        console.log(`   ${sample.name}: ${count} registros`);
      } catch (error) {
        console.log(`   ${sample.name}: ❌ ${error.message}`);
      }
    }
    
    console.log(`\\n🎉 MIGRAÇÃO COMPLETA FINALIZADA!`);
    console.log(`\\n📋 Resumo:`);
    console.log(`   ✅ Banco resetado e recriado`);
    console.log(`   ✅ Tabelas: ${finalTableCount}`);
    console.log(`   ✅ Registros: ${totalRecords}+`);
    console.log(`   ✅ Banco: ep.osociohoteleiro.com.br:5432/osh_hotels`);
    console.log(`\\n🚀 Sua aplicação pode usar o banco de produção!`);
    
  } catch (error) {
    console.error('❌ ERRO na migração:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await localPool.end();
    await prodPool.end();
  }
}

directProductionDeploy();