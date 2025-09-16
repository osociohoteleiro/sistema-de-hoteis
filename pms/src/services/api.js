// Serviço de API para comunicação com o backend
// HARDCODED for production - TEMPORARY FIX
const isProduction = window.location.hostname !== 'localhost';
const API_BASE_URL = isProduction 
  ? 'https://osh-sistemas-api-backend.d32pnk.easypanel.host/api'
  : 'http://localhost:3001/api';


class ApiService {
  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    let url = `${API_BASE_URL}${endpoint}`;

    // Handle query parameters
    if (options.params) {
      const searchParams = new URLSearchParams();
      Object.keys(options.params).forEach(key => {
        if (options.params[key] != null) {
          searchParams.append(key, options.params[key]);
        }
      });

      if (searchParams.toString()) {
        url += (endpoint.includes('?') ? '&' : '?') + searchParams.toString();
      }

      // Remove params from options to avoid passing to fetch
      const { params: _, ...configOptions } = options;
      options = configOptions;
    }

    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Tratar especificamente erro 401 (token expirado/inválido)
        if (response.status === 401) {
          this.handleUnauthorized();
          throw new Error('Token expirado');
        }

        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      // Não logar erro se for token expirado (já tratado)
      if (error.message !== 'Token expirado') {
        console.error('API request failed:', error);
      }
      throw error;
    }
  }

  // Tratar caso de não autorização (401)
  handleUnauthorized() {
    // Limpar dados de autenticação
    this.setToken(null);
    localStorage.clear();

    // Redirecionar para login
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
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

  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (data.token) {
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
    localStorage.clear();
  }

  // Hotel endpoints
  async getHotels(params = {}) {
    const searchParams = new URLSearchParams(params);
    const endpoint = `/hotels/my-hotels${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
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

  // Rate Shopper Properties endpoints
  async getRateShopperProperties(hotelId, params = {}) {
    const searchParams = new URLSearchParams(params);
    const endpoint = `/rate-shopper/${hotelId}/properties${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    return await this.request(endpoint);
  }

  async createRateShopperProperty(hotelId, propertyData) {
    return await this.request(`/rate-shopper/${hotelId}/properties`, {
      method: 'POST',
      body: JSON.stringify(propertyData),
    });
  }

  async updateRateShopperProperty(propertyId, propertyData) {
    return await this.request(`/rate-shopper/properties/${propertyId}`, {
      method: 'PUT',
      body: JSON.stringify(propertyData),
    });
  }

  async deleteRateShopperProperty(propertyId) {
    return await this.request(`/rate-shopper/properties/${propertyId}`, {
      method: 'DELETE',
    });
  }

  async updateMainProperty(propertyId, isMain) {
    return await this.request(`/rate-shopper/properties/${propertyId}/main-property`, {
      method: 'PUT',
      body: JSON.stringify({ is_main_property: isMain }),
    });
  }

  // Health check
  async healthCheck() {
    return await this.request('/health');
  }
}

// Export singleton instance
export default new ApiService();