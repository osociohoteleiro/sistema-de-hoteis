// Detecção automática de ambiente baseada no hostname
const isProduction = window.location.hostname !== 'localhost';
const isEasyPanel = window.location.hostname.includes('easypanel.host');

// URLs baseadas no ambiente detectado
const ENVIRONMENT_CONFIG = {
  development: {
    API_BASE_URL: 'http://localhost:3001',
    API_URL_WITH_PATH: 'http://localhost:3001/api'
  },
  production: {
    API_BASE_URL: 'https://osh-sistemas-api-backend.d32pnk.easypanel.host',
    API_URL_WITH_PATH: 'https://osh-sistemas-api-backend.d32pnk.easypanel.host/api'
  }
};

// Detectar ambiente atual
const currentEnvironment = isProduction ? 'production' : 'development';
const config = ENVIRONMENT_CONFIG[currentEnvironment];

console.log('🌍 Hotel-App Environment detected:', {
  hostname: window.location.hostname,
  isProduction,
  isEasyPanel,
  environment: currentEnvironment,
  config
});

export const API_CONFIG = {
  baseURL: config.API_BASE_URL,
  baseURLWithPath: config.API_URL_WITH_PATH,
  WEBHOOK_URL: 'https://osh-ia-n8n.d32pnk.easypanel.host/webhook/cadastra_hotel',
  AI_ENDPOINTS: {
    CREATE_INTEGRATION: 'https://osh-ia-n8n.d32pnk.easypanel.host/webhook/create_integration',
    GET_INTEGRATIONS: 'https://osh-ia-n8n.d32pnk.easypanel.host/webhook/get_integrations',
    UPDATE_INTEGRATION: 'https://osh-ia-n8n.d32pnk.easypanel.host/webhook/update_integration',
    DELETE_INTEGRATION: 'https://osh-ia-n8n.d32pnk.easypanel.host/webhook/delete_integration',
    GET_AI_STATS: 'https://osh-ia-n8n.d32pnk.easypanel.host/webhook/get_ai_stats',
    GET_BOT_FIELDS: 'https://osh-ia-n8n.d32pnk.easypanel.host/webhook/05e590dd-8185-424b-9658-d839ca38c481/lista_botfields_onenode/:hotel_uuid',
    UPDATE_BOT_FIELDS: 'https://osh-ia-n8n.d32pnk.easypanel.host/webhook/atualiza_botfields_no_onenode'
  }
};