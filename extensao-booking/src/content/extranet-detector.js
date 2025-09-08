// Detector principal de páginas da extranet
console.log('🔍 OSH Extranet Detector loaded on:', window.location.href);

class ExtranetDetector {
  constructor() {
    this.currentPage = null;
    this.extractors = new Map();
    this.syncQueue = [];
    this.isProcessing = false;
    
    this.init();
  }

  async init() {
    console.log('🚀 Initializing Extranet Detector');
    
    // Verificar se a extensão está configurada
    const isConfigured = await this.checkConfiguration();
    if (!isConfigured) {
      this.showConfigurationPrompt();
      return;
    }

    // Detectar página atual
    this.detectCurrentPage();
    
    // Configurar observador para mudanças na URL (SPA)
    this.setupNavigationObserver();
    
    // Configurar listeners para mensagens do service worker
    this.setupMessageListeners();
    
    // Iniciar extração inicial
    this.startInitialExtraction();
  }

  async checkConfiguration() {
    try {
      const result = await chrome.storage.local.get(['osh_auth_token', 'osh_hotel_id']);
      return !!(result.osh_auth_token && result.osh_hotel_id);
    } catch (error) {
      console.error('❌ Error checking configuration:', error);
      return false;
    }
  }

  showConfigurationPrompt() {
    const banner = document.createElement('div');
    banner.id = 'osh-config-banner';
    banner.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #2196F3;
        color: white;
        padding: 12px;
        text-align: center;
        z-index: 999999;
        font-family: Arial, sans-serif;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      ">
        <strong>🏨 OSH Booking Sync:</strong> 
        Clique no ícone da extensão para configurar a sincronização com o PMS
        <button onclick="document.getElementById('osh-config-banner').remove()" 
          style="margin-left: 15px; background: white; color: #2196F3; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer;">
          ✕
        </button>
      </div>
    `;
    document.body.appendChild(banner);
    
    // Remove banner após 10 segundos
    setTimeout(() => {
      const banner = document.getElementById('osh-config-banner');
      if (banner) banner.remove();
    }, 10000);
  }

  detectCurrentPage() {
    const url = window.location.href;
    console.log('🔍 Detecting page:', url);

    // Encontrar detector correspondente
    for (const detector of PAGE_DETECTORS) {
      if (detector.pattern.test(url)) {
        this.currentPage = detector;
        console.log(`✅ Page detected: ${detector.type}`);
        break;
      }
    }

    if (!this.currentPage) {
      console.log('ℹ️ Page not monitored:', url);
    }
  }

  setupNavigationObserver() {
    // Observer para mudanças na URL (SPA navigation)
    let currentUrl = window.location.href;
    
    const observer = new MutationObserver(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        console.log('🧭 Navigation detected:', currentUrl);
        
        // Re-detectar página
        this.detectCurrentPage();
        
        // Aguardar carregamento da nova página
        setTimeout(() => this.startInitialExtraction(), 2000);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Também escutar eventos de popstate (back/forward)
    window.addEventListener('popstate', () => {
      setTimeout(() => {
        this.detectCurrentPage();
        this.startInitialExtraction();
      }, 1000);
    });
  }

  setupMessageListeners() {
    // Listener para mensagens do service worker
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log('📨 Content script received message:', request);

      switch (request.action) {
        case 'FORCE_SYNC':
          this.forceSync();
          sendResponse({ success: true });
          break;

        case 'AUTO_SYNC':
          this.autoSync();
          sendResponse({ success: true });
          break;

        default:
          console.warn('⚠️ Unknown message action:', request.action);
      }
    });
  }

  async startInitialExtraction() {
    if (!this.currentPage) return;

    console.log(`🚀 Starting extraction for: ${this.currentPage.type}`);
    
    // Aguardar página carregar completamente
    if (document.readyState !== 'complete') {
      window.addEventListener('load', () => this.extractCurrentPageData());
    } else {
      // Aguardar um pouco mais para AJAX requests
      setTimeout(() => this.extractCurrentPageData(), 3000);
    }
  }

  async extractCurrentPageData() {
    if (!this.currentPage || this.isProcessing) return;

    this.isProcessing = true;
    
    try {
      console.log(`📊 Extracting data from: ${this.currentPage.type}`);

      let extractedData = null;

      switch (this.currentPage.type) {
        case OSH_CONFIG.DATA_TYPES.DASHBOARD_METRICS:
          extractedData = await this.extractDashboardData();
          break;

        case OSH_CONFIG.DATA_TYPES.DEMAND_DATA:
          extractedData = await this.extractDemandData();
          break;

        default:
          console.warn('⚠️ No extractor for:', this.currentPage.type);
          return;
      }

      if (extractedData && Object.keys(extractedData.metrics || {}).length > 0) {
        await this.syncData(extractedData);
        this.showSyncIndicator('success');
      } else {
        console.log('ℹ️ No data extracted');
        this.showSyncIndicator('warning', 'Nenhum dado encontrado');
      }

    } catch (error) {
      console.error('❌ Extraction failed:', error);
      this.showSyncIndicator('error', error.message);
    } finally {
      this.isProcessing = false;
    }
  }

  async extractDashboardData() {
    console.log('📊 Extracting dashboard data...');
    
    const metrics = {};
    
    // Tentar diferentes seletores para métricas comuns
    const selectors = {
      reservations: [
        '[data-testid*="reservation"], [data-testid*="booking"]',
        '.total-bookings, .reservations-count',
        'h2:contains("Reservas"), h3:contains("Bookings")',
        '.metric-value, .kpi-value'
      ],
      revenue: [
        '[data-testid*="revenue"], [data-testid*="income"]',
        '.revenue-amount, .income-total',
        'span:contains("€"), span:contains("R$")',
        '.currency-value'
      ],
      occupancy: [
        '[data-testid*="occupancy"], [data-testid*="occ"]',
        '.occupancy-rate, .occ-rate',
        'span:contains("%")'
      ]
    };

    // Extrair métricas
    for (const [key, selectorList] of Object.entries(selectors)) {
      for (const selector of selectorList) {
        try {
          const element = document.querySelector(selector);
          if (element && element.textContent.trim()) {
            metrics[key] = this.cleanExtractedValue(element.textContent);
            console.log(`✅ Found ${key}:`, metrics[key]);
            break;
          }
        } catch (error) {
          // Ignorer seletores inválidos
        }
      }
    }

    // Tentar extrair de tabelas
    const tables = document.querySelectorAll('table, .data-table, .metrics-table');
    for (const table of tables) {
      const tableData = this.extractTableData(table);
      Object.assign(metrics, tableData);
    }

    return {
      type: OSH_CONFIG.DATA_TYPES.DASHBOARD_METRICS,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      metrics: metrics,
      raw: {
        pageTitle: document.title,
        bodyText: document.body.innerText.substring(0, 1000)
      }
    };
  }

  async extractDemandData() {
    console.log('📈 Extracting demand data...');
    
    const metrics = {};
    
    // Procurar por tabelas de dados
    const tables = document.querySelectorAll('table, .demand-table, .statistics-table');
    
    for (const table of tables) {
      const tableData = this.extractTableData(table);
      Object.assign(metrics, tableData);
    }

    // Procurar por gráficos ou dados de chart
    const chartElements = document.querySelectorAll('[data-chart], .chart, canvas');
    if (chartElements.length > 0) {
      metrics.hasCharts = true;
      metrics.chartCount = chartElements.length;
    }

    return {
      type: OSH_CONFIG.DATA_TYPES.DEMAND_DATA,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      metrics: metrics
    };
  }

  extractTableData(table) {
    const data = {};
    const rows = table.querySelectorAll('tr');
    
    for (const row of rows) {
      const cells = row.querySelectorAll('td, th');
      if (cells.length >= 2) {
        const key = this.cleanExtractedValue(cells[0].textContent);
        const value = this.cleanExtractedValue(cells[1].textContent);
        
        if (key && value && key.length < 100) {
          data[key] = value;
        }
      }
    }
    
    return data;
  }

  cleanExtractedValue(text) {
    return text.trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s€$R%.,:-]/g, '')
      .substring(0, 200);
  }

  async syncData(extractedData) {
    console.log('🔄 Syncing data:', extractedData);

    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'SYNC_DATA',
        data: extractedData
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('❌ Runtime error:', chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (response && response.success) {
          console.log('✅ Sync successful:', response);
          resolve(response);
        } else {
          console.error('❌ Sync failed:', response);
          reject(new Error(response?.error || 'Sync failed'));
        }
      });
    });
  }

  showSyncIndicator(type, message = '') {
    // Remover indicador anterior
    const existing = document.getElementById('osh-sync-indicator');
    if (existing) existing.remove();

    const colors = {
      success: '#4CAF50',
      warning: '#FF9800',
      error: '#f44336'
    };

    const icons = {
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };

    const texts = {
      success: 'Sincronizado com PMS OSH',
      warning: message || 'Dados parciais sincronizados',
      error: message || 'Erro na sincronização'
    };

    const indicator = document.createElement('div');
    indicator.id = 'osh-sync-indicator';
    indicator.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 10px 15px;
        border-radius: 25px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 999999;
        font-family: Arial, sans-serif;
        font-size: 14px;
        animation: slideIn 0.3s ease;
      ">
        ${icons[type]} ${texts[type]}
      </div>
      <style>
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      </style>
    `;
    
    document.body.appendChild(indicator);
    
    // Remover após 4 segundos
    setTimeout(() => {
      if (document.getElementById('osh-sync-indicator')) {
        document.getElementById('osh-sync-indicator').remove();
      }
    }, 4000);
  }

  async forceSync() {
    console.log('🔄 Force sync requested');
    await this.extractCurrentPageData();
  }

  async autoSync() {
    // Só fazer sync automático se houver dados novos
    console.log('⏰ Auto sync triggered');
    await this.extractCurrentPageData();
  }
}

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.oshDetector = new ExtranetDetector();
  });
} else {
  window.oshDetector = new ExtranetDetector();
}

console.log('✅ Extranet Detector loaded');