// Cliente para comunicação com a API OSH
class OSHApiClient {
  
  constructor() {
    this.baseURL = OSH_CONFIG.API_BASE_URL;
    this.retryAttempts = OSH_CONFIG.SYNC_CONFIG.RETRY_ATTEMPTS;
    this.retryDelay = OSH_CONFIG.SYNC_CONFIG.RETRY_DELAY;
  }

  // Fazer requisição HTTP com retry automático
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = await OSHStorage.getAuthToken();
    
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        'X-Extension-Version': '1.0.0',
        'X-Extension-Source': 'chrome-extension'
      },
      ...options
    };

    let lastError;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        console.log(`🌐 API Request (attempt ${attempt}): ${endpoint}`, defaultOptions);
        
        const response = await fetch(url, defaultOptions);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
        }

        const data = await response.json();
        console.log(`✅ API Success: ${endpoint}`, data);
        return data;

      } catch (error) {
        lastError = error;
        console.warn(`⚠️ API attempt ${attempt} failed: ${endpoint}`, error.message);
        
        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }

    console.error(`❌ API Failed after ${this.retryAttempts} attempts: ${endpoint}`, lastError);
    throw lastError;
  }

  // Delay helper
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Autenticar extensão com token
  async authenticate(token, hotelId) {
    try {
      const response = await this.request(OSH_CONFIG.API_ENDPOINTS.AUTH, {
        method: 'POST',
        body: JSON.stringify({ token, hotelId, source: 'extension' })
      });

      if (response.success) {
        await OSHStorage.saveAuthToken(token);
        await OSHStorage.saveHotelId(hotelId);
        await OSHStorage.setSyncStatus(OSH_CONFIG.SYNC_STATUS.SUCCESS);
        return { success: true, data: response };
      }

      return { success: false, error: response.message || 'Authentication failed' };
      
    } catch (error) {
      await OSHStorage.setSyncStatus(OSH_CONFIG.SYNC_STATUS.ERROR);
      return { success: false, error: error.message };
    }
  }

  // Verificar status de conexão
  async checkStatus() {
    try {
      const response = await this.request(OSH_CONFIG.API_ENDPOINTS.STATUS);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Sincronizar dados extraídos
  async syncData(extractedData) {
    try {
      await OSHStorage.setSyncStatus(OSH_CONFIG.SYNC_STATUS.SYNCING);
      
      const hotelId = await OSHStorage.getHotelId();
      const payload = {
        hotelId,
        timestamp: new Date().toISOString(),
        source: 'booking-extranet',
        data: extractedData
      };

      const response = await this.request(OSH_CONFIG.API_ENDPOINTS.SYNC, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (response.success) {
        await OSHStorage.updateLastSync();
        await OSHStorage.setSyncStatus(OSH_CONFIG.SYNC_STATUS.SUCCESS);
        
        // Mostrar notificação de sucesso
        this.showNotification('success', `Dados sincronizados: ${extractedData.type}`);
        
        return { success: true, data: response };
      }

      await OSHStorage.setSyncStatus(OSH_CONFIG.SYNC_STATUS.ERROR);
      return { success: false, error: response.message };

    } catch (error) {
      await OSHStorage.setSyncStatus(OSH_CONFIG.SYNC_STATUS.ERROR);
      console.error('❌ Sync failed:', error);
      
      this.showNotification('error', `Erro na sincronização: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // Obter configuração do hotel
  async getHotelConfig() {
    try {
      const response = await this.request(OSH_CONFIG.API_ENDPOINTS.CONFIG);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Mostrar notificação
  showNotification(type, message) {
    try {
      chrome.notifications?.create({
        type: 'basic',
        iconUrl: 'icons/icon-48.png',
        title: 'OSH Booking Sync',
        message: message
      });
    } catch (error) {
      console.log('Notification not available:', error);
    }
  }

  // Atualizar badge da extensão
  updateBadge(text, color = '#4CAF50') {
    try {
      chrome.action?.setBadgeText({ text: text.toString() });
      chrome.action?.setBadgeBackgroundColor({ color });
    } catch (error) {
      console.log('Badge update not available:', error);
    }
  }

  // Verificar se está online
  async isOnline() {
    try {
      const response = await fetch(`${this.baseURL}/health`, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

// Instância global
window.OSHApiClient = new OSHApiClient();