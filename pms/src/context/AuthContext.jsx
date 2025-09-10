import { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext();

// Definir tipos de usuário (compatível com API)
export const USER_TYPES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN', 
  HOTEL: 'HOTEL'
};

// Definir todas as permissões possíveis
export const PERMISSIONS = {
  // Dashboard
  VIEW_DASHBOARD: 'view_dashboard',
  
  // Hotéis
  VIEW_HOTELS: 'view_hotels',
  CREATE_HOTEL: 'create_hotel',
  EDIT_HOTEL: 'edit_hotel',
  DELETE_HOTEL: 'delete_hotel',
  
  // IA
  VIEW_AI: 'view_ai',
  MANAGE_AI_INTEGRATIONS: 'manage_ai_integrations',
  VIEW_AI_CONFIGURATIONS: 'view_ai_configurations',
  EDIT_AI_CONFIGURATIONS: 'edit_ai_configurations',
  
  // Configurações
  VIEW_SETTINGS: 'view_settings',
  EDIT_ENDPOINTS: 'edit_endpoints',
  EDIT_GENERAL_CONFIG: 'edit_general_config',
  EDIT_UPLOAD_CONFIG: 'edit_upload_config',
  
  // Administração
  MANAGE_USERS: 'manage_users',
  MANAGE_PERMISSIONS: 'manage_permissions',
  
  // Área do Hotel
  VIEW_HOTEL_AREA: 'view_hotel_area',
  MANAGE_RESERVATIONS: 'manage_reservations',
  MANAGE_CUSTOMER_SERVICE: 'manage_customer_service',
  
  // IA do Hotel
  VIEW_HOTEL_IA: 'view_hotel_ia',
  MANAGE_HOTEL_IA: 'manage_hotel_ia',
  
  // Meus Hotéis
  VIEW_MY_HOTELS: 'view_my_hotels',
  MANAGE_MY_HOTELS: 'manage_my_hotels',
  
  // Marketing do Hotel
  VIEW_HOTEL_MARKETING: 'view_hotel_marketing',
  MANAGE_MARKETING_CAMPAIGNS: 'manage_marketing_campaigns',
  ACCESS_META_API: 'access_meta_api',
  
  // Relatórios do Hotel
  VIEW_HOTEL_REPORTS: 'view_hotel_reports',
  EXPORT_HOTEL_REPORTS: 'export_hotel_reports',
  VIEW_FINANCIAL_REPORTS: 'view_financial_reports',

  // PMS
  VIEW_PMS: 'view_pms',
  MANAGE_PMS_RESERVATIONS: 'manage_pms_reservations',
  MANAGE_PMS_ROOMS: 'manage_pms_rooms',
  MANAGE_PMS_GUESTS: 'manage_pms_guests',
  MANAGE_PMS_CHECKIN: 'manage_pms_checkin',
  MANAGE_PMS_CHECKOUT: 'manage_pms_checkout',
  VIEW_PMS_CALENDAR: 'view_pms_calendar',
  VIEW_PMS_FINANCIALS: 'view_pms_financials',
  VIEW_PMS_REPORTS: 'view_pms_reports',
  MANAGE_PMS_RATES: 'manage_pms_rates',
  VIEW_PMS_RATE_SHOPPER: 'view_pms_rate_shopper',
  MANAGE_PMS_RATE_SHOPPER: 'manage_pms_rate_shopper'
};

// Permissões padrão por tipo de usuário
const DEFAULT_PERMISSIONS = {
  [USER_TYPES.SUPER_ADMIN]: Object.values(PERMISSIONS), // Todas as permissões
  
  [USER_TYPES.ADMIN]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_HOTELS,
    PERMISSIONS.CREATE_HOTEL,
    PERMISSIONS.EDIT_HOTEL,
    PERMISSIONS.VIEW_AI,
    PERMISSIONS.MANAGE_AI_INTEGRATIONS,
    PERMISSIONS.VIEW_AI_CONFIGURATIONS,
    PERMISSIONS.EDIT_AI_CONFIGURATIONS,
    PERMISSIONS.VIEW_SETTINGS,
    PERMISSIONS.EDIT_ENDPOINTS,
    PERMISSIONS.EDIT_GENERAL_CONFIG,
    PERMISSIONS.EDIT_UPLOAD_CONFIG,
    // Área do Hoteleiro
    PERMISSIONS.VIEW_HOTEL_AREA,
    PERMISSIONS.MANAGE_RESERVATIONS,
    PERMISSIONS.MANAGE_CUSTOMER_SERVICE,
    PERMISSIONS.VIEW_HOTEL_IA,
    PERMISSIONS.MANAGE_HOTEL_IA,
    PERMISSIONS.VIEW_MY_HOTELS,
    PERMISSIONS.MANAGE_MY_HOTELS,
    PERMISSIONS.VIEW_HOTEL_MARKETING,
    PERMISSIONS.MANAGE_MARKETING_CAMPAIGNS,
    PERMISSIONS.ACCESS_META_API,
    PERMISSIONS.VIEW_HOTEL_REPORTS,
    PERMISSIONS.EXPORT_HOTEL_REPORTS,
    PERMISSIONS.VIEW_FINANCIAL_REPORTS,
    // PMS
    PERMISSIONS.VIEW_PMS,
    PERMISSIONS.MANAGE_PMS_RESERVATIONS,
    PERMISSIONS.MANAGE_PMS_ROOMS,
    PERMISSIONS.MANAGE_PMS_GUESTS,
    PERMISSIONS.MANAGE_PMS_CHECKIN,
    PERMISSIONS.MANAGE_PMS_CHECKOUT,
    PERMISSIONS.VIEW_PMS_CALENDAR,
    PERMISSIONS.VIEW_PMS_FINANCIALS,
    PERMISSIONS.VIEW_PMS_REPORTS,
    PERMISSIONS.MANAGE_PMS_RATES,
    PERMISSIONS.VIEW_PMS_RATE_SHOPPER,
    PERMISSIONS.MANAGE_PMS_RATE_SHOPPER
  ],
  
  [USER_TYPES.HOTEL]: [
    PERMISSIONS.VIEW_HOTEL_AREA,
    PERMISSIONS.MANAGE_RESERVATIONS,
    PERMISSIONS.MANAGE_CUSTOMER_SERVICE,
    PERMISSIONS.VIEW_HOTEL_IA,
    PERMISSIONS.MANAGE_HOTEL_IA,
    PERMISSIONS.VIEW_MY_HOTELS,
    PERMISSIONS.MANAGE_MY_HOTELS,
    PERMISSIONS.VIEW_HOTEL_MARKETING,
    PERMISSIONS.MANAGE_MARKETING_CAMPAIGNS,
    PERMISSIONS.ACCESS_META_API,
    PERMISSIONS.VIEW_HOTEL_REPORTS,
    PERMISSIONS.EXPORT_HOTEL_REPORTS,
    PERMISSIONS.VIEW_FINANCIAL_REPORTS,
    // PMS
    PERMISSIONS.VIEW_PMS,
    PERMISSIONS.MANAGE_PMS_RESERVATIONS,
    PERMISSIONS.MANAGE_PMS_ROOMS,
    PERMISSIONS.MANAGE_PMS_GUESTS,
    PERMISSIONS.MANAGE_PMS_CHECKIN,
    PERMISSIONS.MANAGE_PMS_CHECKOUT,
    PERMISSIONS.VIEW_PMS_CALENDAR,
    PERMISSIONS.VIEW_PMS_FINANCIALS,
    PERMISSIONS.VIEW_PMS_REPORTS,
    PERMISSIONS.MANAGE_PMS_RATES,
    PERMISSIONS.VIEW_PMS_RATE_SHOPPER,
    PERMISSIONS.MANAGE_PMS_RATE_SHOPPER
  ]
};

// Dados do usuário padrão (desenvolvimento)
const DEFAULT_USERS = {
  'superadmin@hotel.com': {
    id: 1,
    email: 'superadmin@hotel.com',
    name: 'Super Administrador',
    type: USER_TYPES.SUPER_ADMIN,
    permissions: DEFAULT_PERMISSIONS[USER_TYPES.SUPER_ADMIN]
  },
  'admin@hotel.com': {
    id: 2,
    email: 'admin@hotel.com',
    name: 'Administrador',
    type: USER_TYPES.ADMIN,
    permissions: DEFAULT_PERMISSIONS[USER_TYPES.ADMIN]
  },
  'hotel@hotel.com': {
    id: 3,
    email: 'hotel@hotel.com',
    name: 'Usuário Hotel',
    type: USER_TYPES.HOTEL,
    permissions: DEFAULT_PERMISSIONS[USER_TYPES.HOTEL]
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Carregar dados do usuário do localStorage na inicialização
  useEffect(() => {
    const savedUser = localStorage.getItem('authUser');
    const savedToken = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
    
    if (savedUser && savedToken) {
      // Garantir que o apiService tenha o token
      if (!localStorage.getItem('auth_token')) {
        localStorage.setItem('auth_token', savedToken);
      }
      apiService.setToken(savedToken);
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);
        console.log('✅ Usuário carregado do localStorage:', userData);
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        localStorage.removeItem('authUser');
        localStorage.removeItem('authToken');
      }
    }
    
    setLoading(false);
  }, []);

  // Função de login  
  const login = async (email, password) => {
    setLoading(true);
    try {
      console.log('🔐 Tentativa de login:', { email });
      
      // Tentar API primeiro se disponível
      try {
        console.log('🔄 Tentando login via API...');
        const apiResponse = await apiService.login(email, password);
        
        if (apiResponse && apiResponse.user) {
          // Usar permissões reais da API em vez das hardcoded
          const userType = apiResponse.user.user_type;
          
          // Super Admin sempre tem todas as permissões
          let permissions;
          if (userType === USER_TYPES.SUPER_ADMIN) {
            permissions = Object.values(PERMISSIONS); // Todas as permissões
          } else {
            permissions = (apiResponse.permissions && apiResponse.permissions.length > 0) 
              ? apiResponse.permissions 
              : DEFAULT_PERMISSIONS[userType] || [];
          }
          
          const userData = {
            ...apiResponse.user,
            type: userType, // Manter compatibilidade
            permissions: permissions
          };
          
          // Salvar no localStorage
          localStorage.setItem('authUser', JSON.stringify(userData));
          localStorage.setItem('authToken', apiResponse.token);
          
          // O apiService.login já salva o token como auth_token, mas vamos garantir
          if (apiResponse.token) {
            localStorage.setItem('auth_token', apiResponse.token);
            // Atualizar o token no apiService para próximas requisições
            apiService.setToken(apiResponse.token);
          }
          
          setUser(userData);
          setIsAuthenticated(true);
          
          console.log('✅ Login realizado com sucesso via API:', userData);
          return { success: true, user: userData, hotels: apiResponse.hotels };
        }
      } catch (apiError) {
        console.log('⚠️ API indisponível, usando dados locais:', apiError.message);
        
        // Fallback para dados mockados
        const userData = DEFAULT_USERS[email.toLowerCase()];
        
        if (!userData || password !== '123456') {
          throw new Error('Email ou senha inválidos');
        }

        // Para fallback, usar permissões padrão baseadas no tipo do usuário
        const fallbackUser = {
          ...userData,
          permissions: DEFAULT_PERMISSIONS[userData.type] || []
        };

        // Simular token JWT
        const token = `fake_token_${userData.id}_${Date.now()}`;
        
        // Salvar no localStorage
        localStorage.setItem('authUser', JSON.stringify(fallbackUser));
        localStorage.setItem('authToken', token);
        
        setUser(fallbackUser);
        setIsAuthenticated(true);
        
        console.log('✅ Login realizado com dados mockados:', fallbackUser);
        return { success: true, user: fallbackUser };
      }
      
    } catch (error) {
      console.error('❌ Erro no login:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Função de logout
  const logout = () => {
    console.log('🚪 Realizando logout...');
    
    // Tentar logout da API (não crítico se falhar)
    try {
      apiService.logout();
    } catch (error) {
      console.log('⚠️ Erro no logout da API:', error.message);
    }
    
    // Limpar dados locais sempre
    localStorage.removeItem('authUser');
    localStorage.removeItem('authToken');
    setUser(null);
    setIsAuthenticated(false);
  };

  // Verificar se usuário tem uma permissão específica
  const hasPermission = (permission) => {
    if (!user || !user.permissions) {
      return false;
    }
    return user.permissions.includes(permission);
  };

  // Verificar se usuário tem qualquer uma das permissões fornecidas
  const hasAnyPermission = (permissions) => {
    if (!Array.isArray(permissions)) {
      return hasPermission(permissions);
    }
    return permissions.some(permission => hasPermission(permission));
  };

  // Verificar se usuário tem todas as permissões fornecidas
  const hasAllPermissions = (permissions) => {
    if (!Array.isArray(permissions)) {
      return hasPermission(permissions);
    }
    return permissions.every(permission => hasPermission(permission));
  };

  // Verificar se é Super Admin
  const isSuperAdmin = () => {
    return user?.type === USER_TYPES.SUPER_ADMIN;
  };

  // Verificar se é Admin
  const isAdmin = () => {
    return user?.type === USER_TYPES.ADMIN;
  };

  // Verificar se é usuário Hotel
  const isHotel = () => {
    return user?.type === USER_TYPES.HOTEL;
  };

  // Atualizar permissões de um usuário (apenas para Super Admin)
  const updateUserPermissions = async (userId, newPermissions) => {
    if (!isSuperAdmin()) {
      throw new Error('Apenas Super Admin pode alterar permissões');
    }

    try {
      console.log('🔧 Atualizando permissões do usuário:', { userId, newPermissions });
      
      // TODO: Implementar chamada para API
      // Por enquanto, apenas log para desenvolvimento
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao atualizar permissões:', error);
      throw error;
    }
  };

  // Listar todos os usuários Admin (apenas para Super Admin)
  const getAdminUsers = async () => {
    if (!isSuperAdmin()) {
      throw new Error('Apenas Super Admin pode listar usuários');
    }

    try {
      // TODO: Implementar chamada para API
      // Por enquanto, retornar usuários mockados
      const adminUsers = Object.values(DEFAULT_USERS).filter(u => u.type === USER_TYPES.ADMIN);
      return adminUsers;
    } catch (error) {
      console.error('❌ Erro ao listar usuários Admin:', error);
      throw error;
    }
  };

  const value = {
    // Estado
    user,
    loading,
    isAuthenticated,
    
    // Funções de autenticação
    login,
    logout,
    
    // Funções de verificação de permissão
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSuperAdmin,
    isAdmin,
    isHotel,
    
    // Funções de gerenciamento (Super Admin)
    updateUserPermissions,
    getAdminUsers,
    
    // Constantes
    USER_TYPES,
    PERMISSIONS,
    DEFAULT_PERMISSIONS
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};

export default AuthContext;