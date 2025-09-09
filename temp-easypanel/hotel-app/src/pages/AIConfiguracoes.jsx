import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useHotelList } from '../hooks/useHotelList';
import IntegrationForm from '../components/IntegrationForm';
import IntegrationList from '../components/IntegrationList';
import BotFieldsList from '../components/BotFieldsList';
import QdrantCollectionModal from '../components/QdrantCollectionModal';
import QdrantCreateCollectionModal from '../components/QdrantCreateCollectionModal';
import QRCodeViewer from '../components/QRCodeViewer';
import toast from 'react-hot-toast';

const AIConfiguracoes = () => {
  const { fetchIntegrations, integrations, fetchBotFields, botFields, updateAllBotFields, loading, setIntegrations, setBotFields, selectedHotelUuid, selectHotel, qdrantCollectionsCount, fetchQdrantCollectionsCount } = useApp();
  const { hotels, loading: loadingHotels } = useHotelList();
  const [showIntegrationForm, setShowIntegrationForm] = useState(false);
  const [showQdrantModal, setShowQdrantModal] = useState(false);
  const [showQdrantCreateModal, setShowQdrantCreateModal] = useState(false);
  const [evolutionInstancesCount, setEvolutionInstancesCount] = useState(0);
  const [showEvolutionCreateModal, setShowEvolutionCreateModal] = useState(false);
  const [showEvolutionConnectModal, setShowEvolutionConnectModal] = useState(false);
  const [showEvolutionDisconnectModal, setShowEvolutionDisconnectModal] = useState(false);
  const [selectedEvolutionInstance, setSelectedEvolutionInstance] = useState(null);
  const [evolutionInstanceStatus, setEvolutionInstanceStatus] = useState(null);
  const [creatingEvolutionInstance, setCreatingEvolutionInstance] = useState(false);
  const [disconnectConfirmText, setDisconnectConfirmText] = useState('');

  // Carregar dados quando hotel for selecionado
  useEffect(() => {
    if (selectedHotelUuid) {
      // Buscar integrações
      fetchIntegrations(selectedHotelUuid).catch(error => {
        console.error('Erro ao buscar integrações:', error);
        setIntegrations([]);
      });

      // Carregar campos do bot do localStorage (se existir)
      loadBotFieldsFromLocalStorage(selectedHotelUuid);

      // Buscar contagem de collections do Qdrant
      fetchQdrantCollectionsCount(selectedHotelUuid);

      // Buscar contagem de instâncias do Evolution
      fetchEvolutionInstancesCount(selectedHotelUuid);
    }
  }, [selectedHotelUuid]);

  // Função para carregar campos do bot do localStorage
  const loadBotFieldsFromLocalStorage = (hotelUuid) => {
    try {
      console.log('📦 Tentando carregar campos do bot do localStorage...');
      
      // Verificar diferentes possíveis chaves de cache
      const possibleKeys = [
        `botFields_${hotelUuid}`,
        `botFields`,
        `hotel_${hotelUuid}_botFields`,
        `aiconfiguracoes_botFields_${hotelUuid}`
      ];
      
      let foundData = null;
      let usedKey = null;
      
      for (const key of possibleKeys) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            foundData = JSON.parse(data);
            usedKey = key;
            break;
          } catch (e) {
            console.warn(`Dados inválidos no localStorage para key: ${key}`);
          }
        }
      }
      
      if (foundData && Array.isArray(foundData) && foundData.length > 0) {
        console.log(`✅ Campos do bot carregados do localStorage (${usedKey}):`, foundData);
        setBotFields(foundData);
      } else {
        console.log('ℹ️ Nenhum dado de campos do bot encontrado no localStorage');
        setBotFields([]);
      }
    } catch (error) {
      console.error('Erro ao carregar campos do bot do localStorage:', error);
      setBotFields([]);
    }
  };

  const handleIntegrationAdded = (newIntegration) => {
    // Recarregar integrações do hotel após adicionar nova integração
    if (selectedHotelUuid) {
      fetchIntegrations(selectedHotelUuid);
    }
    setShowIntegrationForm(false);
  };

  const handleRefreshBotFields = async () => {
    if (!selectedHotelUuid) {
      toast.error('Selecione um hotel primeiro');
      return;
    }

    try {
      console.log('🧹 Limpando localStorage e buscando campos do bot apenas da API...');
      
      // 1. Limpar dados locais primeiro
      setBotFields([]);
      
      // 2. Limpar TODOS os possíveis caches localStorage relacionados
      const possibleKeys = [
        `botFields_${selectedHotelUuid}`,
        `botFields`,
        `hotel_${selectedHotelUuid}_botFields`,
        `aiconfiguracoes_botFields_${selectedHotelUuid}`
      ];
      
      let removedKeys = [];
      possibleKeys.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          removedKeys.push(key);
        }
      });
      
      if (removedKeys.length > 0) {
        console.log('🧹 Caches localStorage removidos:', removedKeys);
      }
      
      // 3. Tentar buscar apenas da API
      try {
        await fetchBotFields(selectedHotelUuid);
        toast.success('Campos do bot atualizados da API!');
      } catch (apiError) {
        console.error('Erro da API:', apiError);
        
        // Se API falhou (endpoint não configurado ou erro), manter vazio
        setBotFields([]);
        
        if (apiError.message.includes('não configurado')) {
          toast.error('Endpoint não configurado. Configure em "Configurações > API Endpoints"');
        } else {
          toast.error(`Erro da API: ${apiError.message}`);
        }
      }
    } catch (error) {
      console.error('Erro geral ao atualizar campos do bot:', error);
      setBotFields([]);
      toast.error(`Erro: ${error.message}`);
    }
  };

  const handleBulkUpdateBotFields = async () => {
    if (!selectedHotelUuid) {
      toast.error('Selecione um hotel primeiro');
      return;
    }

    if (!botFields || botFields.length === 0) {
      toast.error('Nenhum campo do bot encontrado para atualizar');
      return;
    }

    try {
      await updateAllBotFields(botFields);
      toast.success(`${botFields.length} campos do bot atualizados com sucesso!`);
    } catch (error) {
      console.error('Erro ao atualizar campos do bot em lote:', error);
      toast.error(`Erro ao atualizar campos: ${error.message}`);
    }
  };

  const handleQdrantModalOpen = () => {
    if (!selectedHotelUuid) {
      toast.error('Selecione um hotel primeiro');
      return;
    }
    setShowQdrantModal(true);
  };

  const handleQdrantCreateModalOpen = () => {
    if (!selectedHotelUuid) {
      toast.error('Selecione um hotel primeiro');
      return;
    }
    setShowQdrantCreateModal(true);
  };

  const handleCollectionRelated = (result) => {
    console.log('Collection relacionada:', result);
    // Atualizar contagem de collections do hotel
    if (selectedHotelUuid) {
      fetchQdrantCollectionsCount(selectedHotelUuid);
    }
    toast.success('Collection relacionada com sucesso!');
  };

  const handleCollectionCreated = (result) => {
    console.log('Collection criada:', result);
    // Atualizar contagem de collections do hotel
    if (selectedHotelUuid) {
      fetchQdrantCollectionsCount(selectedHotelUuid);
    }
    toast.success('Collection criada com sucesso!');
  };

  // Função para buscar contagem de instâncias do Evolution
  const fetchEvolutionInstancesCount = async (hotelUuid) => {
    try {
      const response = await fetch(`http://localhost:3001/api/evolution/database?hotel_uuid=${hotelUuid}`);
      const data = await response.json();
      
      if (data.success) {
        setEvolutionInstancesCount(data.data.length);
        
        // Se há instâncias, verificar status da primeira
        if (data.data.length > 0) {
          const instance = data.data[0];
          setSelectedEvolutionInstance(instance.instance_name);
          checkEvolutionInstanceStatus(instance.instance_name);
        }
      } else {
        setEvolutionInstancesCount(0);
        setEvolutionInstanceStatus(null);
      }
    } catch (error) {
      console.error('Erro ao buscar contagem de instâncias Evolution:', error);
      setEvolutionInstancesCount(0);
      setEvolutionInstanceStatus(null);
    }
  };

  // Função para verificar status da instância
  const checkEvolutionInstanceStatus = async (instanceName) => {
    try {
      const response = await fetch(`http://localhost:3001/api/evolution/status/${instanceName}`);
      const data = await response.json();
      
      if (data.success) {
        const status = data.data.instance?.state || 'disconnected';
        setEvolutionInstanceStatus(status);
      }
    } catch (error) {
      console.error('Erro ao verificar status da instância:', error);
      setEvolutionInstanceStatus('disconnected');
    }
  };

  // Handlers para Evolution
  const handleEvolutionCreateModalOpen = () => {
    if (!selectedHotelUuid) {
      toast.error('Selecione um hotel primeiro');
      return;
    }
    setShowEvolutionCreateModal(true);
  };

  const handleEvolutionConnectModalOpen = async () => {
    if (!selectedHotelUuid) {
      toast.error('Selecione um hotel primeiro');
      return;
    }

    // Buscar a primeira instância do hotel para conectar
    try {
      const response = await fetch(`http://localhost:3001/api/evolution/database?hotel_uuid=${selectedHotelUuid}`);
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        setSelectedEvolutionInstance(data.data[0].instance_name);
        setShowEvolutionConnectModal(true);
      } else {
        toast.error('Nenhuma instância Evolution encontrada para este hotel');
      }
    } catch (error) {
      console.error('Erro ao buscar instâncias Evolution:', error);
      toast.error('Erro ao buscar instâncias Evolution');
    }
  };

  const handleEvolutionInstanceCreated = () => {
    // Atualizar contagem de instâncias do hotel
    if (selectedHotelUuid) {
      fetchEvolutionInstancesCount(selectedHotelUuid);
    }
    setShowEvolutionCreateModal(false);
    toast.success('Instância Evolution criada com sucesso!');
  };

  const handleEvolutionDisconnectModalOpen = () => {
    if (!selectedEvolutionInstance) {
      toast.error('Nenhuma instância selecionada');
      return;
    }
    setDisconnectConfirmText('');
    setShowEvolutionDisconnectModal(true);
  };

  const handleEvolutionDisconnect = async () => {
    if (disconnectConfirmText !== 'DESCONECTAR') {
      toast.error('Digite "DESCONECTAR" para confirmar');
      return;
    }

    try {
      toast.loading('Desconectando instância...', { id: 'disconnecting-evolution' });
      
      const response = await fetch(`http://localhost:3001/api/evolution/logout/${selectedEvolutionInstance}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Instância desconectada com sucesso!', { id: 'disconnecting-evolution' });
        setShowEvolutionDisconnectModal(false);
        setDisconnectConfirmText('');
        // Atualizar status
        if (selectedHotelUuid) {
          fetchEvolutionInstancesCount(selectedHotelUuid);
        }
      } else {
        toast.error('Erro ao desconectar: ' + (data.error?.message || 'Erro desconhecido'), { id: 'disconnecting-evolution' });
      }
    } catch (error) {
      console.error('Erro ao desconectar instância:', error);
      toast.error('Erro ao desconectar instância', { id: 'disconnecting-evolution' });
    }
  };

  // Gerar nome único da instância baseado no hotel
  const generateEvolutionInstanceName = () => {
    const selectedHotel = hotels.find(h => h.value === selectedHotelUuid);
    if (selectedHotel) {
      // Criar nome baseado no nome do hotel (sem espaços, em lowercase)
      const baseName = selectedHotel.label
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
      
      // Adicionar timestamp para garantir unicidade
      const timestamp = Date.now().toString().slice(-6);
      return `${baseName}_${timestamp}`;
    }
    return `hotel_instance_${Date.now()}`;
  };

  const handleCreateEvolutionInstance = async () => {
    if (!selectedHotelUuid) {
      toast.error('Selecione um hotel primeiro');
      return;
    }

    // Verificar se já existe uma instância para este hotel
    if (evolutionInstancesCount > 0) {
      toast.error('Este hotel já possui uma instância Evolution. Apenas uma instância por hotel é permitida.');
      return;
    }

    // Evitar múltiplas criações simultâneas
    if (creatingEvolutionInstance) {
      toast.error('Aguarde... Criando instância...');
      return;
    }

    setCreatingEvolutionInstance(true);
    const instanceName = generateEvolutionInstanceName();
    
    try {
      toast.loading('Criando instância Evolution...', { id: 'creating-evolution' });
      
      const response = await fetch('http://localhost:3001/api/evolution/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instanceName,
          hotel_uuid: selectedHotelUuid,
          integration: 'WHATSAPP-BAILEYS'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Instância Evolution criada com sucesso!', { id: 'creating-evolution' });
        handleEvolutionInstanceCreated();
      } else {
        toast.error('Erro ao criar instância: ' + (data.error?.message || 'Erro desconhecido'), { id: 'creating-evolution' });
      }
    } catch (error) {
      console.error('Erro ao criar instância:', error);
      toast.error('Erro ao criar instância Evolution', { id: 'creating-evolution' });
    } finally {
      setCreatingEvolutionInstance(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Configurações de IA
            </h2>
            <p className="text-sidebar-300">
              Configure as integrações e parâmetros da inteligência artificial.
            </p>
          </div>
          <Link
            to="/ia"
            className="flex items-center space-x-2 text-sidebar-300 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Voltar para IA</span>
          </Link>
        </div>
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
                {loadingHotels ? 'Carregando hotéis...' : 'Selecione um hotel para configurar suas integrações'}
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

      {/* Integration Types Section */}
      {selectedHotelUuid && (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-white">Tipos de integrações</h3>
            <p className="text-sidebar-300 text-sm mt-1">
              Conheça os tipos de integrações disponíveis para seu hotel
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* Artax */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm">Artax</h4>
                  <p className="text-sidebar-400 text-xs mt-1">Sistema de gestão hoteleira</p>
                </div>
                <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-300">
                  Disponível
                </span>
              </div>
            </div>

            {/* Evolution */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm">Evolution</h4>
                  <p className="text-sidebar-400 text-xs mt-1">API de WhatsApp</p>
                </div>
                <div className="space-y-2">
                  <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-300 block">
                    {evolutionInstancesCount > 0 
                      ? `${evolutionInstancesCount} ${evolutionInstancesCount === 1 ? 'instância' : 'instâncias'}`
                      : 'Nenhuma instância'
                    }
                  </span>
                  {selectedHotelUuid && (
                    <div className="flex space-x-2">
                      {evolutionInstancesCount === 0 ? (
                        <button
                          onClick={handleCreateEvolutionInstance}
                          disabled={creatingEvolutionInstance}
                          className="px-3 py-1 text-xs bg-green-500/30 hover:bg-green-500/50 text-green-200 rounded-full transition-colors flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {creatingEvolutionInstance ? (
                            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          )}
                          <span>{creatingEvolutionInstance ? 'Criando...' : 'Criar'}</span>
                        </button>
                      ) : (
                        <span className="px-3 py-1 text-xs bg-gray-500/30 text-gray-300 rounded-full flex items-center space-x-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Criada</span>
                        </span>
                      )}
                      
                      {evolutionInstancesCount > 0 && (
                        <>
                          {evolutionInstanceStatus === 'open' ? (
                            <button
                              onClick={handleEvolutionDisconnectModalOpen}
                              className="px-3 py-1 text-xs bg-red-500/30 hover:bg-red-500/50 text-red-200 rounded-full transition-colors flex items-center space-x-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                              <span>Desconectar</span>
                            </button>
                          ) : (
                            <button
                              onClick={handleEvolutionConnectModalOpen}
                              className="px-3 py-1 text-xs bg-green-500/30 hover:bg-green-500/50 text-green-200 rounded-full transition-colors flex items-center space-x-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                              <span>Conectar</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Qdrant */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm">Qdrant</h4>
                  <p className="text-sidebar-400 text-xs mt-1">Base de dados vetorial</p>
                </div>
                <div className="space-y-2">
                  <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-300 block">
                    {qdrantCollectionsCount > 0 
                      ? `${qdrantCollectionsCount} ${qdrantCollectionsCount === 1 ? 'collection' : 'collections'}`
                      : 'Nenhuma collection'
                    }
                  </span>
                  {selectedHotelUuid && (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleQdrantCreateModalOpen}
                        className="px-3 py-1 text-xs bg-green-500/30 hover:bg-green-500/50 text-green-200 rounded-full transition-colors flex items-center space-x-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Criar</span>
                      </button>
                      <button
                        onClick={handleQdrantModalOpen}
                        className="px-3 py-1 text-xs bg-purple-500/30 hover:bg-purple-500/50 text-purple-200 rounded-full transition-colors flex items-center space-x-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        <span>Relacionar</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Flowise */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm">Flowise</h4>
                  <p className="text-sidebar-400 text-xs mt-1">Fluxos de IA visuais</p>
                </div>
                <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-300">
                  Disponível
                </span>
              </div>
            </div>

            {/* Onenode */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm">Onenode</h4>
                  <p className="text-sidebar-400 text-xs mt-1">Automação de processos</p>
                </div>
                <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-300">
                  Disponível
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Integration and Bot Fields Management */}
      {selectedHotelUuid && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Integration Management */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-white">Integrações</h3>
                <p className="text-sidebar-300 text-sm mt-1">
                  Configure as integrações com sistemas externos para IA ({integrations.length} integrações)
                </p>
              </div>
              <button
                onClick={() => setShowIntegrationForm(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Nova</span>
              </button>
            </div>

            {/* Integration Form */}
            {showIntegrationForm && (
              <div className="mb-6 p-6 bg-white/5 rounded-lg border border-white/10">
                <IntegrationForm
                  selectedHotelUuid={selectedHotelUuid}
                  onIntegrationAdded={handleIntegrationAdded}
                  onCancel={() => setShowIntegrationForm(false)}
                />
              </div>
            )}

            {/* Integration List */}
            <IntegrationList 
              integrations={integrations}
              onIntegrationUpdate={setIntegrations}
            />
          </div>

          {/* Bot Fields Management */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-white">Campos do Bot</h3>
                <p className="text-sidebar-300 text-sm mt-1">
                  {botFields.length > 5 
                    ? `Exibindo 5 de ${botFields.length} campos configurados no bot de IA`
                    : `Visualize os campos configurados no bot de IA (${botFields.length} campos)`
                  }
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleRefreshBotFields}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 text-sm"
                  disabled={loading}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Atualizar</span>
                </button>
                {botFields && botFields.length > 0 && (
                  <button
                    onClick={handleBulkUpdateBotFields}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 text-sm"
                    disabled={loading}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Salvar Todos</span>
                  </button>
                )}
              </div>
            </div>

            {/* Bot Fields List */}
            <BotFieldsList 
              botFields={botFields}
              loading={loading}
            />
          </div>
        </div>
      )}

      {/* Integration Status Overview */}
      {selectedHotelUuid && (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Status das Integrações</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.length === 0 ? (
              <div className="col-span-full">
                <p className="text-sidebar-400 text-center py-8">
                  Nenhuma integração configurada para este hotel
                </p>
              </div>
            ) : (
              integrations.map((integration) => (
                <div key={integration.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-white text-sm">{integration.integration_name}</h4>
                    <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-300">
                      Ativo
                    </span>
                  </div>
                  <p className="text-sidebar-400 text-xs mb-3">{integration.platform}</p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-sidebar-400">Última sincronização:</span>
                      <span className="text-sidebar-300">Agora</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-sidebar-400">Status:</span>
                      <span className="text-green-300">Conectado</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Qdrant Collection Modal */}
      <QdrantCollectionModal
        isOpen={showQdrantModal}
        onClose={() => setShowQdrantModal(false)}
        selectedHotelUuid={selectedHotelUuid}
        onCollectionRelated={handleCollectionRelated}
      />

      {/* Qdrant Create Collection Modal */}
      <QdrantCreateCollectionModal
        isOpen={showQdrantCreateModal}
        onClose={() => setShowQdrantCreateModal(false)}
        selectedHotelUuid={selectedHotelUuid}
        onCollectionCreated={handleCollectionCreated}
      />

      {/* Evolution Connect Modal - QR Code */}
      {showEvolutionConnectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Conectar WhatsApp</h3>
              <button
                onClick={() => setShowEvolutionConnectModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="w-full">
              <QRCodeViewer 
                instanceName={selectedEvolutionInstance}
                onStatusChange={(status) => {
                  console.log(`Status da instância ${selectedEvolutionInstance}:`, status);
                  if (status === 'open') {
                    toast.success('WhatsApp conectado com sucesso!');
                    // Atualizar status da instância
                    setEvolutionInstanceStatus('open');
                    // Fechar modal de conexão
                    setShowEvolutionConnectModal(false);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Evolution Disconnect Modal - Confirmação */}
      {showEvolutionDisconnectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Desconectar WhatsApp</h3>
              <button
                onClick={() => {
                  setShowEvolutionDisconnectModal(false);
                  setDisconnectConfirmText('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-red-800">Atenção!</h4>
                  <p className="text-sm text-red-700">Esta ação irá desconectar o WhatsApp da instância <strong>{selectedEvolutionInstance}</strong>.</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Para confirmar, digite <strong>"DESCONECTAR"</strong> no campo abaixo:
                </label>
                <input
                  type="text"
                  value={disconnectConfirmText}
                  onChange={(e) => setDisconnectConfirmText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Digite DESCONECTAR"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowEvolutionDisconnectModal(false);
                    setDisconnectConfirmText('');
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEvolutionDisconnect}
                  disabled={disconnectConfirmText !== 'DESCONECTAR'}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Desconectar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIConfiguracoes;