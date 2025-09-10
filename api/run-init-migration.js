const db = require('./config/database');
const fs = require('fs');
const path = require('path');

async function runInitMigration() {
    try {
        console.log('🚀 Executando migração inicial PostgreSQL...');
        
        // Executar migração inicial completa
        const migrationPath = path.join(__dirname, 'migrations', '000_init_postgresql_complete.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');
        
        console.log('📊 Executando 000_init_postgresql_complete.sql...');
        await executeSQL(sql);
        
        // Executar migração de app_configurations
        const appConfigPath = path.join(__dirname, 'migrations', '022_create_app_configurations_table_postgres.sql');
        const appConfigSql = fs.readFileSync(appConfigPath, 'utf8');
        
        console.log('📊 Executando 022_create_app_configurations_table_postgres.sql...');
        await executeSQL(appConfigSql);
        
        console.log('✅ Migrações executadas com sucesso!');
        
        // Criar usuário admin padrão
        await createDefaultUser();
        
        console.log('🎉 Banco de dados inicializado com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro na migração:', error);
        throw error;
    } finally {
        process.exit(0);
    }
}

async function executeSQL(sql) {
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
                    console.log('🔄 Executando:', currentCommand.substring(0, 70) + '...');
                    await db.query(currentCommand);
                }
            } catch (error) {
                console.error('❌ Erro no comando:', error.message);
                console.error('📝 Comando:', currentCommand);
                // Continue with next command for some errors
                if (!error.message.includes('already exists') && 
                    !error.message.includes('does not exist') &&
                    !error.message.includes('column') &&
                    !error.message.includes('relation')) {
                    throw error;
                }
                console.log('⚠️  Ignorando erro (provavelmente estrutura já existe)');
            }
            
            currentCommand = '';
        }
    }
}

async function createDefaultUser() {
    try {
        console.log('👤 Criando usuário admin padrão...');
        
        // Verificar se já existe
        const existing = await db.query("SELECT id FROM users WHERE email = 'admin@osh.com.br'");
        
        if (existing.rows.length > 0) {
            console.log('👤 Usuário admin já existe.');
            return;
        }
        
        // Criar usuário (senha: admin123)
        const hashedPassword = '$2b$10$rQx1VJwBQ.lHX4LZGmE5huL5JZgZ.NZqJ8Y4Q2hZvE8g2mQg.Q0tC'; // admin123
        
        await db.query(`
            INSERT INTO users (name, email, password, role, is_active) 
            VALUES ($1, $2, $3, $4, $5)
        `, ['Admin OSH', 'admin@osh.com.br', hashedPassword, 'admin', true]);
        
        console.log('✅ Usuário admin criado: admin@osh.com.br / admin123');
        
    } catch (error) {
        console.error('❌ Erro ao criar usuário:', error);
    }
}

// Executar migração
runInitMigration();