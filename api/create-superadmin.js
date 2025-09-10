const User = require('./models/User');

async function createSuperAdmin() {
  try {
    console.log('👑 Criando Super Admin...');
    
    // Verificar se já existe
    const existing = await User.findByEmail('superadmin@hotel.com');
    if (existing) {
      console.log('✅ Super Admin já existe:', existing.toJSON());
      return;
    }
    
    // Criar super admin
    const user = new User({
      name: 'Super Administrador',
      email: 'superadmin@hotel.com',
      user_type: 'SUPER_ADMIN',
      active: true,
      email_verified: true
    });
    
    await user.setPassword('123456');
    await user.save();
    
    console.log('✅ Super Admin criado:', user.toJSON());
    console.log('📧 Email: superadmin@hotel.com');
    console.log('🔐 Senha: 123456');
    console.log('👑 Super Admin automaticamente tem todas as permissões');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

createSuperAdmin();