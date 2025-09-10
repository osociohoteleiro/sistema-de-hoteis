import { useState, useEffect } from 'react';
import { useAuth, PERMISSIONS, USER_TYPES } from '../context/AuthContext';
import NewUserModal from '../components/NewUserModal';
import EditUserModal from '../components/EditUserModal';
import ChangePasswordModal from '../components/ChangePasswordModal';
import DeleteUserModal from '../components/DeleteUserModal';
import ManageUserHotelsModal from '../components/ManageUserHotelsModal';
import toast from 'react-hot-toast';

const Permissions = () => {
  const { 
    getAdminUsers, 
    updateUserPermissions, 
    createUser, 
    getAllUsers,
    updateUser,
    deleteUser,
    canEditUser,
    canDeleteUser,
    canChangePassword,
    isSuperAdmin, 
    PERMISSIONS: ALL_PERMISSIONS 
  } = useAuth();
  const [adminUsers, setAdminUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState({});
  const [saving, setSaving] = useState(false);
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [changingPasswordUser, setChangingPasswordUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  const [showManageHotelsModal, setShowManageHotelsModal] = useState(false);
  const [managingHotelsUser, setManagingHotelsUser] = useState(null);

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
    ],
    'PMS - Sistema de Gestão Hoteleira': [
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
    [PERMISSIONS.MANAGE_CUSTOMER_SERVICE]: 'Gerenciar Atendimento',
    // Labels PMS
    [PERMISSIONS.VIEW_PMS_DASHBOARD]: 'Visualizar Dashboard PMS',
    [PERMISSIONS.VIEW_PMS_CALENDARIO]: 'Visualizar Calendário',
    [PERMISSIONS.MANAGE_PMS_RESERVAS]: 'Gerenciar Reservas',
    [PERMISSIONS.VIEW_PMS_TARIFARIO]: 'Visualizar Tarifário',
    [PERMISSIONS.MANAGE_PMS_TARIFARIO]: 'Gerenciar Tarifário',
    [PERMISSIONS.VIEW_PMS_RATE_SHOPPER]: 'Visualizar Rate Shopper',
    [PERMISSIONS.MANAGE_PMS_RATE_SHOPPER]: 'Gerenciar Rate Shopper',
    [PERMISSIONS.VIEW_PMS_FINANCEIRO]: 'Visualizar Financeiro',
    [PERMISSIONS.MANAGE_PMS_FINANCEIRO]: 'Gerenciar Financeiro',
    [PERMISSIONS.VIEW_PMS_RELATORIOS]: 'Visualizar Relatórios',
    [PERMISSIONS.VIEW_PMS_CONFIGURACOES]: 'Visualizar Configurações PMS',
    [PERMISSIONS.MANAGE_PMS_CONFIGURACOES]: 'Gerenciar Configurações PMS',
    [PERMISSIONS.VIEW_PMS_QUARTOS]: 'Visualizar Quartos',
    [PERMISSIONS.MANAGE_PMS_QUARTOS]: 'Gerenciar Quartos',
    [PERMISSIONS.VIEW_PMS_HOSPEDES]: 'Visualizar Hóspedes',
    [PERMISSIONS.MANAGE_PMS_HOSPEDES]: 'Gerenciar Hóspedes'
  };

  useEffect(() => {
    loadAdminUsers();
  }, []);

  const loadAdminUsers = async () => {
    try {
      setLoading(true);
      // Carregar todos os usuários do sistema
      const users = await getAllUsers();
      setAllUsers(users);
      // Manter compatibilidade com código existente
      const adminUsers = users.filter(u => u.user_type === 'ADMIN');
      setAdminUsers(adminUsers);
      console.log('👥 Usuários carregados:', users);
    } catch (error) {
      toast.error('Erro ao carregar usuários');
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectUser = (user) => {
    setSelectedUser(user);
    setUserPermissions(
      (user.permissions || []).reduce((acc, permission) => {
        acc[permission] = true;
        return acc;
      }, {})
    );
    console.log('👤 Usuário selecionado:', user);
    console.log('🔍 Permissões do usuário:', user.permissions);
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

      console.log('🔧 Salvando permissões:', { userId: selectedUser.id, newPermissions });
      const result = await updateUserPermissions(selectedUser.id, newPermissions);
      console.log('📤 Resultado da API:', result);
      
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

  const handleCreateUser = async (userData) => {
    try {
      const newUser = await createUser(userData);
      
      // Recarregar lista de usuários após criar
      loadAdminUsers();
      
      console.log('✅ Usuário criado:', newUser);
    } catch (error) {
      console.error('❌ Erro ao criar usuário:', error);
      throw error; // Re-throw para que o modal possa tratar
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleUpdateUser = async (userData) => {
    try {
      await updateUser(editingUser.id, userData);
      
      // Recarregar lista de usuários após editar
      loadAdminUsers();
      
      toast.success('Usuário atualizado com sucesso!');
      setShowEditModal(false);
      setEditingUser(null);
      
      console.log('✅ Usuário atualizado:', editingUser.id);
    } catch (error) {
      console.error('❌ Erro ao atualizar usuário:', error);
      throw error;
    }
  };

  const handleDeleteUser = (user) => {
    setDeletingUser(user);
    setShowDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    if (!deletingUser) return;
    
    try {
      await deleteUser(deletingUser.id);
      
      // Recarregar lista de usuários após excluir
      loadAdminUsers();
      
      // Se era o usuário selecionado, desselecionar
      if (selectedUser?.id === deletingUser.id) {
        setSelectedUser(null);
        setUserPermissions({});
      }
      
      toast.success('Usuário excluído com sucesso!');
      console.log('✅ Usuário excluído:', deletingUser.id);
    } catch (error) {
      console.error('❌ Erro ao excluir usuário:', error);
      toast.error(error.message || 'Erro ao excluir usuário');
      throw error; // Re-throw para que o modal trate o loading
    }
  };

  const handleChangePassword = (user) => {
    setChangingPasswordUser(user);
    setShowPasswordModal(true);
  };

  const handleManageHotels = (user) => {
    setManagingHotelsUser(user);
    setShowManageHotelsModal(true);
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
        
        <button
          onClick={() => setShowNewUserModal(true)}
          className="bg-primary-600 hover:bg-primary-500 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Novo Usuário
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Usuários */}
        <div className="lg:col-span-1">
          <div className="bg-sidebar-800/50 backdrop-blur-sm rounded-lg border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Todos os Usuários</h3>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {allUsers.map((user) => (
                <div
                  key={user.id}
                  className={`p-4 rounded-lg border transition-all duration-200 ${
                    selectedUser?.id === user.id
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center space-x-3 flex-1 cursor-pointer"
                      onClick={() => selectUser(user)}
                    >
                      <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {user.name?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium truncate">{user.name}</h4>
                        <p className="text-sidebar-400 text-sm truncate">{user.email}</p>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            user.user_type === 'SUPER_ADMIN' ? 'bg-red-500/20 text-red-400' :
                            user.user_type === 'ADMIN' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-green-500/20 text-green-400'
                          }`}>
                            {user.user_type === 'SUPER_ADMIN' ? 'Super Admin' :
                             user.user_type === 'ADMIN' ? 'Admin' : 'Hoteleiro'}
                          </span>
                          {!user.active && (
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-500/20 text-gray-400">
                              Inativo
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Botões de ação */}
                    <div className="flex items-center space-x-2 ml-2">
                      {canEditUser(user) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditUser(user);
                          }}
                          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Editar usuário"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                      
                      {canChangePassword(user) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleChangePassword(user);
                          }}
                          className="p-2 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 rounded-lg transition-colors"
                          title="Alterar senha"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </button>
                      )}
                      
                      {/* Botão Gerenciar Hotéis - para todos os tipos de usuário */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleManageHotels(user);
                        }}
                        className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-colors"
                        title="Gerenciar hotéis vinculados"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </button>
                      
                      {canDeleteUser(user) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteUser(user);
                          }}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Excluir usuário"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {allUsers.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sidebar-400">Nenhum usuário encontrado</p>
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

      {/* Modal de Novo Usuário */}
      <NewUserModal
        isOpen={showNewUserModal}
        onClose={() => setShowNewUserModal(false)}
        onUserCreated={handleCreateUser}
      />

      {/* Modal de Editar Usuário */}
      <EditUserModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingUser(null);
        }}
        user={editingUser}
        onUserUpdated={handleUpdateUser}
      />

      {/* Modal de Alterar Senha */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setChangingPasswordUser(null);
        }}
        user={changingPasswordUser}
      />

      {/* Modal de Exclusão */}
      <DeleteUserModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingUser(null);
        }}
        onConfirm={confirmDeleteUser}
        user={deletingUser}
      />

      <ManageUserHotelsModal
        isOpen={showManageHotelsModal}
        onClose={() => {
          setShowManageHotelsModal(false);
          setManagingHotelsUser(null);
        }}
        user={managingHotelsUser}
      />
    </div>
  );
};

export default Permissions;