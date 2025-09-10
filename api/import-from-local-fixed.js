// Script para importar backup do banco local na produção (VERSÃO CORRIGIDA)
const db = require('./config/database');
const fs = require('fs');

async function importFromLocalFixed() {
    try {
        console.log('📥 IMPORTANDO banco local para produção (VERSÃO CORRIGIDA)...');
        
        // Verificar se arquivo de backup existe
        const backupFiles = fs.readdirSync('.')
            .filter(f => f.startsWith('backup-local-') && f.endsWith('.sql'))
            .sort()
            .reverse(); // Mais recente primeiro
            
        if (backupFiles.length === 0) {
            console.log('❌ Nenhum arquivo de backup encontrado!');
            process.exit(1);
        }
        
        const backupFile = backupFiles[0];
        console.log(`📄 Usando arquivo: ${backupFile}`);
        
        // Ler arquivo SQL
        const sqlContent = fs.readFileSync(backupFile, 'utf8');
        
        // Separar comandos por tipo
        const lines = sqlContent.split('\n').filter(line => line.trim() && !line.trim().startsWith('--'));
        
        const dropCommands = [];
        const extensionCommands = [];
        const createTableCommands = [];
        const alterCommands = [];
        const insertCommands = [];
        
        let currentCommand = '';
        let commandType = '';
        
        for (const line of lines) {
            currentCommand += line + '\n';
            
            if (line.trim().endsWith(';')) {
                const cmd = currentCommand.trim();
                
                if (cmd.toUpperCase().startsWith('DROP')) {
                    dropCommands.push(cmd);
                } else if (cmd.toUpperCase().includes('CREATE EXTENSION')) {
                    extensionCommands.push(cmd);
                } else if (cmd.toUpperCase().startsWith('CREATE TABLE')) {
                    createTableCommands.push(cmd);
                } else if (cmd.toUpperCase().startsWith('ALTER TABLE')) {
                    alterCommands.push(cmd);
                } else if (cmd.toUpperCase().startsWith('INSERT')) {
                    insertCommands.push(cmd);
                }
                
                currentCommand = '';
            }
        }
        
        console.log(`📊 Comandos organizados:`);
        console.log(`   🗑️ DROP: ${dropCommands.length}`);
        console.log(`   🔧 EXTENSION: ${extensionCommands.length}`);
        console.log(`   📋 CREATE TABLE: ${createTableCommands.length}`);
        console.log(`   🔗 ALTER TABLE: ${alterCommands.length}`);
        console.log(`   💾 INSERT: ${insertCommands.length}`);
        
        // Executar na ordem correta
        let totalSuccess = 0;
        let totalErrors = 0;
        
        // 1. DROP commands
        console.log('🗑️ Executando comandos DROP...');
        for (const cmd of dropCommands) {
            try {
                await db.query(cmd);
                totalSuccess++;
            } catch (e) {
                if (!e.message.includes('does not exist')) {
                    console.log(`⚠️ DROP error: ${e.message.substring(0, 80)}...`);
                }
                totalErrors++;
            }
        }
        
        // 2. EXTENSION commands
        console.log('🔧 Habilitando extensões...');
        for (const cmd of extensionCommands) {
            try {
                await db.query(cmd);
                totalSuccess++;
            } catch (e) {
                console.log(`⚠️ EXTENSION error: ${e.message.substring(0, 80)}...`);
                totalErrors++;
            }
        }
        
        // 3. CREATE TABLE commands
        console.log('📋 Criando tabelas...');
        for (const cmd of createTableCommands) {
            try {
                await db.query(cmd);
                totalSuccess++;
            } catch (e) {
                if (!e.message.includes('already exists')) {
                    console.log(`⚠️ CREATE error: ${e.message.substring(0, 80)}...`);
                }
                totalErrors++;
            }
        }
        
        // 4. ALTER TABLE commands
        console.log('🔗 Aplicando constraints...');
        for (const cmd of alterCommands) {
            try {
                await db.query(cmd);
                totalSuccess++;
            } catch (e) {
                if (!e.message.includes('already exists')) {
                    console.log(`⚠️ ALTER error: ${e.message.substring(0, 80)}...`);
                }
                totalErrors++;
            }
        }
        
        // 5. INSERT commands (com retry)
        console.log('💾 Inserindo dados...');
        const insertOrder = [
            'users', 'hotels', 'workspaces', 'folders', 'bots', 'flows',
            'user_hotels', 'user_permissions', 'app_configurations',
            'app_config', 'bot_fields', 'onenode_bot_fields',
            'logo_history', 'hotel_sites', 'site_templates', 'site_themes',
            'site_pages', 'site_media', 'site_bookings', 'site_form_submissions',
            'site_analytics', 'rate_shopper_properties', 'rate_shopper_configs',
            'rate_shopper_searches', 'rate_shopper_prices', 'rate_shopper_price_history',
            'rate_shopper_alerts', 'rate_shopper_alert_history', 'rate_shopper_reports',
            'rate_shopper_queue', 'meta_available_accounts', 'meta_connected_accounts',
            'meta_sync_logs', 'oauth_states'
        ];
        
        for (const tableName of insertOrder) {
            const tableInserts = insertCommands.filter(cmd => 
                cmd.toUpperCase().includes(`INSERT INTO ${tableName.toUpperCase()}`)
            );
            
            if (tableInserts.length > 0) {
                console.log(`💾 Inserindo dados: ${tableName} (${tableInserts.length} registros)`);
                
                for (const cmd of tableInserts) {
                    try {
                        await db.query(cmd);
                        totalSuccess++;
                    } catch (e) {
                        if (!e.message.includes('duplicate key') && 
                            !e.message.includes('already exists')) {
                            console.log(`⚠️ INSERT ${tableName}: ${e.message.substring(0, 80)}...`);
                        }
                        totalErrors++;
                    }
                }
            }
        }
        
        // Inserir comandos restantes
        const remainingInserts = insertCommands.filter(cmd => 
            !insertOrder.some(table => 
                cmd.toUpperCase().includes(`INSERT INTO ${table.toUpperCase()}`)
            )
        );
        
        if (remainingInserts.length > 0) {
            console.log(`💾 Inserindo dados restantes (${remainingInserts.length} comandos)...`);
            for (const cmd of remainingInserts) {
                try {
                    await db.query(cmd);
                    totalSuccess++;
                } catch (e) {
                    totalErrors++;
                }
            }
        }
        
        console.log('🎉 IMPORTAÇÃO CORRIGIDA CONCLUÍDA!');
        console.log(`✅ Comandos executados com sucesso: ${totalSuccess}`);
        console.log(`⚠️ Comandos com erro: ${totalErrors}`);
        
        // Verificar dados importados
        console.log('🔍 Verificando dados importados...');
        
        try {
            const users = await db.query('SELECT COUNT(*) as total FROM users');
            console.log(`👤 Usuários: ${users[0].total}`);
            
            const hotels = await db.query('SELECT COUNT(*) as total FROM hotels');
            console.log(`🏨 Hotéis: ${hotels[0].total}`);
            
            const admin = await db.query(`SELECT name, email FROM users WHERE email = 'admin@osh.com.br'`);
            if (admin.length > 0) {
                console.log(`👑 Admin encontrado: ${admin[0].name} (${admin[0].email})`);
            }
            
            const permissions = await db.query('SELECT COUNT(*) as total FROM user_permissions');
            console.log(`🔐 Permissões: ${permissions[0].total}`);
            
        } catch (e) {
            console.log('⚠️ Erro ao verificar dados:', e.message);
        }
        
        console.log('');
        console.log('🚀 TESTE AGORA:');
        console.log('Login no PMS com admin@osh.com.br / admin123');
        
    } catch (error) {
        console.error('❌ ERRO NA IMPORTAÇÃO:', error);
        console.error('Details:', error.message);
        process.exit(1);
    }
    
    process.exit(0);
}

// Executar
importFromLocalFixed();