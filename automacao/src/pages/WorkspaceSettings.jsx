import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:3001/api';

const makeRequestWithRetry = async (url, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await axios.get(url);
      return response;
    } catch (error) {
      if (error.response?.status === 429 && i < maxRetries - 1) {
        const delay = Math.min(1000 * Math.pow(2, i), 10000);
        console.log(`Rate limited, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
};

const WorkspaceSettings = () => {
  const { workspaceUuid } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [instances, setInstances] = useState([]);
  const [instancesStatus, setInstancesStatus] = useState(new Map());
  const [linkedInstances, setLinkedInstances] = useState([]);
  const [savingLinks, setSavingLinks] = useState(false);

  useEffect(() => {
    loadWorkspaceData();
  }, [workspaceUuid]);

  const loadWorkspaceData = async () => {
    try {
      setLoading(true);

      if (!workspaceUuid || workspaceUuid === 'undefined' || workspaceUuid === 'null') {
        console.error('WorkspaceUuid inválido:', workspaceUuid);
        toast.error('UUID do workspace inválido. Redirecionando para lista de workspaces...');
        setTimeout(() => {
          window.location.href = '/workspaces';
        }, 2000);
        return;
      }

      // Carregar workspace do localStorage
      const savedWorkspace = localStorage.getItem('selectedWorkspace');
      if (savedWorkspace) {
        const parsedWorkspace = JSON.parse(savedWorkspace);
        setWorkspace(parsedWorkspace);
      }

      // Carregar dados sequencialmente para evitar rate limiting
      await loadLinkedInstances();
      await new Promise(resolve => setTimeout(resolve, 500)); // Pausa entre carregamentos
      await loadEvolutionInstances();

    } catch (error) {
      console.error('Erro ao carregar dados do workspace:', error);
      toast.error('Erro ao carregar configurações do workspace');
    } finally {
      setLoading(false);
    }
  };

  const loadEvolutionInstances = async () => {
    try {
      const response = await makeRequestWithRetry(`${API_BASE_URL}/evolution/instances`);
      if (response.data.success) {
        const instancesData = response.data.data || [];
        setInstances(instancesData);

        // Carregar status das instâncias apenas se necessário
        if (instancesData.length > 0 && instancesData.length <= 5) {
          // Só carregar status automaticamente se houver poucas instâncias
          await loadInstancesStatus(instancesData);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar instâncias Evolution:', error);
      toast.error('Erro ao carregar instâncias Evolution');
    }
  };

  const loadLinkedInstances = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/workspace-instances/${workspaceUuid}`);
      if (response.data.success) {
        const linked = response.data.data || [];
        setLinkedInstances(linked.map(item => item.instance_name));
        console.log('Instâncias vinculadas carregadas:', linked);
      }
    } catch (error) {
      console.error('Erro ao carregar instâncias vinculadas:', error);
      // Se a API não existe ainda, não é erro crítico
      if (error.response?.status !== 404) {
        toast.error('Erro ao carregar vínculos de instâncias');
      }
    }
  };

  const loadInstancesStatus = async (instancesList) => {
    const statusMap = new Map();

    // Processar uma instância por vez para evitar rate limiting
    for (const instance of instancesList) {
      try {
        const instanceName = instance.name || instance.instanceName;
        if (!instanceName) continue;

        // Maior delay entre requisições para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

        const response = await axios.get(`${API_BASE_URL}/evolution/status/${instanceName}`);
        if (response.data.success) {
          const connectionState = response.data.data.instance?.state || 'DISCONNECTED';
          statusMap.set(instanceName, connectionState);
        } else {
          statusMap.set(instanceName, 'DISCONNECTED');
        }
      } catch (error) {
        const instanceName = instance.name || instance.instanceName || 'unknown';
        console.log(`Status da instância ${instanceName} não disponível`);
        statusMap.set(instanceName, 'DISCONNECTED');

        // Se for rate limiting, parar e usar status padrão para o resto
        if (error.response?.status === 429) {
          console.log('Rate limiting detectado, usando status padrão para instâncias restantes');
          break;
        }
      }
    }

    setInstancesStatus(statusMap);
  };

  const handleInstanceToggle = async (instanceName) => {
    try {
      const isCurrentlyLinked = linkedInstances.includes(instanceName);

      if (isCurrentlyLinked) {
        // Desvincular instância
        await axios.delete(`${API_BASE_URL}/workspace-instances/${workspaceUuid}/${instanceName}`);
        setLinkedInstances(prev => prev.filter(name => name !== instanceName));
        toast.success(`Instância ${instanceName} desvinculada com sucesso`);
      } else {
        // Vincular instância
        await axios.post(`${API_BASE_URL}/workspace-instances`, {
          workspace_uuid: workspaceUuid,
          instance_name: instanceName
        });
        setLinkedInstances(prev => [...prev, instanceName]);
        toast.success(`Instância ${instanceName} vinculada com sucesso`);
      }
    } catch (error) {
      console.error('Erro ao alterar vínculo da instância:', error);
      toast.error('Erro ao alterar vínculo da instância. A API pode não estar implementada ainda.');
    }
  };

  const getInstanceStatus = (instance) => {
    const instanceName = instance.name || instance.instanceName;
    let status = instancesStatus.get(instanceName);

    if (!status) {
      status = instance.connectionStatus || 'disconnected';
    }

    switch (status.toLowerCase()) {
      case 'open':
        return 'CONNECTED';
      case 'connecting':
        return 'CONNECTING';
      case 'close':
      case 'closed':
      case 'disconnected':
      default:
        return 'DISCONNECTED';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONNECTED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'DISCONNECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'CONNECTING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'CONNECTED':
        return '✅';
      case 'DISCONNECTED':
        return '❌';
      case 'CONNECTING':
        return '🔄';
      default:
        return '⚫';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sapphire-600 mx-auto mb-4"></div>
          <p className="text-steel-600">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 p-6 shadow-blue-elegant">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                to="/workspaces"
                className="text-sapphire-600 hover:text-sapphire-700 text-sm font-medium"
              >
                ← Voltar aos Workspaces
              </Link>
              <span className="text-steel-400">|</span>
              <Link
                to={`/workspace/${workspaceUuid}/chat-ao-vivo`}
                className="text-sapphire-600 hover:text-sapphire-700 text-sm font-medium"
              >
                Chat ao Vivo
              </Link>
              <span className="text-steel-400">|</span>
              <Link
                to={`/workspace/${workspaceUuid}/bots`}
                className="text-sapphire-600 hover:text-sapphire-700 text-sm font-medium"
              >
                Bots
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-midnight-950">
              Configurações - {workspace?.name || 'Workspace'}
            </h1>
            <p className="text-steel-700 mt-2">
              {workspace ? `Hotel: ${workspace.hotel_nome}` : 'Configure as integrações e preferências do workspace'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full border border-blue-200">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-semibold">Configurações</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seção Instâncias Evolution */}
      <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 shadow-blue-elegant">
        <div className="border-b border-sapphire-200/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-midnight-950">Instâncias Evolution API</h2>
              <p className="text-steel-600 text-sm mt-1">
                Vincule instâncias Evolution ao workspace para receber mensagens automaticamente no chat ao vivo
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-steel-600">
                {linkedInstances.length} de {instances.length} instâncias vinculadas
              </div>
              <button
                onClick={() => loadInstancesStatus(instances)}
                disabled={loading}
                className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-1 px-3 rounded-lg text-sm transition-minimal border border-blue-200 disabled:opacity-50"
                title="Atualizar status das instâncias"
              >
                🔄 Status
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {instances.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-sapphire rounded-full flex items-center justify-center mx-auto mb-6 shadow-sapphire-glow">
                <span className="text-white text-2xl">📱</span>
              </div>
              <h3 className="text-xl font-semibold text-midnight-950 mb-4">Nenhuma instância encontrada</h3>
              <p className="text-steel-600 max-w-md mx-auto">
                Não foram encontradas instâncias Evolution API. Certifique-se de que o serviço Evolution está rodando.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {instances.map((instance) => {
                const instanceName = instance.name || instance.instanceName;
                const status = getInstanceStatus(instance);
                const isLinked = linkedInstances.includes(instanceName);

                return (
                  <div
                    key={instanceName}
                    className={`bg-white/80 backdrop-blur-sm rounded-lg border p-6 shadow-blue-subtle transition-all duration-300 ${
                      isLinked
                        ? 'border-sapphire-300/70 ring-2 ring-sapphire-200/50'
                        : 'border-sapphire-200/50 hover:border-sapphire-300/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sapphire-glow ${
                          isLinked ? 'bg-gradient-sapphire' : 'bg-steel-200'
                        }`}>
                          <span className={`text-lg ${isLinked ? 'text-white' : 'text-steel-600'}`}>📱</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-midnight-950 text-sm">{instanceName}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
                              {getStatusIcon(status)} {status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="text-xs text-steel-600">
                        <div>Criada em: {new Date(instance.createdAt || instance.created_at || Date.now()).toLocaleDateString('pt-BR')}</div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-steel-700">
                          {isLinked ? 'Vinculada ao workspace' : 'Não vinculada'}
                        </span>
                        <button
                          onClick={() => handleInstanceToggle(instanceName)}
                          disabled={savingLinks}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 ${
                            isLinked
                              ? 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-400/50'
                              : 'bg-gradient-sapphire hover:bg-sapphire-600 text-white focus:ring-sapphire-400/50'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {savingLinks ? '...' : (isLinked ? 'Desvincular' : 'Vincular')}
                        </button>
                      </div>

                      {isLinked && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-green-600 text-sm">✅</span>
                            <span className="text-green-800 text-xs font-medium">
                              Mensagens aparecerão no chat ao vivo
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
      </div>

      {/* Seção WhatsApp Cloud (futura) */}
      <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 shadow-blue-elegant">
        <div className="border-b border-sapphire-200/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-midnight-950">WhatsApp Cloud API</h2>
              <p className="text-steel-600 text-sm mt-1">
                Configure credenciais e configurações da WhatsApp Cloud API
              </p>
            </div>
            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-semibold">Em breve</span>
          </div>
        </div>

        <div className="p-6">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-sapphire rounded-full flex items-center justify-center mx-auto mb-6 shadow-sapphire-glow">
              <span className="text-white text-2xl">☁️</span>
            </div>
            <h3 className="text-xl font-semibold text-midnight-950 mb-4">Configuração WhatsApp Cloud</h3>
            <p className="text-steel-600 max-w-md mx-auto">
              A configuração da WhatsApp Cloud API será implementada em breve.
            </p>
          </div>
        </div>
      </div>

      {/* Footer com estatísticas */}
      <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 p-4 shadow-blue-elegant">
        <div className="flex flex-wrap gap-6 text-sm text-steel-600">
          <div>
            <span className="font-medium">Instâncias Evolution:</span> {instances.length}
          </div>
          <div>
            <span className="font-medium">Vinculadas:</span> {linkedInstances.length}
          </div>
          <div>
            <span className="font-medium">Conectadas:</span> {instances.filter(i => getInstanceStatus(i) === 'CONNECTED').length}
          </div>
          <div>
            <span className="font-medium">Workspace UUID:</span> {workspaceUuid}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceSettings;