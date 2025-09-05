import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Search,
  Eye,
  BarChart3,
  MapPin,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Play,
  Pause,
  RefreshCw,
  Filter,
  Calendar,
  Building,
  Settings,
  X,
  Trash
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import NewSearchModal from './NewSearchModal';
import SearchDetailsModal from './SearchDetailsModal';
import ConfirmationModal from '../../components/ConfirmationModal';
import { io } from 'socket.io-client';
import axios from 'axios';

// Função utilitária para formatar datas de forma segura
const formatDate = (dateValue, locale = 'pt-BR', options = {}) => {
  if (!dateValue) return 'Data inválida';
  
  try {
    const date = new Date(dateValue);
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) return 'Data inválida';
    
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      ...options
    });
  } catch (error) {
    console.error('Error formatting date:', error, dateValue);
    return 'Data inválida';
  }
};

// Função utilitária para formatar data e hora de forma segura
const formatDateTime = (dateValue, locale = 'pt-BR') => {
  if (!dateValue) return 'Data inválida';
  
  try {
    const date = new Date(dateValue);
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) return 'Data inválida';
    
    return date.toLocaleString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting datetime:', error, dateValue);
    return 'Data inválida';
  }
};

const RateShopperDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState('all');
  const [dateRange, setDateRange] = useState('30d');
  const [showNewSearchModal, setShowNewSearchModal] = useState(false);
  const [submittingSearch, setSubmittingSearch] = useState(false);
  const [notification, setNotification] = useState(null);
  const [searchesPolling, setSearchesPolling] = useState(false);
  const [extractionStatuses, setExtractionStatuses] = useState({});
  const [startingExtractions, setStartingExtractions] = useState(new Set());
  const [showSearchDetails, setShowSearchDetails] = useState(false);
  const [selectedSearch, setSelectedSearch] = useState(null);
  const [lazyModeActive, setLazyModeActive] = useState(false);
  const [socket, setSocket] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Confirmar',
    cancelText: 'Cancelar'
  });

  // Função para mostrar confirmação personalizada
  const showConfirmation = ({ title, message, type = 'warning', confirmText = 'Confirmar', cancelText = 'Cancelar', onConfirm }) => {
    return new Promise((resolve) => {
      setConfirmModal({
        isOpen: true,
        type,
        title,
        message,
        confirmText,
        cancelText,
        onConfirm: () => {
          resolve(true);
          onConfirm && onConfirm();
        }
      });
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal(prev => ({
      ...prev,
      isOpen: false
    }));
  };

  // Configuração do Socket.io
  useEffect(() => {
    const newSocket = io('http://localhost:3002', {
      transports: ['websocket', 'polling'],
      timeout: 5000,
      forceNew: true
    });
    
    newSocket.on('connect', () => {
      console.log('🔌 Conectado ao Socket.io:', newSocket.id);
      
      // Entrar na sala do hotel
      const hotelId = 2; // Temporário - usar o hotel atual
      newSocket.emit('join-hotel-room', hotelId);
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('❌ Erro na conexão Socket.io:', error);
    });
    
    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Desconectado do Socket.io:', reason);
    });
    
    // Listener para atualizações de progresso em tempo real
    newSocket.on('extraction-progress', (data) => {
      console.log('📡 Progresso recebido via Socket.io:', data);
      console.log('🏃 Estado do Modo Preguiça:', lazyModeActive);
      
      const { searchId, progress } = data;
      
      // Atualizar o estado do dashboard em tempo real
      setDashboardData(prevData => ({
        ...prevData,
        recent_searches: prevData.recent_searches?.map(search => {
          if (search.id == searchId) {
            return {
              ...search,
              status: progress.status,
              processed_dates: progress.processed_dates,
              total_dates: progress.total_dates,
              progress_percentage: progress.progress_percentage,
              total_prices_found: progress.total_prices_found,
              duration_seconds: progress.duration_seconds,
              started_at: progress.started_at,
              completed_at: progress.completed_at,
              property_name: progress.property_name || search.property_name,
              error_log: progress.error_log
            };
          }
          return search;
        }) || []
      }));
      
      // Mostrar notificação de progresso se necessário
      if (progress.status === 'COMPLETED') {
        setNotification({
          type: 'success',
          title: 'Extração Concluída!',
          message: `${progress.property_name || `#${searchId}`} terminou com ${progress.total_prices_found || 0} preços`
        });
        
        // Se Modo Preguiça estiver ativo, iniciar próxima extração
        setTimeout(() => {
          if (lazyModeRef.current) {
            console.log('✅ Extração concluída - chamando próxima no Modo Preguiça');
            lazyModeRef.current();
          }
        }, 1000); // Aguardar 1 segundo para garantir que o estado foi atualizado
        
      } else if (progress.status === 'FAILED') {
        setNotification({
          type: 'error',
          title: 'Extração Falhou!',
          message: `${progress.property_name || `#${searchId}`}: ${progress.error_log || 'Erro desconhecido'}`
        });
        
        // Se Modo Preguiça estiver ativo, continuar com próxima mesmo se falhou
        setTimeout(() => {
          if (lazyModeRef.current) {
            console.log('❌ Extração falhou - tentando próxima no Modo Preguiça');
            lazyModeRef.current();
          }
        }, 1000);
      }
    });
    
    // Listener para status de extração
    newSocket.on('extraction-status', (data) => {
      console.log('📡 Status recebido via Socket.io:', data);
      
      if (data.message) {
        setNotification({
          type: data.status === 'COMPLETED' ? 'success' : 'info',
          title: 'Status da Extração',
          message: data.message
        });
      }
    });
    
    setSocket(newSocket);
    
    return () => {
      console.log('🔌 Limpando conexão Socket.io');
      newSocket.disconnect();
    };
  }, []);

  // Mock data - será substituído pela chamada real da API
  const mockData = {
    summary: {
      total_properties: 0,
      total_searches: 0,
      total_prices: 0,
      running_searches: 0,
      avg_price: 0,
      min_price: 0,
      max_price: 0
    },
    recent_searches: [],
    properties: [
      {
        id: 1,
        property_name: 'HOTEL MARANDUBA',
        latest_price: 295.00,
        latest_scraped_at: '2025-01-04T08:30:00Z',
        avg_price_30d: 285.50,
        price_count_30d: 28
      },
      {
        id: 2,
        property_name: 'POUSADA KALIMAN',
        latest_price: 220.00,
        latest_scraped_at: '2025-01-04T09:45:00Z',
        avg_price_30d: 215.75,
        price_count_30d: 30
      }
    ],
    price_trends: [
      { date: '2025-01-01', 'HOTEL MARANDUBA': 280, 'POUSADA KALIMAN': 210 },
      { date: '2025-01-02', 'HOTEL MARANDUBA': 290, 'POUSADA KALIMAN': 215 },
      { date: '2025-01-03', 'HOTEL MARANDUBA': 285, 'POUSADA KALIMAN': 220 },
      { date: '2025-01-04', 'HOTEL MARANDUBA': 295, 'POUSADA KALIMAN': 225 }
    ]
  };

  useEffect(() => {
    loadDashboardData();
  }, [selectedProperty, dateRange]);

  // Polling seletivo apenas para buscas (quando necessário)
  const startSearchesPolling = () => {
    if (searchesPolling) return; // Já está rodando

    setSearchesPolling(true);
    let pollCount = 0;
    const maxPolls = 24; // 24 * 5s = 2 minutos

    const pollInterval = setInterval(() => {
      pollCount++;
      
      // Atualizar apenas as buscas recentes
      updateRecentSearches();
      
      if (pollCount >= maxPolls) {
        clearInterval(pollInterval);
        setSearchesPolling(false);
      }
    }, 5000);

    // Auto-stop após 2 minutos
    setTimeout(() => {
      clearInterval(pollInterval);
      setSearchesPolling(false);
    }, 120000);
  };

  // Atualizar apenas a seção de buscas recentes
  const updateRecentSearches = async () => {
    try {
      const hotelId = 2;
      const response = await axios.get(`/api/rate-shopper/${hotelId}/dashboard`);
      
      if (response.data.success && dashboardData) {
        setDashboardData(prev => ({
          ...prev,
          recent_searches: response.data.data.recent_searches,
          summary: {
            ...prev.summary,
            running_searches: response.data.data.summary.running_searches || prev.summary.running_searches
          }
        }));
      }
    } catch (error) {
      console.error('Error updating searches:', error);
    }
  };

  // Limpar notificação após 5 segundos
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Obter hotel_id do usuário logado (assumindo que está em localStorage ou context)
      const hotelId = 2; // Temporário - usando hotel existente (Pousada Bugaendrus)
      
      const response = await axios.get(`/api/rate-shopper/${hotelId}/dashboard`, {
        params: {
          property_id: selectedProperty === 'all' ? undefined : selectedProperty,
          days: dateRange === '30d' ? 30 : dateRange === '7d' ? 7 : 90
        }
      });
      
      if (response.data.success) {
        setDashboardData(response.data.data);
      } else {
        console.error('Failed to load dashboard data');
        // Fallback para dados mock
        setDashboardData(mockData);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      // Fallback para dados mock em caso de erro
      setDashboardData(mockData);
    } finally {
      setLoading(false);
    }
  };

  // Funções de controle de extração
  const handleStartExtraction = async (search) => {
    try {
      const searchId = search.id;
      setStartingExtractions(prev => new Set([...prev, searchId]));
      
      const hotelId = 2;
      const response = await axios.post(`/api/rate-shopper-extraction/${hotelId}/start-extraction`, {
        search_ids: [searchId],
        properties: [{ id: search.property_id, name: search.property_name }]
      });

      if (response.data.success) {
        setNotification({
          type: 'success',
          title: 'Extração Iniciada!',
          message: `Extração de ${search.property_name} iniciada com sucesso`
        });
        
        // Iniciar polling para acompanhar progresso
        startExtractionPolling(searchId);
        
        // Atualizar dados do dashboard
        setTimeout(loadDashboardData, 1000);
      }
    } catch (error) {
      console.error('Error starting extraction:', error);
      setNotification({
        type: 'error',
        title: 'Erro ao Iniciar Extração',
        message: error.response?.data?.error || 'Ocorreu um erro inesperado'
      });
    } finally {
      setStartingExtractions(prev => {
        const newSet = new Set(prev);
        newSet.delete(search.id);
        return newSet;
      });
    }
  };

  const handleStopExtraction = async (search) => {
    try {
      const hotelId = 2;
      const response = await axios.post(`/api/rate-shopper-extraction/${hotelId}/stop-extraction`);

      if (response.data.success) {
        setNotification({
          type: 'success',
          title: 'Extração Pausada!',
          message: `Extração de ${search.property_name} pausada com sucesso`
        });
        
        // FORÇAR ATUALIZAÇÃO IMEDIATA do status local
        setDashboardData(prevData => ({
          ...prevData,
          recent_searches: prevData.recent_searches.map(s => 
            s.id === search.id 
              ? { ...s, status: 'CANCELLED' }
              : s
          )
        }));
        
        // Recarregar dados do servidor para confirmar
        setTimeout(() => {
          loadDashboardData();
        }, 500);
      }
    } catch (error) {
      console.error('Error stopping extraction:', error);
      setNotification({
        type: 'error',
        title: 'Erro ao Pausar Extração',
        message: error.response?.data?.error || 'Ocorreu um erro inesperado'
      });
    }
  };

  // Referência para a função do Modo Preguiça (usada no Socket.io listener)
  const lazyModeRef = useRef();
  
  // Função para iniciar próxima extração no Modo Preguiça
  const startNextLazyExtraction = useCallback(async () => {
    console.log('🔄 startNextLazyExtraction chamada - lazyModeActive:', lazyModeActive);
    
    if (!lazyModeActive) {
      console.log('❌ Modo Preguiça não ativo, ignorando');
      return;
    }
    
    // Buscar próxima extração pendente
    const pendingSearches = dashboardData?.recent_searches?.filter(search => 
      search.status === 'PENDING'
    ) || [];
    
    console.log('📋 Extrações pendentes encontradas:', pendingSearches.length);
    
    if (pendingSearches.length === 0) {
      // Não há mais extrações pendentes - finalizar Modo Preguiça
      console.log('✅ Modo Preguiça concluído - sem extrações pendentes');
      setLazyModeActive(false);
      setNotification({
        type: 'success',
        title: 'Modo Preguiça Concluído!',
        message: 'Todas as extrações pendentes foram processadas.'
      });
      return;
    }
    
    // Iniciar próxima extração
    const nextSearch = pendingSearches[0];
    try {
      console.log(`🚀 Modo Preguiça: Iniciando próxima extração - ${nextSearch.property_name}`);
      await handleStartExtraction(nextSearch);
      
      setNotification({
        type: 'info',
        title: 'Próxima Extração Iniciada',
        message: `Iniciando extração de ${nextSearch.property_name}. ${pendingSearches.length - 1} restantes.`
      });
    } catch (error) {
      console.error('❌ Erro ao iniciar próxima extração do Modo Preguiça:', error);
      setNotification({
        type: 'warning',
        title: 'Erro na Próxima Extração',
        message: `Falha ao iniciar ${nextSearch.property_name}. Continuando com as demais.`
      });
      
      // Tentar a próxima após um delay
      setTimeout(() => {
        if (lazyModeRef.current) {
          console.log('🔄 Tentando próxima extração após erro...');
          lazyModeRef.current();
        }
      }, 2000);
    }
  }, [lazyModeActive, dashboardData?.recent_searches, setNotification, handleStartExtraction]);

  // Manter referência atualizada para uso no Socket.io listener
  useEffect(() => {
    lazyModeRef.current = startNextLazyExtraction;
  }, [startNextLazyExtraction]);

  const handleDeleteSearch = async (search) => {
    const confirmed = await new Promise((resolve) => {
      setConfirmModal({
        isOpen: true,
        type: 'danger',
        title: 'Excluir Busca',
        message: `Tem certeza que deseja excluir a busca "${search.property_name || `#${search.id}`}"? Esta ação não pode ser desfeita.`,
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
        onConfirm: () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          resolve(false);
        }
      });
    });

    if (!confirmed) return;

    try {
      const hotelId = 2;
      const response = await axios.delete(`/api/rate-shopper/${hotelId}/searches/${search.id}`);

      if (response.data.success) {
        setNotification({
          type: 'success',
          title: 'Busca Excluída!',
          message: `Busca "${search.property_name || `#${search.id}`}" excluída com sucesso`
        });

        // Remover a busca da lista local imediatamente
        setDashboardData(prevData => ({
          ...prevData,
          recent_searches: prevData.recent_searches.filter(s => s.id !== search.id)
        }));
        
        // Recarregar dados do servidor para confirmar
        setTimeout(() => {
          loadDashboardData();
        }, 500);
      }
    } catch (error) {
      console.error('Error deleting search:', error);
      setNotification({
        type: 'error',
        title: 'Erro ao Excluir Busca',
        message: error.response?.data?.error || 'Ocorreu um erro inesperado'
      });
    }
  };

  const handleLazyMode = async () => {
    if (lazyModeActive) {
      // Se já está ativo, desativar
      setLazyModeActive(false);
      setNotification({
        type: 'info',
        title: 'Modo Preguiça Desativado',
        message: 'As extrações automáticas foram interrompidas'
      });
      return;
    }

    // Buscar todas as extrações pendentes
    const pendingSearches = dashboardData?.recent_searches?.filter(search => 
      search.status === 'PENDING'
    ) || [];

    if (pendingSearches.length === 0) {
      setNotification({
        type: 'warning',
        title: 'Nenhuma Extração Pendente',
        message: 'Não há extrações pendentes para iniciar'
      });
      return;
    }

    const confirmed = await new Promise((resolve) => {
      setConfirmModal({
        isOpen: true,
        type: 'info',
        title: 'Ativar Modo Preguiça',
        message: `Deseja iniciar o Modo Preguiça? Isso iniciará ${pendingSearches.length} extrações pendentes sequencialmente (uma por vez).`,
        confirmText: 'Iniciar Todas',
        cancelText: 'Cancelar',
        onConfirm: () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          resolve(false);
        }
      });
    });

    if (!confirmed) return;

    setLazyModeActive(true);
    
    setNotification({
      type: 'success',
      title: 'Modo Preguiça Ativado!',
      message: `Iniciando ${pendingSearches.length} extrações sequencialmente. A primeira será iniciada agora.`
    });

    // Iniciar apenas a primeira extração
    // As próximas serão iniciadas automaticamente via Socket.io quando as anteriores terminarem
    try {
      const firstSearch = pendingSearches[0];
      console.log(`Modo Preguiça: Iniciando primeira extração - ${firstSearch.property_name}`);
      await handleStartExtraction(firstSearch);
    } catch (error) {
      console.error('Erro ao iniciar primeira extração do Modo Preguiça:', error);
      setLazyModeActive(false);
      setNotification({
        type: 'error',
        title: 'Erro no Modo Preguiça',
        message: 'Falha ao iniciar a primeira extração. Modo Preguiça desativado.'
      });
    }
  };

  // Polling específico para status de extração
  const startExtractionPolling = (searchId) => {
    const hotelId = 2;
    
    const pollInterval = setInterval(async () => {
      try {
        // Usar a rota correta que retorna progresso em tempo real
        const response = await axios.get(`/api/rate-shopper/searches/${searchId}/live-progress`);
        
        if (response.data.success) {
          const searchData = response.data.data.search;
          
          // Atualizar o progresso na lista de searches
          setDashboardData(prevData => ({
            ...prevData,
            recent_searches: prevData.recent_searches?.map(search => {
              if (search.id === searchId) {
                return {
                  ...search,
                  status: searchData.status,
                  processed_dates: searchData.processed_dates,
                  total_dates: searchData.total_dates,
                  progress_percentage: searchData.progress_percent,
                  total_prices_found: searchData.actual_prices_count || search.total_prices_found,
                  duration_seconds: searchData.elapsed_seconds,
                  started_at: searchData.started_at,
                  completed_at: searchData.completed_at
                };
              }
              return search;
            }) || []
          }));
          
          // Atualizar status de extração específico
          setExtractionStatuses(prev => ({
            ...prev,
            [searchId]: {
              ...searchData,
              progress_percent: searchData.progress_percent,
              elapsed_seconds: searchData.elapsed_seconds,
              eta_seconds: searchData.eta_seconds
            }
          }));
          
          // Parar polling se extração terminou
          if (searchData.status === 'COMPLETED' || searchData.status === 'FAILED' || searchData.status === 'CANCELLED') {
            clearInterval(pollInterval);
            // Recarregar dados completos após terminar
            setTimeout(loadDashboardData, 1000);
          }
        }
      } catch (error) {
        console.error('Error polling extraction progress:', error);
        // Em caso de erro, tentar recarregar dados completos
        setTimeout(loadDashboardData, 5000);
      }
    }, 2000); // Polling mais frequente para progresso em tempo real

    // Auto-stop após 15 minutos (mais tempo para extrações longas)
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 900000);
  };

  const handleNewSearch = async (searchData) => {
    try {
      setSubmittingSearch(true);
      
      const propertyId = searchData.property_id;
      
      // Atualizar configurações de automação da propriedade se necessário
      if (searchData.auto_repeat) {
        const hotelId = 2; // Temporário - usando hotel existente (Pousada Bugaendrus)
        await axios.put(`/api/rate-shopper/properties/${propertyId}`, {
          auto_search_enabled: true,
          search_frequency_hours: searchData.repeat_frequency_hours
        });
      }
      
      // Iniciar busca para a propriedade selecionada (usando estrutura correta da API)
      const hotelId = 2; // Temporário - usando hotel existente (Pousada Bugaendrus)
      const searchResponse = await axios.post(`/api/rate-shopper/${hotelId}/searches`, {
        property_id: propertyId,
        start_date: searchData.start_date,
        end_date: searchData.end_date,
        max_bundle_size: searchData.max_bundle_size
      });

      if (searchResponse.data.success) {
        // Mostrar notificação de sucesso
        setNotification({
          type: 'success',
          title: 'Busca Iniciada!',
          message: `Busca criada para ${properties.find(p => p.id.toString() === propertyId.toString())?.property_name}. O processamento iniciará em breve.`
        });

        // Iniciar polling apenas das buscas por 2 minutos
        startSearchesPolling();
        
        // Recarregar dashboard após um delay para mostrar a nova busca
        setTimeout(() => {
          loadDashboardData();
        }, 1000);
      }
    } catch (error) {
      console.error('Error creating search:', error);
      
      // Mostrar notificação de erro
      setNotification({
        type: 'error',
        title: 'Erro ao Criar Busca',
        message: error.response?.data?.error || 'Ocorreu um erro inesperado. Tente novamente.'
      });
      
      throw error;
    } finally {
      setSubmittingSearch(false);
    }
  };

  const cleanFailedSearches = async () => {
    try {
      const hotelId = 2; // Temporário - usando hotel existente (Pousada Bugaendrus)
      
      const response = await axios.delete(`/api/rate-shopper/${hotelId}/searches/failed`);
      
      if (response.data.success) {
        // Mostrar notificação de sucesso
        setNotification({
          type: 'success',
          title: 'Limpeza Concluída!',
          message: `${response.data.deletedCount} busca(s) mal sucedida(s) foram excluídas.`
        });
        
        // Recarregar os dados do dashboard
        loadDashboardData();
      }
    } catch (error) {
      console.error('Error cleaning failed searches:', error);
      
      // Mostrar notificação de erro
      setNotification({
        type: 'error',
        title: 'Erro ao Limpar Buscas',
        message: error.response?.data?.error || 'Ocorreu um erro ao excluir as buscas mal sucedidas. Tente novamente.'
      });
    }
  };

  const handleSearchClick = (search) => {
    setSelectedSearch(search);
    setShowSearchDetails(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const { summary, recent_searches, properties, price_trends } = dashboardData;

  return (
    <>
      {/* Notificação */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border-l-4 ${
          notification.type === 'success' 
            ? 'bg-green-50 border-green-500 text-green-800' 
            : 'bg-red-50 border-red-500 text-red-800'
        }`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {notification.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium">{notification.title}</h3>
              <p className="text-sm mt-1">{notification.message}</p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="ml-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rate Shopper</h1>
            <p className="text-gray-600">
              Análise de preços da concorrência
              {searchesPolling && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Atualizando buscas...
                </span>
              )}
            </p>
          </div>
          
          <div className="flex gap-4">
            <select 
              value={selectedProperty} 
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas as propriedades</option>
              {properties?.map((prop, index) => (
                <option key={`${prop.id}-${index}`} value={prop.id}>{prop.property_name}</option>
              ))}
            </select>
            
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
            </select>

            <button
              onClick={cleanFailedSearches}
              className="inline-flex items-center px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-white hover:bg-red-50"
              title="Excluir buscas mal sucedidas"
            >
              <X className="h-4 w-4 mr-2" />
              Limpar Falhas
            </button>

            <Link
              to="/rate-shopper/properties"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Settings className="h-4 w-4 mr-2" />
              Gerenciar Propriedades
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Propriedades Monitoradas</p>
              <p className="text-3xl font-bold text-gray-900">{summary.total_properties}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Preços Coletados</p>
              <p className="text-3xl font-bold text-gray-900">{summary.total_prices.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Preço Médio</p>
              <p className="text-3xl font-bold text-gray-900">R$ {summary.avg_price?.toFixed(2)}</p>
              <div className="flex items-center mt-1">
                <span className="text-xs text-gray-500">
                  R$ {summary.min_price?.toFixed(2)} - R$ {summary.max_price?.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Buscas Ativas</p>
              <p className="text-3xl font-bold text-gray-900">{summary.running_searches}</p>
              <div className="flex items-center mt-1">
                <div className="flex items-center text-xs text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                  Em execução
                </div>
              </div>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Search className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Price Trends Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Tendência de Preços</h3>
            <p className="text-sm text-gray-600">Evolução dos preços nos últimos dias</p>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={price_trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => formatDate(value)}
                />
                <YAxis 
                  tickFormatter={(value) => `R$ ${value}`}
                />
                <Tooltip 
                  formatter={(value, name) => [`R$ ${value}`, name]}
                  labelFormatter={(value) => formatDate(value)}
                />
                <Line 
                  type="monotone" 
                  dataKey="HOTEL MARANDUBA" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="POUSADA KALIMAN" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  dot={{ fill: '#EF4444', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>


        {/* Recent Searches */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Extrações em Andamento</h3>
                <p className="text-sm text-gray-600">
                  Buscas ativas e concluídas recentemente (até 1 hora)
                </p>
              </div>
              <div className="text-right flex flex-col items-end space-y-2">
                <button
                  onClick={handleLazyMode}
                  disabled={!dashboardData?.recent_searches?.some(search => search.status === 'PENDING')}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    lazyModeActive
                      ? 'bg-orange-600 hover:bg-orange-700 text-white'
                      : dashboardData?.recent_searches?.some(search => search.status === 'PENDING')
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {lazyModeActive ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Modo Ativo - Clique para Parar
                    </>
                  ) : (
                    <>
                      😴 Modo Preguiça
                    </>
                  )}
                </button>
                {searchesPolling && (
                  <div className="text-xs text-blue-600">
                    🔄 Atualizando automaticamente...
                  </div>
                )}
                {lazyModeActive && (
                  <div className="text-xs text-orange-600">
                    🔄 Iniciando extrações sequencialmente...
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="p-6">
            {recent_searches && recent_searches.length > 0 ? (
              <div className="space-y-4">
                {recent_searches.filter(search => {
                  // Mostrar apenas buscas em andamento ou concluídas há menos de 1 hora
                  if (search.status === 'RUNNING' || search.status === 'PENDING') return true;
                  if (search.status === 'COMPLETED') {
                    const completedAt = new Date(search.completed_at || search.started_at);
                    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
                    return completedAt > oneHourAgo;
                  }
                  return false;
                }).map((search, index) => (
                <div key={`${search.id}-${index}`} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors" onClick={() => handleSearchClick(search)}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                        search.status === 'RUNNING' ? 'bg-blue-100' : 
                        search.status === 'COMPLETED' ? 'bg-green-100' : 
                        search.status === 'FAILED' ? 'bg-red-100' :
                        search.status === 'CANCELLED' ? 'bg-orange-100' : 'bg-gray-100'
                      }`}>
                        {search.status === 'RUNNING' ? (
                          <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
                        ) : search.status === 'COMPLETED' ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : search.status === 'FAILED' ? (
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        ) : search.status === 'CANCELLED' ? (
                          <Pause className="h-5 w-5 text-orange-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{search.property_name}</p>
                          <span className="text-xs text-gray-500">
                            #{search.id}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>📅 {formatDate(search.start_date)} → {formatDate(search.end_date)}</div>
                          <div>
                            {search.status === 'RUNNING' 
                              ? `🔄 Processando: ${search.processed_dates || 0}/${search.total_dates} datas`
                              : search.status === 'COMPLETED' 
                              ? `✅ Finalizada: ${search.total_prices_found || 0} preços encontrados`
                              : search.status === 'FAILED'
                              ? `❌ Erro na execução`
                              : `⏳ Aguardando processamento (${search.total_dates} datas)`
                            }
                          </div>
                          <div className="text-xs text-gray-500">
                            Criada: {formatDateTime(search.started_at || search.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        search.status === 'RUNNING' 
                          ? 'bg-blue-100 text-blue-800'
                          : search.status === 'COMPLETED' 
                          ? 'bg-green-100 text-green-800'
                          : search.status === 'FAILED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {search.status === 'RUNNING' ? '🔄 Executando' : 
                         search.status === 'COMPLETED' ? '✅ Concluída' :
                         search.status === 'FAILED' ? '❌ Erro' :
                         '⏳ Pendente'}
                      </span>
                      
                      {/* Botões de controle */}
                      <div className="flex items-center space-x-2">
                        {search.status === 'PENDING' && (
                          <button
                            onClick={() => handleStartExtraction(search)}
                            disabled={startingExtractions.has(search.id)}
                            className="inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {startingExtractions.has(search.id) ? (
                              <>
                                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                Iniciando...
                              </>
                            ) : (
                              <>
                                <Play className="h-3 w-3 mr-1" />
                                Iniciar
                              </>
                            )}
                          </button>
                        )}
                        
                        {search.status === 'RUNNING' && (
                          <button
                            onClick={() => handleStopExtraction(search)}
                            className="inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                          >
                            <Pause className="h-3 w-3 mr-1" />
                            Pausar
                          </button>
                        )}
                        
                        {(search.status === 'FAILED' || search.status === 'CANCELLED') && (
                          <button
                            onClick={() => handleStartExtraction(search)}
                            disabled={startingExtractions.has(search.id)}
                            className="inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                          >
                            {startingExtractions.has(search.id) ? (
                              <>
                                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                {search.status === 'CANCELLED' ? 'Reiniciando...' : 'Reiniciando...'}
                              </>
                            ) : (
                              <>
                                <Play className="h-3 w-3 mr-1" />
                                {search.status === 'CANCELLED' ? 'Retomar' : 'Tentar Novamente'}
                              </>
                            )}
                          </button>
                        )}
                        
                        {/* Botão de exclusão - disponível sempre exceto durante execução */}
                        {search.status !== 'RUNNING' && (
                          <button
                            onClick={() => handleDeleteSearch(search)}
                            className="inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                          >
                            <Trash className="h-3 w-3 mr-1" />
                            Excluir
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Barra de progresso para extrações em andamento */}
                  {search.status === 'RUNNING' && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Progresso da Extração
                        </span>
                        <span className="text-sm text-gray-500">
                          {search.progress_percentage || 0}% concluído
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${search.progress_percentage || 0}%` }}
                        ></div>
                      </div>
                      {extractionStatuses[search.id] && (
                        <div className="mt-2 text-xs text-gray-600">
                          <div>⏱️ Tempo decorrido: {Math.floor((extractionStatuses[search.id].duration || 0) / 60)}:{String((extractionStatuses[search.id].duration || 0) % 60).padStart(2, '0')}</div>
                          {extractionStatuses[search.id].estimatedTimeRemaining && (
                            <div>⏳ Tempo estimado restante: {Math.floor(extractionStatuses[search.id].estimatedTimeRemaining / 60)}:{String(extractionStatuses[search.id].estimatedTimeRemaining % 60).padStart(2, '0')}</div>
                          )}
                          {extractionStatuses[search.id].progress?.currentProperty && (
                            <div>🏨 Processando: {extractionStatuses[search.id].progress.currentProperty}</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <Search className="h-8 w-8 text-gray-400" />
                  </div>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Nenhuma busca encontrada</h4>
                <p className="text-gray-600 mb-4">
                  Crie uma nova busca para começar a monitorar os preços da concorrência.
                </p>
                <button
                  onClick={() => setShowNewSearchModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Criar Primeira Busca
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Properties Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Histórico Completo</h3>
              <p className="text-sm text-gray-600">Todas as extrações realizadas - clique para ver os preços</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => loadDashboardData()}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
              
              <button 
                onClick={() => setShowNewSearchModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                disabled={submittingSearch}
              >
                <Search className="h-4 w-4 mr-2" />
                Nova Busca
              </button>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Busca
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Período
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preços Encontrados
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data da Busca
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recent_searches?.map((search, index) => (
                <tr 
                  key={`${search.id}-${index}`} 
                  className="hover:bg-gray-50 cursor-pointer transition-colors" 
                  onClick={() => handleSearchClick(search)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        search.status === 'RUNNING' ? 'bg-blue-100' : 
                        search.status === 'COMPLETED' ? 'bg-green-100' : 
                        search.status === 'FAILED' ? 'bg-red-100' : 'bg-gray-100'
                      }`}>
                        {search.status === 'RUNNING' ? (
                          <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
                        ) : search.status === 'COMPLETED' ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : search.status === 'FAILED' ? (
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-gray-600" />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {search.property_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          #{search.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(search.start_date)} → {formatDate(search.end_date)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      search.status === 'RUNNING' 
                        ? 'bg-blue-100 text-blue-800'
                        : search.status === 'COMPLETED' 
                        ? 'bg-green-100 text-green-800'
                        : search.status === 'FAILED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {search.status === 'RUNNING' ? '🔄 Executando' : 
                       search.status === 'COMPLETED' ? '✅ Concluída' :
                       search.status === 'FAILED' ? '❌ Erro' :
                       '⏳ Pendente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-green-600">
                      {search.total_prices_found || 0} preços
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDateTime(search.started_at || search.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Nova Busca */}
      <NewSearchModal 
        isOpen={showNewSearchModal}
        onClose={() => setShowNewSearchModal(false)}
        onSubmit={() => {
          // Recarregar dashboard após nova busca ser criada
          loadDashboardData();
          setShowNewSearchModal(false);
        }}
      />

      {/* Modal de Confirmação */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        onCancel={confirmModal.onCancel || (() => setConfirmModal(prev => ({ ...prev, isOpen: false })))}
        type={confirmModal.type}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
      />
    </>
  );
};

export default RateShopperDashboard;