import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import InstanceStatusIndicator from './InstanceStatusIndicator';
import QRCodeModal from './QRCodeModal';
import ConfirmationModal from './ConfirmationModal';

const API_BASE_URL = 'http://localhost:3001/api';

const WorkspaceInstanceManager = ({ workspaceUuid, workspace }) => {
  const [data, setData] = useState({
    instances: [],
    linkedInstances: [],
    linkedInstancesData: [], // Array completo com custom_name
    loading: true,
    saving: false
  });

  const [filters, setFilters] = useState({
    search: '',
    statusFilter: 'all', // 'all', 'online', 'offline', 'linked', 'unlinked'
    sortBy: 'name' // 'name', 'status', 'linked'
  });

  const [qrModal, setQrModal] = useState({
    isOpen: false,
    instanceName: null
  });

  const [editingCustomName, setEditingCustomName] = useState({
    instanceName: null,
    value: '',
    saving: false
  });

  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    instanceName: '',
    action: null,
    confirmText: 'Confirmar',
    cancelText: 'Cancelar'
  });

  useEffect(() => {
    loadData();
  }, [workspaceUuid]);

  const loadData = async () => {
    try {
      setData(prev => ({ ...prev, loading: true }));

      const [instancesResponse, linkedResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/evolution/instances`),
        axios.get(`${API_BASE_URL}/workspace-instances/${workspaceUuid}`)
      ]);

      const instances = instancesResponse.data.success ? instancesResponse.data.data : [];
      const linked = linkedResponse.data.success ? linkedResponse.data.data : [];
      const linkedNames = linked.map(item => item.instance_name);

      setData({
        instances,
        linkedInstances: linkedNames,
        linkedInstancesData: linked, // Dados completos incluindo custom_name
        loading: false,
        saving: false
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar instâncias');
      setData(prev => ({ ...prev, loading: false }));
    }
  };

  const showConfirmation = (type, title, message, instanceName, action, confirmText = 'Confirmar') => {
    setConfirmationModal({
      isOpen: true,
      type,
      title,
      message,
      instanceName,
      action,
      confirmText,
      cancelText: 'Cancelar'
    });
  };

  const hideConfirmation = () => {
    setConfirmationModal({
      isOpen: false,
      type: 'warning',
      title: '',
      message: '',
      instanceName: '',
      action: null,
      confirmText: 'Confirmar',
      cancelText: 'Cancelar'
    });
  };

  const handleConfirmAction = async () => {
    if (confirmationModal.action) {
      await confirmationModal.action();
    }
    hideConfirmation();
  };

  const handleInstanceToggle = (instanceName) => {
    const isLinked = data.linkedInstances.includes(instanceName);

    if (isLinked) {
      showConfirmation(
        'warning',
        'Desvincular Instância',
        `Tem certeza que deseja desvincular a instância "${instanceName}" deste workspace? Esta ação removerá a vinculação, mas não afetará a configuração da instância.`,
        instanceName,
        () => performInstanceToggle(instanceName),
        'Desvincular'
      );
    } else {
      showConfirmation(
        'info',
        'Vincular Instância',
        `Deseja vincular a instância "${instanceName}" a este workspace? Isso permitirá que as mensagens desta instância apareçam no chat ao vivo.`,
        instanceName,
        () => performInstanceToggle(instanceName),
        'Vincular'
      );
    }
  };

  const performInstanceToggle = async (instanceName) => {
    try {
      setData(prev => ({ ...prev, saving: true }));

      const isLinked = data.linkedInstances.includes(instanceName);
      const endpoint = isLinked
        ? `${API_BASE_URL}/workspace-instances/${workspaceUuid}/${instanceName}`
        : `${API_BASE_URL}/workspace-instances`;

      if (isLinked) {
        await axios.delete(endpoint);
        toast.success(`Instância ${instanceName} desvinculada`);
      } else {
        await axios.post(endpoint, {
          workspace_uuid: workspaceUuid,
          instance_name: instanceName
        });
        toast.success(`Instância ${instanceName} vinculada`);
      }

      // Atualizar estado local
      setData(prev => ({
        ...prev,
        linkedInstances: isLinked
          ? prev.linkedInstances.filter(name => name !== instanceName)
          : [...prev.linkedInstances, instanceName],
        linkedInstancesData: isLinked
          ? prev.linkedInstancesData.filter(item => item.instance_name !== instanceName)
          : [...prev.linkedInstancesData, { instance_name: instanceName, custom_name: null }],
        saving: false
      }));
    } catch (error) {
      console.error('Erro ao alterar vínculo:', error);
      toast.error(`Erro ao ${data.linkedInstances.includes(instanceName) ? 'desvincular' : 'vincular'} instância`);
      setData(prev => ({ ...prev, saving: false }));
    }
  };

  const handleConnectInstance = (instanceName) => {
    setQrModal({
      isOpen: true,
      instanceName
    });
  };

  const handleDisconnectInstance = (instanceName) => {
    showConfirmation(
      'danger',
      'Desconectar WhatsApp',
      `Tem certeza que deseja desconectar a instância "${instanceName}" do WhatsApp? Esta ação encerrará a sessão ativa e será necessário escanear o QR Code novamente para reconectar.`,
      instanceName,
      () => performDisconnectInstance(instanceName),
      'Desconectar'
    );
  };

  const performDisconnectInstance = async (instanceName) => {
    try {
      setData(prev => ({ ...prev, saving: true }));

      const response = await axios.delete(`${API_BASE_URL}/evolution/instances/${instanceName}`);

      if (response.data.success) {
        toast.success(`Instância ${instanceName} desconectada com sucesso`);
        // Recarregar dados para atualizar status
        await loadData();
      } else {
        throw new Error('Falha ao desconectar instância');
      }
    } catch (error) {
      console.error('Erro ao desconectar instância:', error);
      toast.error(`Erro ao desconectar instância: ${error.message}`);
    } finally {
      setData(prev => ({ ...prev, saving: false }));
    }
  };

  const handleCloseQrModal = () => {
    setQrModal({
      isOpen: false,
      instanceName: null
    });
  };

  const getInstanceCustomName = (instanceName) => {
    const linkedData = data.linkedInstancesData.find(item => item.instance_name === instanceName);
    return linkedData?.custom_name || '';
  };

  const handleStartEditCustomName = (instanceName) => {
    const currentCustomName = getInstanceCustomName(instanceName);
    setEditingCustomName({
      instanceName,
      value: currentCustomName,
      saving: false
    });
  };

  const handleCancelEditCustomName = () => {
    setEditingCustomName({
      instanceName: null,
      value: '',
      saving: false
    });
  };

  const handleSaveCustomName = async () => {
    if (!editingCustomName.instanceName) return;

    try {
      setEditingCustomName(prev => ({ ...prev, saving: true }));

      await axios.put(
        `${API_BASE_URL}/workspace-instances/${workspaceUuid}/${editingCustomName.instanceName}/custom-name`,
        { custom_name: editingCustomName.value.trim() || null }
      );

      // Atualizar estado local após sucesso da API
      setData(prev => ({
        ...prev,
        linkedInstancesData: prev.linkedInstancesData.map(item =>
          item.instance_name === editingCustomName.instanceName
            ? { ...item, custom_name: editingCustomName.value.trim() || null }
            : item
        )
      }));

      toast.success('Nome personalizado atualizado com sucesso');
      handleCancelEditCustomName();

    } catch (error) {
      console.error('Erro ao salvar nome personalizado:', error);
      toast.error('Erro ao salvar nome personalizado');
      setEditingCustomName(prev => ({ ...prev, saving: false }));
    }
  };

  const filteredAndSortedInstances = () => {
    let filtered = data.instances.filter(instance => {
      const instanceName = instance.name || instance.instanceName;
      const isLinked = data.linkedInstances.includes(instanceName);

      // Filtro de busca
      if (filters.search && !instanceName.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Filtro de status
      if (filters.statusFilter === 'linked' && !isLinked) return false;
      if (filters.statusFilter === 'unlinked' && isLinked) return false;

      // Filtros de conexão online/offline
      const isConnected = instance.connectionStatus === 'open';
      if (filters.statusFilter === 'online' && !isConnected) return false;
      if (filters.statusFilter === 'offline' && isConnected) return false;

      return true;
    });

    // Ordenação
    filtered.sort((a, b) => {
      const nameA = a.name || a.instanceName;
      const nameB = b.name || b.instanceName;
      const linkedA = data.linkedInstances.includes(nameA);
      const linkedB = data.linkedInstances.includes(nameB);

      switch (filters.sortBy) {
        case 'linked':
          if (linkedA !== linkedB) return linkedB - linkedA; // Vinculadas primeiro
          return nameA.localeCompare(nameB);
        case 'status':
          // Mock status comparison
          return nameA.localeCompare(nameB);
        default:
          return nameA.localeCompare(nameB);
      }
    });

    return filtered;
  };

  const getStatsData = () => {
    const total = data.instances.length;
    const linked = data.linkedInstances.length;
    const online = data.instances.filter(instance => {
      return instance.connectionStatus === 'open';
    }).length;

    return { total, linked, online, offline: total - online };
  };

  const stats = getStatsData();
  const processedInstances = filteredAndSortedInstances();

  if (data.loading) {
    return (
      <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 p-8 shadow-blue-elegant">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-sapphire-200/40 rounded w-1/3"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-sapphire-200/40 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 shadow-blue-elegant">
      {/* Header */}
      <div className="border-b border-sapphire-200/30 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-midnight-950">
              Gerenciamento de Contas
            </h2>
            <p className="text-steel-600 text-sm mt-1">
              Contas personalizadas da Workspace "{workspace?.name || 'Desconhecido'}"
            </p>
          </div>
          <button
            onClick={loadData}
            disabled={data.loading}
            className="px-4 py-2 bg-sapphire-600 text-white rounded-lg hover:bg-sapphire-700 disabled:opacity-50 transition-colors"
          >
            🔄 Atualizar
          </button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-sapphire-700">{stats.total}</div>
            <div className="text-xs text-steel-600">Total</div>
          </div>
          <div className="bg-white/50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-emerald-700">{stats.linked}</div>
            <div className="text-xs text-steel-600">Vinculadas</div>
          </div>
          <div className="bg-white/50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-700">{stats.online}</div>
            <div className="text-xs text-steel-600">Online</div>
          </div>
          <div className="bg-white/50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-700">{stats.offline}</div>
            <div className="text-xs text-steel-600">Offline</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="border-b border-sapphire-200/30 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-steel-700 mb-2">Buscar</label>
            <input
              type="text"
              placeholder="Nome da instância..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full px-3 py-2 bg-white/60 border border-sapphire-200/50 rounded-lg focus:ring-2 focus:ring-sapphire-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-steel-700 mb-2">Filtro</label>
            <select
              value={filters.statusFilter}
              onChange={(e) => setFilters(prev => ({ ...prev, statusFilter: e.target.value }))}
              className="w-full px-3 py-2 bg-white/60 border border-sapphire-200/50 rounded-lg focus:ring-2 focus:ring-sapphire-500 focus:border-transparent"
            >
              <option value="all">Todas</option>
              <option value="linked">Vinculadas</option>
              <option value="unlinked">Não vinculadas</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-steel-700 mb-2">Ordenar por</label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
              className="w-full px-3 py-2 bg-white/60 border border-sapphire-200/50 rounded-lg focus:ring-2 focus:ring-sapphire-500 focus:border-transparent"
            >
              <option value="name">Nome</option>
              <option value="linked">Status de vínculo</option>
              <option value="status">Status de conexão</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Instâncias */}
      <div className="p-6">
        {processedInstances.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📱</div>
            <h3 className="text-xl font-semibold text-midnight-950 mb-2">
              {data.instances.length === 0
                ? 'Nenhuma instância encontrada'
                : 'Nenhuma instância corresponde aos filtros'
              }
            </h3>
            <p className="text-steel-600 max-w-md mx-auto">
              {data.instances.length === 0
                ? 'Não foram encontradas instâncias Evolution API.'
                : 'Ajuste os filtros para ver mais instâncias.'
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {processedInstances.map((instance) => {
              const instanceName = instance.name || instance.instanceName;
              const isLinked = data.linkedInstances.includes(instanceName);
              const customName = getInstanceCustomName(instanceName);
              const displayName = customName || instanceName;
              const isEditingThisInstance = editingCustomName.instanceName === instanceName;

              // Dados da conexão WhatsApp
              const isConnected = instance.connectionStatus === 'open';
              const whatsappNumber = instance.number;
              const profileName = instance.profileName;
              const profilePicUrl = instance.profilePicUrl;

              return (
                <div
                  key={instanceName}
                  className={`bg-white/80 backdrop-blur-sm rounded-lg border p-4 shadow-blue-subtle transition-all duration-300 ${
                    isLinked
                      ? 'border-emerald-300/70 ring-2 ring-emerald-200/50'
                      : 'border-sapphire-200/50 hover:border-sapphire-300/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3 flex-1">
                      {isConnected && profilePicUrl ? (
                        <div className="w-8 h-8 rounded-lg overflow-hidden border-2 border-green-400">
                          <img
                            src={profilePicUrl}
                            alt={profileName || 'Perfil WhatsApp'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className={`w-8 h-8 rounded-lg hidden items-center justify-center ${
                            isLinked ? 'bg-emerald-500' : 'bg-steel-300'
                          }`}>
                            <span className="text-white text-sm">📱</span>
                          </div>
                        </div>
                      ) : (
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isLinked ? 'bg-emerald-500' : 'bg-steel-300'
                        }`}>
                          <span className="text-white text-sm">📱</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        {/* Nome da Instância */}
                        {isEditingThisInstance && isLinked ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editingCustomName.value}
                              onChange={(e) => setEditingCustomName(prev => ({ ...prev, value: e.target.value }))}
                              placeholder="Nome personalizado..."
                              className="w-full px-2 py-1 text-sm border border-sapphire-300 rounded focus:ring-2 focus:ring-sapphire-500 focus:border-transparent"
                              disabled={editingCustomName.saving}
                              autoFocus
                            />
                            <div className="flex gap-1">
                              <button
                                onClick={handleSaveCustomName}
                                disabled={editingCustomName.saving}
                                className="px-2 py-1 bg-emerald-500 text-white text-xs rounded hover:bg-emerald-600 disabled:opacity-50"
                              >
                                {editingCustomName.saving ? '...' : '✓'}
                              </button>
                              <button
                                onClick={handleCancelEditCustomName}
                                disabled={editingCustomName.saving}
                                className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 disabled:opacity-50"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-midnight-950 text-sm truncate">
                                {displayName}
                              </h3>
                              {isLinked && (
                                <button
                                  onClick={() => handleStartEditCustomName(instanceName)}
                                  className="text-gray-400 hover:text-sapphire-600 text-xs"
                                  title="Editar nome personalizado"
                                >
                                  ✏️
                                </button>
                              )}
                            </div>
                            {/* Nome real (se diferente do personalizado) */}
                            {customName && customName !== instanceName && (
                              <p className="text-xs text-steel-500 truncate">
                                Real: {instanceName}
                              </p>
                            )}
                          </div>
                        )}
                        <InstanceStatusIndicator
                          instanceName={instanceName}
                          size="sm"
                          showLabel={true}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      {isConnected && whatsappNumber ? (
                        <div className="flex-1 mr-3">
                          <div className="text-sm font-medium text-green-700 mb-1">
                            ✅ WhatsApp Conectado
                          </div>
                          <div className="text-xs text-green-600 space-y-1">
                            <div className="font-mono">
                              📞 {whatsappNumber.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4')}
                            </div>
                            {profileName && (
                              <div className="truncate" title={profileName}>
                                👤 {profileName}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 mr-3">
                          <div className="text-sm font-medium text-gray-600 mb-1">
                            📱 WhatsApp Desconectado
                          </div>
                          <div className="text-xs text-gray-500">
                            Use o botão "Conectar" para vincular uma conta WhatsApp
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        {isConnected ? (
                          <button
                            onClick={() => handleDisconnectInstance(instanceName)}
                            disabled={data.saving}
                            className="px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Desconectar WhatsApp"
                          >
                            {data.saving ? '...' : '🔌 Desconectar'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleConnectInstance(instanceName)}
                            className="px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Conectar WhatsApp (QR Code)"
                          >
                            📱 Conectar
                          </button>
                        )}
                        <button
                          onClick={() => handleInstanceToggle(instanceName)}
                          disabled={data.saving}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                            isLinked
                              ? 'bg-red-500 hover:bg-red-600 text-white'
                              : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {data.saving ? '...' : (isLinked ? 'Desvincular' : 'Vincular')}
                        </button>
                      </div>
                    </div>

                    {isLinked && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-600 text-sm">💬</span>
                          <span className="text-emerald-800 text-xs font-medium">
                            Mensagens aparecem no chat ao vivo
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={qrModal.isOpen}
        onClose={handleCloseQrModal}
        instanceName={qrModal.instanceName}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={hideConfirmation}
        onConfirm={handleConfirmAction}
        title={confirmationModal.title}
        message={confirmationModal.message}
        confirmText={confirmationModal.confirmText}
        cancelText={confirmationModal.cancelText}
        type={confirmationModal.type}
        instanceName={confirmationModal.instanceName}
      />
    </div>
  );
};

export default WorkspaceInstanceManager;