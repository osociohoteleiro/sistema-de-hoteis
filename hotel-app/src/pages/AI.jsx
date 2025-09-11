import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useHotelList } from '../hooks/useHotelList';
import MarketingMessageForm from '../components/MarketingMessageFormTest';
import MarketingMessageList from '../components/MarketingMessageList';
import KnowledgeModal from '../components/KnowledgeModal';
import apiService from '../services/api';
import toast from 'react-hot-toast';

const AI = () => {
  const { fetchMarketingMessages, marketingMessages, setMarketingMessages, selectedHotelUuid, selectHotel } = useApp();
  const { hotels, loading: loadingHotels } = useHotelList();
  const [aiStats, setAiStats] = useState({
    connectedHotels: 0,
    totalAttendances: 0,
    totalReservations: 0
  });
  const [showMarketingForm, setShowMarketingForm] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  
  // AI Training states
  const [aiTrainingStatus, setAiTrainingStatus] = useState(true); // true = active, false = paused
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);

  useEffect(() => {
    const loadAiStats = async () => {
      try {
        const data = await apiService.getAiStats();
        setAiStats({
          connectedHotels: data.connectedHotels || 0,
          totalAttendances: data.totalAttendances || 0,
          totalReservations: data.totalReservations || 0
        });
      } catch (error) {
        console.error('Erro ao carregar estatísticas da IA:', error);
        // Manter valores padrão em caso de erro
        setAiStats({
          connectedHotels: 0,
          totalAttendances: 0,
          totalReservations: 0
        });
      }
    };

    loadAiStats();
  }, []);

  // Buscar mensagens quando hotel for selecionado
  useEffect(() => {
    if (selectedHotelUuid) {
      // Buscar mensagens de marketing
      fetchMarketingMessages(selectedHotelUuid).catch(error => {
        console.error('Erro ao buscar mensagens de marketing:', error);
        setMarketingMessages([]);
      });
    }
  }, [selectedHotelUuid]);

  const statsCards = [
    {
      title: 'Hotéis Conectados',
      value: aiStats.connectedHotels,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      color: 'bg-blue-500',
      description: 'Hotéis integrados com IA'
    },
    {
      title: 'Atendimentos IA',
      value: aiStats.totalAttendances,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      color: 'bg-green-500',
      description: 'Atendimentos realizados pela IA'
    },
    {
      title: 'Reservas IA',
      value: aiStats.totalReservations,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      color: 'bg-purple-500',
      description: 'Reservas processadas pela IA'
    }
  ];


  const handleMarketingMessageAdded = (newMessage) => {
    // Recarregar mensagens do hotel após adicionar nova mensagem
    if (selectedHotelUuid) {
      fetchMarketingMessages(selectedHotelUuid);
    }
    // NÃO fechar o formulário automaticamente - deixar que o usuário escolha
    // setShowMarketingForm(false);
  };

  const handleMarketingMessageEdit = (message) => {
    setEditingMessage(message);
    setShowMarketingForm(true);
  };

  const handleMarketingMessageUpdated = (updatedMessage) => {
    // Recarregar mensagens do hotel após atualizar mensagem
    if (selectedHotelUuid) {
      fetchMarketingMessages(selectedHotelUuid);
    }
    // Limpar estado de edição
    setEditingMessage(null);
  };

  // AI Training handlers
  const handleToggleAI = async () => {
    try {
      const newStatus = !aiTrainingStatus;
      await apiService.toggleAiStatus(selectedHotelUuid, newStatus);
      setAiTrainingStatus(newStatus);
      toast.success(`IA ${newStatus ? 'ativada' : 'pausada'} com sucesso`);
    } catch (error) {
      console.error('Erro ao alternar status da IA:', error);
      toast.error('Erro ao alterar status da IA');
    }
  };

  const handleKnowledgeConfig = () => {
    if (!selectedHotelUuid) {
      toast.error('Selecione um hotel primeiro');
      return;
    }
    setShowKnowledgeModal(true);
  };

  const handleSkillsManagement = () => {
    if (!selectedHotelUuid) {
      toast.error('Selecione um hotel primeiro');
      return;
    }
    // TODO: Open skills management modal/page
    toast.info('Funcionalidade de habilidades será implementada em breve');
    console.log('Gerenciar Habilidades da IA');
  };

  const handleBehaviorAdjustment = () => {
    if (!selectedHotelUuid) {
      toast.error('Selecione um hotel primeiro');
      return;
    }
    // TODO: Open behavior adjustment modal/page
    toast.info('Funcionalidade de comportamento será implementada em breve');
    console.log('Ajustar Comportamento da IA');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Painel de Inteligência Artificial
            </h2>
            <p className="text-sidebar-300">
              Monitore o desempenho dos atendimentos automatizados e gerencie campanhas de marketing.
            </p>
          </div>
          <Link
            to="/ia/configuracoes"
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Configurações</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsCards.map((stat, index) => (
          <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sidebar-300 text-sm font-medium">{stat.title}</p>
                <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                <p className="text-xs text-sidebar-400 mt-2">{stat.description}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color} text-white ml-4`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Hotel Selector */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Selecionar Hotel</h3>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <select
              value={selectedHotelUuid}
              onChange={(e) => selectHotel(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={loadingHotels}
            >
              <option value="" className="bg-sidebar-800 text-sidebar-300">
                {loadingHotels ? 'Carregando hotéis...' : 'Selecione um hotel para ver suas integrações'}
              </option>
              {hotels.map((hotel) => (
                <option key={hotel.value} value={hotel.value} className="bg-sidebar-800">
                  {hotel.label}
                </option>
              ))}
            </select>
          </div>
          {selectedHotelUuid && (
            <div className="flex items-center text-green-300">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm">Hotel selecionado</span>
            </div>
          )}
        </div>
      </div>

      {/* Marketing Messages Management */}
      {selectedHotelUuid && (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-white">Campanhas de Marketing</h3>
                <p className="text-sidebar-300 text-sm mt-1">
                  Gerencie campanhas automáticas de marketing ({marketingMessages.length} campanhas)
                </p>
              </div>
              <button
                onClick={() => setShowMarketingForm(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Nova</span>
              </button>
            </div>

            {/* Marketing Form */}
            {showMarketingForm && (
              <div className="mb-6 p-6 bg-white/5 rounded-lg border border-white/10">
                <MarketingMessageForm
                  selectedHotelUuid={selectedHotelUuid}
                  editingMessage={editingMessage}
                  onMessageAdded={editingMessage ? handleMarketingMessageUpdated : handleMarketingMessageAdded}
                  onCancel={() => {
                    setShowMarketingForm(false);
                    setEditingMessage(null);
                  }}
                />
              </div>
            )}

            {/* Marketing List */}
            <MarketingMessageList 
              messages={marketingMessages}
              onMessageUpdate={setMarketingMessages}
              onMessageEdit={handleMarketingMessageEdit}
            />
        </div>
      )}

      {/* AI Training Management */}
      {selectedHotelUuid && (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
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
      )}

      {/* AI Performance Overview */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Desempenho da IA</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-white mb-3">Métricas Recentes</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-sidebar-300">Taxa de Sucesso:</span>
                <span className="text-green-300 font-medium">---%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-sidebar-300">Tempo Médio de Resposta:</span>
                <span className="text-blue-300 font-medium">--- ms</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-sidebar-300">Disponibilidade:</span>
                <span className="text-green-300 font-medium">---%</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Status das Integrações</h4>
            <div className="space-y-2">
              <p className="text-sidebar-400 text-sm">
                Configure integrações em{' '}
                <Link to="/ia/configuracoes" className="text-primary-400 hover:text-primary-300 underline">
                  Configurações de IA
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Knowledge Modal */}
      <KnowledgeModal 
        isOpen={showKnowledgeModal}
        onClose={() => setShowKnowledgeModal(false)}
        hotelUuid={selectedHotelUuid}
      />
    </div>
  );
};

export default AI;