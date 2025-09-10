// Script para importar tabelas que faltaram na primeira importação
const db = require('./config/database');
const fs = require('fs');

async function importMissingTables() {
    try {
        console.log('📊 IMPORTANDO tabelas que faltaram...');
        
        // Verificar se arquivo de backup existe
        const backupFiles = fs.readdirSync('.')
            .filter(f => f.startsWith('backup-local-') && f.endsWith('.sql'))
            .sort()
            .reverse();
            
        if (backupFiles.length === 0) {
            console.log('❌ Nenhum arquivo de backup encontrado!');
            process.exit(1);
        }
        
        const backupFile = backupFiles[0];
        console.log(`📄 Usando arquivo: ${backupFile}`);
        
        // Ler arquivo SQL
        const sqlContent = fs.readFileSync(backupFile, 'utf8');
        
        // Tabelas que queremos importar especificamente
        const targetTables = [
            'rate_shopper_price_history',
            'rate_shopper_searches', 
            'rate_shopper_prices',
            'rate_shopper_alerts',
            'rate_shopper_alert_history',
            'rate_shopper_configs',
            'rate_shopper_properties',
            'rate_shopper_queue',
            'rate_shopper_reports',
            'site_analytics',
            'site_bookings',
            'site_form_submissions',
            'site_media',
            'site_pages',
            'site_templates',
            'site_themes',
            'hotel_sites',
            'logo_history',
            'bot_fields',
            'onenode_bot_fields',
            'meta_available_accounts',
            'meta_connected_accounts',
            'meta_sync_logs',
            'oauth_states'
        ];
        
        console.log(`🎯 Focando em ${targetTables.length} tabelas específicas...`);
        
        // Separar comandos
        const lines = sqlContent.split('\n').filter(line => line.trim() && !line.trim().startsWith('--'));
        
        const createTableCommands = [];
        const insertCommands = [];
        
        let currentCommand = '';
        
        for (const line of lines) {
            currentCommand += line + '\n';
            
            if (line.trim().endsWith(';')) {
                const cmd = currentCommand.trim();
                
                // Verificar se é comando para uma das tabelas alvo
                const isTargetTable = targetTables.some(table => 
                    cmd.toUpperCase().includes(table.toUpperCase())
                );
                
                if (isTargetTable) {
                    if (cmd.toUpperCase().startsWith('CREATE TABLE')) {
                        createTableCommands.push(cmd);
                    } else if (cmd.toUpperCase().startsWith('INSERT')) {
                        insertCommands.push(cmd);
                    }
                }
                
                currentCommand = '';
            }
        }
        
        console.log(`📋 Comandos encontrados:`);
        console.log(`   📋 CREATE TABLE: ${createTableCommands.length}`);
        console.log(`   💾 INSERT: ${insertCommands.length}`);
        
        let totalSuccess = 0;
        let totalErrors = 0;
        
        // 1. Criar tabelas que faltaram
        console.log('📋 Criando tabelas que faltaram...');
        for (const cmd of createTableCommands) {
            try {
                await db.query(cmd);
                totalSuccess++;
                
                // Extrair nome da tabela
                const match = cmd.match(/CREATE TABLE (\w+)/i);
                if (match) {
                    console.log(`✅ Tabela criada: ${match[1]}`);
                }
            } catch (e) {
                if (e.message.includes('already exists')) {
                    console.log(`⏭️ Tabela já existe: ${e.message.substring(0, 50)}...`);
                } else {
                    console.log(`❌ Erro CREATE: ${e.message.substring(0, 80)}...`);
                }
                totalErrors++;
            }
        }
        
        // 2. Inserir dados por tabela na ordem correta
        console.log('💾 Inserindo dados das tabelas...');
        
        const insertOrder = [
            'rate_shopper_properties',
            'rate_shopper_configs', 
            'rate_shopper_searches',
            'rate_shopper_prices',
            'rate_shopper_price_history',
            'rate_shopper_alerts',
            'rate_shopper_alert_history',
            'rate_shopper_reports',
            'rate_shopper_queue',
            'logo_history',
            'hotel_sites',
            'site_templates',
            'site_themes', 
            'site_pages',
            'site_media',
            'site_bookings',
            'site_form_submissions',
            'site_analytics',
            'bot_fields',
            'onenode_bot_fields',
            'meta_available_accounts',
            'meta_connected_accounts', 
            'meta_sync_logs',
            'oauth_states'
        ];
        
        for (const tableName of insertOrder) {
            const tableInserts = insertCommands.filter(cmd => 
                cmd.toUpperCase().includes(`INSERT INTO ${tableName.toUpperCase()}`)
            );
            
            if (tableInserts.length > 0) {
                console.log(`💾 Inserindo ${tableName}: ${tableInserts.length} registros`);
                
                let tableSuccess = 0;
                let tableErrors = 0;
                
                for (const cmd of tableInserts) {
                    try {
                        await db.query(cmd);
                        tableSuccess++;
                        totalSuccess++;
                    } catch (e) {
                        if (!e.message.includes('duplicate key') && 
                            !e.message.includes('already exists')) {
                            console.log(`   ⚠️ ${e.message.substring(0, 60)}...`);
                        }
                        tableErrors++;
                        totalErrors++;
                    }
                }
                
                console.log(`   ✅ ${tableSuccess} inseridos, ⚠️ ${tableErrors} erros`);
            } else {
                console.log(`⏭️ ${tableName}: nenhum dado encontrado`);
            }
        }
        
        console.log('🎉 IMPORTAÇÃO DE TABELAS FALTANTES CONCLUÍDA!');
        console.log(`✅ Comandos executados com sucesso: ${totalSuccess}`);
        console.log(`⚠️ Comandos com erro: ${totalErrors}`);
        
        // Verificar dados específicos do RateShopper
        console.log('🔍 Verificando dados do RateShopper...');
        
        try {
            const searches = await db.query('SELECT COUNT(*) as total FROM rate_shopper_searches');
            console.log(`🔍 Buscas RateShopper: ${searches[0].total}`);
            
            const prices = await db.query('SELECT COUNT(*) as total FROM rate_shopper_prices');
            console.log(`💰 Preços RateShopper: ${prices[0].total}`);
            
            const priceHistory = await db.query('SELECT COUNT(*) as total FROM rate_shopper_price_history');
            console.log(`📈 Histórico de preços: ${priceHistory[0].total}`);
            
            const properties = await db.query('SELECT COUNT(*) as total FROM rate_shopper_properties');
            console.log(`🏨 Propriedades monitoradas: ${properties[0].total}`);
            
            const configs = await db.query('SELECT COUNT(*) as total FROM rate_shopper_configs');
            console.log(`⚙️ Configurações: ${configs[0].total}`);
            
        } catch (e) {
            console.log('⚠️ Erro ao verificar RateShopper:', e.message);
        }
        
        console.log('');
        console.log('🎉 TUDO IMPORTADO!');
        console.log('📊 Dados do RateShopper e todas as outras tabelas agora estão disponíveis!');
        
    } catch (error) {
        console.error('❌ ERRO NA IMPORTAÇÃO:', error);
        console.error('Details:', error.message);
        process.exit(1);
    }
    
    process.exit(0);
}

// Executar
importMissingTables();