// Script para importar backup do banco local na produção
const db = require('./config/database');
const fs = require('fs');

async function importFromLocal() {
    try {
        console.log('📥 IMPORTANDO banco local para produção...');
        
        // Verificar se arquivo de backup existe
        const backupFiles = fs.readdirSync('.')
            .filter(f => f.startsWith('backup-local-') && f.endsWith('.sql'))
            .sort()
            .reverse(); // Mais recente primeiro
            
        if (backupFiles.length === 0) {
            console.log('❌ Nenhum arquivo de backup encontrado!');
            console.log('💡 Execute primeiro: node export-local-database.js');
            process.exit(1);
        }
        
        const backupFile = backupFiles[0];
        console.log(`📄 Usando arquivo: ${backupFile}`);
        
        // Ler arquivo SQL
        const sqlContent = fs.readFileSync(backupFile, 'utf8');
        
        // Dividir em comandos SQL individuais
        const sqlCommands = sqlContent
            .split('\n')
            .filter(line => line.trim() && !line.trim().startsWith('--'))
            .join('\n')
            .split(';')
            .filter(cmd => cmd.trim())
            .map(cmd => cmd.trim() + ';');
            
        console.log(`📝 Executando ${sqlCommands.length} comandos SQL...`);
        
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < sqlCommands.length; i++) {
            const command = sqlCommands[i];
            
            if (command.trim() === ';') continue;
            
            try {
                await db.query(command);
                successCount++;
                
                if (i % 50 === 0) {
                    console.log(`⏳ Progresso: ${i}/${sqlCommands.length} comandos executados...`);
                }
            } catch (error) {
                errorCount++;
                
                // Log apenas erros críticos
                if (!error.message.includes('already exists') && 
                    !error.message.includes('duplicate key')) {
                    console.log(`⚠️ Erro no comando ${i}: ${error.message.substring(0, 100)}...`);
                }
            }
        }
        
        console.log('🎉 IMPORTAÇÃO CONCLUÍDA!');
        console.log(`✅ Comandos executados com sucesso: ${successCount}`);
        console.log(`⚠️ Comandos com erro: ${errorCount}`);
        
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
            
        } catch (e) {
            console.log('⚠️ Erro ao verificar dados:', e.message);
        }
        
        console.log('');
        console.log('🚀 PRÓXIMO PASSO:');
        console.log('Teste o login no PMS com admin@osh.com.br / admin123');
        
    } catch (error) {
        console.error('❌ ERRO NA IMPORTAÇÃO:', error);
        console.error('Details:', error.message);
        process.exit(1);
    }
    
    process.exit(0);
}

// Executar
importFromLocal();