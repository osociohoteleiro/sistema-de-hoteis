import { useState, useEffect } from 'react';
import { metaApi } from '../services/metaApi';
import toast from 'react-hot-toast';

const MetaConnectModal = ({ isOpen, onClose, hotelUuid, onConnectionUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('login'); // 'login', 'select', 'connected'
  const [availableAccounts, setAvailableAccounts] = useState([]);
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState([]);

  // Verificar status da conexão e contas disponíveis ao abrir
  useEffect(() => {
    if (isOpen && hotelUuid) {
      checkStatus();
    }
  }, [isOpen, hotelUuid]);

  // Verificar parâmetros da URL quando redirecionar do OAuth
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('oauth_success') === '1' && urlParams.get('select_accounts') === '1') {
      // Usuário voltou do OAuth, mostrar seleção de contas
      setStep('select');
      loadAvailableAccounts();
      // Limpar parâmetros da URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const checkStatus = async () => {
    try {
      setLoading(true);
      
      // Verificar contas conectadas
      try {
        const connectedResponse = await metaApi.getOAuthAccounts(hotelUuid);
        if (connectedResponse.success && connectedResponse.accounts.length > 0) {
          setConnectedAccounts(connectedResponse.accounts);
          setStep('connected');
          return;
        }
      } catch (error) {
        console.warn('No connected accounts found');
      }

      // Verificar contas disponíveis (após OAuth mas não conectadas)
      try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
        const availableResponse = await fetch(`http://localhost:3001/api/meta/oauth/available-accounts/${hotelUuid}`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).then(res => res.json());
        
        if (availableResponse.success && availableResponse.accounts.length > 0) {
          setAvailableAccounts(availableResponse.accounts);
          setStep('select');
          return;
        }
      } catch (error) {
        console.warn('No available accounts found');
      }

      // Se não tem nem conectadas nem disponíveis, mostrar tela de login
      setStep('login');

    } catch (error) {
      console.error('Error checking status:', error);
      setStep('login');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableAccounts = async () => {
    try {
      setLoading(true);
      
      // Usar o mesmo padrão de token que o restante da aplicação
      const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
      console.log('🔑 Token found:', token ? 'Yes' : 'No');
      
      if (!token) {
        toast.error('Token de autenticação não encontrado. Faça login novamente.');
        setStep('login');
        return;
      }
      
      const response = await fetch(`http://localhost:3001/api/meta/oauth/available-accounts/${hotelUuid}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }).then(res => res.json());
      
      if (response.success) {
        setAvailableAccounts(response.accounts);
        // Pre-selecionar contas não conectadas
        const notConnected = response.accounts
          .filter(acc => !acc.isConnected)
          .map(acc => acc.id);
        setSelectedAccountIds(notConnected);
      } else {
        toast.error(response.message || 'Erro ao carregar contas');
        setStep('login');
      }
    } catch (error) {
      console.error('Error loading available accounts:', error);
      toast.error('Erro ao carregar contas disponíveis');
      setStep('login');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectFacebook = async () => {
    try {
      setLoading(true);
      const response = await metaApi.getOAuthUrl(hotelUuid);
      
      if (response.success && response.authUrl) {
        // Redirecionar para o Facebook (não popup)
        window.location.href = response.authUrl;
      }
    } catch (error) {
      console.error('Erro ao conectar com Facebook:', error);
      toast.error(error.message || 'Erro ao conectar com Facebook');
      setLoading(false);
    }
  };

  const handleAccountToggle = (accountId) => {
    setSelectedAccountIds(prev => 
      prev.includes(accountId) 
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  const handleConnectSelectedAccounts = async () => {
    if (selectedAccountIds.length === 0) {
      toast.error('Selecione pelo menos uma conta para conectar');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:3001/api/meta/oauth/connect-accounts/${hotelUuid}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ accountIds: selectedAccountIds })
      }).then(res => res.json());

      if (response.success) {
        toast.success(response.message);
        setStep('connected');
        setConnectedAccounts(response.connectedAccounts);
        onConnectionUpdate && onConnectionUpdate();
      } else {
        toast.error(response.error || 'Erro ao conectar contas');
      }
    } catch (error) {
      console.error('Error connecting accounts:', error);
      toast.error('Erro ao conectar contas selecionadas');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectAccount = async (accountId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:3001/api/meta/oauth/disconnect-account/${hotelUuid}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ adAccountId: accountId })
      }).then(res => res.json());

      if (response.success) {
        toast.success('Conta desconectada com sucesso!');
        // Atualizar lista de conectadas
        setConnectedAccounts(prev => prev.filter(acc => acc.id !== accountId));
        onConnectionUpdate && onConnectionUpdate();
        
        // Se não sobrou nenhuma conta, voltar para seleção
        if (connectedAccounts.length <= 1) {
          loadAvailableAccounts();
          setStep('select');
        }
      } else {
        toast.error(response.error || 'Erro ao desconectar conta');
      }
    } catch (error) {
      console.error('Error disconnecting account:', error);
      toast.error('Erro ao desconectar conta');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMoreAccounts = () => {
    loadAvailableAccounts();
    setStep('select');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-sidebar-900 rounded-lg shadow-xl max-w-2xl w-full mx-4 border border-white/10 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">📘</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Meta Ads Manager</h2>
              <p className="text-sidebar-400 text-sm">Conectar contas do Facebook e Instagram</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-sidebar-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-sidebar-400">Carregando...</p>
            </div>
          )}

          {/* Tela de Login */}
          {!loading && step === 'login' && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">Conectar com Facebook</h3>
              <p className="text-sidebar-400 text-sm mb-6">
                Faça login com sua conta do Facebook para ver suas contas de anúncios e escolher quais deseja conectar.
              </p>
              <button
                onClick={handleConnectFacebook}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-8 rounded-lg transition-colors flex items-center space-x-2 mx-auto disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>Login com Facebook</span>
              </button>
            </div>
          )}

          {/* Tela de Seleção de Contas */}
          {!loading && step === 'select' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-white font-semibold mb-2">Escolha suas Contas de Anúncios</h3>
                <p className="text-sidebar-400 text-sm">
                  Selecione as contas que deseja conectar. Você pode conectar múltiplas contas e gerenciá-las individualmente.
                </p>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {availableAccounts.map((account) => {
                  const isSelected = selectedAccountIds.includes(account.id);
                  const isActive = account.account_status === 1;
                  const isAlreadyConnected = account.isConnected;
                  
                  return (
                    <div
                      key={account.id}
                      className={`p-4 rounded-lg border transition-all ${
                        isAlreadyConnected
                          ? 'bg-green-500/10 border-green-500/30'
                          : isSelected
                            ? 'bg-blue-500/20 border-blue-500/40'
                            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 cursor-pointer'
                      }`}
                      onClick={() => !isAlreadyConnected && handleAccountToggle(account.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-5 h-5 rounded border-2 mt-1 flex items-center justify-center ${
                          isAlreadyConnected
                            ? 'bg-green-500 border-green-500'
                            : isSelected 
                              ? 'bg-blue-500 border-blue-500' 
                              : 'border-sidebar-400 bg-transparent'
                        }`}>
                          {(isSelected || isAlreadyConnected) && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <p className="text-white font-medium">{account.name}</p>
                            {isAlreadyConnected && (
                              <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded">
                                Conectada
                              </span>
                            )}
                            <span className={`px-2 py-1 text-xs rounded ${
                              isActive 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {isActive ? 'Ativa' : 'Inativa'}
                            </span>
                          </div>
                          
                          <div className="space-y-1 text-sm">
                            <p className="text-sidebar-400">
                              ID: <span className="font-mono text-xs">{account.account_id}</span>
                            </p>
                            {account.currency && (
                              <p className="text-sidebar-400">
                                Moeda: {account.currency}
                              </p>
                            )}
                            {account.business?.name && (
                              <p className="text-sidebar-400">
                                Empresa: {account.business.name}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <p className="text-sidebar-400 text-sm">
                  {selectedAccountIds.length} de {availableAccounts.filter(a => !a.isConnected).length} contas selecionadas
                </p>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setStep('login')}
                    className="bg-sidebar-700 hover:bg-sidebar-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handleConnectSelectedAccounts}
                    disabled={selectedAccountIds.length === 0 || loading}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Conectando...' : `Conectar ${selectedAccountIds.length} Conta(s)`}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tela de Contas Conectadas */}
          {!loading && step === 'connected' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-white font-semibold mb-2">Contas Conectadas</h3>
                <p className="text-sidebar-400 text-sm">
                  {connectedAccounts.length} conta(s) conectada(s) e pronta(s) para uso.
                </p>
              </div>

              {/* TESTE EM VERMELHO - CONFIRMAÇÃO */}
              <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4 mb-4">
                <p className="text-red-400 font-bold text-center">
                  🔴 TESTE - CLAUDE ESTÁ NO LUGAR CERTO! 🔴
                </p>
                <p className="text-red-300 text-sm text-center mt-1">
                  Esta é a seção "Contas Conectadas" no Modal Meta Ads Manager
                </p>
              </div>

              <div className="space-y-3">
                {connectedAccounts.map((account) => (
                  <div key={account.id} className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-400 font-medium">{account.name}</p>
                        <p className="text-sidebar-400 text-sm">
                          ID: <span className="font-mono text-xs">{account.id}</span>
                        </p>
                      </div>
                      <button
                        onClick={() => handleDisconnectAccount(account.id)}
                        className="bg-red-600 hover:bg-red-500 text-white font-medium py-1 px-3 rounded text-sm transition-colors"
                      >
                        Desconectar
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-center space-x-3 pt-4 border-t border-white/10">
                <button
                  onClick={handleAddMoreAccounts}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                >
                  Conectar Mais Contas
                </button>
                <button
                  onClick={onClose}
                  className="bg-sidebar-700 hover:bg-sidebar-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetaConnectModal;