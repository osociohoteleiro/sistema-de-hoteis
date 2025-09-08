// Controlador do popup da extensão
console.log('🎮 OSH Popup Controller loaded');

class PopupController {
  constructor() {
    this.currentTab = 'status';
    this.isLoading = false;
    this.statusCache = null;
    
    this.init();
  }

  async init() {
    console.log('🚀 Initializing popup controller');
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Load initial status
    await this.loadStatus();
    
    // Auto-refresh status every 10 seconds
    setInterval(() => this.loadStatus(), 10000);
  }

  setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.target.dataset.tab;
        this.switchTab(tab);
      });
    });

    // Configuration
    document.getElementById('saveConfig').addEventListener('click', () => {
      this.saveConfiguration();
    });

    // Sync controls
    document.getElementById('forceSyncBtn').addEventListener('click', () => {
      this.forceSync();
    });

    document.getElementById('testConnectionBtn').addEventListener('click', () => {
      this.testConnection();
    });

    // Settings
    document.getElementById('autoSyncToggle').addEventListener('change', (e) => {
      this.updateSetting('autoSync', e.target.checked);
    });

    document.getElementById('notificationsToggle').addEventListener('change', (e) => {
      this.updateSetting('notifications', e.target.checked);
    });

    document.getElementById('debugModeToggle').addEventListener('change', (e) => {
      this.updateSetting('debugMode', e.target.checked);
    });

    // Footer actions
    document.getElementById('clearDataBtn').addEventListener('click', () => {
      this.clearData();
    });

    document.getElementById('openPmsBtn').addEventListener('click', () => {
      this.openPMS();
    });
  }

  switchTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.tab === tab) {
        btn.classList.add('active');
      }
    });

    // Show/hide sections
    document.querySelectorAll('.section').forEach(section => {
      section.style.display = 'none';
    });

    switch (tab) {
      case 'status':
        if (this.statusCache?.isConfigured) {
          document.getElementById('statusSection').style.display = 'block';
        } else {
          document.getElementById('configSection').style.display = 'block';
        }
        break;
      case 'settings':
        document.getElementById('settingsSection').style.display = 'block';
        this.loadSettings();
        break;
      case 'help':
        document.getElementById('helpSection').style.display = 'block';
        break;
    }

    this.currentTab = tab;
  }

  async loadStatus() {
    try {
      const response = await this.sendMessage({ action: 'GET_STATUS' });
      
      if (response && response.success) {
        this.statusCache = response.data;
        this.updateStatusDisplay(response.data);
      } else {
        console.error('Failed to load status:', response);
        this.updateStatusDisplay({ isConfigured: false });
      }
    } catch (error) {
      console.error('Error loading status:', error);
      this.updateStatusDisplay({ isConfigured: false });
    }
  }

  updateStatusDisplay(status) {
    // Update status indicator
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');

    if (status.isConfigured) {
      if (status.apiOnline) {
        statusDot.className = 'status-dot';
        statusText.textContent = 'Online';
      } else {
        statusDot.className = 'status-dot warning';
        statusText.textContent = 'API Offline';
      }
    } else {
      statusDot.className = 'status-dot error';
      statusText.textContent = 'Não configurado';
    }

    // Update status section
    if (status.isConfigured) {
      document.getElementById('hotelIdDisplay').textContent = status.hotelId || '-';
      
      const lastSync = status.lastSync ? 
        new Date(status.lastSync).toLocaleString('pt-BR') : 'Nunca';
      document.getElementById('lastSyncDisplay').textContent = lastSync;
      
      const apiStatus = status.apiOnline ? '✅ Online' : '❌ Offline';
      document.getElementById('apiStatusDisplay').textContent = apiStatus;
      
      // Show status section if current tab is status
      if (this.currentTab === 'status') {
        document.getElementById('configSection').style.display = 'none';
        document.getElementById('statusSection').style.display = 'block';
      }
    } else {
      // Show config section if not configured
      if (this.currentTab === 'status') {
        document.getElementById('statusSection').style.display = 'none';
        document.getElementById('configSection').style.display = 'block';
      }
    }
  }

  async saveConfiguration() {
    const hotelId = document.getElementById('hotelId').value.trim();
    const authToken = document.getElementById('authToken').value.trim();

    if (!hotelId || !authToken) {
      this.showMessage('Por favor, preencha todos os campos', 'error');
      return;
    }

    this.setLoading(true);

    try {
      // Save to storage
      await chrome.storage.local.set({
        osh_hotel_id: hotelId,
        osh_auth_token: authToken
      });

      // Test connection
      const response = await fetch('http://localhost:3001/api/booking-extranet/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          hotelId,
          source: 'extension'
        })
      });

      if (response.ok) {
        this.showMessage('Configuração salva com sucesso!', 'success');
        await this.loadStatus();
        this.switchTab('status');
      } else {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

    } catch (error) {
      console.error('Config save error:', error);
      this.showMessage(`Erro: ${error.message}`, 'error');
    } finally {
      this.setLoading(false);
    }
  }

  async forceSync() {
    this.setLoading(true);

    try {
      // Get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url.includes('admin.booking.com')) {
        throw new Error('Abra uma página da extranet Booking.com');
      }

      // Send force sync message
      await chrome.tabs.sendMessage(tab.id, { action: 'FORCE_SYNC' });
      
      this.showMessage('Sincronização iniciada!', 'success');
      
      // Refresh status after 3 seconds
      setTimeout(() => this.loadStatus(), 3000);

    } catch (error) {
      console.error('Force sync error:', error);
      this.showMessage(`Erro: ${error.message}`, 'error');
    } finally {
      this.setLoading(false);
    }
  }

  async testConnection() {
    this.setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/booking-extranet/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        this.showMessage('Conexão OK!', 'success');
      } else {
        throw new Error(`HTTP ${response.status}`);
      }

    } catch (error) {
      console.error('Connection test error:', error);
      this.showMessage('API offline ou inacessível', 'error');
    } finally {
      this.setLoading(false);
    }
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.local.get('osh_user_config');
      const config = result.osh_user_config || {
        autoSync: true,
        notifications: true,
        debugMode: false
      };

      document.getElementById('autoSyncToggle').checked = config.autoSync;
      document.getElementById('notificationsToggle').checked = config.notifications;
      document.getElementById('debugModeToggle').checked = config.debugMode;

    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async updateSetting(key, value) {
    try {
      const result = await chrome.storage.local.get('osh_user_config');
      const config = result.osh_user_config || {};
      
      config[key] = value;
      
      await chrome.storage.local.set({ osh_user_config: config });
      
      console.log(`Setting updated: ${key} = ${value}`);

    } catch (error) {
      console.error('Error updating setting:', error);
    }
  }

  async clearData() {
    if (confirm('Limpar todos os dados da extensão? Esta ação não pode ser desfeita.')) {
      try {
        await chrome.storage.local.clear();
        this.showMessage('Dados limpos com sucesso!', 'success');
        await this.loadStatus();
        this.switchTab('status');
      } catch (error) {
        this.showMessage(`Erro: ${error.message}`, 'error');
      }
    }
  }

  openPMS() {
    chrome.tabs.create({ url: 'http://localhost:5175' });
  }

  setLoading(loading) {
    this.isLoading = loading;
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = loading ? 'flex' : 'none';
  }

  showMessage(message, type = 'info') {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      font-size: 14px;
      z-index: 10000;
      animation: slideInFromRight 0.3s ease;
    `;
    
    toast.textContent = message;
    document.body.appendChild(toast);

    // Remove after 4 seconds
    setTimeout(() => {
      toast.remove();
    }, 4000);

    // Add animation CSS if not exists
    if (!document.querySelector('#toast-animations')) {
      const style = document.createElement('style');
      style.id = 'toast-animations';
      style.textContent = `
        @keyframes slideInFromRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  sendMessage(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        resolve(response);
      });
    });
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.popupController = new PopupController();
});

console.log('✅ Popup controller loaded');