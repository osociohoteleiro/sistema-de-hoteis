import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

// Criar instância do axios com configurações padrão
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use((config) => {
  // Buscar token correto do localStorage
  const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratamento de respostas e erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado - apenas remover token, não redirecionar
      // O redirecionamento será tratado pelo componente ProtectedRoute
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('auth_token');
      console.log('⚠️ Token Meta API expirado, removendo tokens');
    }
    return Promise.reject(error);
  }
);

export const metaApi = {
  // Obter URL de autorização OAuth do Facebook
  async getOAuthUrl(hotelUuid) {
    try {
      const response = await api.get(`/meta/oauth/url/${hotelUuid}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter URL OAuth:', error);
      throw this.handleError(error);
    }
  },

  // Obter credenciais/status de conexão
  async getCredentials(hotelUuid) {
    try {
      const response = await api.get(`/meta/credentials/${hotelUuid}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        // Não tem credenciais ainda - retornar estado inicial
        return { success: false, credentials: null };
      }
      console.error('Erro ao obter credenciais:', error);
      throw this.handleError(error);
    }
  },

  // Configurar credenciais manualmente (caso não use OAuth)
  async setCredentials(hotelUuid, credentials) {
    try {
      const response = await api.post(`/meta/credentials/${hotelUuid}`, credentials);
      return response.data;
    } catch (error) {
      console.error('Erro ao configurar credenciais:', error);
      throw this.handleError(error);
    }
  },

  // Remover conexão
  async disconnect(hotelUuid) {
    try {
      const response = await api.delete(`/meta/credentials/${hotelUuid}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao desconectar:', error);
      throw this.handleError(error);
    }
  },

  // Sincronizar dados do Meta
  async syncData(hotelUuid, dateRange = null) {
    try {
      const response = await api.post(`/meta/sync/${hotelUuid}`, {
        dateRange
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao sincronizar dados:', error);
      throw this.handleError(error);
    }
  },

  // Obter campanhas
  async getCampaigns(hotelUuid, params = {}) {
    try {
      const response = await api.get(`/meta/campaigns/${hotelUuid}`, {
        params
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao obter campanhas:', error);
      throw this.handleError(error);
    }
  },

  // Obter insights/métricas
  async getInsights(hotelUuid, params = {}) {
    try {
      const response = await api.get(`/meta/insights/${hotelUuid}`, {
        params
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao obter insights:', error);
      throw this.handleError(error);
    }
  },

  // Renovar token
  async refreshToken(hotelUuid) {
    try {
      const response = await api.post(`/meta/refresh-token/${hotelUuid}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      throw this.handleError(error);
    }
  },

  // Obter logs de sincronização
  async getSyncLogs(hotelUuid, params = {}) {
    try {
      const response = await api.get(`/meta/sync-logs/${hotelUuid}`, {
        params
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao obter logs:', error);
      throw this.handleError(error);
    }
  },

  // Obter contas de anúncios do OAuth
  async getOAuthAccounts(hotelUuid) {
    try {
      const response = await api.get(`/meta/oauth/accounts/${hotelUuid}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter contas OAuth:', error);
      throw this.handleError(error);
    }
  },

  // Obter contas disponíveis para conexão
  async getAvailableAccounts(hotelUuid) {
    try {
      const response = await api.get(`/meta/oauth/available-accounts/${hotelUuid}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter contas disponíveis:', error);
      throw this.handleError(error);
    }
  },

  // Conectar contas selecionadas
  async connectAccounts(hotelUuid, accountIds) {
    try {
      const response = await api.post(`/meta/oauth/connect-accounts/${hotelUuid}`, {
        accountIds
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao conectar contas:', error);
      throw this.handleError(error);
    }
  },

  // Desconectar conta específica
  async disconnectAccount(hotelUuid, accountId) {
    try {
      const response = await api.post(`/meta/oauth/disconnect-account/${hotelUuid}`, {
        adAccountId: accountId
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao desconectar conta:', error);
      throw this.handleError(error);
    }
  },

  // Selecionar conta de anúncios (DEPRECATED - usar connectAccounts)
  async selectAccount(hotelUuid, adAccountId) {
    try {
      const response = await api.post(`/meta/oauth/select-account/${hotelUuid}`, {
        adAccountId
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao selecionar conta:', error);
      throw this.handleError(error);
    }
  },

  // Tratamento padrão de erros
  handleError(error) {
    if (error.response) {
      // Erro HTTP da API
      const { status, data } = error.response;
      return new Error(data.error || `Erro HTTP ${status}`);
    } else if (error.request) {
      // Erro de rede
      return new Error('Erro de conectividade. Verifique sua conexão com a internet.');
    } else {
      // Erro genérico
      return new Error('Erro inesperado: ' + error.message);
    }
  }
};

export default metaApi;