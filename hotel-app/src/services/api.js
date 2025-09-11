// Serviço de API para comunicação com o backend
import { API_CONFIG } from '../config/api.js';

const API_BASE_URL = API_CONFIG.baseURLWithPath;

console.log('🚨 HOTEL-APP ApiService DEBUG - API_BASE_URL:', API_BASE_URL);
console.log('🚨 HOTEL-APP ApiService DEBUG - hostname:', window.location.hostname);

class ApiService {
  constructor() {
    // Não armazenar token no constructor - buscar sempre dinamicamente
  }

  setToken(token) {
    if (token) {
      localStorage.setItem('auth_token', token);
      // Também armazenar no formato usado pelo AuthContext
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('authToken');
    }
  }

  getToken() {
    // Buscar token dinamicamente dos possíveis locais
    return localStorage.getItem('auth_token') || localStorage.getItem('authToken') || localStorage.getItem('token');
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    const token = this.getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
      console.log('🔐 [DEBUG] Token sendo enviado:', token.substring(0, 20) + '...');
    } else {
      console.log('⚠️ [DEBUG] Nenhum token encontrado!');
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (data.token) {
      this.setToken(data.token);
    }

    return data;
  }

  async register(userData, autoLogin = false) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    // Só salvar token se for para auto login (registro próprio)
    if (data.token && autoLogin) {
      this.setToken(data.token);
    }

    return data;
  }

  async getProfile() {
    return await this.request('/auth/me');
  }

  async updateProfile(profileData) {
    return await this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async changePassword(passwordData) {
    return await this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
  }

  logout() {
    this.setToken(null);
    // Limpar outros dados de autenticação mas manter configurações
    localStorage.removeItem('authUser');
    localStorage.removeItem('token');
  }

  // Users endpoints
  async getUsers(params = {}) {
    const searchParams = new URLSearchParams(params);
    const endpoint = `/users${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    return await this.request(endpoint);
  }

  async getUser(id) {
    return await this.request(`/users/${id}`);
  }

  async updateUser(id, userData) {
    return await this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id) {
    return await this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  async changeUserPassword(id, passwordData) {
    return await this.request(`/users/${id}/password`, {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  }

  // Hotel endpoints
  async getHotels(params = {}) {
    const searchParams = new URLSearchParams(params);
    const endpoint = `/hotels${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    return await this.request(endpoint);
  }

  async getHotel(id) {
    return await this.request(`/hotels/${id}`);
  }

  async createHotel(hotelData) {
    return await this.request('/hotels', {
      method: 'POST',
      body: JSON.stringify(hotelData),
    });
  }

  async updateHotel(id, hotelData) {
    return await this.request(`/hotels/${id}`, {
      method: 'PUT',
      body: JSON.stringify(hotelData),
    });
  }

  async deleteHotel(id) {
    return await this.request(`/hotels/${id}`, {
      method: 'DELETE',
    });
  }

  // Config endpoints
  async getConfigs(params = {}) {
    const searchParams = new URLSearchParams(params);
    const endpoint = `/config${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    return await this.request(endpoint);
  }

  async getConfig(key, hotelId = null) {
    const params = hotelId ? `?hotel_id=${hotelId}` : '';
    return await this.request(`/config/${key}${params}`);
  }

  async setConfig(configData, hotelId = null) {
    const params = hotelId ? `?hotel_id=${hotelId}` : '';
    return await this.request(`/config${params}`, {
      method: 'POST',
      body: JSON.stringify(configData),
    });
  }

  async deleteConfig(key, hotelId = null) {
    const params = hotelId ? `?hotel_id=${hotelId}` : '';
    return await this.request(`/config/${key}${params}`, {
      method: 'DELETE',
    });
  }

  // API Endpoints management
  async getApiEndpoints(params = {}) {
    const searchParams = new URLSearchParams(params);
    const endpoint = `/config/endpoints/list${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    return await this.request(endpoint);
  }

  async getApiEndpoint(id) {
    return await this.request(`/config/endpoints/${id}`);
  }

  async createApiEndpoint(endpointData, hotelId = null) {
    const params = hotelId ? `?hotel_id=${hotelId}` : '';
    return await this.request(`/config/endpoints${params}`, {
      method: 'POST',
      body: JSON.stringify(endpointData),
    });
  }

  async updateApiEndpoint(id, endpointData) {
    return await this.request(`/config/endpoints/${id}`, {
      method: 'PUT',
      body: JSON.stringify(endpointData),
    });
  }

  async deleteApiEndpoint(id) {
    return await this.request(`/config/endpoints/${id}`, {
      method: 'DELETE',
    });
  }

  // User permissions management
  async updateUserPermissions(userId, permissions) {
    console.log('🔧 ApiService.updateUserPermissions chamado:', { userId, permissions });
    const result = await this.request(`/users/${userId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
    });
    console.log('✅ ApiService.updateUserPermissions resultado:', result);
    return result;
  }

  async getUserPermissions(userId) {
    return await this.request(`/users/${userId}/permissions`);
  }

  // ✅ NOVOS ENDPOINTS ADICIONADOS - Baseados na API real

  // Evolution API endpoints
  async getEvolutionInstances(hotelId = null) {
    const params = hotelId ? `?hotel_id=${hotelId}` : '';
    return await this.request(`/evolution/instances${params}`);
  }

  async createEvolutionInstance(instanceData) {
    return await this.request('/evolution/instances', {
      method: 'POST',
      body: JSON.stringify(instanceData),
    });
  }

  async deleteEvolutionInstance(instanceName) {
    return await this.request(`/evolution/instances/${instanceName}`, {
      method: 'DELETE',
    });
  }

  // Flowise endpoints
  async getFlowiseBots(hotelId = null) {
    const params = hotelId ? `?hotel_id=${hotelId}` : '';
    return await this.request(`/flowise/bots${params}`);
  }

  async createFlowiseBot(botData) {
    return await this.request('/flowise/bots', {
      method: 'POST',
      body: JSON.stringify(botData),
    });
  }

  async updateFlowiseBot(botId, botData) {
    return await this.request(`/flowise/bots/${botId}`, {
      method: 'PUT',
      body: JSON.stringify(botData),
    });
  }

  async deleteFlowiseBot(botId) {
    return await this.request(`/flowise/bots/${botId}`, {
      method: 'DELETE',
    });
  }

  // Bot Fields endpoints
  async getBotFields(hotelId = null) {
    const params = hotelId ? `?hotel_id=${hotelId}` : '';
    return await this.request(`/bot-fields${params}`);
  }

  async createBotField(fieldData) {
    return await this.request('/bot-fields', {
      method: 'POST',
      body: JSON.stringify(fieldData),
    });
  }

  async updateBotField(fieldId, fieldData) {
    return await this.request(`/bot-fields/${fieldId}`, {
      method: 'PUT',
      body: JSON.stringify(fieldData),
    });
  }

  async deleteBotField(fieldId) {
    return await this.request(`/bot-fields/${fieldId}`, {
      method: 'DELETE',
    });
  }

  // Marketing Messages endpoints
  async getMarketingMessages(hotelId = null) {
    const params = hotelId ? `?hotel_id=${hotelId}` : '';
    return await this.request(`/marketing-messages${params}`);
  }

  async createMarketingMessage(messageData) {
    return await this.request('/marketing-messages', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  async updateMarketingMessage(messageId, messageData) {
    return await this.request(`/marketing-messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify(messageData),
    });
  }

  async deleteMarketingMessage(messageId) {
    return await this.request(`/marketing-messages/${messageId}`, {
      method: 'DELETE',
    });
  }

  // Qdrant endpoints
  async getQdrantCollections() {
    return await this.request('/qdrant/collections');
  }

  async createQdrantCollection(collectionData) {
    return await this.request('/qdrant/collections', {
      method: 'POST',
      body: JSON.stringify(collectionData),
    });
  }

  async deleteQdrantCollection(collectionName) {
    return await this.request(`/qdrant/collections/${collectionName}`, {
      method: 'DELETE',
    });
  }

  // Meta API endpoints
  async getMetaCredentials(hotelId) {
    return await this.request(`/meta/credentials/${hotelId}`);
  }

  async setMetaCredentials(hotelId, credentials) {
    return await this.request(`/meta/credentials/${hotelId}`, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async deleteMetaCredentials(hotelId) {
    return await this.request(`/meta/credentials/${hotelId}`, {
      method: 'DELETE',
    });
  }

  async getMetaOAuthUrl(hotelId) {
    return await this.request(`/meta/oauth/url/${hotelId}`);
  }

  // Reports endpoints
  async getReports(params = {}) {
    const searchParams = new URLSearchParams(params);
    const endpoint = `/reports${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    return await this.request(endpoint);
  }

  async getReport(reportId) {
    return await this.request(`/reports/${reportId}`);
  }

  // Rate Shopper endpoints
  async getRateShopperData(params = {}) {
    const searchParams = new URLSearchParams(params);
    const endpoint = `/rate-shopper${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    return await this.request(endpoint);
  }

  async getRateShopperExtraction() {
    return await this.request('/rate-shopper-extraction');
  }

  // Hotel Sites endpoints
  async getHotelSites(hotelId = null) {
    const params = hotelId ? `?hotel_id=${hotelId}` : '';
    return await this.request(`/hotel-sites${params}`);
  }

  async createHotelSite(siteData) {
    return await this.request('/hotel-sites', {
      method: 'POST',
      body: JSON.stringify(siteData),
    });
  }

  async updateHotelSite(siteId, siteData) {
    return await this.request(`/hotel-sites/${siteId}`, {
      method: 'PUT',
      body: JSON.stringify(siteData),
    });
  }

  async deleteHotelSite(siteId) {
    return await this.request(`/hotel-sites/${siteId}`, {
      method: 'DELETE',
    });
  }

  // Logos endpoints
  async uploadLogo(hotelId, logoData) {
    return await this.request(`/logos/upload/${hotelId}`, {
      method: 'POST',
      body: JSON.stringify(logoData),
    });
  }

  async getLogoHistory(hotelId) {
    return await this.request(`/logos/history/${hotelId}`);
  }

  async setActiveLogo(hotelId, logoId) {
    return await this.request(`/logos/set-active/${hotelId}/${logoId}`, {
      method: 'POST',
    });
  }

  // User Hotels management
  async getUserHotels(userId) {
    return await this.request(`/users/${userId}/hotels`);
  }

  async assignUserToHotels(userId, hotelIds) {
    return await this.request(`/hotels/assign-user`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, hotel_ids: hotelIds }),
    });
  }

  // Health check
  async healthCheck() {
    return await this.request('/health');
  }
}

// Export singleton instance
export default new ApiService();