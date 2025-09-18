import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import InstanceStatusIndicator from '../components/InstanceStatusIndicator';
import WorkspaceInstanceManager from '../components/WorkspaceInstanceManager';

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

      {/* Gerenciamento Avançado de Instâncias */}
      <WorkspaceInstanceManager
        workspaceUuid={workspaceUuid}
        workspace={workspace}
      />

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