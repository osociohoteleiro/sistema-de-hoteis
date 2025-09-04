import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Livechat from '../components/Livechat';

const API_BASE_URL = 'http://localhost:3001/api';

const WhatsAppCloudOAuth = () => {
  const { workspaceUuid } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('livechat');
  const [isConfigured, setIsConfigured] = useState(false);
  const [connecting, setConnecting] = useState(false);

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

  const handleMetaConnect = () => {
    // Verificar se o App ID está configurado
    const clientId = process.env.REACT_APP_FACEBOOK_APP_ID || '';
    
    if (!clientId || clientId === 'your_app_id_here') {
      toast.error('App ID do Facebook não configurado. Configure REACT_APP_FACEBOOK_APP_ID no arquivo .env');
      return;
    }

    setConnecting(true);
    
    const redirectUri = encodeURIComponent(`${window.location.origin}/whatsapp-oauth-callback`);
    const scope = encodeURIComponent('whatsapp_business_management,whatsapp_business_messaging');
    const state = encodeURIComponent(workspaceUuid); // Para identificar a workspace no callback
    
    const oauthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}&response_type=code`;
    
    // Abrir popup para OAuth
    const popup = window.open(
      oauthUrl,
      'meta-oauth',
      'width=600,height=700,scrollbars=yes,resizable=yes'
    );

    // Monitorar o popup
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        setConnecting(false);
        // Recarregar dados para verificar se a conexão foi bem-sucedida
        loadWorkspaceData();
      }
    }, 1000);

    // Escutar mensagens do popup (quando o callback for processado)
    const messageListener = (event) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'WHATSAPP_OAUTH_SUCCESS') {
        popup.close();
        window.removeEventListener('message', messageListener);
        setConnecting(false);
        setIsConfigured(true);
        toast.success('WhatsApp Cloud API conectado com sucesso!');
        loadWorkspaceData();
      } else if (event.data.type === 'WHATSAPP_OAUTH_ERROR') {
        popup.close();
        window.removeEventListener('message', messageListener);
        setConnecting(false);
        toast.error('Erro ao conectar: ' + (event.data.error || 'Erro desconhecido'));
      }
    };

    window.addEventListener('message', messageListener);
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

      {/* Configuração com OAuth */}
      {!isConfigured && (
        <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 p-8 shadow-blue-elegant">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-sapphire rounded-full flex items-center justify-center mx-auto mb-6 shadow-sapphire-glow">
              <span className="text-white text-2xl">🔗</span>
            </div>
            
            <h2 className="text-2xl font-bold text-midnight-950 mb-4">Conectar WhatsApp Cloud API</h2>
            <p className="text-steel-600 mb-8 max-w-md mx-auto">
              Conecte sua conta do WhatsApp Business de forma segura e rápida usando a autenticação oficial do Meta.
            </p>

            <button
              onClick={handleMetaConnect}
              disabled={connecting}
              className={`bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-8 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-3 mx-auto ${
                connecting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {connecting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Conectando...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>Conectar com Meta</span>
                </>
              )}
            </button>

            <div className="mt-8 grid md:grid-cols-3 gap-4 text-sm">
              <div className="bg-green-50/80 backdrop-blur-sm p-4 rounded-lg border border-green-200/50">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-white text-sm">✓</span>
                </div>
                <h4 className="font-semibold text-green-800 mb-1">Seguro</h4>
                <p className="text-green-700">Autenticação oficial do Meta</p>
              </div>
              
              <div className="bg-blue-50/80 backdrop-blur-sm p-4 rounded-lg border border-blue-200/50">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-white text-sm">⚡</span>
                </div>
                <h4 className="font-semibold text-blue-800 mb-1">Rápido</h4>
                <p className="text-blue-700">Configuração em poucos cliques</p>
              </div>
              
              <div className="bg-purple-50/80 backdrop-blur-sm p-4 rounded-lg border border-purple-200/50">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-white text-sm">🔒</span>
                </div>
                <h4 className="font-semibold text-purple-800 mb-1">Privado</h4>
                <p className="text-purple-700">Suas credenciais ficam protegidas</p>
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

export default WhatsAppCloudOAuth;