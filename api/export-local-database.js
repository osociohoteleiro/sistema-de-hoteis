// Script para exportar banco local e gerar SQL para importar na produção
const db = require('./config/database');
const fs = require('fs');

async function exportLocalDatabase() {
    try {
        console.log('📦 EXPORTANDO banco local para produção...');
        
        let sqlOutput = '';
        
        // Função para adicionar SQL ao output
        function addSQL(sql) {
            sqlOutput += sql + '\n\n';
        }
        
        // 1. Começar com DROP e criação das tabelas
        console.log('🗑️ Gerando comandos DROP...');
        addSQL('-- EXPORT DO BANCO LOCAL OSH');
        addSQL('-- Gerado automaticamente em ' + new Date().toISOString());
        addSQL('');
        addSQL('-- Remover tabelas existentes');
        addSQL('DROP TABLE IF EXISTS user_permissions CASCADE;');
        addSQL('DROP TABLE IF EXISTS user_hotels CASCADE;');
        addSQL('DROP TABLE IF EXISTS site_analytics CASCADE;');
        addSQL('DROP TABLE IF EXISTS site_bookings CASCADE;');
        addSQL('DROP TABLE IF EXISTS site_form_submissions CASCADE;');
        addSQL('DROP TABLE IF EXISTS site_media CASCADE;');
        addSQL('DROP TABLE IF EXISTS site_pages CASCADE;');
        addSQL('DROP TABLE IF EXISTS site_templates CASCADE;');
        addSQL('DROP TABLE IF EXISTS site_themes CASCADE;');
        addSQL('DROP TABLE IF EXISTS hotel_sites CASCADE;');
        addSQL('DROP TABLE IF EXISTS rate_shopper_alert_history CASCADE;');
        addSQL('DROP TABLE IF EXISTS rate_shopper_alerts CASCADE;');
        addSQL('DROP TABLE IF EXISTS rate_shopper_configs CASCADE;');
        addSQL('DROP TABLE IF EXISTS rate_shopper_price_history CASCADE;');
        addSQL('DROP TABLE IF EXISTS rate_shopper_prices CASCADE;');
        addSQL('DROP TABLE IF EXISTS rate_shopper_properties CASCADE;');
        addSQL('DROP TABLE IF EXISTS rate_shopper_queue CASCADE;');
        addSQL('DROP TABLE IF EXISTS rate_shopper_reports CASCADE;');
        addSQL('DROP TABLE IF EXISTS rate_shopper_searches CASCADE;');
        addSQL('DROP TABLE IF EXISTS meta_available_accounts CASCADE;');
        addSQL('DROP TABLE IF EXISTS meta_connected_accounts CASCADE;');
        addSQL('DROP TABLE IF EXISTS meta_sync_logs CASCADE;');
        addSQL('DROP TABLE IF EXISTS oauth_states CASCADE;');
        addSQL('DROP TABLE IF EXISTS logo_history CASCADE;');
        addSQL('DROP TABLE IF EXISTS bot_fields CASCADE;');
        addSQL('DROP TABLE IF EXISTS onenode_bot_fields CASCADE;');
        addSQL('DROP TABLE IF EXISTS flows CASCADE;');
        addSQL('DROP TABLE IF EXISTS bots CASCADE;');
        addSQL('DROP TABLE IF EXISTS folders CASCADE;');
        addSQL('DROP TABLE IF EXISTS workspaces CASCADE;');
        addSQL('DROP TABLE IF EXISTS app_config CASCADE;');
        addSQL('DROP TABLE IF EXISTS app_configurations CASCADE;');
        addSQL('DROP TABLE IF EXISTS hotels CASCADE;');
        addSQL('DROP TABLE IF EXISTS users CASCADE;');
        
        // 2. Habilitar extensões
        console.log('🔧 Habilitando extensões...');
        addSQL('-- Habilitar extensões necessárias');
        addSQL('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
        
        // 3. Obter estrutura de todas as tabelas
        console.log('📋 Exportando estrutura das tabelas...');
        
        const tables = await db.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `);
        
        addSQL('-- CRIAÇÃO DAS TABELAS');
        
        for (const table of tables) {
            const tableName = table.table_name;
            console.log(`📝 Exportando estrutura: ${tableName}`);
            
            // Obter definição da tabela
            const columns = await db.query(`
                SELECT 
                    column_name,
                    data_type,
                    is_nullable,
                    column_default,
                    character_maximum_length,
                    numeric_precision,
                    numeric_scale
                FROM information_schema.columns 
                WHERE table_name = $1 
                ORDER BY ordinal_position
            `, [tableName]);
            
            // Gerar CREATE TABLE
            let createTableSQL = `CREATE TABLE ${tableName} (\n`;
            const columnDefs = [];
            
            for (const col of columns) {
                let colDef = `    ${col.column_name} `;
                
                // Tipo da coluna
                if (col.data_type === 'character varying') {
                    colDef += `VARCHAR(${col.character_maximum_length || 255})`;
                } else if (col.data_type === 'timestamp without time zone') {
                    colDef += 'TIMESTAMP';
                } else if (col.data_type === 'time without time zone') {
                    colDef += 'TIME';
                } else {
                    colDef += col.data_type.toUpperCase();
                }
                
                // NOT NULL
                if (col.is_nullable === 'NO') {
                    colDef += ' NOT NULL';
                }
                
                // DEFAULT
                if (col.column_default) {
                    let defaultVal = col.column_default;
                    // Ajustar defaults específicos
                    if (defaultVal.includes('nextval')) {
                        // SERIAL columns
                    } else if (defaultVal.includes('uuid_generate_v4')) {
                        colDef += ' DEFAULT gen_random_uuid()';
                    } else if (defaultVal.includes('now()')) {
                        colDef += ' DEFAULT NOW()';
                    } else {
                        colDef += ` DEFAULT ${defaultVal}`;
                    }
                }
                
                columnDefs.push(colDef);
            }
            
            createTableSQL += columnDefs.join(',\n') + '\n);';
            addSQL(createTableSQL);
            
            // Obter constraints e índices
            const constraints = await db.query(`
                SELECT constraint_name, constraint_type
                FROM information_schema.table_constraints 
                WHERE table_name = $1
            `, [tableName]);
            
            for (const constraint of constraints) {
                if (constraint.constraint_type === 'PRIMARY KEY') {
                    const pkCols = await db.query(`
                        SELECT column_name
                        FROM information_schema.key_column_usage
                        WHERE constraint_name = $1
                    `, [constraint.constraint_name]);
                    
                    const pkColumns = pkCols.map(c => c.column_name).join(', ');
                    addSQL(`ALTER TABLE ${tableName} ADD PRIMARY KEY (${pkColumns});`);
                }
            }
        }
        
        // 4. Exportar dados
        console.log('📊 Exportando dados...');
        addSQL('-- DADOS DAS TABELAS');
        
        for (const table of tables) {
            const tableName = table.table_name;
            console.log(`💾 Exportando dados: ${tableName}`);
            
            const data = await db.query(`SELECT * FROM ${tableName}`);
            
            if (data.length > 0) {
                addSQL(`-- Dados da tabela ${tableName}`);
                
                // Obter nomes das colunas
                const columns = Object.keys(data[0]);
                const columnNames = columns.join(', ');
                
                for (const row of data) {
                    const values = columns.map(col => {
                        const val = row[col];
                        if (val === null) return 'NULL';
                        if (typeof val === 'string') {
                            return "'" + val.replace(/'/g, "''") + "'";
                        }
                        if (typeof val === 'boolean') return val;
                        if (val instanceof Date) {
                            return "'" + val.toISOString() + "'";
                        }
                        if (typeof val === 'object') {
                            return "'" + JSON.stringify(val).replace(/'/g, "''") + "'";
                        }
                        return val;
                    }).join(', ');
                    
                    addSQL(`INSERT INTO ${tableName} (${columnNames}) VALUES (${values});`);
                }
                addSQL('');
            }
        }
        
        // 5. Salvar arquivo SQL
        const filename = `backup-local-${Date.now()}.sql`;
        fs.writeFileSync(filename, sqlOutput);
        
        console.log('🎉 EXPORT CONCLUÍDO!');
        console.log(`📄 Arquivo gerado: ${filename}`);
        console.log(`📏 Tamanho: ${(fs.statSync(filename).size / 1024 / 1024).toFixed(2)} MB`);
        console.log('');
        console.log('🚀 PRÓXIMOS PASSOS:');
        console.log('1. Copie o arquivo SQL para o servidor EasyPanel');
        console.log('2. Execute: psql -U osh_user -d osh_db -f ' + filename);
        console.log('3. Teste o login no PMS');
        
    } catch (error) {
        console.error('❌ ERRO NO EXPORT:', error);
        console.error('Details:', error.message);
        process.exit(1);
    }
    
    process.exit(0);
}

// Executar
exportLocalDatabase();