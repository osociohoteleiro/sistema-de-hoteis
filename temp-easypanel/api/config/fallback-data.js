/**
 * SISTEMA DE FALLBACK PARA DESENVOLVIMENTO
 * 
 * Este arquivo contém dados temporários para quando o banco de dados externo
 * não está acessível. NUNCA usar em produção!
 */

const bcrypt = require('bcryptjs');

// Função para criar hash de senha
const createPasswordHash = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return await bcrypt.hash(password, salt);
};

// Dados de fallback em memória
let fallbackUsers = [];
let fallbackHotels = [];
let fallbackUserHotels = [];

const initializeFallbackData = async () => {
  if (fallbackUsers.length > 0) return; // Já inicializado
  
  console.log('🔄 Inicializando dados de fallback...');
  
  const superAdminPassword = await createPasswordHash('admin123');
  
  // Usuário super admin
  fallbackUsers.push({
    id: 1,
    uuid: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Super Admin OSH',
    email: 'superadmin@hotel.com',
    password_hash: superAdminPassword,
    user_type: 'SUPER_ADMIN',
    active: true,
    email_verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  
  // Hotel de exemplo
  fallbackHotels.push({
    id: 1,
    hotel_uuid: '0cf84c30-82cb-11f0-bd40-02420a0b00b1',
    name: 'Hotel OSH Desenvolvimento',
    hotel_nome: 'Hotel OSH Desenvolvimento',
    checkin_time: '14:00:00',
    checkout_time: '12:00:00',
    cover_image: null,
    description: 'Hotel para desenvolvimento e testes',
    address: 'Rua Exemplo, 123',
    phone: '(11) 99999-9999',
    email: 'contato@hotel-dev.com',
    website: 'https://hotel-dev.com',
    status: 'ACTIVE',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  
  // Relacionamento usuário-hotel
  fallbackUserHotels.push({
    id: 1,
    user_id: 1,
    hotel_id: 1,
    role: 'OWNER',
    permissions: JSON.stringify({
      'reports': true,
      'marketing': true,
      'settings': true,
      'users': true
    }),
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  
  console.log('✅ Dados de fallback inicializados');
};

const fallbackDatabase = {
  async query(sql, params = []) {
    await initializeFallbackData();
    
    const sqlLower = sql.toLowerCase().trim();
    
    // SELECT FROM users
    if (sqlLower.includes('select') && sqlLower.includes('from users')) {
      if (sqlLower.includes('where email = ?')) {
        return fallbackUsers.filter(u => u.email === params[0]);
      }
      if (sqlLower.includes('where id = ?')) {
        return fallbackUsers.filter(u => u.id === params[0]);
      }
      if (sqlLower.includes('where uuid = ?')) {
        return fallbackUsers.filter(u => u.uuid === params[0]);
      }
      return fallbackUsers;
    }
    
    // SELECT FROM hotels
    if (sqlLower.includes('select') && sqlLower.includes('from hotels')) {
      if (sqlLower.includes('where hotel_uuid = ?')) {
        return fallbackHotels.filter(h => h.hotel_uuid === params[0]);
      }
      if (sqlLower.includes('where id = ?')) {
        return fallbackHotels.filter(h => h.id === params[0]);
      }
      if (sqlLower.includes('join user_hotels')) {
        // Query de hotéis do usuário
        const userId = params[params.length - 1];
        const userHotel = fallbackUserHotels.find(uh => uh.user_id === userId && uh.active);
        if (userHotel) {
          const hotel = fallbackHotels.find(h => h.id === userHotel.hotel_id);
          if (hotel) {
            return [{
              ...hotel,
              role: userHotel.role,
              permissions: userHotel.permissions,
              user_active: userHotel.active
            }];
          }
        }
        return [];
      }
      return fallbackHotels;
    }
    
    // SELECT FROM user_hotels
    if (sqlLower.includes('select') && sqlLower.includes('user_hotels')) {
      if (sqlLower.includes('where uh.user_id = ?')) {
        return fallbackUserHotels.filter(uh => uh.user_id === params[0]);
      }
      return fallbackUserHotels;
    }
    
    // INSERT, UPDATE, DELETE - simular sucesso
    if (sqlLower.startsWith('insert') || sqlLower.startsWith('update') || sqlLower.startsWith('delete')) {
      return { insertId: Date.now(), affectedRows: 1 };
    }
    
    console.log(`⚠️ Fallback DB: Query não reconhecida: ${sql}`);
    return [];
  },
  
  async connect() {
    await initializeFallbackData();
    return true;
  },
  
  getStatus() {
    return {
      connected: true,
      host: 'fallback-memory',
      database: 'fallback-data'
    };
  }
};

module.exports = {
  fallbackDatabase,
  initializeFallbackData
};