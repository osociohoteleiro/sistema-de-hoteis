const User = require('./models/User');

async function createLimitedUser() {
  try {
    console.log('👤 Criando usuário com permissões limitadas...');
    
    // Verificar se já existe
    const existing = await User.findByEmail('usuario@hotel.com');
    if (existing) {
      console.log('✅ Usuário limitado já existe');
      // Atualizar suas permissões
      const limitedPermissions = [
        'view_pms', // Pode acessar o PMS
        'view_pms_calendar' // Mas só pode ver calendário
      ];
      
      await existing.setPermissions(limitedPermissions);
      console.log('✅ Permissões limitadas definidas:', limitedPermissions);
      return;
    }
    
    // Criar usuário com permissões limitadas
    const user = new User({
      name: 'Usuário Limitado',
      email: 'usuario@hotel.com',
      user_type: 'HOTEL',
      active: true,
      email_verified: true
    });
    
    await user.setPassword('123456');
    await user.save();
    
    console.log('✅ Usuário criado:', user.toJSON());
    
    // Dar apenas algumas permissões
    const limitedPermissions = [
      'view_pms', // Pode acessar o PMS
      'view_pms_calendar' // Mas só pode ver calendário
      // NÃO tem: manage_pms_reservations, view_pms_rate_shopper, etc
    ];
    
    await user.setPermissions(limitedPermissions);
    console.log('✅ Permissões limitadas definidas:', limitedPermissions);
    console.log('📧 Email: usuario@hotel.com');
    console.log('🔐 Senha: 123456');
    console.log('⚠️ Este usuário pode acessar o PMS mas terá "Acesso Negado" em muitas páginas');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

createLimitedUser();