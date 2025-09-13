// Configuração de ambiente que detecta automaticamente produção vs desenvolvimento
// Esta abordagem funciona independente de variáveis de ambiente do build

const isProduction = window.location.hostname !== 'localhost';
const isEasyPanel = window.location.hostname.includes('easypanel.host');

// URLs baseadas no ambiente detectado
const ENVIRONMENT_CONFIG = {
  development: {
    API_BASE_URL: 'http://localhost:3001/api',
    SOCKET_URL: 'http://localhost:3001'
  },
  production: {
    API_BASE_URL: 'https://osh-sistemas-api-backend.d32pnk.easypanel.host/api',
    SOCKET_URL: 'https://osh-sistemas-api-backend.d32pnk.easypanel.host'
  }
};

// Detectar ambiente atual
const currentEnvironment = isProduction ? 'production' : 'development';
const config = ENVIRONMENT_CONFIG[currentEnvironment];


export const API_BASE_URL = config.API_BASE_URL;
export const SOCKET_URL = config.SOCKET_URL;

export default {
  API_BASE_URL,
  SOCKET_URL,
  isProduction,
  isEasyPanel,
  environment: currentEnvironment
};