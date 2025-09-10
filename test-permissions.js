// Teste direto da API de permissões
const fetch = require('node-fetch');

async function testPermissions() {
  try {
    console.log('🧪 Testando API de permissões...');
    
    // Fazer login para obter token
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'superadmin@hotel.com',
        password: '123456'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login falhou: ${loginResponse.status}`);
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login realizado:', loginData.user.name);
    const token = loginData.token;
    
    // Testar salvar permissões para um usuário
    const userId = 11; // ID do usuário admin@hotel.com
    const newPermissions = [
      'view_pms_dashboard',
      'view_pms_rate_shopper',
      'manage_pms_rate_shopper'
    ];
    
    console.log('🔧 Salvando permissões via API...');
    console.log('👤 User ID:', userId);
    console.log('🎯 Permissões:', newPermissions);
    
    const permissionsResponse = await fetch(`http://localhost:3001/api/users/${userId}/permissions`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        permissions: newPermissions
      })
    });
    
    if (!permissionsResponse.ok) {
      const errorText = await permissionsResponse.text();
      throw new Error(`Erro ao salvar permissões: ${permissionsResponse.status} - ${errorText}`);
    }
    
    const permissionsData = await permissionsResponse.json();
    console.log('✅ Permissões salvas:', permissionsData);
    
    // Verificar se foram salvas
    console.log('🔍 Verificando permissões salvas...');
    const checkResponse = await fetch(`http://localhost:3001/api/users/${userId}/permissions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (checkResponse.ok) {
      const checkData = await checkResponse.json();
      console.log('✅ Permissões confirmadas:', checkData.permissions);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testPermissions();