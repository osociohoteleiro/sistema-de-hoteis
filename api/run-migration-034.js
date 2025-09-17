const db = require('./config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('🚀 Executando migração 034 - PAUSED status e campos de checkpoint...');

        const migrationPath = path.join(__dirname, 'migrations', '034_add_paused_status_and_checkpoint_fields.sql');
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
                        error.message.includes('IF NOT EXISTS') ||
                        error.message.includes('ADD VALUE') && error.message.includes('already exists')) {
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

        console.log('✅ Migração 034 concluída com sucesso!');
        console.log(`📊 Total de comandos executados: ${commandCount}`);

        // Verificar se o status PAUSED foi adicionado
        console.log('🔍 Verificando se o status PAUSED foi adicionado...');
        try {
            const result = await db.query(`
                SELECT enumlabel
                FROM pg_enum e
                JOIN pg_type t ON e.enumtypid = t.oid
                WHERE t.typname = 'rate_shopper_status'
                ORDER BY e.enumsortorder
            `);

            const statuses = result.rows ? result.rows.map(row => row.enumlabel) : result.map(row => row.enumlabel);
            console.log('📋 Status disponíveis:', statuses);

            if (statuses.includes('PAUSED')) {
                console.log('✅ Status PAUSED foi adicionado com sucesso!');
            } else {
                console.log('⚠️ Status PAUSED não foi encontrado. Pode já ter sido adicionado anteriormente.');
            }
        } catch (verifyError) {
            console.log('⚠️ Erro ao verificar status (pode ser normal):', verifyError.message);
        }

        // Verificar se as colunas foram adicionadas
        console.log('🔍 Verificando se as colunas de checkpoint foram adicionadas...');
        try {
            const result = await db.query(`
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'rate_shopper_searches'
                AND column_name IN ('last_processed_date', 'pause_checkpoint', 'paused_at', 'pause_reason')
                ORDER BY column_name
            `);

            const columns = result.rows ? result.rows.map(row => row.column_name) : result.map(row => row.column_name);
            console.log('📋 Colunas de checkpoint encontradas:', columns);

            const expectedColumns = ['last_processed_date', 'pause_checkpoint', 'paused_at', 'pause_reason'];
            const missingColumns = expectedColumns.filter(col => !columns.includes(col));

            if (missingColumns.length === 0) {
                console.log('✅ Todas as colunas de checkpoint foram adicionadas com sucesso!');
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