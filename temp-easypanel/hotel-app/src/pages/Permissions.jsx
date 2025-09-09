import { useState, useEffect } from 'react';
import { useAuth, PERMISSIONS, USER_TYPES } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Permissions = () => {
  const { getAdminUsers, updateUserPermissions, isSuperAdmin, PERMISSIONS: ALL_PERMISSIONS } = useAuth();
  const [adminUsers, setAdminUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState({});
  const [saving, setSaving] = useState(false);

  // Agrupar permissões por categoria para melhor organização
  const PERMISSION_GROUPS = {
    'Dashboard': [
      PERMISSIONS.VIEW_DASHBOARD
    ],
    'Hotéis': [
      PERMISSIONS.VIEW_HOTELS,
      PERMISSIONS.CREATE_HOTEL,
      PERMISSIONS.EDIT_HOTEL,
      PERMISSIONS.DELETE_HOTEL
    ],
    'Inteligência Artificial': [
      PERMISSIONS.VIEW_AI,
      PERMISSIONS.MANAGE_AI_INTEGRATIONS,
      PERMISSIONS.VIEW_AI_CONFIGURATIONS,
      PERMISSIONS.EDIT_AI_CONFIGURATIONS
    ],
    'Configurações': [
      PERMISSIONS.VIEW_SETTINGS,
      PERMISSIONS.EDIT_ENDPOINTS,
      PERMISSIONS.EDIT_GENERAL_CONFIG,
      PERMISSIONS.EDIT_UPLOAD_CONFIG
    ],
    'Área do Hotel (Futuro)': [
      PERMISSIONS.VIEW_HOTEL_AREA,
      PERMISSIONS.MANAGE_RESERVATIONS,
      PERMISSIONS.MANAGE_CUSTOMER_SERVICE
    ]
  };

  // Labels amigáveis para as permissões
  const PERMISSION_LABELS = {
    [PERMISSIONS.VIEW_DASHBOARD]: 'Visualizar Dashboard',
    [PERMISSIONS.VIEW_HOTELS]: 'Visualizar Hotéis',
    [PERMISSIONS.CREATE_HOTEL]: 'Criar Hotéis',
    [PERMISSIONS.EDIT_HOTEL]: 'Editar Hotéis',
    [PERMISSIONS.DELETE_HOTEL]: 'Excluir Hotéis',
    [PERMISSIONS.VIEW_AI]: 'Visualizar IA',
    [PERMISSIONS.MANAGE_AI_INTEGRATIONS]: 'Gerenciar Integrações de IA',
    [PERMISSIONS.VIEW_AI_CONFIGURATIONS]: 'Visualizar Configurações de IA',
    [PERMISSIONS.EDIT_AI_CONFIGURATIONS]: 'Editar Configurações de IA',
    [PERMISSIONS.VIEW_SETTINGS]: 'Visualizar Configurações',
    [PERMISSIONS.EDIT_ENDPOINTS]: 'Editar Endpoints da API',
    [PERMISSIONS.EDIT_GENERAL_CONFIG]: 'Editar Configurações Gerais',
    [PERMISSIONS.EDIT_UPLOAD_CONFIG]: 'Editar Configurações de Upload',
    [PERMISSIONS.MANAGE_USERS]: 'Gerenciar Usuários',
    [PERMISSIONS.MANAGE_PERMISSIONS]: 'Gerenciar Permissões',
    [PERMISSIONS.VIEW_HOTEL_AREA]: 'Visualizar Área do Hotel',
    [PERMISSIONS.MANAGE_RESERVATIONS]: 'Gerenciar Reservas',
    [PERMISSIONS.MANAGE_CUSTOMER_SERVICE]: 'Gerenciar Atendimento'
  };

  useEffect(() => {
    loadAdminUsers();
  }, []);

  const loadAdminUsers = async () => {
    try {
      setLoading(true);
      const users = await getAdminUsers();
      setAdminUsers(users);
      console.log('👥 Usuários Admin carregados:', users);
    } catch (error) {
      toast.error('Erro ao carregar usuários Admin');
      console.error('Error loading admin users:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectUser = (user) => {
    setSelectedUser(user);
    setUserPermissions(
      user.permissions.reduce((acc, permission) => {
        acc[permission] = true;
        return acc;
      }, {})
    );
    console.log('👤 Usuário selecionado:', user);
  };

  const handlePermissionChange = (permission, checked) => {
    setUserPermissions(prev => ({
      ...prev,
      [permission]: checked
    }));
  };

  const handleSelectAllInGroup = (groupPermissions, selectAll) => {
    const updates = {};
    groupPermissions.forEach(permission => {
      updates[permission] = selectAll;
    });
    setUserPermissions(prev => ({ ...prev, ...updates }));
  };

  const savePermissions = async () => {
    if (!selectedUser) return;

    try {
      setSaving(true);
      const newPermissions = Object.keys(userPermissions).filter(
        permission => userPermissions[permission]
      );

      await updateUserPermissions(selectedUser.id, newPermissions);
      
      // Atualizar a lista local
      setAdminUsers(prev => 
        prev.map(user => 
          user.id === selectedUser.id 
            ? { ...user, permissions: newPermissions }
            : user
        )
      );

      // Atualizar o usuário selecionado
      setSelectedUser(prev => ({ ...prev, permissions: newPermissions }));

      toast.success('Permissões atualizadas com sucesso!');
      console.log('✅ Permissões salvas:', newPermissions);
      
    } catch (error) {
      toast.error('Erro ao salvar permissões');
      console.error('Error saving permissions:', error);
    } finally {
      setSaving(false);
    }
  };

  // Verificar se é Super Admin
  if (!isSuperAdmin()) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 text-6xl mb-4">🚫</div>
        <h2 className="text-2xl font-bold text-white mb-4">Acesso Restrito</h2>
        <p className="text-sidebar-400">Esta página é acessível apenas para Super Administradores.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
        <p className="text-white">Carregando usuários...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Gerenciar Permissões</h1>
          <p className="text-sidebar-400">Configure as permissões dos usuários Admin</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Usuários */}
        <div className="lg:col-span-1">
          <div className="bg-sidebar-800/50 backdrop-blur-sm rounded-lg border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Usuários Admin</h3>
            
            <div className="space-y-3">
              {adminUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => selectUser(user)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                    selectedUser?.id === user.id
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">
                        {user.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{user.name}</h4>
                      <p className="text-sidebar-400 text-sm">{user.email}</p>
                      <p className="text-primary-400 text-xs">
                        {user.permissions?.length || 0} permissões
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {adminUsers.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sidebar-400">Nenhum usuário Admin encontrado</p>
              </div>
            )}
          </div>
        </div>

        {/* Configuração de Permissões */}
        <div className="lg:col-span-2">
          {selectedUser ? (
            <div className="bg-sidebar-800/50 backdrop-blur-sm rounded-lg border border-white/10 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Permissões de {selectedUser.name}
                  </h3>
                  <p className="text-sidebar-400 text-sm">{selectedUser.email}</p>
                </div>
                
                <button
                  onClick={savePermissions}
                  disabled={saving}
                  className="bg-primary-600 hover:bg-primary-500 disabled:bg-primary-800 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    'Salvar Permissões'
                  )}
                </button>
              </div>

              <div className="space-y-6">
                {Object.entries(PERMISSION_GROUPS).map(([groupName, permissions]) => (
                  <div key={groupName} className="border border-white/10 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-white font-medium">{groupName}</h4>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleSelectAllInGroup(permissions, true)}
                          className="text-primary-400 hover:text-primary-300 text-sm"
                        >
                          Selecionar Todos
                        </button>
                        <span className="text-sidebar-400">|</span>
                        <button
                          onClick={() => handleSelectAllInGroup(permissions, false)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Desmarcar Todos
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {permissions.map((permission) => (
                        <label
                          key={permission}
                          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={userPermissions[permission] || false}
                            onChange={(e) => handlePermissionChange(permission, e.target.checked)}
                            className="w-4 h-4 text-primary-600 bg-white/10 border-white/20 rounded focus:ring-primary-500 focus:ring-2"
                          />
                          <span className="text-white text-sm">
                            {PERMISSION_LABELS[permission] || permission}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-sidebar-800/50 backdrop-blur-sm rounded-lg border border-white/10 p-12 text-center">
              <div className="text-6xl mb-4">👤</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Selecione um usuário
              </h3>
              <p className="text-sidebar-400">
                Escolha um usuário Admin da lista ao lado para configurar suas permissões.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Permissions;