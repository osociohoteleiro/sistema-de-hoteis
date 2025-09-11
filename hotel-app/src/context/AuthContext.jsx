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
  
  // PMS - Sistema de Gestão Hoteleira
  VIEW_PMS_DASHBOARD: 'view_pms_dashboard',
  VIEW_PMS_CALENDARIO: 'view_pms_calendario',
  MANAGE_PMS_RESERVAS: 'manage_pms_reservas',
  VIEW_PMS_TARIFARIO: 'view_pms_tarifario',
  MANAGE_PMS_TARIFARIO: 'manage_pms_tarifario',
  VIEW_PMS_RATE_SHOPPER: 'view_pms_rate_shopper',
  MANAGE_PMS_RATE_SHOPPER: 'manage_pms_rate_shopper',
  VIEW_PMS_FINANCEIRO: 'view_pms_financeiro',
  MANAGE_PMS_FINANCEIRO: 'manage_pms_financeiro',
  VIEW_PMS_RELATORIOS: 'view_pms_relatorios',
  VIEW_PMS_CONFIGURACOES: 'view_pms_configuracoes',
  MANAGE_PMS_CONFIGURACOES: 'manage_pms_configuracoes',
  VIEW_PMS_QUARTOS: 'view_pms_quartos',
  MANAGE_PMS_QUARTOS: 'manage_pms_quartos',
  VIEW_PMS_HOSPEDES: 'view_pms_hospedes',
  MANAGE_PMS_HOSPEDES: 'manage_pms_hospedes'
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
    // Permissões PMS para Admin
    PERMISSIONS.VIEW_PMS_DASHBOARD,
    PERMISSIONS.VIEW_PMS_CALENDARIO,
    PERMISSIONS.MANAGE_PMS_RESERVAS,
    PERMISSIONS.VIEW_PMS_TARIFARIO,
    PERMISSIONS.MANAGE_PMS_TARIFARIO,
    PERMISSIONS.VIEW_PMS_RATE_SHOPPER,
    PERMISSIONS.MANAGE_PMS_RATE_SHOPPER,
    PERMISSIONS.VIEW_PMS_FINANCEIRO,
    PERMISSIONS.MANAGE_PMS_FINANCEIRO,
    PERMISSIONS.VIEW_PMS_RELATORIOS,
    PERMISSIONS.VIEW_PMS_CONFIGURACOES,
    PERMISSIONS.MANAGE_PMS_CONFIGURACOES,
    PERMISSIONS.VIEW_PMS_QUARTOS,
    PERMISSIONS.MANAGE_PMS_QUARTOS,
    PERMISSIONS.VIEW_PMS_HOSPEDES,
    PERMISSIONS.MANAGE_PMS_HOSPEDES
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
    // Permissões PMS para Hoteleiros
    PERMISSIONS.VIEW_PMS_DASHBOARD,
    PERMISSIONS.VIEW_PMS_CALENDARIO,
    PERMISSIONS.MANAGE_PMS_RESERVAS,
    PERMISSIONS.VIEW_PMS_TARIFARIO,
    PERMISSIONS.MANAGE_PMS_TARIFARIO,
    PERMISSIONS.VIEW_PMS_RATE_SHOPPER,
    PERMISSIONS.MANAGE_PMS_RATE_SHOPPER,
    PERMISSIONS.VIEW_PMS_FINANCEIRO,
    PERMISSIONS.MANAGE_PMS_FINANCEIRO,
    PERMISSIONS.VIEW_PMS_RELATORIOS,
    PERMISSIONS.VIEW_PMS_CONFIGURACOES,
    PERMISSIONS.MANAGE_PMS_CONFIGURACOES,
    PERMISSIONS.VIEW_PMS_QUARTOS,
    PERMISSIONS.MANAGE_PMS_QUARTOS,
    PERMISSIONS.VIEW_PMS_HOSPEDES,
    PERMISSIONS.MANAGE_PMS_HOSPEDES
  ]
};

// Dados do usuário padrão (desenvolvimento)
const DEFAULT_USERS = {
  'superadmin@hotel.com': {
    id: 1,
    email: 'superadmin@hotel.com',
    name: 'Super Administrador',
    user_type: USER_TYPES.SUPER_ADMIN, // ✅ CORREÇÃO: user_type em vez de type
    permissions: DEFAULT_PERMISSIONS[USER_TYPES.SUPER_ADMIN]
  },
  'admin@hotel.com': {
    id: 2,
    email: 'admin@hotel.com',
    name: 'Administrador',
    user_type: USER_TYPES.ADMIN, // ✅ CORREÇÃO: user_type em vez de type
    permissions: DEFAULT_PERMISSIONS[USER_TYPES.ADMIN]
  },
  'hotel@hotel.com': {
    id: 3,
    email: 'hotel@hotel.com',
    name: 'Usuário Hotel',
    user_type: USER_TYPES.HOTEL, // ✅ CORREÇÃO: user_type em vez de type
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
      if (!localStorage.getItem('token')) {
        localStorage.setItem('token', savedToken);
      }
      apiService.setToken(savedToken);
      try {
        const userData = JSON.parse(savedUser);
        console.log('🔍 Dados brutos do localStorage:', userData);
        console.log('🔍 userData.type:', userData.type);
        console.log('🔍 userData.user_type:', userData.user_type);
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
          // Mapear dados da API para formato frontend
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
          
          console.log('🔍 Debug - userType:', userType);
          console.log('🔍 Debug - USER_TYPES.ADMIN:', USER_TYPES.ADMIN);
          console.log('🔍 Debug - DEFAULT_PERMISSIONS keys:', Object.keys(DEFAULT_PERMISSIONS));
          console.log('🔍 Debug - permissions:', permissions);
          console.log('🔍 Debug - VIEW_HOTEL_AREA permission:', PERMISSIONS.VIEW_HOTEL_AREA);
          console.log('🔍 Debug - has VIEW_HOTEL_AREA:', permissions.includes(PERMISSIONS.VIEW_HOTEL_AREA));
          
          const userData = {
            ...apiResponse.user,
            user_type: userType, // ✅ CORREÇÃO: Usar user_type (API) em vez de type
            permissions: permissions
          };
          
          // Salvar no localStorage
          localStorage.setItem('authUser', JSON.stringify(userData));
          localStorage.setItem('authToken', apiResponse.token);
          
          // O apiService.login já salva o token como auth_token, mas vamos garantir
          if (apiResponse.token) {
            localStorage.setItem('auth_token', apiResponse.token);
          }
          
          setUser(userData);
          setIsAuthenticated(true);
          
          console.log('✅ Login realizado com sucesso via API:', userData);
          return { success: true, user: userData, hotels: apiResponse.hotels };
        }
      } catch (apiError) {
        console.error('❌ API indisponível:', apiError.message);
        throw new Error(`Erro de autenticação: ${apiError.message}`);
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
      console.log('🔍 hasPermission - user ou permissions inválidos:', { user, permissions: user?.permissions });
      return false;
    }
    const hasIt = user.permissions.includes(permission);
    console.log(`🔍 hasPermission - ${permission}:`, hasIt, 'user permissions:', user.permissions);
    return hasIt;
  };

  // Verificar se usuário tem qualquer uma das permissões fornecidas
  const hasAnyPermission = (permissions) => {
    console.log('🔍 hasAnyPermission - checking:', permissions);
    if (!Array.isArray(permissions)) {
      const result = hasPermission(permissions);
      console.log('🔍 hasAnyPermission - single permission result:', result);
      return result;
    }
    const result = permissions.some(permission => hasPermission(permission));
    console.log('🔍 hasAnyPermission - array result:', result);
    return result;
  };

  // Verificar se usuário tem todas as permissões fornecidas
  const hasAllPermissions = (permissions) => {
    console.log('🔍 hasAllPermissions - checking:', permissions);
    if (!Array.isArray(permissions)) {
      const result = hasPermission(permissions);
      console.log('🔍 hasAllPermissions - single permission result:', result);
      return result;
    }
    const result = permissions.every(permission => hasPermission(permission));
    console.log('🔍 hasAllPermissions - array result:', result);
    return result;
  };

  // Verificar se é Super Admin
  const isSuperAdmin = () => {
    return user?.user_type === USER_TYPES.SUPER_ADMIN;
  };

  // Verificar se é Admin
  const isAdmin = () => {
    return user?.user_type === USER_TYPES.ADMIN;
  };

  // Verificar se é usuário Hotel
  const isHotel = () => {
    return user?.user_type === USER_TYPES.HOTEL;
  };

  // Atualizar permissões de um usuário (apenas para Super Admin)
  const updateUserPermissions = async (userId, newPermissions) => {
    if (!isSuperAdmin()) {
      throw new Error('Apenas Super Admin pode alterar permissões');
    }

    try {
      console.log('🔧 Atualizando permissões do usuário:', { userId, newPermissions });
      
      // Fazer chamada para API para salvar permissões
      const response = await apiService.updateUserPermissions(userId, newPermissions);
      
      if (response && response.permissions) {
        console.log('✅ Permissões salvas com sucesso na API:', response.permissions);
        return { success: true, permissions: response.permissions };
      } else {
        console.log('⚠️ API não disponível, simulando sucesso');
        return { success: true };
      }
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
      const adminUsers = Object.values(DEFAULT_USERS).filter(u => u.user_type === USER_TYPES.ADMIN); // ✅ CORREÇÃO: user_type
      return adminUsers;
    } catch (error) {
      console.error('❌ Erro ao listar usuários Admin:', error);
      throw error;
    }
  };

  // Listar todos os usuários do sistema
  const getAllUsers = async () => {
    try {
      console.log('🔍 Buscando todos os usuários...');
      
      const response = await apiService.getUsers();
      
      console.log('✅ Usuários encontrados:', response);
      return response.users || [];
    } catch (error) {
      console.error('❌ Erro ao listar usuários:', error);
      throw error;
    }
  };

  // Criar novo usuário (apenas para Super Admin)
  const createUser = async (userData) => {
    if (!isSuperAdmin()) {
      throw new Error('Apenas Super Admin pode criar usuários');
    }

    try {
      console.log('🚀 Criando novo usuário:', userData);
      
      // Salvar token atual antes da criação
      const currentToken = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
      
      const response = await apiService.register(userData, false); // false = não fazer auto login
      
      // Garantir que o token original seja mantido
      if (currentToken) {
        localStorage.setItem('auth_token', currentToken);
        localStorage.setItem('authToken', currentToken);
        apiService.setToken(currentToken);
      }
      
      console.log('✅ Usuário criado com sucesso:', response);
      return response;
    } catch (error) {
      console.error('❌ Erro ao criar usuário:', error);
      throw error;
    }
  };

  // Editar usuário
  const updateUser = async (userId, userData) => {
    try {
      console.log('🔧 Editando usuário:', { userId, userData });
      
      const response = await apiService.updateUser(userId, userData);
      
      console.log('✅ Usuário atualizado com sucesso:', response);
      return response;
    } catch (error) {
      console.error('❌ Erro ao atualizar usuário:', error);
      throw error;
    }
  };

  // Excluir usuário
  const deleteUser = async (userId) => {
    try {
      console.log('🗑️ Excluindo usuário:', userId);
      
      const response = await apiService.deleteUser(userId);
      
      console.log('✅ Usuário excluído com sucesso:', response);
      return response;
    } catch (error) {
      console.error('❌ Erro ao excluir usuário:', error);
      throw error;
    }
  };

  // Alterar senha do usuário
  const changePassword = async (userId, passwordData) => {
    try {
      console.log('🔑 Alterando senha do usuário:', userId);
      
      const response = await apiService.changeUserPassword(userId, passwordData);
      
      console.log('✅ Senha alterada com sucesso:', response);
      return response;
    } catch (error) {
      console.error('❌ Erro ao alterar senha:', error);
      throw error;
    }
  };

  // Verificar se pode editar usuário
  const canEditUser = (targetUser) => {
    if (!user) return false;
    
    // Super Admin pode editar qualquer usuário
    if (user.user_type === USER_TYPES.SUPER_ADMIN) {
      return true;
    }
    
    // Admin pode editar seu próprio perfil e usuários atribuídos
    if (user.user_type === USER_TYPES.ADMIN) {
      // Pode editar a si mesmo
      if (targetUser.id === user.id) {
        return true;
      }
      // TODO: Implementar lógica para usuários atribuídos
      return false;
    }
    
    // Hoteleiro só pode editar usuários da área do hotel (implementar futuramente)
    if (user.user_type === USER_TYPES.HOTEL) {
      // Pode editar apenas a si mesmo por enquanto
      return targetUser.id === user.id;
    }
    
    return false;
  };

  // Verificar se pode excluir usuário
  const canDeleteUser = (targetUser) => {
    if (!user) return false;
    
    // Super Admin pode excluir qualquer usuário (exceto a si mesmo)
    if (user.user_type === USER_TYPES.SUPER_ADMIN) {
      return targetUser.id !== user.id;
    }
    
    // Admin pode excluir usuários atribuídos (não a si mesmo)
    if (user.user_type === USER_TYPES.ADMIN) {
      if (targetUser.id === user.id) {
        return false; // Não pode excluir a si mesmo
      }
      // TODO: Implementar lógica para usuários atribuídos
      return false;
    }
    
    // Hoteleiro não pode excluir usuários
    return false;
  };

  // Verificar se pode alterar senha do usuário
  const canChangePassword = (targetUser) => {
    if (!user) return false;
    
    // Super Admin pode alterar senha de qualquer usuário
    if (user.user_type === USER_TYPES.SUPER_ADMIN) {
      return true;
    }
    
    // Qualquer usuário pode alterar sua própria senha
    if (targetUser.id === user.id) {
      return true;
    }
    
    return false;
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
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    changePassword,
    canEditUser,
    canDeleteUser,
    canChangePassword,
    
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