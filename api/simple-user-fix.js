// Script SUPER SIMPLES para corrigir usuário admin
const db = require('./config/database');

async function simpleUserFix() {
    try {
        console.log('🔧 CORREÇÃO SIMPLES: Garantindo usuário admin funciona...');
        
        // 1. Tentar atualizar com password
        try {
            console.log('🔄 Tentando atualizar com campo "password"...');
            const result1 = await db.query(`
                UPDATE users 
                SET password = $1, role = 'admin', is_active = true
                WHERE email = 'admin@osh.com.br'
            `, ['$2b$10$rQx1VJwBQ.lHX4LZGmE5huL5JZgZ.NZqJ8Y4Q2hZvE8g2mQg.Q0tC']);
            
            console.log('✅ Campo "password" atualizado, linhas afetadas:', result1.rowCount);
        } catch (error) {
            console.log('⚠️ Campo "password" falhou:', error.message);
        }
        
        // 2. Tentar atualizar com password_hash
        try {
            console.log('🔄 Tentando atualizar com campo "password_hash"...');
            const result2 = await db.query(`
                UPDATE users 
                SET password_hash = $1, role = 'admin', is_active = true
                WHERE email = 'admin@osh.com.br'
            `, ['$2b$10$rQx1VJwBQ.lHX4LZGmE5huL5JZgZ.NZqJ8Y4Q2hZvE8g2mQg.Q0tC']);
            
            console.log('✅ Campo "password_hash" atualizado, linhas afetadas:', result2.rowCount);
        } catch (error) {
            console.log('⚠️ Campo "password_hash" falhou:', error.message);
        }
        
        // 3. Verificar se usuário existe
        try {
            const user = await db.query(`SELECT email, role, is_active FROM users WHERE email = 'admin@osh.com.br'`);
            if (user.rows && user.rows.length > 0) {
                console.log('✅ Usuário admin encontrado:', user.rows[0]);
            } else {
                console.log('❌ Usuário admin não encontrado!');
                
                // Tentar criar o usuário
                console.log('🔄 Tentando criar usuário admin...');
                try {
                    await db.query(`
                        INSERT INTO users (name, email, password, role, is_active) 
                        VALUES ('Admin OSH', 'admin@osh.com.br', $1, 'admin', true)
                    `, ['$2b$10$rQx1VJwBQ.lHX4LZGmE5huL5JZgZ.NZqJ8Y4Q2hZvE8g2mQg.Q0tC']);
                    console.log('✅ Usuário admin criado com password');
                } catch (createError) {
                    console.log('⚠️ Criar com password falhou:', createError.message);
                    
                    try {
                        await db.query(`
                            INSERT INTO users (name, email, password_hash, role, is_active) 
                            VALUES ('Admin OSH', 'admin@osh.com.br', $1, 'admin', true)
                        `, ['$2b$10$rQx1VJwBQ.lHX4LZGmE5huL5JZgZ.NZqJ8Y4Q2hZvE8g2mQg.Q0tC']);
                        console.log('✅ Usuário admin criado com password_hash');
                    } catch (createError2) {
                        console.log('❌ Falhou criar com password_hash também:', createError2.message);
                    }
                }
            }
        } catch (error) {
            console.log('❌ Erro ao verificar usuário:', error.message);
        }
        
        console.log('🎉 CORREÇÃO SIMPLES CONCLUÍDA!');
        console.log('👤 Login: admin@osh.com.br');
        console.log('🔑 Senha: admin123');
        
    } catch (error) {
        console.error('❌ ERRO GERAL:', error);
        console.error('Details:', error.message);
        process.exit(1);
    }
    
    process.exit(0);
}

// Executar
simpleUserFix();