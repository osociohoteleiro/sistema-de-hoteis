import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Livechat from '../components/Livechat';

const API_BASE_URL = 'http://localhost:3001/api';

const WhatsAppCloud = () => {
  const { workspaceUuid } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('livechat');
  const [credentials, setCredentials] = useState({
    appId: '',
    appSecret: '',
    accessToken: '',
    phoneNumberId: '',
    businessAccountId: '',
    webhookUrl: ''
  });
  const [isConfigured, setIsConfigured] = useState(false);

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

      // Verificar se já existe configuração do WhatsApp Cloud
      try {
        const configResponse = await axios.get(`${API_BASE_URL}/whatsapp-cloud/credentials/${workspaceUuid}`);
        if (configResponse.data.success) {
          setIsConfigured(configResponse.data.configured);
        }
      } catch (configError) {
        console.error('Erro ao verificar configuração:', configError);
        setIsConfigured(false);
      }
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar informações');
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // TODO: Implementar salvamento das credenciais
      toast.success('Credenciais salvas com sucesso!');
      setIsConfigured(true);
    } catch (error) {
      toast.error('Erro ao salvar credenciais');
    }
  };

  const tabs = [
    { id: 'livechat', name: 'Livechat', icon: '💬' },
    { id: 'templates', name: 'Templates', icon: '📝' },
    { id: 'analytics', name: 'Analytics', icon: '📊' },
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
                <span className="text-white text-xl">☁️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-midnight-950">WhatsApp Cloud API</h1>
                <p className="text-steel-700">
                  Workspace: <span className="font-semibold">{workspace?.workspace_name}</span>
                </p>
              </div>
            </div>
            <p className="text-steel-600">
              Interface oficial do WhatsApp Business com recursos avançados e compliance total.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {isConfigured ? (
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg border border-green-200">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-semibold">Configurado</span>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg border border-yellow-200">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm font-semibold">Pendente Configuração</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Configuração Inicial */}
      {!isConfigured && (
        <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 p-8 shadow-blue-elegant">
          <h2 className="text-xl font-bold text-midnight-950 mb-6">Configuração Inicial</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-midnight-950 mb-4">Credenciais da API</h3>
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-steel-700 mb-2">
                    App ID
                  </label>
                  <input
                    type="text"
                    value={credentials.appId}
                    onChange={(e) => setCredentials({...credentials, appId: e.target.value})}
                    className="w-full px-4 py-3 border border-sapphire-200/50 rounded-lg focus:ring-2 focus:ring-sapphire-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                    placeholder="Seu App ID do Facebook"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-steel-700 mb-2">
                    App Secret
                  </label>
                  <input
                    type="password"
                    value={credentials.appSecret}
                    onChange={(e) => setCredentials({...credentials, appSecret: e.target.value})}
                    className="w-full px-4 py-3 border border-sapphire-200/50 rounded-lg focus:ring-2 focus:ring-sapphire-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                    placeholder="Seu App Secret"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-steel-700 mb-2">
                    Access Token
                  </label>
                  <input
                    type="text"
                    value={credentials.accessToken}
                    onChange={(e) => setCredentials({...credentials, accessToken: e.target.value})}
                    className="w-full px-4 py-3 border border-sapphire-200/50 rounded-lg focus:ring-2 focus:ring-sapphire-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                    placeholder="Token de acesso do WhatsApp Business"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-steel-700 mb-2">
                    Phone Number ID
                  </label>
                  <input
                    type="text"
                    value={credentials.phoneNumberId}
                    onChange={(e) => setCredentials({...credentials, phoneNumberId: e.target.value})}
                    className="w-full px-4 py-3 border border-sapphire-200/50 rounded-lg focus:ring-2 focus:ring-sapphire-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                    placeholder="ID do número de telefone"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-sapphire hover:bg-midnight-700 text-white font-semibold py-3 px-6 rounded-lg transition-minimal shadow-sapphire-glow hover:shadow-blue-soft"
                >
                  Salvar Configurações
                </button>
              </form>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-midnight-950 mb-4">Como Configurar</h3>
              <div className="space-y-4 text-sm text-steel-600">
                <div className="bg-blue-50/80 backdrop-blur-sm p-4 rounded-lg border border-blue-200/50">
                  <h4 className="font-semibold text-blue-800 mb-2">1. Facebook Developer Console</h4>
                  <p>Acesse o Facebook for Developers e crie um aplicativo Business.</p>
                </div>
                
                <div className="bg-blue-50/80 backdrop-blur-sm p-4 rounded-lg border border-blue-200/50">
                  <h4 className="font-semibold text-blue-800 mb-2">2. WhatsApp Business Account</h4>
                  <p>Configure sua conta do WhatsApp Business no Business Manager.</p>
                </div>
                
                <div className="bg-blue-50/80 backdrop-blur-sm p-4 rounded-lg border border-blue-200/50">
                  <h4 className="font-semibold text-blue-800 mb-2">3. Aprovação</h4>
                  <p>Aguarde a aprovação da Meta para usar a WhatsApp Cloud API.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interface Principal - Tabs sempre visíveis */}
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

        <div className={activeTab === 'livechat' ? '' : 'p-8'}>
          {activeTab === 'livechat' && (
            <Livechat />
          )}

          {activeTab === 'templates' && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gradient-sapphire rounded-full flex items-center justify-center mx-auto mb-6 shadow-sapphire-glow">
                <span className="text-white text-2xl">📝</span>
              </div>
              <h3 className="text-2xl font-bold text-midnight-950 mb-4">Templates de Mensagem</h3>
              <p className="text-steel-600 max-w-md mx-auto">
                Gerencie templates aprovados para campanhas e mensagens automáticas.
              </p>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gradient-sapphire rounded-full flex items-center justify-center mx-auto mb-6 shadow-sapphire-glow">
                <span className="text-white text-2xl">📊</span>
              </div>
              <h3 className="text-2xl font-bold text-midnight-950 mb-4">Analytics e Relatórios</h3>
              <p className="text-steel-600 max-w-md mx-auto">
                Métricas detalhadas de entrega, leitura e engajamento das mensagens.
              </p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gradient-sapphire rounded-full flex items-center justify-center mx-auto mb-6 shadow-sapphire-glow">
                <span className="text-white text-2xl">⚙️</span>
              </div>
              <h3 className="text-2xl font-bold text-midnight-950 mb-4">Configurações Avançadas</h3>
              <p className="text-steel-600 max-w-md mx-auto">
                Configure webhooks, automações e preferências da API.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppCloud;