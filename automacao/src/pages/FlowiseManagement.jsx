import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import flowiseService from '../services/flowiseService';
import messageProcessor from '../services/messageProcessor';
import IntegrationTester from '../components/IntegrationTester';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const FlowiseManagement = () => {
  const [loading, setLoading] = useState(true);
  const [chatflows, setChatflows] = useState([]);
  const [systemInfo, setSystemInfo] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('unknown');
  const [activeTab, setActiveTab] = useState('chatflows');
  const [processingQueue, setProcessingQueue] = useState([]);
  const [queueStats, setQueueStats] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadChatflows(),
        testConnection(),
        loadSystemInfo(),
        loadProcessingQueue(),
        loadQueueStats()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar informações do Flowise');
    } finally {
      setLoading(false);
    }
  };

  const loadChatflows = async () => {
    try {
      const response = await flowiseService.getChatflows();
      if (response.success) {
        setChatflows(response.data);
        console.log(`✅ ${response.data.length} chatflows carregados`);
      } else {
        toast.error('Erro ao carregar chatflows');
        setChatflows([]);
      }
    } catch (error) {
      console.error('Erro ao carregar chatflows:', error);
      setChatflows([]);
    }
  };

  const testConnection = async () => {
    try {
      const response = await flowiseService.testConnection();
      setConnectionStatus(response.success ? 'connected' : 'disconnected');
      
      if (!response.success) {
        toast.error(`Erro de conexão: ${response.error}`);
      }
    } catch (error) {
      setConnectionStatus('error');
      console.error('Erro ao testar conexão:', error);
    }
  };

  const loadSystemInfo = async () => {
    try {
      const response = await flowiseService.getSystemInfo();
      if (response.success) {
        setSystemInfo(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar informações do sistema:', error);
    }
  };

  const loadProcessingQueue = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/webhooks/queue/pending`);
      if (response.data.success) {
        setProcessingQueue(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar fila de processamento:', error);
      setProcessingQueue([]);
    }
  };

  const loadQueueStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/webhooks/queue/stats`);
      if (response.data.success) {
        setQueueStats(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas da fila:', error);
      setQueueStats([]);
    }
  };

  const handleTestChatflow = async (chatflowId) => {
    try {
      const result = await messageProcessor.testMessageProcessing(chatflowId);
      
      if (result.success) {
        toast.success('Teste realizado com sucesso!');
        console.log('Resposta do teste:', result.data);
      } else {
        toast.error(`Erro no teste: ${result.error}`);
      }
    } catch (error) {
      toast.error('Erro ao testar chatflow');
      console.error('Erro:', error);
    }
  };

  const handleDeleteChatflow = async (chatflowId, chatflowName) => {
    if (!window.confirm(`Tem certeza que deseja deletar o chatflow "${chatflowName}"?`)) {
      return;
    }

    try {
      const result = await flowiseService.deleteChatflow(chatflowId);
      
      if (result.success) {
        toast.success('Chatflow deletado com sucesso');
        await loadChatflows(); // Recarregar lista
      } else {
        toast.error(`Erro ao deletar: ${result.error}`);
      }
    } catch (error) {
      toast.error('Erro ao deletar chatflow');
      console.error('Erro:', error);
    }
  };

  const getConnectionStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-100';
      case 'disconnected': return 'text-red-600 bg-red-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getConnectionStatusText = (status) => {
    switch (status) {
      case 'connected': return 'Conectado';
      case 'disconnected': return 'Desconectado';
      case 'error': return 'Erro';
      default: return 'Verificando...';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const tabs = [
    { id: 'chatflows', label: 'Chatflows', icon: '🤖' },
    { id: 'queue', label: 'Fila de Mensagens', icon: '📥' },
    { id: 'system', label: 'Sistema', icon: '⚙️' },
    { id: 'test', label: 'Teste de Integração', icon: '🧪' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sapphire-600 mx-auto mb-4"></div>
          <p className="text-steel-700">Carregando informações do Flowise...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 p-6 shadow-blue-elegant">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-midnight-950 mb-2">
              Gerenciamento Flowise
            </h1>
            <p className="text-steel-700">
              Configure e monitore a integração com Flowise AI
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Status de Conexão */}
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getConnectionStatusColor(connectionStatus)}`}>
              {getConnectionStatusText(connectionStatus)}
            </div>
            
            <button
              onClick={loadData}
              className="bg-gradient-sapphire text-white px-4 py-2 rounded-lg hover:bg-midnight-700 transition-minimal shadow-sapphire-glow"
            >
              🔄 Atualizar
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-sapphire-200/30">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-sapphire-500 text-sapphire-600'
                    : 'border-transparent text-steel-600 hover:text-steel-800'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'chatflows' && (
        <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 p-6 shadow-blue-elegant">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-midnight-950">
              Chatflows Disponíveis ({chatflows.length})
            </h2>
            <Link
              to="/flows/new"
              className="bg-gradient-sapphire text-white px-4 py-2 rounded-lg hover:bg-midnight-700 transition-minimal shadow-sapphire-glow"
            >
              ➕ Novo Chatflow
            </Link>
          </div>

          {chatflows.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🤖</div>
              <h3 className="text-lg font-medium text-midnight-950 mb-2">
                Nenhum chatflow encontrado
              </h3>
              <p className="text-steel-700 mb-4">
                Crie seu primeiro chatflow para começar
              </p>
              <Link
                to="/flows/new"
                className="bg-gradient-sapphire text-white px-6 py-3 rounded-lg hover:bg-midnight-700 transition-minimal shadow-sapphire-glow inline-block"
              >
                Criar Chatflow
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {chatflows.map((chatflow) => (
                <div key={chatflow.id} className="bg-white/50 rounded-lg p-4 border border-sapphire-100">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-medium text-midnight-950 truncate">
                      {chatflow.name}
                    </h3>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      chatflow.deployed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {chatflow.deployed ? 'Ativo' : 'Inativo'}
                    </div>
                  </div>

                  <p className="text-sm text-steel-700 mb-4 line-clamp-2">
                    {chatflow.category || 'Sem categoria'}
                  </p>

                  <div className="text-xs text-steel-600 mb-4">
                    Atualizado: {formatDate(chatflow.updatedDate)}
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleTestChatflow(chatflow.id)}
                      className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded text-sm hover:bg-blue-100 transition-colors"
                    >
                      🧪 Testar
                    </button>
                    <button
                      onClick={() => handleDeleteChatflow(chatflow.id, chatflow.name)}
                      className="bg-red-50 text-red-700 px-3 py-2 rounded text-sm hover:bg-red-100 transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'queue' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {queueStats.map((stat) => (
              <div key={stat.status} className="bg-gradient-card-blue backdrop-blur-md rounded-lg border border-sapphire-200/40 p-4">
                <div className="text-2xl font-bold text-midnight-950">{stat.count}</div>
                <div className="text-sm text-steel-700 capitalize">{stat.status}</div>
              </div>
            ))}
          </div>

          {/* Queue */}
          <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 p-6 shadow-blue-elegant">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-midnight-950">
                Mensagens Pendentes ({processingQueue.length})
              </h2>
              <button
                onClick={loadProcessingQueue}
                className="bg-gradient-sapphire text-white px-4 py-2 rounded-lg hover:bg-midnight-700 transition-minimal"
              >
                🔄 Atualizar
              </button>
            </div>

            {processingQueue.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📪</div>
                <p className="text-steel-700">Nenhuma mensagem pendente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {processingQueue.map((message) => (
                  <div key={message.id} className="bg-white/50 rounded-lg p-4 border border-sapphire-100">
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-sm font-medium text-midnight-950">
                        {message.from_number}
                      </div>
                      <div className="text-xs text-steel-600">
                        {formatDate(message.created_at)}
                      </div>
                    </div>
                    
                    <div className="text-sm text-steel-700 mb-2">
                      <strong>Instância:</strong> {message.instance_name}
                    </div>
                    
                    <div className="text-sm text-midnight-950 bg-gray-50 rounded p-2">
                      "{message.message_text}"
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 p-6 shadow-blue-elegant">
          <h2 className="text-xl font-semibold text-midnight-950 mb-6">
            Informações do Sistema
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Connection Info */}
            <div className="bg-white/50 rounded-lg p-4 border border-sapphire-100">
              <h3 className="font-medium text-midnight-950 mb-3">Conexão</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-steel-700">URL:</span>
                  <span className="ml-2 font-mono text-midnight-950">
                    {import.meta.env.VITE_FLOWISE_URL}
                  </span>
                </div>
                <div>
                  <span className="text-steel-700">Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${getConnectionStatusColor(connectionStatus)}`}>
                    {getConnectionStatusText(connectionStatus)}
                  </span>
                </div>
                <div>
                  <span className="text-steel-700">API Key:</span>
                  <span className="ml-2 text-midnight-950">
                    {import.meta.env.VITE_FLOWISE_API_KEY ? '••••••••' : 'Não configurada'}
                  </span>
                </div>
              </div>
            </div>

            {/* System Info */}
            {systemInfo && (
              <div className="bg-white/50 rounded-lg p-4 border border-sapphire-100">
                <h3 className="font-medium text-midnight-950 mb-3">Sistema Flowise</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-steel-700">Versão:</span>
                    <span className="ml-2 text-midnight-950">{systemInfo.version}</span>
                  </div>
                  {systemInfo.commitSha && (
                    <div>
                      <span className="text-steel-700">Commit:</span>
                      <span className="ml-2 font-mono text-midnight-950 text-xs">
                        {systemInfo.commitSha.substring(0, 8)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 pt-6 border-t border-sapphire-200/30">
            <div className="flex space-x-4">
              <button
                onClick={testConnection}
                className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
              >
                🔍 Testar Conexão
              </button>
              <button
                onClick={loadSystemInfo}
                className="bg-green-50 text-green-700 px-4 py-2 rounded-lg hover:bg-green-100 transition-colors"
              >
                ℹ️ Verificar Sistema
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'test' && (
        <IntegrationTester />
      )}
    </div>
  );
};

export default FlowiseManagement;