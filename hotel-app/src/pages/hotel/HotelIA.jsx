import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import KnowledgeModal from '../../components/KnowledgeModal';
import MarketingMessageList from '../../components/MarketingMessageList';
import MarketingMessageForm from '../../components/MarketingMessageForm';
import toast from 'react-hot-toast';

const HotelIA = () => {
  const { user } = useAuth();
  const { selectedHotelUuid, marketingMessages, fetchMarketingMessages, createMarketingMessage, updateMarketingMessage } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [iaSettings, setIaSettings] = useState({
    chatbotEnabled: true,
    autoResponses: false,
    guestLanguage: 'pt-BR',
    responseDelay: 'immediate'
  });

  // AI Training states
  const [aiTrainingStatus, setAiTrainingStatus] = useState(true); // true = active, false = paused
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);

  // Marketing Messages states
  const [showMarketingForm, setShowMarketingForm] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [mockStats] = useState({
    totalInteractions: 1247,
    satisfactionRate: 94.2,
    responseTime: '1.2s',
    resolvedQueries: 89.7
  });

  const mockConversations = [
    {
      id: 1,
      guest: 'Ana Silva',
      room: '205',
      lastMessage: 'Como faço para pedir room service?',
      time: '14:30',
      status: 'ai-handled',
      satisfaction: 5
    },
    {
      id: 2,
      guest: 'Carlos Santos',
      room: '101',
      lastMessage: 'Qual o horário da piscina?',
      time: '13:15',
      status: 'ai-handled',
      satisfaction: 4
    },
    {
      id: 3,
      guest: 'Marina Costa',
      room: '307',
      lastMessage: 'Preciso de ajuda com o check-out',
      time: '12:45',
      status: 'escalated',
      satisfaction: null
    }
  ];

  const handleSettingsChange = (setting, value) => {
    setIaSettings(prev => ({
      ...prev,
      [setting]: value
    }));
    toast.success('Configuração atualizada');
  };

  // AI Training handlers
  const handleToggleAI = () => {
    setAiTrainingStatus(!aiTrainingStatus);
    toast.success(`IA ${aiTrainingStatus ? 'pausada' : 'ativada'}`);
  };

  const handleKnowledgeConfig = () => {
    if (!selectedHotelUuid) {
      toast.error('Selecione um hotel primeiro na página "Meus Hotéis"');
      return;
    }
    setShowKnowledgeModal(true);
  };

  const handleSkillsManagement = () => {
    toast.info('Gerenciamento de habilidades em desenvolvimento');
  };

  const handleBehaviorAdjustment = () => {
    toast.info('Ajuste de comportamento em desenvolvimento');
  };

  // Marketing Messages handlers
  const loadMarketingMessages = async () => {
    if (!selectedHotelUuid) {
      toast.error('Selecione um hotel primeiro na página "Meus Hotéis"');
      return;
    }
    
    setLoadingMessages(true);
    try {
      await fetchMarketingMessages(selectedHotelUuid);
    } catch (error) {
      console.error('Erro ao carregar mensagens de marketing:', error);
      toast.error('Erro ao carregar mensagens de marketing');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleNewMarketingMessage = () => {
    if (!selectedHotelUuid) {
      toast.error('Selecione um hotel primeiro na página "Meus Hotéis"');
      return;
    }
    setEditingMessage(null);
    setShowMarketingForm(true);
  };

  const handleEditMarketingMessage = (message) => {
    setEditingMessage(message);
    setShowMarketingForm(true);
  };

  const handleMarketingMessageAdded = async (messageData) => {
    try {
      if (editingMessage) {
        await updateMarketingMessage(editingMessage.id, messageData);
        toast.success('Mensagem de marketing atualizada com sucesso!');
      } else {
        await createMarketingMessage(messageData);
        toast.success('Mensagem de marketing cadastrada com sucesso!');
      }
      setShowMarketingForm(false);
      setEditingMessage(null);
    } catch (error) {
      console.error('Erro ao salvar mensagem:', error);
      toast.error('Erro ao salvar mensagem de marketing');
    }
  };

  const handleCancelMarketingForm = () => {
    setShowMarketingForm(false);
    setEditingMessage(null);
  };

  // Load marketing messages when tab changes to treinamento
  useEffect(() => {
    if (activeTab === 'treinamento' && selectedHotelUuid) {
      loadMarketingMessages();
    }
  }, [activeTab, selectedHotelUuid]);

  const StatCard = ({ title, value, icon, color = 'primary', suffix = '' }) => (
    <div className="bg-sidebar-800/50 backdrop-blur-sm rounded-lg border border-white/10 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sidebar-400 text-sm font-medium">{title}</p>
          <p className={`text-2xl font-bold text-${color}-400 mt-2`}>
            {value}{suffix}
          </p>
        </div>
        <div className={`p-3 bg-${color}-500/10 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const getStatusColor = (status) => {
    const colors = {
      'ai-handled': 'text-green-400',
      'escalated': 'text-yellow-400',
      'human-handled': 'text-blue-400'
    };
    return colors[status] || 'text-gray-400';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'ai-handled': 'IA Resolveu',
      'escalated': 'Escalado',
      'human-handled': 'Atendimento Humano'
    };
    return labels[status] || 'Desconhecido';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Inteligência Artificial</h1>
          <p className="text-sidebar-400">Gerencie a IA do seu hotel e acompanhe as interações</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-sidebar-800/50 backdrop-blur-sm rounded-lg border border-white/10 p-1">
        <div className="flex space-x-1">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: '📊' },
            { id: 'configuracoes', label: 'Configurações', icon: '⚙️' },
            { id: 'conversas', label: 'Conversas IA', icon: '💬' },
            { id: 'treinamento', label: 'Treinamento', icon: '🎯' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white'
                  : 'text-sidebar-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Interações Totais"
              value={mockStats.totalInteractions.toLocaleString('pt-BR')}
              color="blue"
              icon={
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              }
            />

            <StatCard
              title="Satisfação"
              value={mockStats.satisfactionRate}
              suffix="%"
              color="green"
              icon={
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />

            <StatCard
              title="Tempo de Resposta"
              value={mockStats.responseTime}
              color="purple"
              icon={
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />

            <StatCard
              title="Resoluções"
              value={mockStats.resolvedQueries}
              suffix="%"
              color="yellow"
              icon={
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              }
            />
          </div>

          {/* Charts Placeholder */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-sidebar-800/50 backdrop-blur-sm rounded-lg border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Interações por Hora</h3>
              <div className="h-64 flex items-center justify-center bg-white/5 rounded-lg">
                <p className="text-sidebar-400">Gráfico em desenvolvimento</p>
              </div>
            </div>

            <div className="bg-sidebar-800/50 backdrop-blur-sm rounded-lg border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Tipos de Consulta</h3>
              <div className="h-64 flex items-center justify-center bg-white/5 rounded-lg">
                <p className="text-sidebar-400">Gráfico em desenvolvimento</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Configurações Tab */}
      {activeTab === 'configuracoes' && (
        <div className="space-y-6">
          <div className="bg-sidebar-800/50 backdrop-blur-sm rounded-lg border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Configurações do Chatbot</h3>
            
            <div className="space-y-6">
              {/* Chatbot Enabled */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium">Chatbot Ativo</h4>
                  <p className="text-sidebar-400 text-sm">Ativar ou desativar o chatbot da IA</p>
                </div>
                <button
                  onClick={() => handleSettingsChange('chatbotEnabled', !iaSettings.chatbotEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    iaSettings.chatbotEnabled ? 'bg-primary-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      iaSettings.chatbotEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Auto Responses */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium">Respostas Automáticas</h4>
                  <p className="text-sidebar-400 text-sm">Permitir respostas automáticas da IA</p>
                </div>
                <button
                  onClick={() => handleSettingsChange('autoResponses', !iaSettings.autoResponses)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    iaSettings.autoResponses ? 'bg-primary-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      iaSettings.autoResponses ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Language Selection */}
              <div>
                <h4 className="text-white font-medium mb-2">Idioma do Hóspede</h4>
                <select
                  value={iaSettings.guestLanguage}
                  onChange={(e) => handleSettingsChange('guestLanguage', e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="en-US">English (US)</option>
                  <option value="es-ES">Español</option>
                  <option value="fr-FR">Français</option>
                </select>
              </div>

              {/* Response Delay */}
              <div>
                <h4 className="text-white font-medium mb-2">Tempo de Resposta</h4>
                <select
                  value={iaSettings.responseDelay}
                  onChange={(e) => handleSettingsChange('responseDelay', e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="immediate">Imediato</option>
                  <option value="typing">Simular digitação</option>
                  <option value="delayed">1-2 segundos</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conversas Tab */}
      {activeTab === 'conversas' && (
        <div className="space-y-6">
          <div className="bg-sidebar-800/50 backdrop-blur-sm rounded-lg border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Conversas Recentes com IA</h3>
            
            <div className="space-y-4">
              {mockConversations.map((conversation) => (
                <div key={conversation.id} className="p-4 border border-white/10 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {conversation.guest.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-white font-medium">{conversation.guest}</h4>
                        <p className="text-sidebar-400 text-sm">Quarto {conversation.room}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <span className="text-sidebar-400 text-sm">{conversation.time}</span>
                      <span className={`text-sm font-medium ${getStatusColor(conversation.status)}`}>
                        {getStatusLabel(conversation.status)}
                      </span>
                      {conversation.satisfaction && (
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-4 h-4 ${
                                i < conversation.satisfaction ? 'text-yellow-400' : 'text-gray-600'
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sidebar-300 text-sm">{conversation.lastMessage}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Treinamento Tab */}
      {activeTab === 'treinamento' && (
        <div className="space-y-6">
          <div className="bg-sidebar-800/50 backdrop-blur-sm rounded-lg border border-white/10 p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">Treinar IA</h3>
                  <p className="text-sidebar-300 text-sm mt-1">
                    Configure e gerencie o treinamento da inteligência artificial
                  </p>
                </div>
                
                {/* AI Status Toggle */}
                <div className="flex items-center space-x-3">
                  <span className={`text-sm font-medium ${aiTrainingStatus ? 'text-green-300' : 'text-red-300'}`}>
                    {aiTrainingStatus ? 'IA Ativa' : 'IA Pausada'}
                  </span>
                  <button
                    onClick={handleToggleAI}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-sidebar-900 ${
                      aiTrainingStatus ? 'bg-green-600' : 'bg-red-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        aiTrainingStatus ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Training Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Conhecimento Card */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-colors">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-lg mb-4">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Conhecimento</h4>
                <p className="text-sidebar-400 text-sm mb-4">
                  Gerencie a base de conhecimento e informações da IA
                </p>
                <button
                  onClick={handleKnowledgeConfig}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                >
                  Configurar Conhecimento
                </button>
              </div>

              {/* Habilidades Card */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-colors">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-500/20 rounded-lg mb-4">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Habilidades</h4>
                <p className="text-sidebar-400 text-sm mb-4">
                  Configure habilidades e capacidades da IA
                </p>
                <button
                  onClick={handleSkillsManagement}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                >
                  Gerenciar Habilidades
                </button>
              </div>

              {/* Comportamento Card */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-colors">
                <div className="flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-lg mb-4">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Comportamento</h4>
                <p className="text-sidebar-400 text-sm mb-4">
                  Defina personalidade e comportamento da IA
                </p>
                <button
                  onClick={handleBehaviorAdjustment}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                >
                  Ajustar Comportamento
                </button>
              </div>
            </div>
          </div>

          {/* Marketing Messages Section */}
          <div className="bg-sidebar-800/50 backdrop-blur-sm rounded-lg border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-white">Mensagens de Marketing</h3>
                <p className="text-sidebar-300 text-sm mt-1">
                  Configure campanhas automáticas de marketing para seu hotel
                </p>
              </div>
              
              {!showMarketingForm && (
                <button
                  onClick={handleNewMarketingMessage}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Nova Campanha</span>
                </button>
              )}
            </div>

            {showMarketingForm ? (
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <MarketingMessageForm
                  selectedHotelUuid={selectedHotelUuid}
                  onMessageAdded={handleMarketingMessageAdded}
                  onCancel={handleCancelMarketingForm}
                  editingMessage={editingMessage}
                />
              </div>
            ) : (
              <div>
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-8">
                    <svg className="w-6 h-6 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="ml-2 text-sidebar-400">Carregando mensagens...</span>
                  </div>
                ) : (
                  <MarketingMessageList
                    messages={marketingMessages}
                    onMessageEdit={handleEditMarketingMessage}
                    selectedHotelUuid={selectedHotelUuid}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}


      {/* Knowledge Modal */}
      <KnowledgeModal 
        isOpen={showKnowledgeModal}
        onClose={() => setShowKnowledgeModal(false)}
        hotelUuid={selectedHotelUuid}
      />
    </div>
  );
};

export default HotelIA;