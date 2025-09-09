import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Livechat from '../components/Livechat';

const API_BASE_URL = 'http://localhost:3001/api';

const WhatsAppCloudFixed = () => {
  const { workspaceUuid } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('livechat');
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
                  <span className="text-sm font-semibold">Demo Mode</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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

export default WhatsAppCloudFixed;