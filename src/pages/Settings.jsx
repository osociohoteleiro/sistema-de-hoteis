import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import ImageUpload from '../components/ImageUpload';
import toast from 'react-hot-toast';

const Settings = () => {
  const { config, updateConfig, updateEndpoint, updateAiEndpoint, updateMarketingEndpoint, updateBotFieldsEndpoint, updateKnowledgeEndpoint, updateControlEndpoint, saveAllEndpoints, loadAllEndpoints } = useApp();
  const [activeTab, setActiveTab] = useState('general');
  const [logoInput, setLogoInput] = useState(config.logo || '');
  const [companyNameInput, setCompanyNameInput] = useState(config.companyName || '');
  const [endpoints, setEndpoints] = useState(config.apiEndpoints);
  const [aiEndpoints, setAiEndpoints] = useState(config.aiEndpoints || {
    createIntegration: '',
    getIntegrations: '',
    updateIntegration: '',
    deleteIntegration: '',
    getAiStats: ''
  });
  const [marketingEndpoints, setMarketingEndpoints] = useState(config.marketingEndpoints || {
    createMessage: '',
    getMessages: '',
    updateMessage: '',
    deleteMessage: ''
  });
  const [botFieldsEndpoints, setBotFieldsEndpoints] = useState(config.botFieldsEndpoints || {
    getBotFields: '',
    updateBotFields: '',
    updateAllBotFields: ''
  });
  const [knowledgeEndpoints, setKnowledgeEndpoints] = useState(config.knowledgeEndpoints || {
    getKnowledge: '',
    updateKnowledge: ''
  });
  const [controlEndpoints, setControlEndpoints] = useState(config.controlEndpoints || {
    saveEndpoints: 'https://osh-ia-n8n.d32pnk.easypanel.host/webhook/endpoints_create',
    listEndpoints: 'https://osh-ia-n8n.d32pnk.easypanel.host/webhook/lista_endpoints',
    getEndpoints: '',
    updateEndpoints: ''
  });
  const [uploadSettings, setUploadSettings] = useState(config.uploadConfig || {});
  const [expandedSections, setExpandedSections] = useState({
    hotels: false,
    aiIntegrations: false,
    marketingMessages: false,
    botFields: false,
    knowledge: false,
    control: false
  });

  const tabs = [
    { id: 'general', name: 'Geral', icon: '🏢' },
    { id: 'api', name: 'API Endpoints', icon: '🔗' },
    { id: 'upload', name: 'Upload de Imagens', icon: '📷' },
    { id: 'appearance', name: 'Aparência', icon: '🎨' }
  ];

  // Sincronizar com as mudanças do contexto
  useEffect(() => {
    console.log('🔄 Sincronizando estados locais com config atualizado:', config);
    
    setEndpoints(config.apiEndpoints || {});
    setAiEndpoints(config.aiEndpoints || {
      createIntegration: '',
      getIntegrations: '',
      updateIntegration: '',
      deleteIntegration: '',
      getAiStats: ''
    });
    setMarketingEndpoints(config.marketingEndpoints || {
      createMessage: '',
      getMessages: '',
      updateMessage: '',
      deleteMessage: ''
    });
    setBotFieldsEndpoints(config.botFieldsEndpoints || {
      getBotFields: '',
      updateBotFields: '',
      updateAllBotFields: ''
    });
    setKnowledgeEndpoints(config.knowledgeEndpoints || {
      getKnowledge: '',
      updateKnowledge: ''
    });
    setControlEndpoints(config.controlEndpoints || {
      saveEndpoints: 'https://osh-ia-n8n.d32pnk.easypanel.host/webhook/endpoints_create',
      listEndpoints: 'https://osh-ia-n8n.d32pnk.easypanel.host/webhook/lista_endpoints',
      getEndpoints: '',
      updateEndpoints: ''
    });
    
    console.log('✅ Estados locais atualizados:', {
      endpoints: config.apiEndpoints,
      aiEndpoints: config.aiEndpoints,
      marketingEndpoints: config.marketingEndpoints,
      botFieldsEndpoints: config.botFieldsEndpoints,
      knowledgeEndpoints: config.knowledgeEndpoints,
      controlEndpoints: config.controlEndpoints
    });
  }, [config]);

  const handleSaveGeneral = () => {
    updateConfig({
      logo: logoInput.trim() || null,
      companyName: companyNameInput.trim() || 'Sistema de Hotéis'
    });
    toast.success('Configurações gerais salvas com sucesso!');
  };

  const handleLogoChange = (imageUrl) => {
    setLogoInput(imageUrl);
  };

  const handleUploadSettingChange = (key, value) => {
    setUploadSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveUploadSettings = () => {
    updateConfig({ uploadConfig: uploadSettings });
    toast.success('Configurações de upload salvas com sucesso!');
  };

  const handleEndpointChange = (type, value) => {
    setEndpoints(prev => ({ ...prev, [type]: value }));
  };

  const handleSaveEndpoint = (type) => {
    const url = endpoints[type].trim();
    updateEndpoint(type, url);
    toast.success(`Endpoint de ${getEndpointLabel(type)} salvo com sucesso!`);
  };

  const handleAiEndpointChange = (type, value) => {
    setAiEndpoints(prev => ({ ...prev, [type]: value }));
  };

  const handleSaveAiEndpoint = (type) => {
    const url = aiEndpoints[type].trim();
    updateAiEndpoint(type, url);
    toast.success(`Endpoint de ${getAiEndpointLabel(type)} salvo com sucesso!`);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleTestEndpoint = async (type) => {
    const url = endpoints[type].trim();
    if (!url) {
      toast.error('URL do endpoint não pode estar vazia');
      return;
    }

    // Verificar se é endpoint externo (N8N)
    if (url.includes('osh-ia-n8n.d32pnk.easypanel.host')) {
      toast('⚙️ Endpoint N8N salvo. Para verificar se está funcionando, teste a funcionalidade de edição de hotel.', { 
        duration: 4000,
        icon: '⚙️'
      });
      return;
    }

    try {
      let testUrl = url;
      
      // Para endpoints que usam :id, substituir por um valor de teste
      if (url.includes(':id')) {
        testUrl = url.replace(':id', 'test-uuid-123');
        toast('Testando com ID de exemplo: test-uuid-123', { duration: 2000 });
      }

      console.log('Testando endpoint:', testUrl);

      const response = await fetch(testUrl, {
        method: type === 'createHotel' ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json' },
        ...(type === 'createHotel' && { 
          body: JSON.stringify({ test: true }) 
        })
      });
      
      console.log('Resposta:', response.status, response.statusText);
      
      if (response.ok) {
        toast.success(`Endpoint respondeu com sucesso! Status: ${response.status}`);
      } else if (response.status === 404) {
        toast.success('Endpoint encontrado (404 é normal para ID de teste)');
      } else {
        toast.error(`Endpoint retornou status ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Erro no teste:', error);
      if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
        toast.error('❌ Erro CORS: O servidor não permite testes do browser. Configure CORS no servidor ou teste diretamente na aplicação.');
      } else {
        toast.error(`Erro ao testar endpoint: ${error.message}`);
      }
    }
  };

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

  const getEndpointLabel = (type) => {
    const labels = {
      listHotels: 'Listar Hotéis',
      createHotel: 'Criar Hotel',
      getHotel: 'Buscar Hotel Individual',
      updateHotel: 'Atualizar Hotel',
      deleteHotel: 'Excluir Hotel'
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

  const getEndpointDescription = (type) => {
    const descriptions = {
      listHotels: 'Endpoint para buscar a lista de todos os hotéis cadastrados',
      createHotel: 'Endpoint para cadastrar novos hotéis no sistema',
      getHotel: 'Endpoint para buscar um hotel específico. Use :id onde será substituído pelo hotel_uuid (ex: /webhook/abc/:id)',
      updateHotel: 'Endpoint para atualizar hotel. Use :id onde será substituído pelo hotel_uuid (ex: /webhook/abc/:id)',
      deleteHotel: 'Endpoint para excluir hotel. Use :id onde será substituído pelo hotel_uuid (ex: /webhook/abc/:id)'
    };
    return descriptions[type] || '';
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

  // Bot Fields Endpoint Management Functions
  const handleBotFieldsEndpointChange = (type, value) => {
    setBotFieldsEndpoints(prev => ({ ...prev, [type]: value }));
  };

  const handleSaveBotFieldsEndpoint = (type) => {
    const url = botFieldsEndpoints[type].trim();
    updateBotFieldsEndpoint(type, url);
    toast.success(`Endpoint de ${getBotFieldsEndpointLabel(type)} salvo com sucesso!`);
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

  const handleSaveKnowledgeEndpoint = (type) => {
    const url = knowledgeEndpoints[type].trim();
    updateKnowledgeEndpoint(type, url);
    toast.success(`Endpoint de ${getKnowledgeEndpointLabel(type)} salvo com sucesso!`);
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

  const handleSaveControlEndpoint = (type) => {
    const url = controlEndpoints[type].trim();
    updateControlEndpoint(type, url);
    console.log(`Endpoint de ${getControlEndpointLabel(type)} salvo com sucesso!`);
  };

  const handleSaveAllEndpoints = async () => {
    try {
      await saveAllEndpoints();
      console.log('Todos os endpoints foram salvos com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar endpoints:', error.message);
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
              />

              <button
                onClick={handleSaveGeneral}
                className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Salvar Configurações Gerais
              </button>
            </div>
          )}

          {/* API Endpoints Tab */}
          {activeTab === 'api' && (
            <div className="space-y-8">
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
                            onClick={() => updateMarketingEndpoint(type, marketingEndpoints[type])}
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