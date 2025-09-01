import { createContext, useContext, useState, useEffect } from 'react';
import { API_CONFIG } from '../config/api';

const AppContext = createContext();

const DEFAULT_CONFIG = {
  logo: null,
  companyName: 'Sistema de Hotéis',
  appDescription: 'Plataforma completa para gestão hoteleira com inteligência artificial integrada. Gerencie reservas, atendimento ao cliente e operações de forma eficiente e moderna.',
  apiEndpoints: {
    listHotels: 'http://localhost:3001/api/hotels',
    createHotel: 'http://localhost:3001/api/hotels',
    getHotel: 'http://localhost:3001/api/hotels/:id', // GET /hotels/{id}
    updateHotel: 'http://localhost:3001/api/hotels/:id', // PUT /hotels/{id}
    deleteHotel: 'http://localhost:3001/api/hotels/:id' // DELETE /hotels/{id}
  },
  aiEndpoints: {
    createIntegration: 'https://osh-ia-n8n.d32pnk.easypanel.host/webhook/create_integration',
    getIntegrations: 'https://osh-ia-n8n.d32pnk.easypanel.host/webhook/get_integrations',
    updateIntegration: 'https://osh-ia-n8n.d32pnk.easypanel.host/webhook/update_integration', // PUT /integration/{id}
    deleteIntegration: 'https://osh-ia-n8n.d32pnk.easypanel.host/webhook/delete_integration', // DELETE /integration/{id}
    getAiStats: 'https://osh-ia-n8n.d32pnk.easypanel.host/webhook/get_ai_stats'
  },
  marketingEndpoints: {
    createMessage: 'https://osh-ia-n8n.d32pnk.easypanel.host/webhook/create_marketing_message',
    getMessages: 'https://osh-ia-n8n.d32pnk.easypanel.host/webhook/get_marketing_messages', // GET /marketing/messages/{hotel_uuid}
    updateMessage: 'https://osh-ia-n8n.d32pnk.easypanel.host/webhook/update_marketing_message', // PUT /marketing/messages/{id}
    deleteMessage: 'https://osh-ia-n8n.d32pnk.easypanel.host/webhook/delete_marketing_message' // DELETE /marketing/messages/{id}
  },
  botFieldsEndpoints: {
    getBotFields: 'https://osh-ia-n8n.d32pnk.easypanel.host/webhook/05e590dd-8185-424b-9658-d839ca38c481/lista_botfields_onenode_mysql/:hotel_uuid', // GET /bot-fields/{hotel_uuid}
    updateBotFields: 'https://osh-ia-n8n.d32pnk.easypanel.host/webhook/atualiza_botfields_no_onenode', // POST /bot-fields/update
    updateAllBotFields: 'https://osh-ia-n8n.d32pnk.easypanel.host/webhook/atualiza_botfields_no_onenode' // POST /bot-fields/update-all
  },
  knowledgeEndpoints: {
    getKnowledge: 'https://osh-ia-n8n.d32pnk.easypanel.host/webhook/66c91822-d03a-4250-8719-51f2a55d56a3/lista_cerebro_ia/:hotel_uuid', // GET /knowledge/{hotel_uuid}
    updateKnowledge: 'https://osh-ia-n8n.d32pnk.easypanel.host/webhook/alimenta_qdrant_unidades_base_conhecimento' // POST /knowledge/update
  },
  controlEndpoints: {
    saveEndpoints: 'https://osh-ia-n8n.d32pnk.easypanel.host/webhook/endpoints_create', // POST /endpoints/save
    listEndpoints: 'https://osh-ia-n8n.d32pnk.easypanel.host/webhook/lista_endpoints', // GET /endpoints/list
    getEndpoints: 'https://osh-ia-n8n.d32pnk.easypanel.host/webhook/get_endpoints', // GET /endpoints/{hotel_uuid}
    updateEndpoints: 'https://osh-ia-n8n.d32pnk.easypanel.host/webhook/update_endpoints' // PUT /endpoints/{hotel_uuid}
  },
  uploadConfig: {
    service: 'aws-s3', // 'aws-s3', 'imgbb', 'cloudinary', 'custom', 'base64'
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'application/pdf'],
    // AWS S3 config
    awsAccessKeyId: 'AKIA27ECEV5DUIEBSWMI',
    awsSecretAccessKey: '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',
    awsRegion: 'us-east-2',
    awsBucketName: 'hoteloshia',
    // ImgBB config (fallback para quando S3 não funcionar)
    // Para obter uma chave gratuita: https://api.imgbb.com/
    imgbbApiKey: '', // Adicione sua chave do ImgBB aqui
    // Cloudinary config
    cloudinaryCloudName: '',
    cloudinaryUploadPreset: '',
    // Custom endpoint
    customUploadEndpoint: ''
  }
};

export const AppProvider = ({ children }) => {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(false);
  const [integrations, setIntegrations] = useState([]);
  const [marketingMessages, setMarketingMessages] = useState([]);
  const [botFields, setBotFields] = useState([]);
  const [selectedHotelUuid, setSelectedHotelUuid] = useState('');
  const [aiStats, setAiStats] = useState({
    connectedHotels: 0,
    totalAttendances: 0,
    totalReservations: 0
  });

  useEffect(() => {
    const savedConfig = localStorage.getItem('appConfig');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig({ ...DEFAULT_CONFIG, ...parsed });
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    }

    // Carregar hotel selecionado do localStorage
    const savedSelectedHotel = localStorage.getItem('selectedHotelUuid');
    if (savedSelectedHotel) {
      setSelectedHotelUuid(savedSelectedHotel);
    }
  }, []);

  const updateConfig = (newConfig) => {
    console.log('🔧 AppContext: updateConfig chamado com:', newConfig);
    console.log('🔧 AppContext: config atual antes update:', config);
    const updatedConfig = { ...config, ...newConfig };
    console.log('🔧 AppContext: config após merge:', updatedConfig);
    setConfig(updatedConfig);
    localStorage.setItem('appConfig', JSON.stringify(updatedConfig));
    console.log('🔧 AppContext: salvo no localStorage:', JSON.parse(localStorage.getItem('appConfig')));
    
    // Forçar re-render dos componentes que dependem do config
    console.log('🔧 AppContext: setConfig executado, componentes devem re-renderizar');
  };

  const updateEndpoint = (type, url) => {
    console.log('updateEndpoint chamado:', type, url);
    const updatedEndpoints = { ...config.apiEndpoints, [type]: url };
    console.log('Endpoints atualizados:', updatedEndpoints);
    updateConfig({ apiEndpoints: updatedEndpoints });
  };

  const updateAiEndpoint = (type, url) => {
    console.log('updateAiEndpoint chamado:', type, url);
    const updatedEndpoints = { ...config.aiEndpoints, [type]: url };
    console.log('AI Endpoints atualizados:', updatedEndpoints);
    updateConfig({ aiEndpoints: updatedEndpoints });
  };

  const updateMarketingEndpoint = (type, url) => {
    console.log('updateMarketingEndpoint chamado:', type, url);
    const updatedEndpoints = { ...config.marketingEndpoints, [type]: url };
    console.log('Marketing Endpoints atualizados:', updatedEndpoints);
    updateConfig({ marketingEndpoints: updatedEndpoints });
  };

  const updateBotFieldsEndpoint = (type, url) => {
    console.log('updateBotFieldsEndpoint chamado:', type, url);
    const updatedEndpoints = { ...config.botFieldsEndpoints, [type]: url };
    console.log('Bot Fields Endpoints atualizados:', updatedEndpoints);
    updateConfig({ botFieldsEndpoints: updatedEndpoints });
  };

  const updateKnowledgeEndpoint = (type, url) => {
    console.log('updateKnowledgeEndpoint chamado:', type, url);
    const updatedEndpoints = { ...config.knowledgeEndpoints, [type]: url };
    console.log('Knowledge Endpoints atualizados:', updatedEndpoints);
    updateConfig({ knowledgeEndpoints: updatedEndpoints });
  };

  const updateControlEndpoint = (type, url) => {
    console.log('updateControlEndpoint chamado:', type, url);
    const updatedEndpoints = { ...config.controlEndpoints, [type]: url };
    console.log('Control Endpoints atualizados:', updatedEndpoints);
    updateConfig({ controlEndpoints: updatedEndpoints });
  };

  const selectHotel = (hotelUuid) => {
    console.log('Hotel selecionado:', hotelUuid);
    setSelectedHotelUuid(hotelUuid);
    
    // Persistir no localStorage
    if (hotelUuid) {
      localStorage.setItem('selectedHotelUuid', hotelUuid);
    } else {
      localStorage.removeItem('selectedHotelUuid');
    }

    // Limpar dados específicos do hotel anterior
    setIntegrations([]);
    setMarketingMessages([]);
    setBotFields([]);
  };

  // AI Integration Management Functions
  const createIntegration = async (integrationData) => {
    setLoading(true);
    try {
      const endpoint = config.aiEndpoints.createIntegration;
      if (!endpoint) {
        throw new Error('Endpoint de criação de integração não configurado');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(integrationData)
      });

      if (!response.ok) {
        throw new Error('Failed to create integration');
      }

      const newIntegration = await response.json();
      setIntegrations(prev => [...prev, newIntegration]);
      return newIntegration;
    } catch (error) {
      console.error('Error creating integration:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchIntegrations = async (hotelUuid) => {
    if (!hotelUuid) {
      throw new Error('UUID do hotel é obrigatório para buscar integrações');
    }

    setLoading(true);
    try {
      const endpoint = config.aiEndpoints.getIntegrations;
      if (!endpoint) {
        throw new Error('Endpoint de listagem de integrações não configurado');
      }

      // Substituir :id pelo UUID do hotel
      const url = endpoint.replace(':id', hotelUuid);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch integrations');
      }
      const data = await response.json();
      setIntegrations(Array.isArray(data) ? data : []);
      return data;
    } catch (error) {
      console.error('Error fetching integrations:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteIntegration = async (integrationId) => {
    setLoading(true);
    try {
      const endpoint = config.aiEndpoints.deleteIntegration;
      if (!endpoint) {
        throw new Error('Endpoint de exclusão de integração não configurado');
      }

      const url = endpoint.replace(':id', integrationId);
      const response = await fetch(url, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete integration');
      }

      setIntegrations(prev => prev.filter(integration => integration.id !== integrationId));
    } catch (error) {
      console.error('Error deleting integration:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchAiStats = async () => {
    setLoading(true);
    try {
      const endpoint = config.aiEndpoints.getAiStats;
      if (!endpoint) {
        throw new Error('Endpoint de estatísticas de IA não configurado');
      }

      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error('Failed to fetch AI stats');
      }
      const stats = await response.json();
      setAiStats(stats);
      return stats;
    } catch (error) {
      console.error('Error fetching AI stats:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchBotFields = async (hotelUuid) => {
    if (!hotelUuid) {
      throw new Error('UUID do hotel é obrigatório para buscar campos do bot');
    }

    setLoading(true);
    try {
      // Use the API_CONFIG directly since it's more reliable
      const endpoint = 'https://osh-ia-n8n.d32pnk.easypanel.host/webhook/05e590dd-8185-424b-9658-d839ca38c481/lista_botfields_onenode_mysql/:hotel_uuid';
      
      // Replace :hotel_uuid with the actual hotel UUID
      const url = endpoint.replace(':hotel_uuid', hotelUuid);
      
      console.log('Buscando campos do bot:', { hotelUuid, url });
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch bot fields');
      }
      const data = await response.json();
      console.log('Campos do bot recebidos:', data);
      setBotFields(Array.isArray(data) ? data : []);
      return data;
    } catch (error) {
      console.error('Error fetching bot fields:', error);
      setBotFields([]);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateBotFields = async (fieldData) => {
    setLoading(true);
    try {
      // Use the direct endpoint URL for updating bot fields
      const endpoint = 'https://osh-ia-n8n.d32pnk.easypanel.host/webhook/atualiza_botfields_no_onenode';
      
      console.log('Atualizando campos do bot:', { fieldData, endpoint });
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(fieldData)
      });

      console.log('Resposta da API (atualizar campos do bot):', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Campos do bot atualizados:', result);

      // Refresh bot fields if we have a selected hotel
      if (selectedHotelUuid) {
        fetchBotFields(selectedHotelUuid);
      }

      return result;
    } catch (error) {
      console.error('Error updating bot fields:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateAllBotFields = async (fieldsArray) => {
    setLoading(true);
    try {
      // Use the updateAllBotFields endpoint URL
      const endpoint = config.botFieldsEndpoints.updateAllBotFields;
      if (!endpoint) {
        throw new Error('Endpoint de atualização em lote de campos do bot não configurado');
      }
      
      console.log('Atualizando todos os campos do bot:', { fieldsArray, endpoint });
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(fieldsArray)
      });

      console.log('Resposta da API (atualizar todos os campos do bot):', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Todos os campos do bot atualizados:', result);

      // Refresh bot fields if we have a selected hotel
      if (selectedHotelUuid) {
        fetchBotFields(selectedHotelUuid);
      }

      return result;
    } catch (error) {
      console.error('Error updating all bot fields:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Knowledge Management Functions
  const fetchKnowledgeData = async (hotelUuid) => {
    setLoading(true);
    try {
      const endpoint = config.knowledgeEndpoints.getKnowledge;
      if (!endpoint) {
        throw new Error('Endpoint de conhecimento não configurado');
      }

      const url = endpoint.replace(':hotel_uuid', hotelUuid);
      console.log('Buscando conhecimento da IA:', { hotelUuid, url });
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('Resposta da API (conhecimento):', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Conhecimento carregado:', result);

      return result;
    } catch (error) {
      console.error('Error fetching knowledge data:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateKnowledgeData = async (hotelUuid, knowledgeText) => {
    setLoading(true);
    try {
      const endpoint = config.knowledgeEndpoints.updateKnowledge;
      if (!endpoint) {
        throw new Error('Endpoint de atualização de conhecimento não configurado');
      }

      // Este endpoint não usa :hotel_uuid na URL, o hotel_uuid vai no body
      console.log('🚀 Atualizando conhecimento da IA:', { 
        endpoint, 
        hotelUuid, 
        contentLength: knowledgeText?.length || 0 
      });
      
      const payload = {
        conteudo: knowledgeText,
        hotel_uuid: hotelUuid
      };

      console.log('📤 Payload enviado:', payload);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('📥 Resposta da API (atualizar conhecimento):', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Erro na resposta:', errorData);
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Conhecimento atualizado com sucesso:', result);

      return result;
    } catch (error) {
      console.error('❌ Error updating knowledge data:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Marketing Messages Management Functions
  const createMarketingMessage = async (messageData) => {
    setLoading(true);
    try {
      const endpoint = config.marketingEndpoints.createMessage;
      if (!endpoint) {
        throw new Error('Endpoint de criação de mensagem não configurado');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData)
      });

      if (!response.ok) {
        throw new Error('Failed to create marketing message');
      }

      const newMessage = await response.json();
      setMarketingMessages(prev => [...prev, newMessage]);
      return newMessage;
    } catch (error) {
      console.error('Error creating marketing message:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchMarketingMessages = async (hotelUuid) => {
    if (!hotelUuid) {
      throw new Error('UUID do hotel é obrigatório para buscar mensagens');
    }

    setLoading(true);
    try {
      const endpoint = config.marketingEndpoints.getMessages;
      if (!endpoint) {
        throw new Error('Endpoint de listagem de mensagens não configurado');
      }

      // Substituir :hotel_id pelo UUID do hotel
      const url = endpoint.replace(':hotel_id', hotelUuid);
      
      console.log('Buscando mensagens de marketing:', { hotelUuid, url });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ hotel_id: hotelUuid })
      });

      console.log('Resposta da API (listar):', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Mensagens recebidas:', data);
      setMarketingMessages(Array.isArray(data) ? data : []);
      return data;
    } catch (error) {
      console.error('Error fetching marketing messages:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateMarketingMessage = async (messageId, messageData) => {
    setLoading(true);
    try {
      const endpoint = config.marketingEndpoints.updateMessage;
      if (!endpoint) {
        throw new Error('Endpoint de atualização de mensagem não configurado');
      }

      const url = endpoint.replace(':id', messageId);
      
      console.log('Atualizando mensagem:', { messageId, url, messageData });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(messageData)
      });

      console.log('Resposta da API (atualizar):', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Mensagem atualizada:', result);

      // Atualizar a lista local com a mensagem atualizada
      setMarketingMessages(prev => 
        prev.map(message => 
          message.id === messageId ? { ...message, ...messageData } : message
        )
      );

      return result;
    } catch (error) {
      console.error('Error updating marketing message:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteMarketingMessage = async (messageId) => {
    setLoading(true);
    try {
      const endpoint = config.marketingEndpoints.deleteMessage;
      if (!endpoint) {
        throw new Error('Endpoint de exclusão de mensagem não configurado');
      }

      const url = endpoint.replace(':id', messageId);
      
      console.log('Excluindo mensagem:', { messageId, url });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ id: messageId })
      });

      console.log('Resposta da API (excluir):', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Mensagem excluída:', result);

      // Remover da lista local
      setMarketingMessages(prev => prev.filter(message => message.id !== messageId));
      
      return result;
    } catch (error) {
      console.error('Error deleting marketing message:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Control Endpoints Functions
  const saveAllEndpoints = async (hotelUuid) => {
    setLoading(true);
    try {
      const endpoint = config.controlEndpoints.saveEndpoints;
      if (!endpoint) {
        throw new Error('Endpoint de salvamento de endpoints não configurado');
      }

      // Preparar todos os endpoints em um payload estruturado
      const endpointsPayload = {
        hotel_uuid: hotelUuid || selectedHotelUuid,
        endpoints: {
          hotels: config.apiEndpoints,
          ai: config.aiEndpoints,
          marketing: config.marketingEndpoints,
          botFields: config.botFieldsEndpoints,
          knowledge: config.knowledgeEndpoints,
          control: config.controlEndpoints
        },
        timestamp: new Date().toISOString(),
        system_info: {
          app_name: config.companyName,
          version: '1.0.0'
        }
      };

      console.log('💾 Salvando todos os endpoints:', { endpoint, payload: endpointsPayload });
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(endpointsPayload)
      });

      console.log('📥 Resposta da API (salvar endpoints):', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Erro na resposta:', errorData);
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Endpoints salvos com sucesso:', result);

      return result;
    } catch (error) {
      console.error('❌ Error saving all endpoints:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loadAllEndpoints = async () => {
    setLoading(true);
    try {
      const endpoint = config.controlEndpoints.listEndpoints;
      if (!endpoint) {
        throw new Error('Endpoint de listagem de endpoints não configurado');
      }

      console.log('📥 Carregando endpoints da API:', endpoint);
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('📥 Resposta da API (listar endpoints):', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Erro na resposta:', errorData);
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }

      const endpointsData = await response.json();
      console.log('✅ Endpoints carregados:', endpointsData);

      // Aplicar os endpoints carregados aos respectivos campos
      // A API retorna um array de objetos com: { id, category, name, url }
      
      if (endpointsData.endpoints && Array.isArray(endpointsData.endpoints)) {
        const endpointsArray = endpointsData.endpoints;
        
        // Organizar endpoints por categoria
        const organizedEndpoints = {
          hotels: {},
          ai: {},
          marketing: {},
          botFields: {},
          knowledge: {},
          control: {}
        };
        
        // Mapear cada endpoint para sua categoria correspondente
        endpointsArray.forEach(endpoint => {
          const { category, name, url } = endpoint;
          
          if (organizedEndpoints[category]) {
            organizedEndpoints[category][name] = url;
          } else {
            console.warn(`⚠️ Categoria desconhecida: ${category}`, endpoint);
          }
        });
        
        console.log('📋 Endpoints organizados por categoria:', organizedEndpoints);
        
        // Atualizar configuração com os novos endpoints
        const newConfig = { ...config };
        
        if (Object.keys(organizedEndpoints.hotels).length > 0) {
          newConfig.apiEndpoints = { ...config.apiEndpoints, ...organizedEndpoints.hotels };
        }
        
        if (Object.keys(organizedEndpoints.ai).length > 0) {
          newConfig.aiEndpoints = { ...config.aiEndpoints, ...organizedEndpoints.ai };
        }
        
        if (Object.keys(organizedEndpoints.marketing).length > 0) {
          newConfig.marketingEndpoints = { ...config.marketingEndpoints, ...organizedEndpoints.marketing };
        }
        
        if (Object.keys(organizedEndpoints.botFields).length > 0) {
          newConfig.botFieldsEndpoints = { ...config.botFieldsEndpoints, ...organizedEndpoints.botFields };
        }
        
        if (Object.keys(organizedEndpoints.knowledge).length > 0) {
          newConfig.knowledgeEndpoints = { ...config.knowledgeEndpoints, ...organizedEndpoints.knowledge };
        }
        
        if (Object.keys(organizedEndpoints.control).length > 0) {
          newConfig.controlEndpoints = { ...config.controlEndpoints, ...organizedEndpoints.control };
        }

        // Atualizar a configuração completa
        updateConfig(newConfig);
        
        console.log('🔄 Endpoints aplicados à configuração:', newConfig);
        console.log('✅ Total de endpoints processados:', endpointsArray.length);
      } else {
        // Se a API retorna uma estrutura diferente, mapear conforme necessário
        console.log('⚠️ Estrutura de resposta não reconhecida. Dados recebidos:', endpointsData);
        console.log('ℹ️ Esperado: { endpoints: [{ id, category, name, url }] }');
      }

      return endpointsData;
    } catch (error) {
      console.error('❌ Error loading all endpoints:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    config,
    updateConfig,
    updateEndpoint,
    updateAiEndpoint,
    updateMarketingEndpoint,
    updateBotFieldsEndpoint,
    updateKnowledgeEndpoint,
    updateControlEndpoint,
    loading,
    setLoading,
    // Hotel selection
    selectedHotelUuid,
    selectHotel,
    // AI Integration functions and state
    integrations,
    aiStats,
    createIntegration,
    fetchIntegrations,
    deleteIntegration,
    fetchAiStats,
    setIntegrations,
    setAiStats,
    // Bot Fields functions and state
    botFields,
    fetchBotFields,
    updateBotFields,
    updateAllBotFields,
    setBotFields,
    // Knowledge functions
    fetchKnowledgeData,
    updateKnowledgeData,
    // Marketing Messages functions and state
    marketingMessages,
    createMarketingMessage,
    fetchMarketingMessages,
    updateMarketingMessage,
    deleteMarketingMessage,
    setMarketingMessages,
    // Control Endpoints functions
    saveAllEndpoints,
    loadAllEndpoints
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp deve ser usado dentro de AppProvider');
  }
  return context;
};

// Export context as default
export default AppContext;