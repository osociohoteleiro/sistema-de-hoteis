const User = require('./models/User');

async function createTestUser() {
  try {
    console.log('👤 Criando usuário teste...');
    
    // Verificar se já existe
    const existing = await User.findByEmail('admin@hotel.com');
    if (existing) {
      console.log('✅ Usuário admin@hotel.com já existe:', existing.toJSON());
      
      // Verificar suas permissões atuais
      const permissions = await existing.getPermissions();
      console.log('🔐 Permissões atuais:', permissions);
      
      return;
    }
    
    // Criar usuário admin
    const user = new User({
      name: 'Admin Teste',
      email: 'admin@hotel.com',
      user_type: 'ADMIN',
      active: true,
      email_verified: true
    });
    
    await user.setPassword('123456');
    await user.save();
    
    console.log('✅ Usuário criado:', user.toJSON());
    
    // Adicionar algumas permissões de teste
    const testPermissions = [
      'view_pms_dashboard',
      'view_pms_calendario',
      'manage_pms_reservas',
      'view_pms_rate_shopper'
    ];
    
    await user.setPermissions(testPermissions);
    console.log('✅ Permissões adicionadas:', testPermissions);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

createTestUser();