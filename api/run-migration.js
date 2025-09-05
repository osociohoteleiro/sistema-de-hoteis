const db = require('./config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('🚀 Executando migração Rate Shopper...');
        
        const migrationPath = path.join(__dirname, 'migrations', '007_rate_shopper_tables_postgres.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');
        
        // Dividir comandos por linha e filtrar comentários
        const lines = sql.split('\n');
        let currentCommand = '';
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            // Pular comentários e linhas vazias
            if (trimmedLine.startsWith('--') || trimmedLine === '') {
                continue;
            }
            
            currentCommand += line + '\n';
            
            // Executar comando quando encontrar ;
            if (trimmedLine.endsWith(';')) {
                try {
                    if (currentCommand.trim()) {
                        console.log('Executando:', currentCommand.substring(0, 50) + '...');
                        await db.query(currentCommand);
                    }
                } catch (error) {
                    if (!error.message.includes('already exists') && 
                        !error.message.includes('does not exist') &&
                        !error.message.includes('relation') &&
                        !error.message.includes('type') &&
                        !error.message.includes('extension')) {
                        console.error('Erro ao executar comando:', error.message);
                        console.error('Comando:', currentCommand.substring(0, 100));
                    } else {
                        console.log('⚠️ Aviso (ignorado):', error.message.substring(0, 100));
                    }
                }
                currentCommand = '';
            }
        }
        
        console.log('✅ Migração concluída com sucesso!');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Erro na migração:', error);
        process.exit(1);
    }
}

runMigration();