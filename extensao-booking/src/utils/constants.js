// URLs e configurações globais da extensão
const OSH_CONFIG = {
  // URLs da API OSH
  API_BASE_URL: 'http://localhost:3001',  // Desenvolvimento
  API_ENDPOINTS: {
    AUTH: '/api/booking-extranet/auth',
    SYNC: '/api/booking-extranet/sync',
    STATUS: '/api/booking-extranet/status',
    CONFIG: '/api/booking-extranet/config'
  },

  // URLs da Booking.com
  BOOKING_URLS: {
    EXTRANET_BASE: 'https://admin.booking.com/hotel/hoteladmin/extranet_ng',
    HOME: '/manage/home.html',
    STATISTICS: '/manage/statistics/demand_data.html',
    RESERVATIONS: '/manage/reservations/reservations.html',
    RATES: '/manage/rates_availability/rates_calendar.html'
  },

  // Configurações de sincronização
  SYNC_CONFIG: {
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 2000, // 2 segundos
    SYNC_INTERVAL: 30000, // 30 segundos
    BATCH_SIZE: 10
  },

  // Chaves de storage
  STORAGE_KEYS: {
    AUTH_TOKEN: 'osh_auth_token',
    HOTEL_ID: 'osh_hotel_id',
    USER_CONFIG: 'osh_user_config',
    LAST_SYNC: 'osh_last_sync',
    SYNC_STATUS: 'osh_sync_status'
  },

  // Status de sincronização
  SYNC_STATUS: {
    IDLE: 'idle',
    SYNCING: 'syncing',
    SUCCESS: 'success',
    ERROR: 'error',
    OFFLINE: 'offline'
  },

  // Tipos de dados que podem ser extraídos
  DATA_TYPES: {
    DASHBOARD_METRICS: 'dashboard_metrics',
    DEMAND_DATA: 'demand_data',
    RESERVATIONS: 'reservations',
    RATES: 'rates'
  }
};

// Detectores de página
const PAGE_DETECTORS = [
  {
    type: OSH_CONFIG.DATA_TYPES.DASHBOARD_METRICS,
    pattern: /\/manage\/home\.html/,
    extractor: 'home-extractor'
  },
  {
    type: OSH_CONFIG.DATA_TYPES.DEMAND_DATA,
    pattern: /\/manage\/statistics\/demand_data\.html/,
    extractor: 'demand-extractor'
  }
];

// Seletores CSS para extração de dados
const DATA_SELECTORS = {
  dashboard: {
    totalBookings: '[data-testid="total-bookings"], .total-bookings',
    revenue: '[data-testid="revenue"], .revenue-amount',
    occupancyRate: '[data-testid="occupancy"], .occupancy-rate',
    avgDailyRate: '[data-testid="adr"], .adr-value'
  },
  statistics: {
    demandTable: '.demand-data-table, [data-testid="demand-table"]',
    competitorData: '.competitor-rates, [data-testid="competitor-rates"]',
    marketData: '.market-trends, [data-testid="market-trends"]'
  }
};

// Funções utilitárias globais
window.OSH_CONFIG = OSH_CONFIG;
window.PAGE_DETECTORS = PAGE_DETECTORS;
window.DATA_SELECTORS = DATA_SELECTORS;