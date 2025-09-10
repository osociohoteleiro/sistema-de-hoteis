const User = require('./models/User');

async function updateTestPermissions() {
  try {
    console.log('🔧 Atualizando permissões do usuário teste...');
    
    const user = await User.findByEmail('admin@hotel.com');
    if (!user) {
      console.log('❌ Usuário não encontrado');
      process.exit(1);
    }
    
    // Permissões corretas baseadas no AuthContext do PMS
    const correctPermissions = [
      'view_pms', // Para acessar o PMS
      'view_pms_calendar', // Para acessar calendário
      'manage_pms_reservations', // Para acessar reservas
      'view_pms_rate_shopper', // Para acessar rate shopper
      'manage_pms_rate_shopper', // Para gerenciar rate shopper
      'manage_pms_rooms', // Para acessar quartos
      'manage_pms_guests', // Para acessar hóspedes
      'view_pms_financials', // Para acessar financeiro
      'view_pms_reports' // Para acessar relatórios
    ];
    
    await user.setPermissions(correctPermissions);
    console.log('✅ Permissões atualizadas:', correctPermissions);
    
    // Verificar permissões salvas
    const savedPermissions = await user.getPermissions();
    console.log('✅ Permissões confirmadas no banco:', savedPermissions);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

updateTestPermissions();