const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'osh_user',
  password: 'osh_password_2024',
  database: 'osh_db'
});

async function exportAllDataForProduction() {
  try {
    console.log('🚀 Exportando TODOS os dados do banco local para produção...');
    
    // 1. Obter todas as tabelas com dados
    const tablesResult = await pool.query(`
      SELECT 
        t.table_name,
        COALESCE(s.n_tup_ins, 0) as record_count
      FROM information_schema.tables t
      LEFT JOIN pg_stat_user_tables s ON s.relname = t.table_name
      WHERE t.table_schema = 'public' 
      AND t.table_type = 'BASE TABLE'
      AND t.table_name != 'schema_migrations'
      ORDER BY t.table_name
    `);
    
    console.log(`📋 Encontradas ${tablesResult.rows.length} tabelas para exportar`);
    
    let dataScript = `-- Export completo de dados para produção
-- Gerado em: ${new Date().toISOString()}
-- IMPORTANTE: Execute APÓS aplicar as migrations de estrutura

-- Desabilitar verificações de chave estrangeira temporariamente
SET session_replication_role = 'replica';

`;

    let totalRecords = 0;
    
    // 2. Para cada tabela, exportar os dados
    for (const table of tablesResult.rows) {
      const tableName = table.table_name;
      
      console.log(`📊 Processando tabela: ${tableName}`);
      
      // Contar registros
      const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      const recordCount = parseInt(countResult.rows[0].count);
      
      if (recordCount === 0) {
        console.log(`  ⏩ Tabela ${tableName} está vazia, pulando...`);
        continue;
      }
      
      console.log(`  📝 Exportando ${recordCount} registros da tabela ${tableName}...`);
      totalRecords += recordCount;
      
      // Obter estrutura das colunas
      const columnsResult = await pool.query(`
        SELECT 
          column_name,
          data_type,
          udt_name
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [tableName]);
      
      const columns = columnsResult.rows.map(col => col.column_name);
      const columnNames = columns.join(', ');
      
      dataScript += `-- Dados da tabela: ${tableName} (${recordCount} registros)\\n`;
      
      // Buscar todos os dados da tabela
      const dataResult = await pool.query(`SELECT * FROM ${tableName} ORDER BY ${columns[0]}`);
      
      if (dataResult.rows.length > 0) {
        // Gerar INSERT statements em lotes
        const batchSize = 100;
        const batches = [];
        
        for (let i = 0; i < dataResult.rows.length; i += batchSize) {
          batches.push(dataResult.rows.slice(i, i + batchSize));
        }
        
        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
          const batch = batches[batchIndex];
          
          dataScript += `INSERT INTO ${tableName} (${columnNames}) VALUES\\n`;
          
          const valueStrings = batch.map(row => {
            const values = columns.map(col => {
              const value = row[col];
              
              if (value === null) {
                return 'NULL';
              } else if (typeof value === 'string') {
                // Escapar aspas simples
                return "'" + value.replace(/'/g, "''") + "'";
              } else if (typeof value === 'boolean') {
                return value ? 'true' : 'false';
              } else if (value instanceof Date) {
                return "'" + value.toISOString() + "'";
              } else if (typeof value === 'object') {
                // JSON data
                return "'" + JSON.stringify(value).replace(/'/g, "''") + "'";
              } else {
                return value.toString();
              }
            });
            
            return '  (' + values.join(', ') + ')';
          });
          
          dataScript += valueStrings.join(',\\n');
          dataScript += '\\nON CONFLICT DO NOTHING;\\n\\n';
        }
      }
      
      dataScript += `\\n`;
    }
    
    dataScript += `-- Reabilitar verificações de chave estrangeira
SET session_replication_role = 'origin';

-- Atualizar sequências para valores corretos
`;

    // 3. Atualizar sequências
    const sequencesResult = await pool.query(`
      SELECT 
        schemaname,
        sequencename,
        last_value
      FROM pg_sequences 
      WHERE schemaname = 'public'
      ORDER BY sequencename
    `);
    
    for (const seq of sequencesResult.rows) {
      dataScript += `SELECT setval('${seq.sequencename}', COALESCE((SELECT MAX(id) FROM ${seq.sequencename.replace('_id_seq', '')}), 1), true);\\n`;
    }
    
    // 4. Salvar arquivo de dados
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const dataFile = `001_complete_data_export_${timestamp}.sql`;
    const dataPath = path.join('./migrations', dataFile);
    
    fs.writeFileSync(dataPath, dataScript);
    
    console.log(`\\n✅ Export de dados concluído!`);
    console.log(`📁 Arquivo: ${dataFile}`);
    console.log(`📊 Total de registros: ${totalRecords.toLocaleString()}`);
    console.log(`📏 Tamanho: ${(dataScript.length / 1024).toFixed(2)} KB`);
    
    // 5. Criar script combinado (estrutura + dados)
    const structureFile = fs.readdirSync('./migrations').find(f => f.startsWith('000_complete_production_setup'));
    
    if (structureFile) {
      const structureContent = fs.readFileSync(path.join('./migrations', structureFile), 'utf8');
      const combinedContent = structureContent + '\\n\\n' + dataScript;
      
      const combinedFile = `complete_migration_with_data_${timestamp}.sql`;
      fs.writeFileSync(path.join('./migrations', combinedFile), combinedContent);
      
      console.log(`\\n🎯 Arquivo COMPLETO criado: ${combinedFile}`);
      console.log(`📏 Tamanho total: ${(combinedContent.length / 1024).toFixed(2)} KB`);
    }
    
    console.log(`\\n📋 Para aplicar em produção:`);
    console.log(`   1. Aplicar estrutura: migrations/${structureFile}`);
    console.log(`   2. Aplicar dados: migrations/${dataFile}`);
    console.log(`   3. OU usar arquivo combinado: migrations/complete_migration_with_data_${timestamp}.sql`);
    
  } catch (error) {
    console.error('❌ Erro ao exportar dados:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

exportAllDataForProduction();