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

async function compareWithDatabase() {
  try {
    console.log('🔍 ANALISANDO MIGRATIONS VS BANCO ATUAL\n');

    // 1. Obter tabelas do banco atual
    const currentTablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    const currentTables = currentTablesResult.rows.map(row => row.table_name);
    
    console.log('📋 TABELAS NO BANCO ATUAL:', currentTables.length);
    console.log(currentTables.join(', '), '\n');

    // 2. Analisar migrations existentes
    const migrationsDir = './migrations';
    const migrationFiles = fs.readdirSync(migrationsDir).filter(file => file.endsWith('.sql')).sort();
    
    console.log('📂 MIGRATIONS ENCONTRADAS:', migrationFiles.length);
    console.log(migrationFiles.join('\n'), '\n');

    // 3. Analisar cada migration
    const migrationAnalysis = [];
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Extrair operações CREATE TABLE
      const createTableMatches = content.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/gi);
      const tables = createTableMatches ? createTableMatches.map(match => {
        const tableName = match.replace(/CREATE TABLE (?:IF NOT EXISTS )?/i, '').trim();
        return tableName.replace(/[`"]/g, ''); // remover aspas
      }) : [];

      // Extrair operações ALTER TABLE
      const alterTableMatches = content.match(/ALTER TABLE (\w+)/gi);
      const alters = alterTableMatches ? alterTableMatches.map(match => {
        return match.replace(/ALTER TABLE /i, '').trim();
      }) : [];

      // Extrair operações DROP
      const dropMatches = content.match(/DROP TABLE (?:IF EXISTS )?(\w+)/gi);
      const drops = dropMatches ? dropMatches.map(match => {
        return match.replace(/DROP TABLE (?:IF EXISTS )?/i, '').trim();
      }) : [];

      migrationAnalysis.push({
        file,
        tables,
        alters,
        drops,
        hasContent: content.trim().length > 0
      });
    }

    // 4. Identificar discrepâncias
    console.log('🔍 ANÁLISE DE DISCREPÂNCIAS:\n');

    // Tabelas que deveriam existir segundo as migrations
    const migrationTables = new Set();
    migrationAnalysis.forEach(migration => {
      migration.tables.forEach(table => migrationTables.add(table.toLowerCase()));
    });

    // Comparação
    const missingInMigrations = currentTables.filter(table => !migrationTables.has(table.toLowerCase()));
    const missingInDatabase = Array.from(migrationTables).filter(table => !currentTables.includes(table));

    console.log('❌ TABELAS NO BANCO MAS SEM MIGRATION:');
    if (missingInMigrations.length > 0) {
      missingInMigrations.forEach(table => console.log(`  - ${table}`));
    } else {
      console.log('  ✅ Nenhuma');
    }

    console.log('\n❌ TABELAS NAS MIGRATIONS MAS NÃO NO BANCO:');
    if (missingInDatabase.length > 0) {
      missingInDatabase.forEach(table => console.log(`  - ${table}`));
    } else {
      console.log('  ✅ Nenhuma');
    }

    // 5. Análise detalhada das migrations
    console.log('\n📋 ANÁLISE DETALHADA DAS MIGRATIONS:\n');
    
    for (const migration of migrationAnalysis) {
      console.log(`--- ${migration.file} ---`);
      console.log(`Cria tabelas: ${migration.tables.join(', ') || 'Nenhuma'}`);
      console.log(`Altera tabelas: ${migration.alters.join(', ') || 'Nenhuma'}`);
      console.log(`Remove tabelas: ${migration.drops.join(', ') || 'Nenhuma'}`);
      console.log(`Tem conteúdo: ${migration.hasContent ? 'Sim' : 'Não'}`);
      console.log('');
    }

    // 6. Recomendações
    console.log('💡 RECOMENDAÇÕES:\n');

    if (missingInMigrations.length > 0) {
      console.log('🔧 CRIAR MIGRATIONS PARA TABELAS EXISTENTES:');
      missingInMigrations.forEach((table, index) => {
        const migrationName = `0${25 + index}_create_${table}_table.sql`;
        console.log(`  - ${migrationName} para tabela "${table}"`);
      });
      console.log('');
    }

    if (missingInDatabase.length > 0) {
      console.log('🔧 VERIFICAR MIGRATIONS QUE NÃO FORAM EXECUTADAS:');
      missingInDatabase.forEach(table => {
        const relatedMigrations = migrationAnalysis
          .filter(m => m.tables.some(t => t.toLowerCase() === table.toLowerCase()))
          .map(m => m.file);
        console.log(`  - Tabela "${table}" definida em: ${relatedMigrations.join(', ')}`);
      });
      console.log('');
    }

    // 7. Verificar tipos de dados específicos (ENUMS)
    console.log('🔍 VERIFICANDO TIPOS CUSTOMIZADOS (ENUMS):\n');
    const enumsResult = await pool.query(`
      SELECT t.typname as enum_name, e.enumlabel as enum_value
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace 
      WHERE n.nspname = 'public'
      ORDER BY t.typname, e.enumsortorder;
    `);

    const enumsByType = {};
    enumsResult.rows.forEach(row => {
      if (!enumsByType[row.enum_name]) {
        enumsByType[row.enum_name] = [];
      }
      enumsByType[row.enum_name].push(row.enum_value);
    });

    console.log('Tipos ENUM no banco:');
    Object.entries(enumsByType).forEach(([enumName, values]) => {
      console.log(`  - ${enumName}: [${values.join(', ')}]`);
    });

  } catch (error) {
    console.error('❌ Erro na análise:', error.message);
  } finally {
    await pool.end();
  }
}

compareWithDatabase();