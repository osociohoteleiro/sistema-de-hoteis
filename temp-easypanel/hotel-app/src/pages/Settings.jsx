import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import ImageUpload from '../components/ImageUpload';
import LogoHistorySelector from '../components/LogoHistorySelector';
import toast from 'react-hot-toast';

const Settings = () => {
  const { config, updateConfig, updateEndpoint, updateAiEndpoint, updateMarketingEndpoint, updateBotFieldsEndpoint, updateKnowledgeEndpoint, updateControlEndpoint, saveAllEndpoints, loadAllEndpoints, selectedHotelUuid } = useApp();
  const [activeTab, setActiveTab] = useState('general');
  const [logoInput, setLogoInput] = useState(config.logo || '');
  const [companyNameInput, setCompanyNameInput] = useState(config.companyName || '');
  // Estados iniciais com estrutura básica - serão preenchidos pela API
  const [endpoints, setEndpoints] = useState({
    listHotels: '',
    createHotel: '',
    getHotel: '',
    updateHotel: '',
    deleteHotel: ''
  });
  const [aiEndpoints, setAiEndpoints] = useState({
    createIntegration: '',
    getIntegrations: '',
    updateIntegration: '',
    deleteIntegration: '',
    getAiStats: ''
  });
  const [marketingEndpoints, setMarketingEndpoints] = useState({
    createMessage: '',
    getMessages: '',
    updateMessage: '',
    deleteMessage: ''
  });
  const [botFieldsEndpoints, setBotFieldsEndpoints] = useState({
    getBotFields: '',
    updateBotFields: '',
    updateAllBotFields: ''
  });
  const [knowledgeEndpoints, setKnowledgeEndpoints] = useState({
    getKnowledge: '',
    updateKnowledge: ''
  });
  const [controlEndpoints, setControlEndpoints] = useState({
    saveEndpoints: '',
    listEndpoints: '',
    getEndpoints: '',
    updateEndpoints: ''
  });
  const [configEndpoints, setConfigEndpoints] = useState({
    getConfigurations: '',
    updateConfigurations: '',
    saveConfigurations: '',
    resetConfigurations: ''
  });
  const [uploadSettings, setUploadSettings] = useState(config.uploadConfig || {});
  const [expandedSections, setExpandedSections] = useState({
    hotels: false,
    aiIntegrations: false,
    marketingMessages: false,
    botFields: false,
    knowledge: false,
    control: false,
    config: false
  });
  const [endpointsLoading, setEndpointsLoading] = useState(true);
  const [apiEndpointsEmpty, setApiEndpointsEmpty] = useState(false);

  const tabs = [
    { id: 'general', name: 'Geral', icon: '🏢' },
    { id: 'api', name: 'API Endpoints', icon: '🔗' },
    { id: 'upload', name: 'Upload de Imagens', icon: '📷' },
    { id: 'appearance', name: 'Aparência', icon: '🎨' }
  ];

  // Estados inicializados vazios - serão preenchidos apenas pela API
  // REMOVIDO: Sincronização automática com localStorage que causava o problema

  // Função para carregar endpoints da API
  const loadEndpointsFromAPI = async () => {
    try {
      console.log('🚀 Carregando endpoints da API...');
      
      // Usar endpoint da API (do config ou padrão)
      const listEndpointsUrl = config.controlEndpoints?.listEndpoints || 
                              'https://osh-ia-n8n.d32pnk.easypanel.host/webhook/lista_endpoints';
      
      console.log('🔗 URL da API:', listEndpointsUrl);
      setEndpointsLoading(true);
      setApiEndpointsEmpty(false);
      
      // Fazer chamada direta para a API para debuggar
      const response = await fetch(listEndpointsUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('📡 Status da resposta:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const rawData = await response.json();
      console.log('📦 Dados RAW da API:', JSON.stringify(rawData, null, 2));
      console.log('📋 Tipo dos dados:', typeof rawData);
      console.log('📋 É array?:', Array.isArray(rawData));
      
      if (rawData.endpoints) {
        console.log('📋 rawData.endpoints:', JSON.stringify(rawData.endpoints, null, 2));
        console.log('📋 rawData.endpoints é array?:', Array.isArray(rawData.endpoints));
        console.log('📋 Quantidade de endpoints:', rawData.endpoints.length);
      }
      
      // Também chamar a função do contexto para comparar
      const result = await loadAllEndpoints();
      console.log('🔄 Resultado do contexto:', JSON.stringify(result, null, 2));
      
      // Processar a resposta
      let endpointsArray = [];
      
      // A API retorna um array que contém um objeto com propriedade "endpoints"
      if (Array.isArray(rawData) && rawData.length > 0 && rawData[0].endpoints) {
        endpointsArray = rawData[0].endpoints;
        console.log('✅ Estrutura detectada: array[0].endpoints');
      } else if (rawData && rawData.endpoints && Array.isArray(rawData.endpoints)) {
        endpointsArray = rawData.endpoints;
        console.log('✅ Estrutura detectada: object.endpoints');
      } else if (Array.isArray(rawData)) {
        endpointsArray = rawData;
        console.log('✅ Estrutura detectada: array direto');
      }
      
      console.log('📋 Array de endpoints processado:', endpointsArray);
      
      if (endpointsArray.length > 0) {
        console.log('✅ API retornou endpoints, preenchendo campos...');
        
        // Organizar endpoints por categoria
        const organizedEndpoints = {
          hotels: {},
          ai: {},
          marketing: {},
          botFields: {},
          knowledge: {},
          control: {},
          config: {}
        };
        
        endpointsArray.forEach(endpoint => {
          console.log('🔍 Processando endpoint:', endpoint);
          const { category, name, url } = endpoint;
          
          if (organizedEndpoints[category]) {
            organizedEndpoints[category][name] = url || '';
            console.log(`✅ Mapeado: ${category}.${name} = ${url}`);
          } else {
            console.warn(`⚠️ Categoria desconhecida: ${category}`, endpoint);
          }
        });
        
        console.log('📋 Endpoints organizados:', organizedEndpoints);
        
        // Preencher estados locais com dados da API
        setEndpoints(prev => ({ ...prev, ...organizedEndpoints.hotels }));
        setAiEndpoints(prev => ({ ...prev, ...organizedEndpoints.ai }));
        setMarketingEndpoints(prev => ({ ...prev, ...organizedEndpoints.marketing }));
        setBotFieldsEndpoints(prev => ({ ...prev, ...organizedEndpoints.botFields }));
        setKnowledgeEndpoints(prev => ({ ...prev, ...organizedEndpoints.knowledge }));
        setControlEndpoints(prev => ({ ...prev, ...organizedEndpoints.control }));
        setConfigEndpoints(prev => ({ ...prev, ...organizedEndpoints.config }));
        
        console.log('✅ Estados locais atualizados com dados da API');
        setApiEndpointsEmpty(false);
      } else {
        console.log('ℹ️ API não retornou endpoints ou retornou vazia');
        setApiEndpointsEmpty(true);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar endpoints da API:', error.message);
      console.log('ℹ️ Campos ficam vazios - não usa localStorage como fallback');
      setApiEndpointsEmpty(true);
    } finally {
      setEndpointsLoading(false);
    }
  };

  // Carregar endpoints quando a aba API for ativada ou quando componente monta
  useEffect(() => {
    if (activeTab === 'api') {
      console.log('📂 Aba API ativada, carregando endpoints...');
      loadEndpointsFromAPI();
    }
  }, [activeTab]);

  // SEMPRE carregar endpoints na inicialização (independente da aba)
  useEffect(() => {
    console.log('🚀 Inicialização: Carregando endpoints da API...');
    loadEndpointsFromAPI();
  }, []); // Executa apenas uma vez na montagem

  // Função para carregar configurações da API quando necessário
  const loadConfigurationsFromAPI = async () => {
    try {
      console.log('🚀 Verificando se precisa carregar configurações da API...');
      
      // Verificar se já temos logo e nome da aplicação no storage
      const hasLogoInStorage = config.logo && config.logo.trim() !== '';
      const hasCompanyNameInStorage = config.companyName && config.companyName.trim() !== '' && config.companyName !== 'Sistema de Hotéis';
      
      console.log('📊 Status do storage:', {
        logo: hasLogoInStorage ? 'presente' : 'ausente',
        companyName: hasCompanyNameInStorage ? 'presente' : 'ausente'
      });
      
      // Se já temos as duas informações no storage, não precisamos buscar da API
      if (hasLogoInStorage && hasCompanyNameInStorage) {
        console.log('✅ Configurações já presentes no storage, não é necessário buscar da API');
        // Aplicar as configurações do storage aos campos
        setLogoInput(config.logo);
        setCompanyNameInput(config.companyName);
        return;
      }
      
      // Buscar endpoint salvo na seção de configurações
      const getConfigUrl = configEndpoints.getConfigurations;
      
      if (!getConfigUrl || !getConfigUrl.trim()) {
        console.log('⚠️ Endpoint "Buscar Configurações" não está configurado na seção Endpoints de Configurações');
        toast.error('Configure o endpoint "Buscar Configurações" na aba API Endpoints');
        return;
      }
      
      console.log('🔗 Usando endpoint salvo:', getConfigUrl);
      
      // Substituir :hotel_uuid se necessário
      let apiUrl = getConfigUrl;
      if (getConfigUrl.includes(':hotel_uuid')) {
        if (selectedHotelUuid) {
          apiUrl = getConfigUrl.replace(':hotel_uuid', selectedHotelUuid);
        } else {
          console.log('⚠️ Endpoint requer hotel_uuid mas nenhum hotel foi selecionado');
          toast.error('Selecione um hotel para carregar as configurações');
          return;
        }
      }
      
      console.log('📡 Fazendo requisição para:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('📡 Status da resposta:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`API retornou erro ${response.status}: ${response.statusText}`);
      }

      const configData = await response.json();
      console.log('📦 Dados recebidos da API:', configData);
      
      // Processar configurações no formato [{ config_name, config_value }]
      if (Array.isArray(configData) && configData.length > 0) {
        const configs = {};
        configData.forEach(item => {
          if (item.config_name && item.config_value !== undefined) {
            configs[item.config_name] = item.config_value;
          }
        });
        
        console.log('📋 Configurações processadas:', configs);
        
        // Aplicar apenas as configurações que não estão no storage
        const configUpdate = {};
        let updatedCount = 0;
        
        if (!hasLogoInStorage && configs.logo_patch) {
          console.log('🖼️ Aplicando logo da API (não encontrado no storage):', configs.logo_patch);
          setLogoInput(configs.logo_patch);
          configUpdate.logo = configs.logo_patch;
          updatedCount++;
        }
        
        if (!hasCompanyNameInStorage && configs.app_name) {
          console.log('🏢 Aplicando nome da aplicação da API (não encontrado no storage):', configs.app_name);
          setCompanyNameInput(configs.app_name);
          configUpdate.companyName = configs.app_name;
          updatedCount++;
        }
        
        // Atualizar configuração global apenas se necessário
        if (Object.keys(configUpdate).length > 0) {
          updateConfig(configUpdate);
          console.log('✅ Configurações aplicadas ao estado global:', configUpdate);
          toast.success(`${updatedCount} configuração(ões) carregada(s) da API!`);
        } else {
          console.log('ℹ️ Nenhuma configuração nova aplicada (já existem no storage)');
        }
      } else {
        console.log('ℹ️ API não retornou configurações no formato esperado');
        toast.error('API não retornou configurações no formato esperado');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar configurações da API:', error.message);
      toast.error(`Erro ao carregar configurações: ${error.message}`);
    }
  };

  // Carregar configurações automaticamente quando endpoints estiverem disponíveis
  useEffect(() => {
    // Aguardar que os endpoints sejam carregados primeiro
    if (configEndpoints.getConfigurations && !endpointsLoading) {
      console.log('📂 Endpoints de configuração carregados, verificando se precisa buscar da API...');
      // Pequeno delay para garantir que tudo está carregado
      setTimeout(() => {
        loadConfigurationsFromAPI();
      }, 1000);
    }
  }, [configEndpoints.getConfigurations, endpointsLoading, config.logo, config.companyName]);

  // Carregar configurações também quando a aba geral for ativada (para uso manual)
  useEffect(() => {
    if (activeTab === 'general' && configEndpoints.getConfigurations && !endpointsLoading) {
      console.log('📂 Aba Geral ativada, verificando configurações...');
      loadConfigurationsFromAPI();
    }
  }, [activeTab]);

  const handleSaveGeneral = async () => {
    const configData = {
      logo: logoInput.trim() || null,
      companyName: companyNameInput.trim() || 'Sistema de Hotéis'
    };

    // Salvar localmente primeiro
    updateConfig(configData);

    // Tentar enviar para API se endpoint estiver configurado
    try {
      if (configEndpoints.saveConfigurations && configEndpoints.saveConfigurations.trim()) {
        console.log('📤 Enviando configurações gerais para API:', configData);
        
        const apiPayload = {
          hotel_uuid: selectedHotelUuid || null,
          configurations: {
            logo: configData.logo,
            company_name: configData.companyName,
            upload_config: config.uploadConfig,
            system_config: {
              app_description: config.appDescription
            }
          },
          timestamp: new Date().toISOString(),
          system_info: {
            app_name: configData.companyName,
            version: '1.0.0'
          }
        };

        const response = await fetch(configEndpoints.saveConfigurations, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(apiPayload)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Configurações gerais enviadas para API com sucesso:', result);
        toast.success('Configurações gerais salvas localmente e enviadas para API!');
      } else {
        console.log('ℹ️ Endpoint de salvamento de configurações não configurado. Salvo apenas localmente.');
        toast.success('Configurações gerais salvas localmente!');
      }
    } catch (error) {
      console.error('❌ Erro ao enviar configurações para API:', error);
      toast.success('Configurações gerais salvas localmente!');
      toast.error(`Aviso: Não foi possível enviar para API - ${error.message}`);
    }
  };

  // Funções para Endpoints de Hotéis
  const handleEndpointChange = (type, value) => {
    setEndpoints(prev => ({ ...prev, [type]: value }));
  };

  const handleTestEndpoint = async (type) => {
    const endpoint = endpoints[type];
    if (!endpoint) {
      toast.error('Endpoint não configurado!');
      return;
    }
    toast.info('Funcionalidade de teste será implementada em breve');
  };

  const handleSaveEndpoint = async (type) => {
    const url = endpoints[type] ? endpoints[type].trim() : '';

    try {
      // Preparar dados apenas deste endpoint específico
      const singleEndpointData = {
        hotels: { [type]: url }  // Enviar apenas este endpoint específico
      };

      // Enviar para a mesma API que "Salvar Todos"
      await saveEndpointsToAPI(singleEndpointData);
      
      // Também salvar no localStorage
      updateEndpoint(type, url);
      
      console.log(`✅ Endpoint ${type} salvo individualmente na API:`, url);
      toast.success(`Endpoint ${getEndpointLabel(type)} salvo com sucesso!`);
      
      // Recarregar endpoints da API para manter sincronização
      await loadEndpointsFromAPI();
    } catch (error) {
      console.error('❌ Erro ao salvar endpoint:', error);
      toast.error(`Erro ao salvar endpoint: ${error.message}`);
    }
  };

  // Funções auxiliares para labels e métodos
  const getEndpointLabel = (type) => {
    const labels = {
      listHotels: 'Listar Hotéis',
      createHotel: 'Criar Hotel',
      getHotel: 'Buscar Hotel',
      updateHotel: 'Atualizar Hotel',
      deleteHotel: 'Deletar Hotel'
    };
    return labels[type] || type;
  };

  const getEndpointMethod = (type) => {
    const methods = {
      listHotels: 'GET',
      createHotel: 'POST',
      getHotel: 'GET',
      updateHotel: 'PUT',
      deleteHotel: 'DELETE'
    };
    return methods[type] || 'GET';
  };

  // Lidar com seleção de logotipo do histórico
  const handleLogoSelect = async (logoUrl) => {
    console.log('🔄 Settings: Logotipo selecionado do histórico:', logoUrl);
    
    setLogoInput(logoUrl);
    
    // Atualizar contexto para aplicar imediatamente na interface
    const configData = {
      logo: logoUrl,
      companyName: companyNameInput.trim() || 'Sistema de Hotéis'
    };

    updateConfig(configData);
    
    // Notificar usuário
    toast.success('Logotipo atualizado com sucesso!');
  };

  const getEndpointDescription = (type) => {
    const descriptions = {
      listHotels: 'Endpoint para listar todos os hotéis',
      createHotel: 'Endpoint para criar um novo hotel',
      getHotel: 'Endpoint para buscar um hotel específico',
      updateHotel: 'Endpoint para atualizar dados de um hotel',
      deleteHotel: 'Endpoint para deletar um hotel'
    };
    return descriptions[type] || 'Endpoint da API';
  };

  const handleLogoChange = async (imageUrl) => {
    console.log('📷 Settings: Recebendo nova URL do logo:', imageUrl);
    console.log('📷 Settings: Tipo da URL:', typeof imageUrl);
    console.log('📷 Settings: URL completa:', imageUrl);
    
    setLogoInput(imageUrl);
    
    // Salvar automaticamente após upload bem-sucedido
    if (imageUrl && imageUrl !== '') {
      console.log('💾 Settings: Salvando logo automaticamente...');
      console.log('💾 Settings: Estado antes do update:', { 
        logoInput: logoInput, 
        companyNameInput: companyNameInput 
      });
      
      const configData = {
        logo: imageUrl,
        companyName: companyNameInput.trim() || 'Sistema de Hotéis'
      };

      // Salvar localmente primeiro
      updateConfig(configData);
      
      console.log('✅ Settings: updateConfig chamado com:', configData);
      
      // Tentar enviar para API se endpoint estiver configurado
      try {
        if (configEndpoints.saveConfigurations && configEndpoints.saveConfigurations.trim()) {
          console.log('📤 Enviando logo para API automaticamente:', configData);
          
          const apiPayload = {
            hotel_uuid: selectedHotelUuid || null,
            configurations: {
              logo: configData.logo,
              company_name: configData.companyName,
              upload_config: config.uploadConfig,
              system_config: {
                app_description: config.appDescription
              }
            },
            timestamp: new Date().toISOString(),
            system_info: {
              app_name: configData.companyName,
              version: '1.0.0'
            }
          };

          const response = await fetch(configEndpoints.saveConfigurations, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(apiPayload)
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
          }

          const result = await response.json();
          console.log('✅ Logo enviado para API com sucesso:', result);
          toast.success('Logo atualizado e enviado para API!');
        } else {
          console.log('ℹ️ Endpoint de salvamento de configurações não configurado. Logo salvo apenas localmente.');
          toast.success('Logo atualizado com sucesso!');
        }
      } catch (error) {
        console.error('❌ Erro ao enviar logo para API:', error);
        toast.success('Logo atualizado localmente!');
        toast.error(`Aviso: Não foi possível enviar para API - ${error.message}`);
      }
    }
  };

  const handleUploadSettingChange = (key, value) => {
    setUploadSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveUploadSettings = () => {
    updateConfig({ uploadConfig: uploadSettings });
    toast.success('Configurações de upload salvas com sucesso!');
  };

  // REMOVIDAS: Funções antigas que chamavam saveAllEndpoints() causando o problema

  const handleAiEndpointChange = (type, value) => {
    setAiEndpoints(prev => ({ ...prev, [type]: value }));
  };

  const handleSaveAiEndpoint = async (type) => {
    const url = aiEndpoints[type] ? aiEndpoints[type].trim() : '';

    try {
      // Preparar dados apenas deste endpoint específico de IA
      const singleEndpointData = {
        ai: { [type]: url }  // Enviar apenas este endpoint específico
      };

      // Enviar para a mesma API que "Salvar Todos"
      await saveEndpointsToAPI(singleEndpointData);
      
      // Também salvar no localStorage
      updateAiEndpoint(type, url);
      
      console.log(`✅ Endpoint de IA ${type} salvo individualmente na API:`, url);
      toast.success(`Endpoint de ${getAiEndpointLabel(type)} salvo com sucesso!`);
      
      // Recarregar endpoints da API para manter sincronização
      await loadEndpointsFromAPI();
    } catch (error) {
      console.error('❌ Erro ao salvar endpoint de IA:', error);
      toast.error(`Erro ao salvar endpoint de IA: ${error.message}`);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Funções antigas removidas para evitar duplicação

  const handleTestAiEndpoint = async (type) => {
    const url = aiEndpoints[type].trim();
    if (!url) {
      toast.error('URL do endpoint de IA não pode estar vazia');
      return;
    }

    // Verificar se é endpoint externo (N8N)
    if (url.includes('osh-ia-n8n.d32pnk.easypanel.host')) {
      toast('⚙️ Endpoint N8N de IA salvo. Para verificar se está funcionando, teste a funcionalidade de integrações.', { 
        duration: 4000,
        icon: '⚙️'
      });
      return;
    }

    try {
      let testUrl = url;
      
      // Para endpoints que usam :id, substituir por um valor de teste
      if (url.includes(':id')) {
        testUrl = url.replace(':id', 'test-integration-123');
        toast('Testando com ID de exemplo: test-integration-123', { duration: 2000 });
      }

      console.log('Testando endpoint de IA:', testUrl);

      const response = await fetch(testUrl, {
        method: type === 'createIntegration' ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json' },
        ...(type === 'createIntegration' && { 
          body: JSON.stringify({ test: true, integration_name: 'Teste IA' }) 
        })
      });
      
      console.log('Resposta:', response.status, response.statusText);
      
      if (response.ok) {
        toast.success(`Endpoint de IA respondeu com sucesso! Status: ${response.status}`);
      } else if (response.status === 404) {
        toast.success('Endpoint de IA encontrado (404 é normal para ID de teste)');
      } else {
        toast.error(`Endpoint de IA retornou status ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Erro no teste de IA:', error);
      if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
        toast.error('❌ Erro CORS: O servidor não permite testes do browser. Configure CORS no servidor ou teste diretamente na aplicação.');
      } else {
        toast.error(`Erro ao testar endpoint de IA: ${error.message}`);
      }
    }
  };


  const getAiEndpointLabel = (type) => {
    const labels = {
      createIntegration: 'Criar Integração',
      getIntegrations: 'Listar Integrações',
      updateIntegration: 'Atualizar Integração',
      deleteIntegration: 'Excluir Integração',
      getAiStats: 'Estatísticas de IA'
    };
    return labels[type] || type;
  };

  const getAiEndpointMethod = (type) => {
    const methods = {
      createIntegration: 'POST',
      getIntegrations: 'GET',
      updateIntegration: 'PUT',
      deleteIntegration: 'DELETE',
      getAiStats: 'GET'
    };
    return methods[type] || 'GET';
  };

  const getAiEndpointDescription = (type) => {
    const descriptions = {
      createIntegration: 'Endpoint para cadastrar novas integrações de IA no sistema',
      getIntegrations: 'Endpoint para buscar integrações de um hotel específico. Use :id onde será substituído pelo hotel_uuid (ex: /webhook/uuid_hotel/lista_integracoes/:id)',
      updateIntegration: 'Endpoint para atualizar integração. Use :id onde será substituído pelo integration_id (ex: /webhook/abc/:id)',
      deleteIntegration: 'Endpoint para excluir integração. Use :id onde será substituído pelo integration_id (ex: /webhook/abc/:id)',
      getAiStats: 'Endpoint para buscar estatísticas de performance da IA (hotéis conectados, atendimentos, reservas)'
    };
    return descriptions[type] || '';
  };

  const getMarketingEndpointLabel = (type) => {
    const labels = {
      createMessage: 'Criar Mensagem',
      getMessages: 'Listar Mensagens',
      updateMessage: 'Atualizar Mensagem',
      deleteMessage: 'Excluir Mensagem'
    };
    return labels[type] || type;
  };

  const getMarketingEndpointMethod = (type) => {
    const methods = {
      createMessage: 'POST',
      getMessages: 'POST',
      updateMessage: 'POST',
      deleteMessage: 'DELETE'
    };
    return methods[type] || 'GET';
  };

  const getMarketingEndpointDescription = (type) => {
    const descriptions = {
      createMessage: 'Endpoint para cadastrar novas mensagens de marketing no sistema',
      getMessages: 'Endpoint POST para buscar mensagens de um hotel específico. Use :hotel_id onde será substituído pelo hotel_uuid (ex: /webhook/lista_mensagens_marketing/:hotel_id)',
      updateMessage: 'Endpoint POST para atualizar mensagem. Use :id onde será substituído pelo message_id (ex: /webhook/atualiza_mensagem_marketing/:id)',
      deleteMessage: 'Endpoint para excluir mensagem. Use :id onde será substituído pelo message_id (ex: /webhook/marketing/:id)'
    };
    return descriptions[type] || '';
  };

  const handleTestMarketingEndpoint = async (type) => {
    const endpoint = marketingEndpoints[type];
    if (!endpoint) {
      alert('Endpoint não configurado!');
      return;
    }

    try {
      const response = await fetch(endpoint.replace(':id', 'test-id'), {
        method: getMarketingEndpointMethod(type),
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        alert('Endpoint testado com sucesso!');
      } else {
        alert(`Erro ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      alert(`Erro na conexão: ${error.message}`);
    }
  };

  const handleSaveMarketingEndpoint = async (type) => {
    const url = marketingEndpoints[type] ? marketingEndpoints[type].trim() : '';

    try {
      // Preparar dados apenas deste endpoint específico de marketing
      const singleEndpointData = {
        marketing: { [type]: url }  // Enviar apenas este endpoint específico
      };

      // Enviar para a mesma API que "Salvar Todos"
      await saveEndpointsToAPI(singleEndpointData);
      
      // Também salvar no localStorage
      updateMarketingEndpoint(type, url);
      
      console.log(`✅ Endpoint de Marketing ${type} salvo individualmente na API:`, url);
      toast.success(`Endpoint de ${getMarketingEndpointLabel(type)} salvo com sucesso!`);
      
      // Recarregar endpoints da API para manter sincronização
      await loadEndpointsFromAPI();
    } catch (error) {
      console.error('❌ Erro ao salvar endpoint de Marketing:', error);
      toast.error(`Erro ao salvar endpoint de Marketing: ${error.message}`);
    }
  };

  // Bot Fields Endpoint Management Functions
  const handleBotFieldsEndpointChange = (type, value) => {
    setBotFieldsEndpoints(prev => ({ ...prev, [type]: value }));
  };

  const handleSaveBotFieldsEndpoint = async (type) => {
    const url = botFieldsEndpoints[type] ? botFieldsEndpoints[type].trim() : '';

    try {
      // Preparar dados apenas deste endpoint específico de bot fields
      const singleEndpointData = {
        botFields: { [type]: url }  // Enviar apenas este endpoint específico
      };

      // Enviar para a mesma API que "Salvar Todos"
      await saveEndpointsToAPI(singleEndpointData);
      
      // Também salvar no localStorage
      updateBotFieldsEndpoint(type, url);
      
      console.log(`✅ Endpoint de Bot Fields ${type} salvo individualmente na API:`, url);
      toast.success(`Endpoint de ${getBotFieldsEndpointLabel(type)} salvo com sucesso!`);
      
      // Recarregar endpoints da API para manter sincronização
      await loadEndpointsFromAPI();
    } catch (error) {
      console.error('❌ Erro ao salvar endpoint de Bot Fields:', error);
      toast.error(`Erro ao salvar endpoint de Bot Fields: ${error.message}`);
    }
  };

  const handleTestBotFieldsEndpoint = async (type) => {
    const url = botFieldsEndpoints[type].trim();
    if (!url) {
      toast.error('URL do endpoint de campos do bot não pode estar vazia');
      return;
    }

    // Verificar se é endpoint externo (N8N)
    if (url.includes('osh-ia-n8n.d32pnk.easypanel.host')) {
      toast('⚙️ Endpoint N8N de Campos do Bot salvo. Para verificar se está funcionando, teste a funcionalidade de campos do bot.', { 
        duration: 4000,
        icon: '⚙️'
      });
      return;
    }

    try {
      let testUrl = url;
      let requestOptions = {
        method: getBotFieldsEndpointMethod(type),
        headers: { 'Content-Type': 'application/json' }
      };
      
      // Para endpoints que usam :hotel_uuid, substituir por um valor de teste
      if (url.includes(':hotel_uuid')) {
        testUrl = url.replace(':hotel_uuid', 'test-hotel-uuid-123');
        toast('Testando com Hotel UUID de exemplo: test-hotel-uuid-123', { duration: 2000 });
      }

      // Para endpoints POST, adicionar dados de teste
      if (type === 'updateBotFields') {
        requestOptions.body = JSON.stringify({
          test: true,
          id: 'test-field-id',
          name: 'Test Field',
          value: 'Valor de teste',
          description: 'Descrição de teste',
          hotel_uuid: 'test-hotel-uuid-123'
        });
        toast('Testando com dados de exemplo (valor e descrição)', { duration: 2000 });
      }

      console.log('Testando endpoint de campos do bot:', testUrl);

      const response = await fetch(testUrl, requestOptions);
      
      console.log('Resposta:', response.status, response.statusText);
      
      if (response.ok) {
        toast.success(`Endpoint de campos do bot respondeu com sucesso! Status: ${response.status}`);
      } else if (response.status === 404) {
        toast.success('Endpoint de campos do bot encontrado (404 é normal para UUID de teste)');
      } else {
        toast.error(`Endpoint de campos do bot retornou status ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Erro no teste de campos do bot:', error);
      if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
        toast.error('❌ Erro CORS: O servidor não permite testes do browser. Configure CORS no servidor ou teste diretamente na aplicação.');
      } else {
        toast.error(`Erro ao testar endpoint de campos do bot: ${error.message}`);
      }
    }
  };

  const handleKnowledgeEndpointChange = (type, value) => {
    setKnowledgeEndpoints(prev => ({ ...prev, [type]: value }));
  };

  const handleSaveKnowledgeEndpoint = async (type) => {
    const url = knowledgeEndpoints[type] ? knowledgeEndpoints[type].trim() : '';

    try {
      // Preparar dados apenas deste endpoint específico de knowledge
      const singleEndpointData = {
        knowledge: { [type]: url }  // Enviar apenas este endpoint específico
      };

      // Enviar para a mesma API que "Salvar Todos"
      await saveEndpointsToAPI(singleEndpointData);
      
      // Também salvar no localStorage
      updateKnowledgeEndpoint(type, url);
      
      console.log(`✅ Endpoint de Knowledge ${type} salvo individualmente na API:`, url);
      toast.success(`Endpoint de ${getKnowledgeEndpointLabel(type)} salvo com sucesso!`);
      
      // Recarregar endpoints da API para manter sincronização
      await loadEndpointsFromAPI();
    } catch (error) {
      console.error('❌ Erro ao salvar endpoint de Knowledge:', error);
      toast.error(`Erro ao salvar endpoint de Knowledge: ${error.message}`);
    }
  };

  const handleTestKnowledgeEndpoint = async (type) => {
    const url = knowledgeEndpoints[type].trim();
    if (!url) {
      toast.error('URL do endpoint de conhecimento não pode estar vazia');
      return;
    }

    // Verificar se é endpoint externo (N8N)
    if (url.includes('osh-ia-n8n.d32pnk.easypanel.host')) {
      toast('⚙️ Endpoint N8N de Conhecimento salvo. Para verificar se está funcionando, teste a funcionalidade de conhecimento da IA.', { 
        duration: 6000,
        icon: '✅'
      });
      return;
    }

    try {
      const testUrl = url.replace(':hotel_uuid', 'test-uuid-123');
      console.log('Testando endpoint de conhecimento:', testUrl);
      
      const response = await fetch(testUrl, {
        method: getKnowledgeEndpointMethod(type),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Resposta:', response.status, response.statusText);
      
      if (response.ok) {
        toast.success(`Endpoint de conhecimento respondeu com sucesso! Status: ${response.status}`);
      } else if (response.status === 404) {
        toast.success('Endpoint de conhecimento encontrado (404 é normal para UUID de teste)');
      } else {
        toast.error(`Endpoint de conhecimento retornou status ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Erro no teste de conhecimento:', error);
      if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
        toast.error('❌ Erro CORS: O servidor não permite testes do browser. Configure CORS no servidor ou teste diretamente na aplicação.');
      } else {
        toast.error(`Erro ao testar endpoint de conhecimento: ${error.message}`);
      }
    }
  };

  const getBotFieldsEndpointLabel = (type) => {
    const labels = {
      getBotFields: 'Listar Campos do Bot',
      updateBotFields: 'Atualizar Campos do Bot',
      updateAllBotFields: 'Atualizar Todos os Campos do Bot'
    };
    return labels[type] || type;
  };

  const getBotFieldsEndpointMethod = (type) => {
    const methods = {
      getBotFields: 'GET',
      updateBotFields: 'POST',
      updateAllBotFields: 'POST'
    };
    return methods[type] || 'GET';
  };

  const getBotFieldsEndpointDescription = (type) => {
    const descriptions = {
      getBotFields: 'Endpoint para buscar campos do bot de um hotel específico. Use :hotel_uuid onde será substituído pelo hotel_uuid (ex: /webhook/lista_campos_bot/:hotel_uuid)',
      updateBotFields: 'Endpoint POST para atualizar campos do bot. Permite atualizar apenas o VALOR e DESCRIÇÃO dos campos. Outros campos são somente leitura.',
      updateAllBotFields: 'Endpoint POST para atualizar TODOS os campos do bot em lote. Recebe um array de campos no body da requisição.'
    };
    return descriptions[type] || '';
  };

  const getKnowledgeEndpointLabel = (type) => {
    const labels = {
      getKnowledge: 'Listar Conhecimento IA',
      updateKnowledge: 'Atualizar Conhecimento IA'
    };
    return labels[type] || type;
  };

  const getKnowledgeEndpointMethod = (type) => {
    const methods = {
      getKnowledge: 'GET',
      updateKnowledge: 'POST'
    };
    return methods[type] || 'GET';
  };

  const getKnowledgeEndpointDescription = (type) => {
    const descriptions = {
      getKnowledge: 'Endpoint para buscar conhecimento da IA de um hotel específico. Use :hotel_uuid onde será substituído pelo hotel_uuid (ex: /webhook/lista_cerebro_ia/:hotel_uuid)',
      updateKnowledge: 'Endpoint POST para atualizar conhecimento da IA. Envia {conteudo: texto, hotel_uuid: uuid} no body da requisição.'
    };
    return descriptions[type] || '';
  };

  // Control Endpoints Management Functions
  const handleControlEndpointChange = (type, value) => {
    setControlEndpoints(prev => ({ ...prev, [type]: value }));
  };

  const handleSaveControlEndpoint = async (type) => {
    const url = controlEndpoints[type] ? controlEndpoints[type].trim() : '';

    try {
      // Preparar dados apenas deste endpoint específico de control
      const singleEndpointData = {
        control: { [type]: url }  // Enviar apenas este endpoint específico
      };

      // Enviar para a mesma API que "Salvar Todos"
      await saveEndpointsToAPI(singleEndpointData);
      
      // Também salvar no localStorage
      updateControlEndpoint(type, url);
      
      console.log(`✅ Endpoint de Control ${type} salvo individualmente na API:`, url);
      toast.success(`Endpoint de ${getControlEndpointLabel(type)} salvo com sucesso!`);
      
      // Recarregar endpoints da API para manter sincronização
      await loadEndpointsFromAPI();
    } catch (error) {
      console.error('❌ Erro ao salvar endpoint de Control:', error);
      toast.error(`Erro ao salvar endpoint de Control: ${error.message}`);
    }
  };

  // Função que envia endpoints atuais dos inputs (não do localStorage) para a API
  const saveEndpointsToAPI = async (endpointsData) => {
    try {
      // Usar endpoint de salvamento do config ou padrão
      const saveEndpointsUrl = config.controlEndpoints?.saveEndpoints || 
                              controlEndpoints.saveEndpoints ||
                              'https://osh-ia-n8n.d32pnk.easypanel.host/webhook/endpoints_create';
      
      if (!saveEndpointsUrl) {
        throw new Error('Endpoint de salvamento não configurado');
      }

      const payload = {
        hotel_uuid: selectedHotelUuid || null,
        endpoints: endpointsData,
        timestamp: new Date().toISOString(),
        system_info: {
          app_name: config.companyName,
          version: '1.0.0'
        }
      };

      console.log('💾 Enviando endpoints para API:', { endpoint: saveEndpointsUrl, payload });

      const response = await fetch(saveEndpointsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Endpoints salvos na API:', result);
      return result;
    } catch (error) {
      console.error('❌ Erro ao salvar endpoints na API:', error);
      throw error;
    }
  };

  const handleSaveAllEndpoints = async () => {
    try {
      // Preparar todos os endpoints dos inputs atuais (incluindo campos vazios)
      const allEndpointsFromInputs = {
        hotels: endpoints,
        ai: aiEndpoints,
        marketing: marketingEndpoints,
        botFields: botFieldsEndpoints,
        knowledge: knowledgeEndpoints,
        control: controlEndpoints,
        config: configEndpoints
      };

      await saveEndpointsToAPI(allEndpointsFromInputs);
      toast.success('Todos os endpoints foram salvos na API com sucesso!');
      console.log('✅ Todos os endpoints foram salvos com sucesso!');
      
      // Recarregar endpoints da API para manter sincronização
      await loadEndpointsFromAPI();
    } catch (error) {
      console.error('❌ Erro ao salvar todos os endpoints:', error.message);
      toast.error(`Erro ao salvar endpoints: ${error.message}`);
    }
  };

  const handleLoadAllEndpoints = async () => {
    try {
      const result = await loadAllEndpoints();
      console.log('✅ Todos os endpoints foram carregados e aplicados com sucesso!');
      console.log('🔄 Inputs serão atualizados automaticamente pelo useEffect');
      
      // Mostrar quantos endpoints foram processados
      if (result && result.endpoints && Array.isArray(result.endpoints)) {
        console.log(`📊 Total de ${result.endpoints.length} endpoints carregados da API`);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar endpoints:', error.message);
    }
  };

  const getControlEndpointLabel = (type) => {
    const labels = {
      saveEndpoints: 'Salvar Todos os Endpoints',
      listEndpoints: 'Listar Todos os Endpoints',
      getEndpoints: 'Buscar Endpoints',
      updateEndpoints: 'Atualizar Endpoints'
    };
    return labels[type] || type;
  };

  const getControlEndpointMethod = (type) => {
    const methods = {
      saveEndpoints: 'POST',
      listEndpoints: 'GET',
      getEndpoints: 'GET',
      updateEndpoints: 'PUT'
    };
    return methods[type] || 'GET';
  };

  const getControlEndpointDescription = (type) => {
    const descriptions = {
      saveEndpoints: 'Endpoint principal para salvar todos os endpoints configurados no sistema. Envia todos os endpoints em um payload estruturado.',
      listEndpoints: 'Endpoint para listar todos os endpoints salvos. Retorna todos os endpoints que podem ser aplicados automaticamente aos campos.',
      getEndpoints: 'Endpoint para buscar endpoints salvos de um hotel específico. Use :hotel_uuid onde será substituído pelo hotel_uuid',
      updateEndpoints: 'Endpoint para atualizar endpoints salvos. Use :hotel_uuid onde será substituído pelo hotel_uuid'
    };
    return descriptions[type] || '';
  };

  // Configuration Endpoints Management Functions
  const handleConfigEndpointChange = (type, value) => {
    setConfigEndpoints(prev => ({ ...prev, [type]: value }));
  };

  const handleSaveConfigEndpoint = async (type) => {
    const url = configEndpoints[type] ? configEndpoints[type].trim() : '';

    try {
      // Preparar dados apenas deste endpoint específico de configuração
      const singleEndpointData = {
        config: { [type]: url }  // Enviar apenas este endpoint específico
      };

      // Enviar para a mesma API que "Salvar Todos"
      await saveEndpointsToAPI(singleEndpointData);
      
      console.log(`✅ Endpoint de Configuração ${type} salvo individualmente na API:`, url);
      toast.success(`Endpoint de ${getConfigEndpointLabel(type)} salvo com sucesso!`);
      
      // Recarregar endpoints da API para manter sincronização
      await loadEndpointsFromAPI();
    } catch (error) {
      console.error('❌ Erro ao salvar endpoint de Configuração:', error);
      toast.error(`Erro ao salvar endpoint de Configuração: ${error.message}`);
    }
  };

  const handleTestConfigEndpoint = async (type) => {
    const url = configEndpoints[type].trim();
    if (!url) {
      toast.error('URL do endpoint de configuração não pode estar vazia');
      return;
    }

    // Verificar se é endpoint externo (N8N)
    if (url.includes('osh-ia-n8n.d32pnk.easypanel.host')) {
      toast('⚙️ Endpoint N8N de Configurações salvo. Para verificar se está funcionando, teste a funcionalidade de configurações.', { 
        duration: 4000,
        icon: '⚙️'
      });
      return;
    }

    try {
      let testUrl = url;
      let requestOptions = {
        method: getConfigEndpointMethod(type),
        headers: { 'Content-Type': 'application/json' }
      };
      
      // Para endpoints que usam :hotel_uuid, substituir por um valor de teste
      if (url.includes(':hotel_uuid')) {
        testUrl = url.replace(':hotel_uuid', 'test-hotel-uuid-123');
        toast('Testando com Hotel UUID de exemplo: test-hotel-uuid-123', { duration: 2000 });
      }

      // Para endpoints POST, adicionar dados de teste
      if (type === 'updateConfigurations' || type === 'saveConfigurations') {
        requestOptions.body = JSON.stringify({
          test: true,
          configurations: {
            system_name: 'Teste de Configuração',
            theme: 'dark',
            settings: { test: 'valor de teste' }
          },
          hotel_uuid: 'test-hotel-uuid-123'
        });
        toast('Testando com dados de exemplo de configuração', { duration: 2000 });
      }

      console.log('Testando endpoint de configuração:', testUrl);

      const response = await fetch(testUrl, requestOptions);
      
      console.log('Resposta:', response.status, response.statusText);
      
      if (response.ok) {
        toast.success(`Endpoint de configuração respondeu com sucesso! Status: ${response.status}`);
      } else if (response.status === 404) {
        toast.success('Endpoint de configuração encontrado (404 é normal para UUID de teste)');
      } else {
        toast.error(`Endpoint de configuração retornou status ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Erro no teste de configuração:', error);
      if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
        toast.error('❌ Erro CORS: O servidor não permite testes do browser. Configure CORS no servidor ou teste diretamente na aplicação.');
      } else {
        toast.error(`Erro ao testar endpoint de configuração: ${error.message}`);
      }
    }
  };

  const getConfigEndpointLabel = (type) => {
    const labels = {
      getConfigurations: 'Buscar Configurações',
      updateConfigurations: 'Atualizar Configurações',
      saveConfigurations: 'Salvar Configurações',
      resetConfigurations: 'Resetar Configurações'
    };
    return labels[type] || type;
  };

  const getConfigEndpointMethod = (type) => {
    const methods = {
      getConfigurations: 'GET',
      updateConfigurations: 'POST',
      saveConfigurations: 'POST',
      resetConfigurations: 'DELETE'
    };
    return methods[type] || 'GET';
  };

  const getConfigEndpointDescription = (type) => {
    const descriptions = {
      getConfigurations: 'Endpoint para buscar configurações do sistema de um hotel específico. Use :hotel_uuid onde será substituído pelo hotel_uuid (ex: /webhook/get_config/:hotel_uuid)',
      updateConfigurations: 'Endpoint POST para atualizar configurações do sistema. Envia configurações no body da requisição.',
      saveConfigurations: 'Endpoint POST para salvar novas configurações no sistema. Persiste configurações na base de dados.',
      resetConfigurations: 'Endpoint DELETE para resetar configurações do sistema para valores padrão. Use :hotel_uuid onde será substituído pelo hotel_uuid'
    };
    return descriptions[type] || '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <h2 className="text-2xl font-bold text-white mb-2">Configurações do Sistema</h2>
        <p className="text-sidebar-300">
          Configure o sistema, endpoints da API e preferências de aparência.
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
        <div className="border-b border-white/10">
          <nav className="flex space-x-1 p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-500 text-white'
                    : 'text-sidebar-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* General Settings Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Nome da Empresa
                </label>
                <input
                  type="text"
                  value={companyNameInput}
                  onChange={(e) => setCompanyNameInput(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-sidebar-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Digite o nome da empresa"
                />
              </div>

              <ImageUpload
                value={logoInput}
                onChange={handleLogoChange}
                label="Logotipo da Empresa"
                className="mb-4"
                hotelName={null}
                acceptFiles="image/*"
              />

              {/* Histórico de Logotipos */}
              <LogoHistorySelector
                onLogoSelect={handleLogoSelect}
                className="mb-6"
              />

              <div className="flex space-x-4">
                <button
                  onClick={handleSaveGeneral}
                  className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Salvar Configurações Gerais
                </button>
                
                <button
                  onClick={loadConfigurationsFromAPI}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  disabled={!configEndpoints.getConfigurations}
                  title={!configEndpoints.getConfigurations ? 'Configure o endpoint "Buscar Configurações" na aba API Endpoints' : 'Carregar configurações da API'}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Carregar da API</span>
                </button>
              </div>
            </div>
          )}

          {/* API Endpoints Tab */}
          {activeTab === 'api' && (
            <div className="space-y-8">
              {/* Loading State */}
              {endpointsLoading && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                    <div>
                      <h4 className="text-blue-300 font-medium">Carregando endpoints da API...</h4>
                      <p className="text-blue-400/70 text-sm mt-1">Buscando endpoints mais recentes da base de dados</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!endpointsLoading && apiEndpointsEmpty && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <h4 className="text-yellow-300 font-medium">Nenhum endpoint encontrado na API</h4>
                      <p className="text-yellow-400/70 text-sm mt-1">A base de dados não retornou endpoints. Os campos ficam vazios conforme esperado.</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="text-blue-300 font-medium">Configuração de Endpoints</h3>
                    <p className="text-blue-200 text-sm mt-1">
                      Configure os endpoints das suas APIs para que o sistema possa se comunicar corretamente.
                    </p>
                  </div>
                </div>
              </div>

              {/* Hotel Endpoints Section */}
              <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection('hotels')}
                  className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <h3 className="text-white font-semibold text-lg">Endpoints de Hotéis</h3>
                      <p className="text-sidebar-400 text-sm">Configurações para gerenciamento de hotéis</p>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-sidebar-400 transition-transform duration-200 ${
                      expandedSections.hotels ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {expandedSections.hotels && (
                  <div className="px-6 pb-6 space-y-6 border-t border-white/10">
                    {Object.entries(endpoints).map(([type, url]) => (
                      <div key={type} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-white font-medium">{getEndpointLabel(type)}</h4>
                            <p className="text-sidebar-400 text-sm">{getEndpointDescription(type)}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            getEndpointMethod(type) === 'GET' ? 'bg-green-500/20 text-green-300' :
                            getEndpointMethod(type) === 'POST' ? 'bg-blue-500/20 text-blue-300' :
                            getEndpointMethod(type) === 'PUT' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-red-500/20 text-red-300'
                          }`}>
                            {getEndpointMethod(type)}
                          </span>
                        </div>

                        <div className="flex space-x-2">
                          <input
                            type="url"
                            value={url}
                            onChange={(e) => handleEndpointChange(type, e.target.value)}
                            className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-sidebar-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="https://api.exemplo.com/endpoint"
                          />
                          <button
                            onClick={() => handleTestEndpoint(type)}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg transition-colors"
                          >
                            Testar
                          </button>
                          <button
                            onClick={() => handleSaveEndpoint(type)}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
                          >
                            Salvar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* AI Integration Endpoints Section */}
              <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection('aiIntegrations')}
                  className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <h3 className="text-white font-semibold text-lg">Endpoints de Integrações IA</h3>
                      <p className="text-sidebar-400 text-sm">Configurações para gerenciamento de integrações de inteligência artificial</p>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-sidebar-400 transition-transform duration-200 ${
                      expandedSections.aiIntegrations ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {expandedSections.aiIntegrations && (
                  <div className="px-6 pb-6 space-y-6 border-t border-white/10">
                    {Object.keys(aiEndpoints).length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-sidebar-400">Nenhum endpoint de IA configurado</p>
                      </div>
                    ) : (
                      Object.entries(aiEndpoints).map(([type, url]) => (
                      <div key={type} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-white font-medium">{getAiEndpointLabel(type)}</h4>
                            <p className="text-sidebar-400 text-sm">{getAiEndpointDescription(type)}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            getAiEndpointMethod(type) === 'GET' ? 'bg-green-500/20 text-green-300' :
                            getAiEndpointMethod(type) === 'POST' ? 'bg-blue-500/20 text-blue-300' :
                            getAiEndpointMethod(type) === 'PUT' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-red-500/20 text-red-300'
                          }`}>
                            {getAiEndpointMethod(type)}
                          </span>
                        </div>

                        <div className="flex space-x-2">
                          <input
                            type="url"
                            value={url}
                            onChange={(e) => handleAiEndpointChange(type, e.target.value)}
                            className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-sidebar-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="https://api.exemplo.com/ai/endpoint"
                          />
                          <button
                            onClick={() => handleTestAiEndpoint(type)}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg transition-colors"
                          >
                            Testar
                          </button>
                          <button
                            onClick={() => handleSaveAiEndpoint(type)}
                            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                          >
                            Salvar
                          </button>
                        </div>
                      </div>
                    ))
                    )}
                  </div>
                )}
              </div>

              {/* Marketing Messages Endpoints Section */}
              <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedSections(prev => ({
                    ...prev,
                    marketingMessages: !prev.marketingMessages
                  }))}
                  className="w-full p-6 text-left hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <h3 className="text-white font-semibold text-lg">Endpoints de Mensagens de Marketing IA</h3>
                        <p className="text-sidebar-400 text-sm">Configurações para gerenciamento de mensagens de marketing</p>
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-sidebar-400 transition-transform duration-200 ${
                        expandedSections.marketingMessages ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {expandedSections.marketingMessages && (
                  <div className="px-6 pb-6 space-y-6 border-t border-white/10">
                    {Object.keys(marketingEndpoints).length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-sidebar-400">Nenhum endpoint de marketing configurado</p>
                      </div>
                    ) : (
                      Object.entries(marketingEndpoints).map(([type, url]) => (
                      <div key={type} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-white font-medium">{getMarketingEndpointLabel(type)}</h4>
                            <p className="text-sidebar-400 text-sm">{getMarketingEndpointDescription(type)}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            getMarketingEndpointMethod(type) === 'GET' ? 'bg-green-500/20 text-green-300' :
                            getMarketingEndpointMethod(type) === 'POST' ? 'bg-blue-500/20 text-blue-300' :
                            getMarketingEndpointMethod(type) === 'PUT' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-red-500/20 text-red-300'
                          }`}>
                            {getMarketingEndpointMethod(type)}
                          </span>
                        </div>

                        <div className="flex space-x-2">
                          <input
                            type="url"
                            value={url}
                            onChange={(e) => {
                              setMarketingEndpoints(prev => ({
                                ...prev,
                                [type]: e.target.value
                              }));
                            }}
                            className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-sidebar-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="https://api.exemplo.com/marketing/endpoint"
                          />
                          <button
                            onClick={() => handleTestMarketingEndpoint(type)}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg transition-colors"
                          >
                            Testar
                          </button>
                          <button
                            onClick={() => handleSaveMarketingEndpoint(type)}
                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                          >
                            Salvar
                          </button>
                        </div>
                      </div>
                    ))
                    )}
                  </div>
                )}
              </div>

              {/* Bot Fields Endpoints Section */}
              <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedSections(prev => ({
                    ...prev,
                    botFields: !prev.botFields
                  }))}
                  className="w-full p-6 text-left hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <h3 className="text-white font-semibold text-lg">Endpoints de Campos do Bot</h3>
                        <p className="text-sidebar-400 text-sm">Configurações para busca de campos do bot de IA</p>
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-sidebar-400 transition-transform duration-200 ${
                        expandedSections.botFields ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {expandedSections.botFields && (
                  <div className="px-6 pb-6 space-y-6 border-t border-white/10">
                    {Object.keys(botFieldsEndpoints).length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-sidebar-400">Nenhum endpoint de campos do bot configurado</p>
                      </div>
                    ) : (
                      Object.entries(botFieldsEndpoints).map(([type, url]) => (
                        <div key={type} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-white font-medium">{getBotFieldsEndpointLabel(type)}</h4>
                              <p className="text-sidebar-400 text-sm">{getBotFieldsEndpointDescription(type)}</p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              getBotFieldsEndpointMethod(type) === 'GET' ? 'bg-green-500/20 text-green-300' :
                              getBotFieldsEndpointMethod(type) === 'POST' ? 'bg-blue-500/20 text-blue-300' :
                              getBotFieldsEndpointMethod(type) === 'PUT' ? 'bg-yellow-500/20 text-yellow-300' :
                              'bg-red-500/20 text-red-300'
                            }`}>
                              {getBotFieldsEndpointMethod(type)}
                            </span>
                          </div>

                          <div className="flex space-x-2">
                            <input
                              type="url"
                              value={url}
                              onChange={(e) => handleBotFieldsEndpointChange(type, e.target.value)}
                              className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-sidebar-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              placeholder="https://api.exemplo.com/bot-fields/endpoint"
                            />
                            <button
                              onClick={() => handleTestBotFieldsEndpoint(type)}
                              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg transition-colors"
                            >
                              Testar
                            </button>
                            <button
                              onClick={() => handleSaveBotFieldsEndpoint(type)}
                              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                            >
                              Salvar
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Knowledge Endpoints Section */}
              <div className="border border-white/10 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedSections(prev => ({ ...prev, knowledge: !prev.knowledge }))}
                  className="w-full p-4 bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <div className="text-left">
                      <h3 className="text-white font-semibold text-lg">Endpoints de Conhecimento IA</h3>
                      <p className="text-sidebar-400 text-sm mt-1">Configure os endpoints para gerenciar o conhecimento da IA</p>
                    </div>
                  </div>
                  <div className="text-sidebar-400">
                    <svg className={`w-5 h-5 transition-transform ${expandedSections.knowledge ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {expandedSections.knowledge && (
                  <div className="px-6 pb-6 space-y-6 border-t border-white/10">
                    {/* Sempre mostrar os campos de conhecimento */}
                    {['getKnowledge', 'updateKnowledge'].map((type) => {
                      const url = knowledgeEndpoints?.[type] || '';
                      return (
                        <div key={type} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-white font-medium">{getKnowledgeEndpointLabel(type)}</h4>
                              <p className="text-sidebar-400 text-sm">{getKnowledgeEndpointDescription(type)}</p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              getKnowledgeEndpointMethod(type) === 'GET' ? 'bg-green-500/20 text-green-300' :
                              getKnowledgeEndpointMethod(type) === 'POST' ? 'bg-blue-500/20 text-blue-300' :
                              getKnowledgeEndpointMethod(type) === 'PUT' ? 'bg-yellow-500/20 text-yellow-300' :
                              'bg-red-500/20 text-red-300'
                            }`}>
                              {getKnowledgeEndpointMethod(type)}
                            </span>
                          </div>

                          <div className="flex space-x-2">
                            <input
                              type="url"
                              value={url}
                              onChange={(e) => handleKnowledgeEndpointChange(type, e.target.value)}
                              className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-sidebar-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              placeholder={type === 'getKnowledge' ? 'https://api.exemplo.com/lista_cerebro_ia/:hotel_uuid' : 'https://api.exemplo.com/alimenta_qdrant_base_conhecimento'}
                            />
                            <button
                              onClick={() => handleTestKnowledgeEndpoint(type)}
                              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg transition-colors"
                            >
                              Testar
                            </button>
                            <button
                              onClick={() => handleSaveKnowledgeEndpoint(type)}
                              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                            >
                              Salvar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Control Endpoints Section */}
              <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedSections(prev => ({ ...prev, control: !prev.control }))}
                  className="w-full p-6 text-left hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-orange-500/20 rounded-lg">
                        <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <h3 className="text-white font-semibold text-lg">Endpoints de Controle</h3>
                        <p className="text-sidebar-400 text-sm mt-1">Configure endpoints para gerenciar e salvar todos os outros endpoints</p>
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-sidebar-400 transition-transform duration-200 ${
                        expandedSections.control ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {expandedSections.control && (
                  <div className="px-6 pb-6 space-y-6 border-t border-white/10">
                    {/* Control Endpoints */}
                    {Object.entries(controlEndpoints).map(([type, url]) => (
                      <div key={type} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-white font-medium">{getControlEndpointLabel(type)}</h4>
                            <p className="text-sidebar-400 text-sm">{getControlEndpointDescription(type)}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            getControlEndpointMethod(type) === 'GET' ? 'bg-green-500/20 text-green-300' :
                            getControlEndpointMethod(type) === 'POST' ? 'bg-blue-500/20 text-blue-300' :
                            getControlEndpointMethod(type) === 'PUT' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-red-500/20 text-red-300'
                          }`}>
                            {getControlEndpointMethod(type)}
                          </span>
                        </div>

                        <div className="flex space-x-2">
                          <input
                            type="url"
                            value={url}
                            onChange={(e) => handleControlEndpointChange(type, e.target.value)}
                            className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-sidebar-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="https://api.exemplo.com/control/endpoint"
                          />
                          <button
                            onClick={() => handleSaveControlEndpoint(type)}
                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                          >
                            Salvar
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Save All Endpoints Button */}
                    <div className="mt-8 pt-6 border-t border-white/10">
                      <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <svg className="w-5 h-5 text-orange-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3 3-3M12 10v10" />
                          </svg>
                          <div className="flex-1">
                            <h4 className="text-orange-300 font-medium">Salvar Todos os Endpoints</h4>
                            <p className="text-orange-200 text-sm mt-1">
                              Envia todos os endpoints configurados para a API de controle. Inclui endpoints de hotéis, IA, marketing, campos do bot, conhecimento e controle.
                            </p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <button
                            onClick={handleSaveAllEndpoints}
                            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3 3-3M12 10v10" />
                            </svg>
                            <span>Salvar Todos os Endpoints na API</span>
                          </button>

                          <button
                            onClick={handleLoadAllEndpoints}
                            className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span>Carregar e Aplicar Endpoints da API</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Configuration Endpoints Section */}
              <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedSections(prev => ({ ...prev, config: !prev.config }))}
                  className="w-full p-6 text-left hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-cyan-500/20 rounded-lg">
                        <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <h3 className="text-white font-semibold text-lg">Endpoints de Configurações</h3>
                        <p className="text-sidebar-400 text-sm mt-1">Configure endpoints para gerenciar configurações do sistema</p>
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-sidebar-400 transition-transform duration-200 ${
                        expandedSections.config ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {expandedSections.config && (
                  <div className="px-6 pb-6 space-y-6 border-t border-white/10">
                    {/* Configuration Endpoints */}
                    {Object.entries(configEndpoints).map(([type, url]) => (
                      <div key={type} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-white font-medium">{getConfigEndpointLabel(type)}</h4>
                            <p className="text-sidebar-400 text-sm">{getConfigEndpointDescription(type)}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            getConfigEndpointMethod(type) === 'GET' ? 'bg-green-500/20 text-green-300' :
                            getConfigEndpointMethod(type) === 'POST' ? 'bg-blue-500/20 text-blue-300' :
                            getConfigEndpointMethod(type) === 'PUT' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-red-500/20 text-red-300'
                          }`}>
                            {getConfigEndpointMethod(type)}
                          </span>
                        </div>

                        <div className="flex space-x-2">
                          <input
                            type="url"
                            value={url}
                            onChange={(e) => handleConfigEndpointChange(type, e.target.value)}
                            className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-sidebar-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="https://api.exemplo.com/config/endpoint"
                          />
                          <button
                            onClick={() => handleTestConfigEndpoint(type)}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg transition-colors"
                          >
                            Testar
                          </button>
                          <button
                            onClick={() => handleSaveConfigEndpoint(type)}
                            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
                          >
                            Salvar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Upload Settings Tab */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a4 4 0 014 4z" />
                  </svg>
                  <div>
                    <h3 className="text-blue-300 font-medium">Configurações de Upload</h3>
                    <p className="text-blue-200 text-sm mt-1">
                      Configure como as imagens serão processadas e armazenadas no sistema.
                    </p>
                  </div>
                </div>
              </div>

              {/* Service Selection */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  Serviço de Upload
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { value: 'base64', label: 'Local (Base64)', desc: 'Processa localmente, sem servidor externo' },
                    { value: 'imgbb', label: 'ImgBB', desc: 'Serviço gratuito de hospedagem de imagens' },
                    { value: 'cloudinary', label: 'Cloudinary', desc: 'Plataforma robusta com otimização' },
                    { value: 'custom', label: 'Endpoint Customizado', desc: 'Seu próprio servidor de upload' }
                  ].map((service) => (
                    <div
                      key={service.value}
                      onClick={() => handleUploadSettingChange('service', service.value)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        uploadSettings.service === service.value
                          ? 'border-primary-500 bg-primary-500/10'
                          : 'border-white/20 hover:border-white/40 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          uploadSettings.service === service.value
                            ? 'border-primary-500 bg-primary-500'
                            : 'border-white/40'
                        }`} />
                        <h4 className="text-white font-medium">{service.label}</h4>
                      </div>
                      <p className="text-sidebar-400 text-sm mt-1">{service.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Service-specific configurations */}
              {uploadSettings.service === 'imgbb' && (
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    API Key do ImgBB
                  </label>
                  <input
                    type="text"
                    value={uploadSettings.imgbbApiKey || ''}
                    onChange={(e) => handleUploadSettingChange('imgbbApiKey', e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-sidebar-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Cole sua API Key do ImgBB aqui"
                  />
                  <p className="text-sidebar-400 text-xs mt-1">
                    Obtenha gratuitamente em: <a href="https://api.imgbb.com/" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:text-primary-300">https://api.imgbb.com/</a>
                  </p>
                </div>
              )}

              {uploadSettings.service === 'cloudinary' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Cloud Name
                    </label>
                    <input
                      type="text"
                      value={uploadSettings.cloudinaryCloudName || ''}
                      onChange={(e) => handleUploadSettingChange('cloudinaryCloudName', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-sidebar-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="seu-cloud-name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Upload Preset
                    </label>
                    <input
                      type="text"
                      value={uploadSettings.cloudinaryUploadPreset || ''}
                      onChange={(e) => handleUploadSettingChange('cloudinaryUploadPreset', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-sidebar-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="preset-name"
                    />
                  </div>
                </div>
              )}

              {uploadSettings.service === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Endpoint de Upload
                  </label>
                  <input
                    type="url"
                    value={uploadSettings.customUploadEndpoint || ''}
                    onChange={(e) => handleUploadSettingChange('customUploadEndpoint', e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-sidebar-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="https://api.seusite.com/upload"
                  />
                  <p className="text-sidebar-400 text-xs mt-1">
                    O endpoint deve aceitar POST com FormData e retornar JSON com campo 'url'
                  </p>
                </div>
              )}

              <button
                onClick={handleSaveUploadSettings}
                className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Salvar Configurações de Upload
              </button>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-purple-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                  </svg>
                  <div>
                    <h3 className="text-purple-300 font-medium">Personalização Visual</h3>
                    <p className="text-purple-200 text-sm mt-1">
                      Em breve: configurações de tema, cores personalizadas e modo claro/escuro.
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center py-12">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <h3 className="text-white font-semibold mb-2">Recursos em Desenvolvimento</h3>
                <p className="text-sidebar-300">
                  Opções de personalização visual estarão disponíveis em breve.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;