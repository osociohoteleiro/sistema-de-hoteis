import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import MetaConnectModal from '../../components/MetaConnectModal';
import { metaApi } from '../../services/metaApi';

/**
 * REGRA IMPORTANTE: SEMPRE USAR DADOS REAIS
 * 
 * Este componente deve SEMPRE buscar dados reais das APIs.
 * - Nunca usar dados mockados em produção
 * - Sempre verificar se o hotel_uuid é válido antes de fazer requisições
 * - Em caso de erro na API, mostrar mensagem apropriada ao usuário
 * - Manter estados zerados/vazios como fallback enquanto carrega os dados reais
 */

const Marketing = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [marketingSection, setMarketingSection] = useState('meta');
  const [loading, setLoading] = useState(false);
  
  // Estados para Meta Modal
  const [showMetaModal, setShowMetaModal] = useState(false);
  const [metaConnectionStatus, setMetaConnectionStatus] = useState({
    connected: false,
    loading: true,
    credentials: null,
    connectedAccounts: []
  });
  const [realMetaData, setRealMetaData] = useState(null);

  // Estados para dados reais
  const [marketingData, setMarketingData] = useState({
    meta: {
      connectedAccounts: 0,
      totalSpent: 0,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      conversions: 0,
      conversionRate: 0,
      costPerConversion: 0,
      roas: 0
    },
    google: {
      connectedAccounts: 0,
      totalSpent: 0,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      conversions: 0,
      conversionRate: 0,
      costPerConversion: 0,
      roas: 0
    }
  });

  // Obter UUID do hotel atual
  const getCurrentHotelUuid = () => {
    // Primeiro, verificar se há um hotel selecionado no localStorage
    const savedHotelUuid = localStorage.getItem('selectedHotelUuid');
    if (savedHotelUuid && savedHotelUuid !== 'null' && savedHotelUuid !== null && savedHotelUuid !== 'undefined') {
      return savedHotelUuid;
    }
    
    // Se tiver usuário e hotel selecionado
    if (user?.hotels?.length > 0) {
      const hotelUuid = user.hotels[0].hotel_uuid;
      if (hotelUuid && hotelUuid !== 'null' && hotelUuid !== null) {
        // Salvar para próximas consultas
        localStorage.setItem('selectedHotelUuid', hotelUuid);
        return hotelUuid;
      }
    }
    
    // Tentar buscar nos dados do usuário logado
    try {
      const userData = JSON.parse(localStorage.getItem('authUser') || '{}');
      if (userData.hotels?.length > 0) {
        const hotelUuid = userData.hotels[0].hotel_uuid;
        if (hotelUuid && hotelUuid !== 'null' && hotelUuid !== null) {
          localStorage.setItem('selectedHotelUuid', hotelUuid);
          return hotelUuid;
        }
      }
    } catch (error) {
      console.log('⚠️ Erro ao buscar dados do usuário:', error);
    }
    
    // Se não há hotel selecionado, retornar null
    console.error('❌ Nenhum hotel selecionado. Selecione um hotel para continuar.');
    return null;
  };

  // Verificar status da conexão Meta
  const checkMetaConnection = async () => {
    try {
      setMetaConnectionStatus(prev => ({ ...prev, loading: true }));
      
      const hotelUuid = getCurrentHotelUuid();
      if (!hotelUuid || hotelUuid === 'null' || hotelUuid === null || hotelUuid === 'undefined') {
        console.log('⚠️ checkMetaConnection: UUID inválido:', hotelUuid);
        setMetaConnectionStatus({
          connected: false,
          loading: false,
          credentials: null,
          connectedAccounts: []
        });
        return;
      }

      console.log('📡 checkMetaConnection: Verificando conexão Meta para hotel:', hotelUuid);
      
      // Verificar contas conectadas usando a mesma API que o modal
      try {
        console.log('🔎 Chamando metaApi.getOAuthAccounts...');
        const response = await metaApi.getOAuthAccounts(hotelUuid);
        console.log('📦 Resposta da API getOAuthAccounts:', response);
        
        if (response.success && response.accounts && response.accounts.length > 0) {
          console.log('🔍 Contas conectadas encontradas:', response.accounts);
          console.log('📊 Status das contas:', response.accounts.map(acc => ({
            name: acc.name,
            account_status: acc.account_status,
            status: acc.status
          })));
          setMetaConnectionStatus({
            connected: true,
            loading: false,
            credentials: null, // Não precisamos das credenciais na tela principal
            connectedAccounts: response.accounts || []
          });
          
          // Carregar dados reais se conectado
          loadMetaData(hotelUuid);
        } else {
          // Tentar verificar se há credenciais antigas (fallback)
          try {
            const credentialsResponse = await metaApi.getCredentials(hotelUuid);
            if (credentialsResponse.success && credentialsResponse.connected_accounts) {
              setMetaConnectionStatus({
                connected: true,
                loading: false,
                credentials: credentialsResponse.credentials,
                connectedAccounts: credentialsResponse.connected_accounts || []
              });
              loadMetaData(hotelUuid);
            } else {
              setMetaConnectionStatus({
                connected: false,
                loading: false,
                credentials: null,
                connectedAccounts: []
              });
            }
          } catch {
            setMetaConnectionStatus({
              connected: false,
              loading: false,
              credentials: null,
              connectedAccounts: []
            });
          }
        }
      } catch (oauthError) {
        // Se falhar ao buscar contas OAuth, tentar credenciais
        try {
          const credentialsResponse = await metaApi.getCredentials(hotelUuid);
          if (credentialsResponse.success && credentialsResponse.connected_accounts) {
            setMetaConnectionStatus({
              connected: true,
              loading: false,
              credentials: credentialsResponse.credentials,
              connectedAccounts: credentialsResponse.connected_accounts || []
            });
            loadMetaData(hotelUuid);
          } else {
            setMetaConnectionStatus({
              connected: false,
              loading: false,
              credentials: null,
              connectedAccounts: []
            });
          }
        } catch {
          setMetaConnectionStatus({
            connected: false,
            loading: false,
            credentials: null,
            connectedAccounts: []
          });
        }
      }
    } catch (error) {
      console.log('ℹ️ Meta não conectado ainda:', error.message);
      setMetaConnectionStatus({
        connected: false,
        loading: false,
        credentials: null,
        connectedAccounts: []
      });
    }
  };

  // Carregar dados reais do Meta
  const loadMetaData = async (hotelUuid) => {
    try {
      console.log('⚠️ loadMetaData: Dados de insights desabilitados temporariamente');
      // TODO: Reabilitar quando as tabelas Meta estiverem configuradas corretamente
      // const insights = await metaApi.getInsights(hotelUuid);
      // if (insights.success) {
      //   // Processar dados reais do Meta
      //   const processedData = processMetaInsights(insights.data);
      //   setRealMetaData(processedData);
      //   
      //   // Atualizar estado com dados reais
      //   setMarketingData(prev => ({
      //     ...prev,
      //     meta: processedData
      //   }));
      // }
      
      // Por enquanto, manter dados padrão zerados
      const defaultData = {
        connectedAccounts: 1, // Já que temos contas conectadas
        totalSpent: 0,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        conversions: 0,
        conversionRate: 0,
        costPerConversion: 0,
        roas: 0
      };
      
      setMarketingData(prev => ({
        ...prev,
        meta: defaultData
      }));
      
    } catch (error) {
      console.error('Erro ao carregar dados Meta:', error);
      // Manter dados vazios se falhar
    }
  };

  // Processar insights do Meta para formato esperado
  const processMetaInsights = (insights) => {
    if (!insights.data || !insights.data.length) {
      return marketingData.meta; // Fallback para dados vazios
    }

    const totalData = insights.data.reduce((acc, item) => ({
      totalSpent: acc.totalSpent + (parseFloat(item.spend) || 0),
      impressions: acc.impressions + (parseInt(item.impressions) || 0),
      clicks: acc.clicks + (parseInt(item.clicks) || 0),
      conversions: acc.conversions + (parseInt(item.conversions) || 0)
    }), { totalSpent: 0, impressions: 0, clicks: 0, conversions: 0 });

    return {
      connectedAccounts: 1, // Desde que carregou dados
      totalSpent: totalData.totalSpent,
      impressions: totalData.impressions,
      clicks: totalData.clicks,
      ctr: totalData.impressions > 0 ? (totalData.clicks / totalData.impressions * 100) : 0,
      conversions: totalData.conversions,
      conversionRate: totalData.clicks > 0 ? (totalData.conversions / totalData.clicks * 100) : 0,
      costPerConversion: totalData.conversions > 0 ? (totalData.totalSpent / totalData.conversions) : 0,
      roas: totalData.totalSpent > 0 ? (totalData.conversions * 100 / totalData.totalSpent) : 0 // Exemplo simples
    };
  };

  // Atualizar conexão (callback do modal)
  const handleMetaConnectionUpdate = () => {
    checkMetaConnection();
  };

  // Verificar mensagens de OAuth na URL
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    
    // Novo fluxo OAuth - redireciona para seleção de contas
    if (urlParams.get('oauth_success') === '1' && urlParams.get('select_accounts') === '1') {
      toast.success('Login realizado! Agora escolha suas contas de anúncios.');
      setShowMetaModal(true);
      
      // Limpar parâmetros da URL
      window.history.replaceState({}, document.title, location.pathname);
      
      // Verificar status da conexão
      checkMetaConnection();
      return;
    }
    
    // Fluxo antigo (compatibilidade)
    if (urlParams.get('success') === '1') {
      if (urlParams.get('connected') === '1') {
        toast.success('Conta Meta conectada com sucesso!');
      } else if (urlParams.get('select_account') === '1') {
        toast.success('Login realizado! Selecione uma conta de anúncios.');
        setShowMetaModal(true);
      }
      
      // Limpar parâmetros da URL
      window.history.replaceState({}, document.title, location.pathname);
      
      // Verificar status da conexão
      checkMetaConnection();
    } else if (urlParams.get('error')) {
      const errorMsg = decodeURIComponent(urlParams.get('error'));
      toast.error(`Erro na conexão: ${errorMsg}`);
      
      // Limpar parâmetros da URL
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location.search]);

  // Verificar conexão Meta ao carregar
  useEffect(() => {
    checkMetaConnection();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <span>📢</span>
            <span>Marketing</span>
          </h1>
          <p className="text-sidebar-400">Performance de campanhas e canais de marketing</p>
        </div>
      </div>

      {/* Sub-navegação do Marketing */}
      <div className="bg-sidebar-800/50 backdrop-blur-sm rounded-lg border border-white/10 p-1">
        <div className="flex space-x-1">
          {[
            { id: 'meta', label: 'Meta', icon: '📘' },
            { id: 'google', label: 'Google', icon: '🔍' }
          ].map((section) => (
            <button
              key={section.id}
              onClick={() => setMarketingSection(section.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                marketingSection === section.id
                  ? 'bg-primary-600 text-white'
                  : 'text-sidebar-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{section.icon}</span>
              <span className="font-medium">{section.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sessão Meta */}
      {marketingSection === 'meta' && (
        <>
          {/* Header da Sessão Meta */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
                <span>📘</span>
                <span>Meta (Minhas Contas)</span>
              </h3>
              <p className="text-sidebar-400">Facebook e Instagram Ads</p>
            </div>
            {metaConnectionStatus.loading ? (
              <div className="bg-blue-600/50 text-white font-medium py-2 px-4 rounded-lg flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Verificando...</span>
              </div>
            ) : metaConnectionStatus.connected ? (
              <button 
                onClick={() => setShowMetaModal(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Gerenciar Contas</span>
              </button>
            ) : (
              <button 
                onClick={() => setShowMetaModal(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Conectar Conta</span>
              </button>
            )}
          </div>

          {/* Contas Conectadas Meta */}
          <div className="bg-sidebar-800/50 backdrop-blur-sm rounded-lg border border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-white">
                Contas Conectadas ({metaConnectionStatus.connectedAccounts.length})
              </h4>
              {metaConnectionStatus.connected && (
                <button 
                  onClick={() => setShowMetaModal(true)}
                  className="text-primary-400 hover:text-primary-300 text-sm font-medium"
                  title="Gerenciar contas"
                >
                  Gerenciar
                </button>
              )}
            </div>
            
            {/* Lista de Contas Reais */}
            <div className="space-y-3">
              {metaConnectionStatus.loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400"></div>
                  <span className="ml-3 text-sidebar-400">Carregando contas conectadas...</span>
                </div>
              ) : metaConnectionStatus.connectedAccounts.length > 0 ? (
                metaConnectionStatus.connectedAccounts.map((account, index) => (
                  <div key={account.id || index} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">META</span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="text-white font-medium">
                            {account.name || account.ad_account_name || `Conta ${account.id || account.ad_account_id}`}
                          </p>
                          {index === 0 && (
                            <span className="px-2 py-1 bg-primary-500/20 text-primary-400 text-xs rounded">
                              Principal
                            </span>
                          )}
                        </div>
                        <p className="text-sidebar-400 text-sm">
                          ID: {account.id || `act_${account.ad_account_id}`}
                        </p>
                        {account.business_name && (
                          <p className="text-sidebar-500 text-xs">
                            Business: {account.business_name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                        Conectada
                      </span>
                      <span className={`px-2 py-1 text-xs rounded ${
                        account.account_status === 1 || account.status === 1 ? 
                        'bg-green-500/20 text-green-400' : 
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {account.account_status === 1 || account.status === 1 ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-sidebar-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-sidebar-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sidebar-400 text-sm">
                    {metaConnectionStatus.connected ? 
                      'Nenhuma conta conectada ainda.' : 
                      'Conecte sua conta Meta para começar.'}
                  </p>
                  <button 
                    onClick={() => setShowMetaModal(true)}
                    className="mt-3 text-primary-400 hover:text-primary-300 text-sm font-medium"
                  >
                    {metaConnectionStatus.connected ? 'Adicionar Conta' : 'Conectar Agora'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Métricas do Meta (se conectado) */}
          {metaConnectionStatus.connected && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-sidebar-800/50 backdrop-blur-sm rounded-lg border border-white/10 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sidebar-400 text-sm font-medium">Total Investido</p>
                    <p className="text-2xl font-bold text-blue-400 mt-2">
                      R$ {marketingData.meta.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-sidebar-800/50 backdrop-blur-sm rounded-lg border border-white/10 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sidebar-400 text-sm font-medium">Impressões</p>
                    <p className="text-2xl font-bold text-purple-400 mt-2">
                      {marketingData.meta.impressions.toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-500/10 rounded-lg">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-sidebar-800/50 backdrop-blur-sm rounded-lg border border-white/10 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sidebar-400 text-sm font-medium">Cliques</p>
                    <p className="text-2xl font-bold text-green-400 mt-2">
                      {marketingData.meta.clicks.toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-sidebar-800/50 backdrop-blur-sm rounded-lg border border-white/10 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sidebar-400 text-sm font-medium">Conversões</p>
                    <p className="text-2xl font-bold text-yellow-400 mt-2">
                      {marketingData.meta.conversions.toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-500/10 rounded-lg">
                    <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Sessão Google */}
      {marketingSection === 'google' && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="bg-sidebar-800/50 backdrop-blur-sm rounded-lg border border-white/10 p-12 text-center max-w-md">
            <div className="mb-6">
              <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-2">Google Ads - Em Breve</h3>
              <p className="text-sidebar-400 leading-relaxed">
                Estamos trabalhando na integração com o Google Ads para trazer os mesmos recursos de relatórios e gestão que você já possui com o Meta.
              </p>
            </div>
            <div className="text-sidebar-500 text-sm">
              <p>• Relatórios detalhados de campanhas</p>
              <p>• Métricas de performance em tempo real</p>
              <p>• Gestão de múltiplas contas</p>
            </div>
          </div>
        </div>
      )}

      {/* Meta Connect Modal */}
      <MetaConnectModal
        isOpen={showMetaModal}
        onClose={() => setShowMetaModal(false)}
        hotelUuid={getCurrentHotelUuid()}
        onConnectionUpdate={handleMetaConnectionUpdate}
      />
    </div>
  );
};

export default Marketing;