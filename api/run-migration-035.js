const db = require('./config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('🚀 Executando migração 035 - Colunas pause/resume na active_extractions...');

        const migrationPath = path.join(__dirname, 'migrations', '035_add_pause_resume_columns_to_active_extractions.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        // Dividir comandos por linha e filtrar comentários
        const lines = sql.split('\n');
        let currentCommand = '';
        let commandCount = 0;

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
                        commandCount++;
                        console.log(`Executando comando ${commandCount}:`, currentCommand.substring(0, 80) + '...');
                        await db.query(currentCommand);
                        console.log(`✅ Comando ${commandCount} executado com sucesso`);
                    }
                } catch (error) {
                    if (error.message.includes('already exists') ||
                        error.message.includes('does not exist') ||
                        error.message.includes('IF NOT EXISTS')) {
                        console.log(`⚠️ Aviso (ignorado) comando ${commandCount}:`, error.message.substring(0, 100));
                    } else {
                        console.error(`❌ Erro no comando ${commandCount}:`, error.message);
                        console.error('Comando completo:', currentCommand);
                        throw error;
                    }
                }
                currentCommand = '';
            }
        }

        console.log('✅ Migração 035 concluída com sucesso!');
        console.log(`📊 Total de comandos executados: ${commandCount}`);

        // Verificar se as colunas foram adicionadas
        console.log('🔍 Verificando se as colunas foram adicionadas...');
        try {
            const result = await db.query(`
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'active_extractions'
                AND column_name IN ('paused_at', 'resumed_at')
                ORDER BY column_name
            `);

            const columns = result.rows ? result.rows.map(row => row.column_name) : result.map(row => row.column_name);
            console.log('📋 Colunas de pause/resume encontradas:', columns);

            const expectedColumns = ['paused_at', 'resumed_at'];
            const missingColumns = expectedColumns.filter(col => !columns.includes(col));

            if (missingColumns.length === 0) {
                console.log('✅ Todas as colunas de pause/resume foram adicionadas com sucesso!');
            } else {
                console.log('⚠️ Colunas faltantes:', missingColumns);
            }
        } catch (verifyError) {
            console.log('⚠️ Erro ao verificar colunas (pode ser normal):', verifyError.message);
        }

        process.exit(0);

    } catch (error) {
        console.error('❌ Erro fatal na migração:', error);
        process.exit(1);
    }
}

runMigration();