const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

async function createTestUsers() {
  console.log('🚀 Criando usuários de teste...');

  try {
    // Verificar se os usuários já existem
    const existingUsers = await db.query('SELECT email FROM users WHERE email IN (?, ?, ?)', [
      'superadmin@teste.com',
      'admin@teste.com', 
      'hotel@teste.com'
    ]);

    if (existingUsers.length > 0) {
      console.log('⚠️  Alguns usuários de teste já existem:', existingUsers.map(u => u.email));
      
      // Deletar usuários existentes para recriar
      await db.query('DELETE FROM users WHERE email IN (?, ?, ?)', [
        'superadmin@teste.com',
        'admin@teste.com',
        'hotel@teste.com'
      ]);
      console.log('🗑️  Usuários existentes removidos');
    }

    // Hash da senha padrão "123456"
    const passwordHash = await bcrypt.hash('123456', 10);

    // Usuário Super Admin
    await db.query(`
      INSERT INTO users (uuid, name, email, password_hash, user_type, active, email_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      uuidv4(),
      'Super Administrator',
      'superadmin@teste.com',
      passwordHash,
      'SUPER_ADMIN',
      1,
      1
    ]);
    console.log('✅ Super Admin criado: superadmin@teste.com / 123456');

    // Usuário Admin
    await db.query(`
      INSERT INTO users (uuid, name, email, password_hash, user_type, active, email_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      uuidv4(),
      'Administrator',
      'admin@teste.com',
      passwordHash,
      'ADMIN',
      1,
      1
    ]);
    console.log('✅ Admin criado: admin@teste.com / 123456');

    // Usuário Hotel
    await db.query(`
      INSERT INTO users (uuid, name, email, password_hash, user_type, active, email_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      uuidv4(),
      'Usuário Hotel',
      'hotel@teste.com',
      passwordHash,
      'HOTEL',
      1,
      1
    ]);
    console.log('✅ Usuário Hotel criado: hotel@teste.com / 123456');

    // Verificar criação
    const createdUsers = await db.query('SELECT name, email, user_type FROM users WHERE email IN (?, ?, ?)', [
      'superadmin@teste.com',
      'admin@teste.com',
      'hotel@teste.com'
    ]);

    console.log('\n📋 Usuários de teste criados com sucesso:');
    createdUsers.forEach(user => {
      console.log(`   • ${user.name} (${user.email}) - Tipo: ${user.user_type}`);
    });

    console.log('\n🔑 Credenciais de acesso:');
    console.log('   Email: superadmin@teste.com | Senha: 123456 | Tipo: SUPER_ADMIN');
    console.log('   Email: admin@teste.com      | Senha: 123456 | Tipo: ADMIN');
    console.log('   Email: hotel@teste.com      | Senha: 123456 | Tipo: HOTEL');

  } catch (error) {
    console.error('❌ Erro ao criar usuários de teste:', error);
    process.exit(1);
  } finally {
    await db.close();
    console.log('\n✨ Script executado com sucesso!');
    process.exit(0);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  createTestUsers();
}

module.exports = { createTestUsers };