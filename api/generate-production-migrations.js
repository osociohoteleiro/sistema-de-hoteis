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

async function generateProductionMigrations() {
  try {
    console.log('🏗️  Gerando migrations para produção baseadas no banco atual...');
    
    // 1. Limpar migrations antigas (backup first)
    const migrationsDir = './migrations';
    const backupDir = './migrations-backup';
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }
    
    // Fazer backup das migrations existentes
    const existingMigrations = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
    existingMigrations.forEach(file => {
      fs.copyFileSync(
        path.join(migrationsDir, file),
        path.join(backupDir, file)
      );
    });
    console.log(`📦 Backup de ${existingMigrations.length} migrations salvo em migrations-backup/`);
    
    // 2. Criar migration inicial completa
    let migrationContent = `-- Migration: Complete production setup
-- Esta migration replica exatamente o estado atual do banco local
-- Data: ${new Date().toISOString()}

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Criar todos os tipos ENUM necessários
`;

    // Buscar todos os tipos ENUM customizados
    const enumsResult = await pool.query(`
      SELECT 
        t.typname,
        string_agg(e.enumlabel, ',' ORDER BY e.enumsortorder) as labels
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      WHERE t.typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      GROUP BY t.typname
      ORDER BY t.typname;
    `);
    
    console.log(`📋 Encontrados ${enumsResult.rows.length} tipos ENUM customizados`);
    
    for (const enumType of enumsResult.rows) {
      const labels = enumType.labels.split(',').map(label => `'${label.trim()}'`).join(', ');
      migrationContent += `CREATE TYPE IF NOT EXISTS ${enumType.typname} AS ENUM (${labels});\\n`;
    }
    
    migrationContent += `\\n-- Função para atualizar timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Tabela para controle de migrations
CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  version VARCHAR(255) UNIQUE NOT NULL,
  filename VARCHAR(255) NOT NULL,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  checksum VARCHAR(64),
  execution_time_ms INTEGER
);

`;

    // 3. Gerar CREATE TABLE para cada tabela
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log(`🏗️  Gerando DDL para ${tablesResult.rows.length} tabelas...`);
    
    for (const table of tablesResult.rows) {
      const tableName = table.table_name;
      console.log(`  📝 Processando tabela: ${tableName}`);
      
      // Obter estrutura completa da tabela
      const structureResult = await pool.query(`
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
      
      migrationContent += `-- Tabela: ${tableName}\\n`;
      migrationContent += `CREATE TABLE IF NOT EXISTS ${tableName} (\\n`;
      
      const columns = [];
      for (const col of structureResult.rows) {
        let columnDef = `  ${col.column_name} `;
        
        // Determinar tipo de dados
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
      
      migrationContent += columns.join(',\\n');
      migrationContent += `\\n);\\n\\n`;
      
      // Adicionar índices e constraints (buscar PRIMARY KEY)
      const pkResult = await pool.query(`
        SELECT a.attname
        FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = $1::regclass AND i.indisprimary;
      `, [tableName]);
      
      if (pkResult.rows.length > 0) {
        const pkColumns = pkResult.rows.map(row => row.attname).join(', ');
        migrationContent += `ALTER TABLE ${tableName} ADD PRIMARY KEY (${pkColumns});\\n`;
      }
      
      migrationContent += `\\n`;
    }
    
    // 4. Adicionar views se existirem
    const viewsResult = await pool.query(`
      SELECT table_name, view_definition
      FROM information_schema.views 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    if (viewsResult.rows.length > 0) {
      migrationContent += `-- Views\\n`;
      for (const view of viewsResult.rows) {
        migrationContent += `-- View: ${view.table_name}\\n`;
        migrationContent += `CREATE OR REPLACE VIEW ${view.table_name} AS\\n${view.view_definition};\\n\\n`;
      }
    }
    
    // 5. Salvar migration
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const migrationFile = `000_complete_production_setup_${timestamp}.sql`;
    
    fs.writeFileSync(path.join(migrationsDir, migrationFile), migrationContent);
    
    console.log(`\\n✅ Migration criada: ${migrationFile}`);
    console.log(`📁 Tamanho: ${(migrationContent.length / 1024).toFixed(2)} KB`);
    
    // 6. Criar script de sincronização para produção
    const syncScript = `#!/bin/bash
# Script para aplicar migrations em produção
# IMPORTANTE: Execute este script em produção para sincronizar o banco

echo "🚀 Iniciando sincronização de migrations para produção..."

# Aplicar migration principal
node sync-migrations-to-production.js production

echo "✅ Sincronização concluída!"
echo "🔍 Verificar logs acima para confirmar que todas as migrations foram aplicadas com sucesso"
`;

    fs.writeFileSync('./deploy-migrations-to-production.sh', syncScript);
    fs.chmodSync('./deploy-migrations-to-production.sh', '755');
    
    console.log(`\\n📜 Script de deploy criado: deploy-migrations-to-production.sh`);
    console.log(`\\n🎯 Para aplicar em produção:`);
    console.log(`   1. Suba os arquivos para o servidor de produção`);
    console.log(`   2. Execute: ./deploy-migrations-to-production.sh`);
    console.log(`   3. Verifique os logs para confirmar sucesso`);
    
  } catch (error) {
    console.error('❌ Erro ao gerar migrations:', error.message);
  } finally {
    await pool.end();
  }
}

generateProductionMigrations();