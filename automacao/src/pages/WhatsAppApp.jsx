import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:3001/api';

// Helper function for retry with exponential backoff
const makeRequestWithRetry = async (url, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await axios.get(url);
      return response;
    } catch (error) {
      if (error.response?.status === 429 && i < maxRetries - 1) {
        // Wait exponentially longer each retry
        const delay = Math.min(1000 * Math.pow(2, i), 10000);
        console.log(`Rate limited, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
};

const WhatsAppApp = () => {
  const { workspaceUuid } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('instances');
  const [instances, setInstances] = useState([]);
  const [instancesStatus, setInstancesStatus] = useState(new Map()); // Map para armazenar status das instâncias
  const [qrCode, setQrCode] = useState(null);
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [instancesSummary, setInstancesSummary] = useState([]);

  useEffect(() => {
    loadWorkspaceData();
  }, [workspaceUuid]);

  // Carregar instâncias sem auto-seleção para permitir escolha manual
  useEffect(() => {
    console.log(`📋 ${instances.length} instâncias carregadas:`, instances.map(i => i.name || i.instanceName));
  }, [instances]);

  // Polling temporariamente desabilitado devido ao rate limiting
  // useEffect(() => {
  //   if (instances.length > 0) {
  //     const interval = setInterval(() => {
  //       loadInstancesStatus(instances);
  //     }, 300000); // 5 minutos

  //     return () => clearInterval(interval);
  //   }
  // }, [instances]);

  const loadWorkspaceData = async () => {
    try {
      setLoading(true);
      
      // Carregar workspace do localStorage
      const savedWorkspace = localStorage.getItem('selectedWorkspace');
      if (savedWorkspace) {
        setWorkspace(JSON.parse(savedWorkspace));
      }

      // Carregar instâncias Evolution existentes e resumo de mensagens
      await Promise.all([
        loadEvolutionInstances(),
        loadInstancesSummary()
      ]);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar informações');
    } finally {
      setLoading(false);
    }
  };

  const loadInstancesSummary = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/whatsapp-messages/instances-summary`);
      if (response.data.success) {
        setInstancesSummary(response.data.data || []);
        console.log('📊 Resumo das instâncias com mensagens:', response.data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar resumo das instâncias:', error);
    }
  };

  const loadEvolutionInstances = async () => {
    try {
      const response = await makeRequestWithRetry(`${API_BASE_URL}/evolution/instances`);
      if (response.data.success) {
        const instancesData = response.data.data || [];
        setInstances(instancesData);

        // Carregar status apenas da instância prioritária primeiro
        const targetInstance = instancesData.find(instance => {
          const instanceName = instance.name || instance.instanceName;
          return instanceName === 'osociohoteleiro_notificacoes';
        });

        if (targetInstance) {
          // Carregar apenas o status da instância prioritária
          await loadSingleInstanceStatus(targetInstance);
        } else {
          // Se não encontrar a prioritária, carregar todas com throttling
          await loadInstancesStatus(instancesData);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar instâncias:', error);
    }
  };

  const loadSingleInstanceStatus = async (instance) => {
    try {
      const instanceName = instance.name || instance.instanceName;
      const response = await axios.get(`${API_BASE_URL}/evolution/status/${instanceName}`);
      const statusMap = new Map();

      if (response.data.success) {
        const connectionState = response.data.data.instance?.state || 'DISCONNECTED';
        statusMap.set(instanceName, connectionState);
      } else {
        statusMap.set(instanceName, 'DISCONNECTED');
      }

      setInstancesStatus(statusMap);
    } catch (error) {
      const instanceName = instance.name || instance.instanceName || 'unknown';
      console.error(`Erro ao buscar status de ${instanceName}:`, error);
      const statusMap = new Map();
      statusMap.set(instanceName, 'DISCONNECTED');
      setInstancesStatus(statusMap);
    }
  };

  const loadInstancesStatus = async (instancesList) => {
    const statusMap = new Map();

    // Processar instâncias em lotes pequenos para evitar rate limiting
    const batchSize = 3;
    for (let i = 0; i < instancesList.length; i += batchSize) {
      const batch = instancesList.slice(i, i + batchSize);

      const batchPromises = batch.map(async (instance) => {
        try {
          const instanceName = instance.name || instance.instanceName;

          if (!instanceName) {
            console.warn('Instância sem nome:', instance);
            return;
          }

          const response = await axios.get(`${API_BASE_URL}/evolution/status/${instanceName}`);
          if (response.data.success) {
            const connectionState = response.data.data.instance?.state || 'DISCONNECTED';
            statusMap.set(instanceName, connectionState);
          } else {
            statusMap.set(instanceName, 'DISCONNECTED');
          }
        } catch (error) {
          const instanceName = instance.name || instance.instanceName || 'unknown';
          console.error(`Erro ao buscar status de ${instanceName}:`, error);
          statusMap.set(instanceName, 'DISCONNECTED');
        }
      });

      await Promise.all(batchPromises);

      // Pequena pausa entre lotes para evitar rate limiting
      if (i + batchSize < instancesList.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    setInstancesStatus(statusMap);
  };

  const handleConnectInstance = async (instance) => {
    try {
      const instanceName = instance.name || instance.instanceName;
      setSelectedInstance(instanceName);

      // Atualizar status para CONNECTING
      setInstancesStatus(prev => new Map(prev.set(instanceName, 'CONNECTING')));

      const response = await axios.get(`${API_BASE_URL}/evolution/qrcode/${instanceName}`);

      if (response.data.success && response.data.data.qrcode) {
        setQrCode(response.data.data.qrcode);
        toast.success('QR Code gerado! Escaneie com seu WhatsApp.');
      } else {
        toast.error('Não foi possível gerar o QR Code');
        // Reverter status em caso de erro
        setInstancesStatus(prev => new Map(prev.set(instanceName, 'DISCONNECTED')));
      }
    } catch (error) {
      toast.error('Erro ao conectar instância');
      console.error(error);
      // Reverter status em caso de erro
      const instanceName = instance.name || instance.instanceName || 'unknown';
      setInstancesStatus(prev => new Map(prev.set(instanceName, 'DISCONNECTED')));
    }
  };

  const refreshInstanceStatus = async (instance) => {
    try {
      const instanceName = instance.name || instance.instanceName;
      const response = await axios.get(`${API_BASE_URL}/evolution/status/${instanceName}`);
      if (response.data.success) {
        const connectionState = response.data.data.instance?.state || 'DISCONNECTED';
        setInstancesStatus(prev => new Map(prev.set(instanceName, connectionState)));
      }
    } catch (error) {
      const instanceName = instance.name || instance.instanceName || 'unknown';
      console.error(`Erro ao atualizar status de ${instanceName}:`, error);
    }
  };

  const handleCreateInstance = async () => {
    try {
      const workspaceId = workspaceUuid || 'direct';
      const instanceName = `workspace_${workspaceId}_${Date.now()}`;

      const response = await axios.post(`${API_BASE_URL}/evolution/create`, {
        instanceName,
        hotel_uuid: workspace?.hotel_uuid || 'default',
        webhook_url: `${window.location.origin}/api/webhooks/evolution`
      });

      if (response.data.success) {
        toast.success('Instância criada com sucesso!');
        await loadEvolutionInstances();
      } else {
        toast.error('Erro ao criar instância');
      }
    } catch (error) {
      toast.error('Erro ao criar nova instância');
      console.error(error);
    }
  };

  const getInstanceStatus = (instance) => {
    // As instâncias da Evolution API têm o campo 'name', não 'instanceName'
    const instanceName = instance.name || instance.instanceName;

    // Primeiro tentar obter status do Map atualizado
    let status = instancesStatus.get(instanceName);

    // Se não houver no Map, usar o status da própria instância
    if (!status) {
      status = instance.connectionStatus || 'disconnected';
    }

    // Mapear estados da Evolution API para estados do frontend
    switch (status.toLowerCase()) {
      case 'open':
        return 'CONNECTED';
      case 'connecting':
        return 'CONNECTING';
      case 'close':
      case 'closed':
      case 'disconnected':
      default:
        return 'DISCONNECTED';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONNECTED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'DISCONNECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'CONNECTING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Funções para o sistema de mensagens
  const loadConversations = async (instanceName) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/whatsapp-messages/conversations/${instanceName}`);

      if (response.data.success) {
        const conversationsData = response.data.data || [];
        setConversations(conversationsData);

        if (conversationsData.length === 0) {
          toast.info(`Nenhuma conversa encontrada para ${instanceName}`);
        } else {
          console.log(`✅ ${conversationsData.length} conversas carregadas para ${instanceName}:`, conversationsData);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
      toast.error('Erro ao carregar conversas');
    }
  };

  const loadMessages = async (instanceName, phoneNumber) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/whatsapp-messages/${instanceName}/${phoneNumber}`);
      if (response.data.success) {
        setMessages(response.data.data.messages || []);
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      toast.error('Erro ao carregar mensagens');
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || !selectedInstance) {
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/whatsapp-messages/send/${selectedInstance}`, {
        phoneNumber: selectedConversation.phone_number,
        message: messageText.trim(),
        messageType: 'text'
      });

      if (response.data.success) {
        setMessageText('');
        // Recarregar mensagens
        await loadMessages(selectedInstance, selectedConversation.phone_number);
        toast.success('Mensagem enviada!');
      } else {
        toast.error('Erro ao enviar mensagem');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
    }
  };

  const markAsRead = async (instanceName, phoneNumber) => {
    try {
      await axios.put(`${API_BASE_URL}/whatsapp-messages/mark-read/${instanceName}/${phoneNumber}`);
      // Recarregar conversas para atualizar contador
      await loadConversations(instanceName);
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const tabs = [
    { id: 'instances', name: 'Instâncias', icon: '📱' },
    { id: 'messages', name: 'Mensagens', icon: '💬' },
    { id: 'contacts', name: 'Contatos', icon: '👥' },
    { id: 'settings', name: 'Configurações', icon: '⚙️' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sapphire-600 mx-auto mb-4"></div>
          <p className="text-steel-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 p-8 shadow-blue-elegant">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-12 h-12 bg-gradient-sapphire rounded-lg flex items-center justify-center shadow-sapphire-glow">
                <span className="text-white text-xl">📱</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-midnight-950">WhatsApp App (Evolution API)</h1>
                <p className="text-steel-700">
                  Workspace: <span className="font-semibold">{workspace?.workspace_name}</span>
                </p>
              </div>
            </div>
            <p className="text-steel-600">
              Gerencie instâncias do WhatsApp conectadas via Evolution API com recursos avançados de automação.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-semibold">Evolution API</span>
              </div>
            </div>
            <button
              onClick={handleCreateInstance}
              className="bg-gradient-sapphire hover:bg-midnight-700 text-white font-semibold py-2 px-4 rounded-lg transition-minimal shadow-sapphire-glow hover:shadow-blue-soft"
            >
              Nova Instância
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 shadow-blue-elegant">
        <div className="border-b border-sapphire-200/30">
          <nav className="flex space-x-8 px-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-sapphire-500 text-sapphire-600'
                    : 'border-transparent text-steel-600 hover:text-steel-800 hover:border-steel-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-8">
          {activeTab === 'instances' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-midnight-950">Instâncias do WhatsApp</h3>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => loadInstancesStatus(instances)}
                    className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-2 px-3 rounded-lg text-sm transition-minimal border border-blue-200"
                    title="Atualizar status das instâncias"
                  >
                    🔄 Atualizar
                  </button>
                  <div className="text-sm text-steel-600">
                    {instances.length} instância(s) encontrada(s)
                  </div>
                </div>
              </div>

              {instances.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-gradient-sapphire rounded-full flex items-center justify-center mx-auto mb-6 shadow-sapphire-glow">
                    <span className="text-white text-2xl">📱</span>
                  </div>
                  <h4 className="text-xl font-semibold text-midnight-950 mb-4">Nenhuma instância encontrada</h4>
                  <p className="text-steel-600 max-w-md mx-auto mb-6">
                    Crie sua primeira instância do WhatsApp para começar a receber e enviar mensagens.
                  </p>
                  <button
                    onClick={handleCreateInstance}
                    className="bg-gradient-sapphire hover:bg-midnight-700 text-white font-semibold py-3 px-6 rounded-lg transition-minimal shadow-sapphire-glow hover:shadow-blue-soft"
                  >
                    Criar Primeira Instância
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {instances.map((instance) => {
                    const status = getInstanceStatus(instance);
                    return (
                      <div key={instance.name || instance.instanceName || instance.id} className="bg-white/80 backdrop-blur-sm rounded-lg border border-sapphire-200/50 p-6 shadow-blue-subtle">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-sapphire rounded-lg flex items-center justify-center shadow-sapphire-glow">
                              <span className="text-white text-lg">📱</span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-midnight-950">{instance.name || instance.instanceName}</h4>
                              <p className="text-sm text-steel-600">Criada em {new Date(instance.createdAt || instance.created_at || Date.now()).toLocaleDateString('pt-BR')}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
                              {status}
                            </span>
                            <button
                              onClick={() => refreshInstanceStatus(instance)}
                              className="text-steel-500 hover:text-steel-700 p-1 rounded transition-colors"
                              title="Atualizar status"
                            >
                              🔄
                            </button>
                            {status === 'DISCONNECTED' && (
                              <button
                                onClick={() => handleConnectInstance(instance)}
                                className="bg-gradient-sapphire hover:bg-midnight-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-minimal shadow-sapphire-glow hover:shadow-blue-soft"
                              >
                                Conectar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="space-y-6">
              {/* Header da Central de Mensagens */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-midnight-950">Central de Mensagens</h3>
                  <div className="flex items-center gap-4 mt-2">
                    <label className="text-sm text-steel-600">Instância:</label>
                    <select
                      value={selectedInstance || ''}
                      onChange={(e) => {
                        const newInstance = e.target.value;
                        setSelectedInstance(newInstance);
                        if (newInstance) {
                          console.log(`🔍 Mudando para instância: ${newInstance}`);
                          loadConversations(newInstance);
                        }
                      }}
                      className="px-3 py-1 border border-sapphire-200 rounded text-sm bg-white"
                    >
                      <option value="">Selecione uma instância para ver mensagens reais...</option>
                      {/* Mostrar primeiro as instâncias com mensagens */}
                      {instancesSummary.map((summary) => {
                        const status = instancesStatus.get(summary.instance_name);
                        return (
                          <option key={summary.instance_name} value={summary.instance_name}>
                            🔥 {summary.instance_name} ({summary.total_messages} msgs, {summary.total_contacts} contatos) - {status === 'open' ? '✅ Online' : '❌ Offline'}
                          </option>
                        );
                      })}
                      {/* Separador */}
                      {instancesSummary.length > 0 && instances.length > instancesSummary.length && (
                        <option disabled>── Outras instâncias ──</option>
                      )}
                      {/* Outras instâncias sem mensagens */}
                      {instances.filter(instance => {
                        const instanceName = instance.name || instance.instanceName;
                        return !instancesSummary.find(s => s.instance_name === instanceName);
                      }).map((instance) => {
                        const instanceName = instance.name || instance.instanceName;
                        const status = instancesStatus.get(instanceName);
                        return (
                          <option key={instanceName} value={instanceName}>
                            {instanceName} ({status === 'open' ? '✅ Conectado' : status === 'connecting' ? '🔄 Conectando' : '❌ Desconectado'}) - Sem mensagens
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {selectedInstance && (
                    <button
                      onClick={() => loadConversations(selectedInstance)}
                      className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-2 px-3 rounded-lg text-sm transition-minimal border border-blue-200"
                      title="Atualizar conversas"
                    >
                      🔄 Atualizar
                    </button>
                  )}
                </div>
              </div>

              {!selectedInstance ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-gradient-sapphire rounded-full flex items-center justify-center mx-auto mb-6 shadow-sapphire-glow">
                    <span className="text-white text-2xl">💬</span>
                  </div>
                  <h4 className="text-xl font-semibold text-midnight-950 mb-4">Selecione uma instância</h4>
                  <p className="text-steel-600 max-w-md mx-auto">
                    Para enviar e receber mensagens, selecione uma instância conectada do WhatsApp.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-12 gap-6 h-96">
                  {/* Lista de Conversas */}
                  <div className="col-span-4 bg-white/80 backdrop-blur-sm rounded-lg border border-sapphire-200/50 shadow-blue-subtle">
                    <div className="p-4 border-b border-sapphire-200/30">
                      <h4 className="font-semibold text-midnight-950">Conversas</h4>
                      <p className="text-sm text-steel-600">{conversations.length} conversa(s)</p>
                    </div>
                    <div className="overflow-y-auto h-80">
                      {conversations.length === 0 ? (
                        <div className="p-4 text-center text-steel-500">
                          <p>Nenhuma conversa encontrada</p>
                          <p className="text-xs mt-2">DEBUG: selectedInstance = {selectedInstance}</p>
                        </div>
                      ) : (
                        conversations.map((conversation) => (
                          <div
                            key={conversation.phone_number}
                            onClick={() => {
                              setSelectedConversation(conversation);
                              loadMessages(selectedInstance, conversation.phone_number);
                              if (conversation.unread_count > 0) {
                                markAsRead(selectedInstance, conversation.phone_number);
                              }
                            }}
                            className={`p-4 border-b border-sapphire-100 cursor-pointer hover:bg-blue-50 transition-colors ${
                              selectedConversation?.phone_number === conversation.phone_number ? 'bg-blue-100' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-midnight-950 truncate">
                                  {conversation.contact_name || conversation.phone_number}
                                </p>
                                <p className="text-sm text-steel-600 truncate">
                                  {conversation.last_message_content || 'Sem mensagens'}
                                </p>
                              </div>
                              {conversation.unread_count > 0 && (
                                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 ml-2">
                                  {conversation.unread_count}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-steel-500 mt-1">
                              {conversation.last_message_at && new Date(conversation.last_message_at).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Chat */}
                  <div className="col-span-8 bg-white/80 backdrop-blur-sm rounded-lg border border-sapphire-200/50 shadow-blue-subtle flex flex-col">
                    {!selectedConversation ? (
                      <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-gradient-sapphire rounded-full flex items-center justify-center mx-auto mb-4 shadow-sapphire-glow">
                            <span className="text-white text-lg">💬</span>
                          </div>
                          <p className="text-steel-600">Selecione uma conversa</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Header do Chat */}
                        <div className="p-4 border-b border-sapphire-200/30">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-sapphire rounded-full flex items-center justify-center shadow-sapphire-glow">
                              <span className="text-white text-sm">👤</span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-midnight-950">
                                {selectedConversation.contact_name || selectedConversation.phone_number}
                              </h4>
                              <p className="text-sm text-steel-600">{selectedConversation.phone_number}</p>
                            </div>
                          </div>
                        </div>

                        {/* Mensagens */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                          {messages.length === 0 ? (
                            <div className="text-center text-steel-500">
                              <p>Nenhuma mensagem encontrada</p>
                            </div>
                          ) : (
                            messages.map((message) => (
                              <div
                                key={message.id}
                                className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-xs px-4 py-2 rounded-lg ${
                                    message.direction === 'outbound'
                                      ? 'bg-gradient-sapphire text-white'
                                      : 'bg-gray-200 text-midnight-950'
                                  }`}
                                >
                                  <p className="text-sm">{message.content}</p>
                                  <p className={`text-xs mt-1 ${
                                    message.direction === 'outbound' ? 'text-blue-100' : 'text-steel-500'
                                  }`}>
                                    {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Input de Mensagem */}
                        <div className="p-4 border-t border-sapphire-200/30">
                          <div className="flex items-center space-x-3">
                            <input
                              type="text"
                              value={messageText}
                              onChange={(e) => setMessageText(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  sendMessage();
                                }
                              }}
                              placeholder="Digite sua mensagem..."
                              className="flex-1 border border-sapphire-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-sapphire-500 focus:border-sapphire-500"
                            />
                            <button
                              onClick={sendMessage}
                              disabled={!messageText.trim()}
                              className="bg-gradient-sapphire hover:bg-midnight-700 text-white font-medium py-2 px-4 rounded-lg transition-minimal shadow-sapphire-glow hover:shadow-blue-soft disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Enviar
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'contacts' && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gradient-sapphire rounded-full flex items-center justify-center mx-auto mb-6 shadow-sapphire-glow">
                <span className="text-white text-2xl">👥</span>
              </div>
              <h3 className="text-2xl font-bold text-midnight-950 mb-4">Gerenciamento de Contatos</h3>
              <p className="text-steel-600 max-w-md mx-auto">
                Organize e gerencie seus contatos do WhatsApp.
              </p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gradient-sapphire rounded-full flex items-center justify-center mx-auto mb-6 shadow-sapphire-glow">
                <span className="text-white text-2xl">⚙️</span>
              </div>
              <h3 className="text-2xl font-bold text-midnight-950 mb-4">Configurações da Evolution API</h3>
              <p className="text-steel-600 max-w-md mx-auto">
                Configure webhooks, automações e preferências da Evolution API.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal QR Code */}
      {qrCode && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md mx-4 shadow-2xl">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-midnight-950 mb-6">Conectar WhatsApp</h3>
              <div className="bg-white p-4 rounded-lg border-2 border-sapphire-200 mb-6">
                <img src={`data:image/png;base64,${qrCode.base64}`} alt="QR Code" className="mx-auto" />
              </div>
              <p className="text-steel-600 mb-6 text-sm">
                Escaneie este código QR com seu WhatsApp para conectar a instância.
              </p>
              <button
                onClick={() => setQrCode(null)}
                className="bg-gradient-sapphire hover:bg-midnight-700 text-white font-semibold py-2 px-6 rounded-lg transition-minimal"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppApp;