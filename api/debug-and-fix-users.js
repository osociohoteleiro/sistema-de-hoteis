// Script para debugar e corrigir tabela users
const db = require('./config/database');

async function debugAndFixUsers() {
    try {
        console.log('🔍 DEBUGGING: Verificando estrutura da tabela users...');
        
        // 1. Verificar estrutura da tabela
        const structure = await db.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            ORDER BY ordinal_position
        `);
        
        console.log('📊 Estrutura atual da tabela users:');
        console.table(structure.rows);
        
        // 2. Verificar dados existentes
        const users = await db.query('SELECT id, email, password, password_hash FROM users LIMIT 5');
        console.log('👤 Usuários existentes:');
        console.table(users.rows);
        
        // 3. Verificar se existe password_hash mas não password
        const hasPasswordHash = structure.rows.some(row => row.column_name === 'password_hash');
        const hasPassword = structure.rows.some(row => row.column_name === 'password');
        
        console.log(`🔑 Tem coluna 'password': ${hasPassword}`);
        console.log(`🔑 Tem coluna 'password_hash': ${hasPasswordHash}`);
        
        // 4. Se tem password_hash mas não password, copiar dados
        if (hasPasswordHash && hasPassword) {
            console.log('🔄 Copiando dados de password para password_hash...');
            await db.query(`
                UPDATE users 
                SET password_hash = password 
                WHERE password_hash IS NULL AND password IS NOT NULL
            `);
            console.log('✅ Dados copiados de password para password_hash');
        }
        
        // 5. Se não tem password mas tem password_hash, criar coluna password
        if (hasPasswordHash && !hasPassword) {
            console.log('🔄 Criando coluna password e copiando de password_hash...');
            await db.query(`ALTER TABLE users ADD COLUMN password VARCHAR(255)`);
            await db.query(`
                UPDATE users 
                SET password = password_hash 
                WHERE password IS NULL AND password_hash IS NOT NULL
            `);
            console.log('✅ Coluna password criada e dados copiados');
        }
        
        // 6. Garantir que admin tem senha correta em ambas as colunas
        console.log('🔑 Atualizando senha do admin em todas as colunas...');
        const adminPassword = '$2b$10$rQx1VJwBQ.lHX4LZGmE5huL5JZgZ.NZqJ8Y4Q2hZvE8g2mQg.Q0tC'; // admin123
        
        if (hasPassword && hasPasswordHash) {
            await db.query(`
                UPDATE users 
                SET password = $1, password_hash = $1, role = 'admin', is_active = true
                WHERE email = 'admin@osh.com.br'
            `, [adminPassword]);
        } else if (hasPassword) {
            await db.query(`
                UPDATE users 
                SET password = $1, role = 'admin', is_active = true
                WHERE email = 'admin@osh.com.br'
            `, [adminPassword]);
        } else if (hasPasswordHash) {
            await db.query(`
                UPDATE users 
                SET password_hash = $1, role = 'admin', is_active = true
                WHERE email = 'admin@osh.com.br'
            `, [adminPassword]);
        }
        
        console.log('✅ Senha do admin atualizada');
        
        // 7. Verificar resultado final
        const adminUser = await db.query(`
            SELECT id, email, password, password_hash, role, is_active 
            FROM users 
            WHERE email = 'admin@osh.com.br'
        `);
        
        console.log('👤 Usuário admin final:');
        console.table(adminUser.rows);
        
        console.log('🎉 DEBUG E CORREÇÃO CONCLUÍDOS!');
        console.log('👤 Login: admin@osh.com.br');
        console.log('🔑 Senha: admin123');
        
    } catch (error) {
        console.error('❌ ERRO NO DEBUG:', error);
        console.error('Details:', error.message);
        process.exit(1);
    }
    
    process.exit(0);
}

// Executar
debugAndFixUsers();