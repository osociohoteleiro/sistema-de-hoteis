import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:3001/api';

const WhatsAppApp = () => {
  const { workspaceUuid } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('instances');
  const [instances, setInstances] = useState([]);
  const [qrCode, setQrCode] = useState(null);
  const [selectedInstance, setSelectedInstance] = useState(null);

  useEffect(() => {
    loadWorkspaceData();
  }, [workspaceUuid]);

  const loadWorkspaceData = async () => {
    try {
      setLoading(true);
      
      // Carregar workspace do localStorage
      const savedWorkspace = localStorage.getItem('selectedWorkspace');
      if (savedWorkspace) {
        setWorkspace(JSON.parse(savedWorkspace));
      }

      // Carregar instâncias Evolution existentes
      await loadEvolutionInstances();
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar informações');
    } finally {
      setLoading(false);
    }
  };

  const loadEvolutionInstances = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/evolution/instances`);
      if (response.data.success) {
        setInstances(response.data.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar instâncias:', error);
    }
  };

  const handleConnectInstance = async (instanceName) => {
    try {
      setSelectedInstance(instanceName);
      const response = await axios.get(`${API_BASE_URL}/evolution/qrcode/${instanceName}`);
      
      if (response.data.success && response.data.data.qrcode) {
        setQrCode(response.data.data.qrcode);
        toast.success('QR Code gerado! Escaneie com seu WhatsApp.');
      } else {
        toast.error('Não foi possível gerar o QR Code');
      }
    } catch (error) {
      toast.error('Erro ao conectar instância');
      console.error(error);
    }
  };

  const handleCreateInstance = async () => {
    try {
      const instanceName = `workspace_${workspaceUuid}_${Date.now()}`;
      
      const response = await axios.post(`${API_BASE_URL}/evolution/create`, {
        instanceName,
        hotel_uuid: workspace?.hotel_uuid || 'default',
        webhook_url: `${window.location.origin}/api/webhooks/evolution`
      });

      if (response.data.success) {
        toast.success('Instância criada com sucesso!');
        await loadEvolutionInstances();
      } else {
        toast.error('Erro ao criar instância');
      }
    } catch (error) {
      toast.error('Erro ao criar nova instância');
      console.error(error);
    }
  };

  const getInstanceStatus = (instance) => {
    // Simulação de status - na implementação real, isso viria da API
    const statuses = ['CONNECTED', 'DISCONNECTED', 'CONNECTING'];
    return statuses[Math.floor(Math.random() * statuses.length)];
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

  const tabs = [
    { id: 'instances', name: 'Instâncias', icon: '📱' },
    { id: 'messages', name: 'Mensagens', icon: '💬' },
    { id: 'contacts', name: 'Contatos', icon: '👥' },
    { id: 'settings', name: 'Configurações', icon: '⚙️' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sapphire-600 mx-auto mb-4"></div>
          <p className="text-steel-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 p-8 shadow-blue-elegant">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-12 h-12 bg-gradient-sapphire rounded-lg flex items-center justify-center shadow-sapphire-glow">
                <span className="text-white text-xl">📱</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-midnight-950">WhatsApp App (Evolution API)</h1>
                <p className="text-steel-700">
                  Workspace: <span className="font-semibold">{workspace?.workspace_name}</span>
                </p>
              </div>
            </div>
            <p className="text-steel-600">
              Gerencie instâncias do WhatsApp conectadas via Evolution API com recursos avançados de automação.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-semibold">Evolution API</span>
              </div>
            </div>
            <button
              onClick={handleCreateInstance}
              className="bg-gradient-sapphire hover:bg-midnight-700 text-white font-semibold py-2 px-4 rounded-lg transition-minimal shadow-sapphire-glow hover:shadow-blue-soft"
            >
              Nova Instância
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 shadow-blue-elegant">
        <div className="border-b border-sapphire-200/30">
          <nav className="flex space-x-8 px-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-sapphire-500 text-sapphire-600'
                    : 'border-transparent text-steel-600 hover:text-steel-800 hover:border-steel-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-8">
          {activeTab === 'instances' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-midnight-950">Instâncias do WhatsApp</h3>
                <div className="text-sm text-steel-600">
                  {instances.length} instância(s) encontrada(s)
                </div>
              </div>

              {instances.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-gradient-sapphire rounded-full flex items-center justify-center mx-auto mb-6 shadow-sapphire-glow">
                    <span className="text-white text-2xl">📱</span>
                  </div>
                  <h4 className="text-xl font-semibold text-midnight-950 mb-4">Nenhuma instância encontrada</h4>
                  <p className="text-steel-600 max-w-md mx-auto mb-6">
                    Crie sua primeira instância do WhatsApp para começar a receber e enviar mensagens.
                  </p>
                  <button
                    onClick={handleCreateInstance}
                    className="bg-gradient-sapphire hover:bg-midnight-700 text-white font-semibold py-3 px-6 rounded-lg transition-minimal shadow-sapphire-glow hover:shadow-blue-soft"
                  >
                    Criar Primeira Instância
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {instances.map((instance) => {
                    const status = getInstanceStatus(instance);
                    return (
                      <div key={instance.instanceName} className="bg-white/80 backdrop-blur-sm rounded-lg border border-sapphire-200/50 p-6 shadow-blue-subtle">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-sapphire rounded-lg flex items-center justify-center shadow-sapphire-glow">
                              <span className="text-white text-lg">📱</span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-midnight-950">{instance.instanceName}</h4>
                              <p className="text-sm text-steel-600">Criada em {new Date(instance.created_at || Date.now()).toLocaleDateString('pt-BR')}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
                              {status}
                            </span>
                            {status === 'DISCONNECTED' && (
                              <button
                                onClick={() => handleConnectInstance(instance.instanceName)}
                                className="bg-gradient-sapphire hover:bg-midnight-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-minimal shadow-sapphire-glow hover:shadow-blue-soft"
                              >
                                Conectar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gradient-sapphire rounded-full flex items-center justify-center mx-auto mb-6 shadow-sapphire-glow">
                <span className="text-white text-2xl">💬</span>
              </div>
              <h3 className="text-2xl font-bold text-midnight-950 mb-4">Central de Mensagens</h3>
              <p className="text-steel-600 max-w-md mx-auto">
                Interface para envio e recebimento de mensagens via Evolution API.
              </p>
            </div>
          )}

          {activeTab === 'contacts' && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gradient-sapphire rounded-full flex items-center justify-center mx-auto mb-6 shadow-sapphire-glow">
                <span className="text-white text-2xl">👥</span>
              </div>
              <h3 className="text-2xl font-bold text-midnight-950 mb-4">Gerenciamento de Contatos</h3>
              <p className="text-steel-600 max-w-md mx-auto">
                Organize e gerencie seus contatos do WhatsApp.
              </p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gradient-sapphire rounded-full flex items-center justify-center mx-auto mb-6 shadow-sapphire-glow">
                <span className="text-white text-2xl">⚙️</span>
              </div>
              <h3 className="text-2xl font-bold text-midnight-950 mb-4">Configurações da Evolution API</h3>
              <p className="text-steel-600 max-w-md mx-auto">
                Configure webhooks, automações e preferências da Evolution API.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal QR Code */}
      {qrCode && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md mx-4 shadow-2xl">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-midnight-950 mb-6">Conectar WhatsApp</h3>
              <div className="bg-white p-4 rounded-lg border-2 border-sapphire-200 mb-6">
                <img src={`data:image/png;base64,${qrCode.base64}`} alt="QR Code" className="mx-auto" />
              </div>
              <p className="text-steel-600 mb-6 text-sm">
                Escaneie este código QR com seu WhatsApp para conectar a instância.
              </p>
              <button
                onClick={() => setQrCode(null)}
                className="bg-gradient-sapphire hover:bg-midnight-700 text-white font-semibold py-2 px-6 rounded-lg transition-minimal"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppApp;