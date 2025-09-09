const db = require('../config/database');
const bcrypt = require('bcrypt');

async function createTestUser() {
  try {
    console.log('🔄 Conectando ao banco de dados...');
    await db.connect();
    
    const email = 'admin@hotel.com';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Verificar se usuário já existe
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    if (existingUser.length > 0) {
      console.log('⚠️  Usuário de teste já existe!');
      console.log('📧 Email:', email);
      console.log('🔑 Senha:', password);
      await db.close();
      process.exit(0);
    }
    
    // Criar usuário
    const result = await db.query(`
      INSERT INTO users (name, email, password_hash, user_type, active) 
      VALUES (?, ?, ?, ?, ?)
    `, ['Admin Teste', email, hashedPassword, 'SUPER_ADMIN', true]);
    
    console.log('✅ Usuário de teste criado com sucesso!');
    console.log('📧 Email:', email);
    console.log('🔑 Senha:', password);
    console.log('👤 ID:', result.insertId);
    
    await db.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error.message);
    await db.close();
    process.exit(1);
  }
}

createTestUser();