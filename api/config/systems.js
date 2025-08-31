// Configuração de sistemas PMS, Motor de Reservas e Channel Manager conhecidos
// Define os campos de autenticação necessários para cada sistema

const SYSTEM_CONFIGS = {
  // PMS (Property Management Systems)
  'Artaxnet': {
    type: 'pms',
    auth_type: 'oauth',
    required_fields: [
      { 
        name: 'client_id', 
        label: 'Client ID', 
        type: 'text',
        placeholder: 'Digite o Client ID fornecido pela Artaxnet',
        required: true
      },
      { 
        name: 'client_secret', 
        label: 'Client Secret', 
        type: 'password',
        placeholder: 'Digite o Client Secret',
        required: true
      }
    ],
    optional_fields: [
      {
        name: 'hotel_code',
        label: 'Código do Hotel',
        type: 'text',
        placeholder: 'Código do hotel no sistema (opcional)'
      }
    ]
  },
  
  'Omnibees': {
    type: 'pms',
    auth_type: 'api_key',
    default_endpoint: 'https://api.omnibees.com/v2',
    required_fields: [
      { 
        name: 'api_key', 
        label: 'API Key', 
        type: 'password',
        placeholder: 'Digite a API Key da Omnibees',
        required: true
      },
      {
        name: 'hotel_id',
        label: 'Hotel ID',
        type: 'text',
        placeholder: 'ID do hotel na Omnibees',
        required: true
      }
    ],
    optional_fields: []
  },

  'CM Net': {
    type: 'pms',
    auth_type: 'token',
    required_fields: [
      { 
        name: 'token', 
        label: 'Token de Acesso', 
        type: 'password',
        placeholder: 'Token de autenticação CM Net',
        required: true
      },
      { 
        name: 'hotel_code', 
        label: 'Código do Hotel', 
        type: 'text',
        placeholder: 'Código único do hotel',
        required: true
      }
    ],
    optional_fields: []
  },

  'Desbravador': {
    type: 'pms',
    auth_type: 'api_key',
    required_fields: [
      { 
        name: 'api_key', 
        label: 'Chave API', 
        type: 'password',
        placeholder: 'Chave de API Desbravador',
        required: true
      }
    ],
    optional_fields: [
      {
        name: 'property_id',
        label: 'ID da Propriedade',
        type: 'text',
        placeholder: 'Identificador da propriedade (opcional)'
      }
    ]
  },

  'Silbeck': {
    type: 'pms',
    auth_type: 'token',
    required_fields: [
      { 
        name: 'token', 
        label: 'Token de Acesso', 
        type: 'password',
        placeholder: 'Digite o Token fornecido pela Silbeck',
        required: true
      }
    ],
    optional_fields: [
      {
        name: 'hotel_code',
        label: 'Código do Hotel (Opcional)',
        type: 'text',
        placeholder: 'Código do hotel no Silbeck'
      }
    ]
  },

  // Motor de Reservas
  'Asksuite': {
    type: 'motor',
    auth_type: 'token',
    default_endpoint: 'https://api.asksuite.com/v1',
    required_fields: [
      { 
        name: 'access_token', 
        label: 'Token de Acesso', 
        type: 'password',
        placeholder: 'Token fornecido pela Asksuite',
        required: true
      },
      {
        name: 'company_id',
        label: 'ID da Empresa',
        type: 'text',
        placeholder: 'Identificador da empresa',
        required: true
      }
    ],
    optional_fields: []
  },

  'BookingEngine': {
    type: 'motor',
    auth_type: 'api_key',
    default_endpoint: 'https://api.bookingengine.com.br',
    required_fields: [
      { 
        name: 'api_key', 
        label: 'API Key', 
        type: 'password',
        placeholder: 'Chave de API',
        required: true
      },
      { 
        name: 'api_secret', 
        label: 'API Secret', 
        type: 'password',
        placeholder: 'Segredo da API',
        required: true
      }
    ],
    optional_fields: []
  },

  'DirectBooking': {
    type: 'motor',
    auth_type: 'oauth',
    default_endpoint: 'https://api.directbooking.com/v2',
    required_fields: [
      { 
        name: 'client_id', 
        label: 'Client ID', 
        type: 'text',
        placeholder: 'ID do cliente OAuth',
        required: true
      },
      { 
        name: 'client_secret', 
        label: 'Client Secret', 
        type: 'password',
        placeholder: 'Segredo do cliente OAuth',
        required: true
      }
    ],
    optional_fields: [
      {
        name: 'redirect_uri',
        label: 'URL de Redirecionamento',
        type: 'url',
        placeholder: 'URL para callback OAuth'
      }
    ]
  },

  // Channel Manager
  'ChannelManager Plus': {
    type: 'channel',
    auth_type: 'basic',
    default_endpoint: 'https://api.channelmanager.com.br',
    required_fields: [
      { 
        name: 'username', 
        label: 'Usuário', 
        type: 'text',
        placeholder: 'Nome de usuário',
        required: true
      },
      { 
        name: 'password', 
        label: 'Senha', 
        type: 'password',
        placeholder: 'Senha de acesso',
        required: true
      }
    ],
    optional_fields: []
  },

  'SiteMinder': {
    type: 'channel',
    auth_type: 'api_key',
    default_endpoint: 'https://api.siteminder.com/v1',
    required_fields: [
      { 
        name: 'api_key', 
        label: 'API Key', 
        type: 'password',
        placeholder: 'Chave de API SiteMinder',
        required: true
      },
      {
        name: 'property_key',
        label: 'Property Key',
        type: 'text',
        placeholder: 'Chave da propriedade',
        required: true
      }
    ],
    optional_fields: []
  },

  'RateTiger': {
    type: 'channel',
    auth_type: 'token',
    default_endpoint: 'https://api.ratetiger.com/api/v2',
    required_fields: [
      { 
        name: 'api_token', 
        label: 'API Token', 
        type: 'password',
        placeholder: 'Token de API RateTiger',
        required: true
      }
    ],
    optional_fields: [
      {
        name: 'channel_id',
        label: 'Channel ID',
        type: 'text',
        placeholder: 'ID do canal (opcional)'
      }
    ]
  },

  // Sistema personalizado/customizado
  'Outro': {
    type: 'custom',
    auth_type: 'custom',
    default_endpoint: '',
    required_fields: [],
    optional_fields: [],
    allow_custom_fields: true,
    custom_fields_template: [
      { 
        name: 'api_key', 
        label: 'API Key', 
        type: 'password',
        placeholder: 'Chave de API',
        required: false
      },
      { 
        name: 'token', 
        label: 'Token', 
        type: 'password',
        placeholder: 'Token de acesso',
        required: false
      },
      { 
        name: 'client_id', 
        label: 'Client ID', 
        type: 'text',
        placeholder: 'ID do cliente',
        required: false
      },
      { 
        name: 'client_secret', 
        label: 'Client Secret', 
        type: 'password',
        placeholder: 'Segredo do cliente',
        required: false
      }
    ]
  }
};

// Função auxiliar para obter configuração de um sistema
function getSystemConfig(systemName) {
  return SYSTEM_CONFIGS[systemName] || SYSTEM_CONFIGS['Outro'];
}

// Função para obter lista de sistemas por tipo
function getSystemsByType(type) {
  return Object.keys(SYSTEM_CONFIGS).filter(
    name => SYSTEM_CONFIGS[name].type === type || 
            (type === 'all' && SYSTEM_CONFIGS[name].type !== 'custom')
  );
}

// Função para validar credenciais baseado na configuração do sistema
function validateCredentials(systemName, credentials) {
  const config = getSystemConfig(systemName);
  const errors = [];
  
  // Validar campos obrigatórios
  if (config.required_fields) {
    config.required_fields.forEach(field => {
      if (!credentials[field.name] || credentials[field.name].trim() === '') {
        errors.push(`${field.label} é obrigatório`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Função para sanitizar credenciais (remover campos vazios opcionais)
function sanitizeCredentials(credentials) {
  const sanitized = {};
  
  Object.keys(credentials).forEach(key => {
    if (credentials[key] && credentials[key].toString().trim() !== '') {
      sanitized[key] = credentials[key];
    }
  });
  
  return sanitized;
}

module.exports = {
  SYSTEM_CONFIGS,
  getSystemConfig,
  getSystemsByType,
  validateCredentials,
  sanitizeCredentials
};