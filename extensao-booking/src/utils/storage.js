// Gerenciador de storage da extensão Chrome
class OSHStorage {
  
  // Salvar dados no storage da extensão
  static async set(key, value) {
    try {
      const data = { [key]: value };
      await chrome.storage.local.set(data);
      console.log(`✅ Storage saved: ${key}`, value);
      return true;
    } catch (error) {
      console.error(`❌ Storage save error for ${key}:`, error);
      return false;
    }
  }

  // Recuperar dados do storage
  static async get(key) {
    try {
      const result = await chrome.storage.local.get(key);
      return result[key] || null;
    } catch (error) {
      console.error(`❌ Storage get error for ${key}:`, error);
      return null;
    }
  }

  // Recuperar múltiplas chaves
  static async getMultiple(keys) {
    try {
      const result = await chrome.storage.local.get(keys);
      return result;
    } catch (error) {
      console.error('❌ Storage getMultiple error:', error);
      return {};
    }
  }

  // Remover item do storage
  static async remove(key) {
    try {
      await chrome.storage.local.remove(key);
      console.log(`🗑️ Storage removed: ${key}`);
      return true;
    } catch (error) {
      console.error(`❌ Storage remove error for ${key}:`, error);
      return false;
    }
  }

  // Limpar todo o storage
  static async clear() {
    try {
      await chrome.storage.local.clear();
      console.log('🧹 Storage cleared');
      return true;
    } catch (error) {
      console.error('❌ Storage clear error:', error);
      return false;
    }
  }

  // Métodos específicos para dados OSH
  static async saveAuthToken(token) {
    return await this.set(OSH_CONFIG.STORAGE_KEYS.AUTH_TOKEN, token);
  }

  static async getAuthToken() {
    return await this.get(OSH_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
  }

  static async saveHotelId(hotelId) {
    return await this.set(OSH_CONFIG.STORAGE_KEYS.HOTEL_ID, hotelId);
  }

  static async getHotelId() {
    return await this.get(OSH_CONFIG.STORAGE_KEYS.HOTEL_ID);
  }

  static async saveUserConfig(config) {
    return await this.set(OSH_CONFIG.STORAGE_KEYS.USER_CONFIG, config);
  }

  static async getUserConfig() {
    const defaultConfig = {
      autoSync: true,
      syncInterval: 30000,
      notifications: true,
      debugMode: false
    };
    
    const config = await this.get(OSH_CONFIG.STORAGE_KEYS.USER_CONFIG);
    return config ? { ...defaultConfig, ...config } : defaultConfig;
  }

  static async updateLastSync() {
    const timestamp = new Date().toISOString();
    return await this.set(OSH_CONFIG.STORAGE_KEYS.LAST_SYNC, timestamp);
  }

  static async getLastSync() {
    const timestamp = await this.get(OSH_CONFIG.STORAGE_KEYS.LAST_SYNC);
    return timestamp ? new Date(timestamp) : null;
  }

  static async setSyncStatus(status) {
    return await this.set(OSH_CONFIG.STORAGE_KEYS.SYNC_STATUS, status);
  }

  static async getSyncStatus() {
    return await this.get(OSH_CONFIG.STORAGE_KEYS.SYNC_STATUS) || OSH_CONFIG.SYNC_STATUS.IDLE;
  }

  // Verificar se a extensão está configurada
  static async isConfigured() {
    const token = await this.getAuthToken();
    const hotelId = await this.getHotelId();
    return !!(token && hotelId);
  }

  // Obter informações de status completo
  static async getStatusInfo() {
    const [token, hotelId, lastSync, syncStatus, config] = await Promise.all([
      this.getAuthToken(),
      this.getHotelId(),
      this.getLastSync(),
      this.getSyncStatus(),
      this.getUserConfig()
    ]);

    return {
      isConfigured: !!(token && hotelId),
      hasToken: !!token,
      hotelId,
      lastSync,
      syncStatus,
      config
    };
  }
}

// Disponibilizar globalmente
window.OSHStorage = OSHStorage;