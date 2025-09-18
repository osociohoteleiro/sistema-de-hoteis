import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Livechat from '../components/Livechat';

const API_BASE_URL = 'http://localhost:3001/api';

const makeRequestWithRetry = async (url, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await axios.get(url);
      return response;
    } catch (error) {
      if (error.response?.status === 429 && i < maxRetries - 1) {
        const delay = Math.min(1000 * Math.pow(2, i), 10000);
        console.log(`Rate limited, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
};

const WorkspaceChatAoVivo = () => {
  const { workspaceUuid } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSystem, setActiveSystem] = useState('evolution'); // 'evolution' ou 'cloud'
  const [instances, setInstances] = useState([]);
  const [instancesStatus, setInstancesStatus] = useState(new Map());
  const [instancesSummary, setInstancesSummary] = useState([]);
  const [linkedInstances, setLinkedInstances] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [qrCode, setQrCode] = useState(null);

  useEffect(() => {
    loadWorkspaceData();
  }, [workspaceUuid]);

  const loadWorkspaceData = async () => {
    try {
      setLoading(true);

      if (!workspaceUuid || workspaceUuid === 'undefined' || workspaceUuid === 'null') {
        console.error('WorkspaceUuid inválido:', workspaceUuid);
        toast.error('UUID do workspace inválido. Redirecionando para lista de workspaces...');
        setTimeout(() => {
          window.location.href = '/workspaces';
        }, 2000);
        return;
      }

      // Carregar workspace do localStorage
      const savedWorkspace = localStorage.getItem('selectedWorkspace');
      if (savedWorkspace) {
        const parsedWorkspace = JSON.parse(savedWorkspace);
        setWorkspace(parsedWorkspace);
      }

      // Verificar configuração WhatsApp Cloud
      try {
        const cloudConfigResponse = await axios.get(`${API_BASE_URL}/whatsapp-cloud/credentials/${workspaceUuid}`);
        if (cloudConfigResponse.data.configured) {
          console.log('WhatsApp Cloud configurado para este workspace');
        }
      } catch (error) {
        console.log('WhatsApp Cloud não configurado para este workspace');
      }

      // Carregar dados Evolution API
      await Promise.all([
        loadEvolutionInstances(),
        loadInstancesSummary(),
        loadLinkedInstances()
      ]);

    } catch (error) {
      console.error('Erro ao carregar dados do workspace:', error);
      toast.error('Erro ao carregar informações do workspace');
    } finally {
      setLoading(false);
    }
  };

  const loadEvolutionInstances = async () => {
    try {
      const response = await makeRequestWithRetry(`${API_BASE_URL}/evolution/instances`);
      if (response.data.success) {
        const instancesData = response.data.data || [];
        setInstances(instancesData);

        // Carregar status das instâncias em lotes
        if (instancesData.length > 0) {
          await loadInstancesStatus(instancesData);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar instâncias Evolution:', error);
    }
  };

  const loadLinkedInstances = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/workspace-instances/${workspaceUuid}`);
      if (response.data.success) {
        const linked = response.data.data || [];
        const linkedNames = linked.map(item => item.instance_name);
        setLinkedInstances(linkedNames);
        console.log('Instâncias vinculadas ao workspace:', linkedNames);

        // Carregar conversas de todas as instâncias vinculadas
        if (linkedNames.length > 0) {
          await loadAllLinkedConversations(linkedNames);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar instâncias vinculadas:', error);
      // Se a API não existe ainda, não é erro crítico
      if (error.response?.status !== 404) {
        toast.error('Erro ao carregar vínculos de instâncias');
      }
    }
  };

  const loadInstancesSummary = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/whatsapp-messages/instances-summary`);
      if (response.data.success) {
        setInstancesSummary(response.data.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar resumo das instâncias:', error);
    }
  };

  const loadInstancesStatus = async (instancesList) => {
    const statusMap = new Map();

    // Carregar status apenas das instâncias vinculadas se existirem
    const instancesToCheck = linkedInstances.length > 0
      ? instancesList.filter(instance => {
          const instanceName = instance.name || instance.instanceName;
          return linkedInstances.includes(instanceName);
        })
      : instancesList.slice(0, 2); // Limitar a 2 instâncias se não há vínculos

    // Processar uma instância por vez para evitar rate limiting
    for (const instance of instancesToCheck) {
      try {
        const instanceName = instance.name || instance.instanceName;
        if (!instanceName) continue;

        // Delay entre requisições
        await new Promise(resolve => setTimeout(resolve, 400));

        const response = await axios.get(`${API_BASE_URL}/evolution/status/${instanceName}`);
        if (response.data.success) {
          const connectionState = response.data.data.instance?.state || 'DISCONNECTED';
          statusMap.set(instanceName, connectionState);
        } else {
          statusMap.set(instanceName, 'DISCONNECTED');
        }
      } catch (error) {
        const instanceName = instance.name || instance.instanceName || 'unknown';
        statusMap.set(instanceName, 'DISCONNECTED');

        // Se for rate limiting, parar
        if (error.response?.status === 429) {
          console.log('Rate limiting detectado, parando verificação de status');
          break;
        }
      }
    }

    setInstancesStatus(statusMap);
  };

  const loadAllLinkedConversations = async (instanceNames) => {
    try {
      let allConversations = [];

      // Carregar conversas de cada instância vinculada
      for (const instanceName of instanceNames) {
        try {
          const response = await axios.get(`${API_BASE_URL}/whatsapp-messages/conversations/${instanceName}`);
          if (response.data.success) {
            const instanceConversations = response.data.data || [];
            // Adicionar identificação da instância a cada conversa
            const conversationsWithInstance = instanceConversations.map(conv => ({
              ...conv,
              instance_name: instanceName
            }));
            allConversations = allConversations.concat(conversationsWithInstance);
          }
        } catch (error) {
          console.error(`Erro ao carregar conversas da instância ${instanceName}:`, error);
        }
      }

      // Ordenar por última mensagem
      allConversations.sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at));
      setConversations(allConversations);
      console.log(`${allConversations.length} conversas carregadas de ${instanceNames.length} instâncias`);

    } catch (error) {
      console.error('Erro ao carregar conversas das instâncias vinculadas:', error);
      toast.error('Erro ao carregar conversas');
    }
  };

  const handleConnectInstance = async (instance) => {
    try {
      const instanceName = instance.name || instance.instanceName;

      setInstancesStatus(prev => new Map(prev.set(instanceName, 'CONNECTING')));

      const response = await axios.get(`${API_BASE_URL}/evolution/qrcode/${instanceName}`);

      if (response.data.success && response.data.data.qrcode) {
        setQrCode(response.data.data.qrcode);
        toast.success('QR Code gerado! Escaneie com seu WhatsApp.');
      } else {
        toast.error('Não foi possível gerar o QR Code');
        setInstancesStatus(prev => new Map(prev.set(instanceName, 'DISCONNECTED')));
      }
    } catch (error) {
      toast.error('Erro ao conectar instância');
      const instanceName = instance.name || instance.instanceName || 'unknown';
      setInstancesStatus(prev => new Map(prev.set(instanceName, 'DISCONNECTED')));
    }
  };

  const loadConversations = async (instanceName) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/whatsapp-messages/conversations/${instanceName}`);
      if (response.data.success) {
        setConversations(response.data.data || []);
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
    if (!messageText.trim() || !selectedConversation) {
      return;
    }

    try {
      const instanceName = selectedConversation.instance_name;
      const response = await axios.post(`${API_BASE_URL}/whatsapp-messages/send/${instanceName}`, {
        phoneNumber: selectedConversation.phone_number,
        message: messageText.trim(),
        messageType: 'text'
      });

      if (response.data.success) {
        setMessageText('');
        await loadMessages(instanceName, selectedConversation.phone_number);
        toast.success('Mensagem enviada!');
      } else {
        toast.error('Erro ao enviar mensagem');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
    }
  };

  const getInstanceStatus = (instance) => {
    const instanceName = instance.name || instance.instanceName;
    let status = instancesStatus.get(instanceName);

    if (!status) {
      status = instance.connectionStatus || 'disconnected';
    }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sapphire-600 mx-auto mb-4"></div>
          <p className="text-steel-600">Carregando chat ao vivo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 p-6 shadow-blue-elegant">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                to="/workspaces"
                className="text-sapphire-600 hover:text-sapphire-700 text-sm font-medium"
              >
                ← Voltar aos Workspaces
              </Link>
              <span className="text-steel-400">|</span>
              <Link
                to={`/workspace/${workspaceUuid}/bots`}
                className="text-sapphire-600 hover:text-sapphire-700 text-sm font-medium"
              >
                Bots
              </Link>
              <span className="text-steel-400">|</span>
              <Link
                to={`/workspace/${workspaceUuid}/settings`}
                className="text-sapphire-600 hover:text-sapphire-700 text-sm font-medium"
              >
                Configurações
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-midnight-950">
              Chat ao Vivo - {workspace?.name || 'Workspace'}
            </h1>
            <p className="text-steel-700 mt-2">
              {workspace ? `Hotel: ${workspace.hotel_nome}` : 'Central de atendimento em tempo real'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full border border-green-200">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold">Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navegação entre sistemas */}
      <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 shadow-blue-elegant">
        <div className="border-b border-sapphire-200/30">
          <nav className="flex space-x-8 px-8">
            <button
              onClick={() => setActiveSystem('evolution')}
              className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeSystem === 'evolution'
                  ? 'border-sapphire-500 text-sapphire-600'
                  : 'border-transparent text-steel-600 hover:text-steel-800 hover:border-steel-300'
              }`}
            >
              <span>📱</span>
              <span>Evolution API</span>
            </button>
            <button
              onClick={() => setActiveSystem('cloud')}
              className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeSystem === 'cloud'
                  ? 'border-sapphire-500 text-sapphire-600'
                  : 'border-transparent text-steel-600 hover:text-steel-800 hover:border-steel-300'
              }`}
            >
              <span>☁️</span>
              <span>WhatsApp Cloud</span>
            </button>
          </nav>
        </div>

        <div className="p-8">
          {activeSystem === 'evolution' && (
            <div className="space-y-6">
              {/* Status das Instâncias Vinculadas */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-midnight-950">Central Evolution API</h3>
                  <p className="text-sm text-steel-600 mt-1">
                    {linkedInstances.length === 0
                      ? 'Nenhuma instância vinculada ao workspace'
                      : `${linkedInstances.length} instância(s) vinculada(s): ${linkedInstances.join(', ')}`
                    }
                  </p>
                </div>
                <Link
                  to={`/workspace/${workspaceUuid}/settings`}
                  className="bg-sapphire-100 hover:bg-sapphire-200 text-sapphire-800 font-medium py-2 px-3 rounded-lg text-sm transition-minimal border border-sapphire-200"
                >
                  ⚙️ Configurar Instâncias
                </Link>
              </div>

              {linkedInstances.length > 0 ? (
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
                        </div>
                      ) : (
                        conversations.map((conversation) => (
                          <div
                            key={`${conversation.instance_name}-${conversation.phone_number}`}
                            onClick={() => {
                              setSelectedConversation(conversation);
                              loadMessages(conversation.instance_name, conversation.phone_number);
                            }}
                            className={`p-4 border-b border-sapphire-100 cursor-pointer hover:bg-blue-50 transition-colors ${
                              selectedConversation?.phone_number === conversation.phone_number && selectedConversation?.instance_name === conversation.instance_name ? 'bg-blue-100' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-midnight-950 truncate">
                                    {conversation.contact_name || conversation.phone_number}
                                  </p>
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                    {conversation.instance_name}
                                  </span>
                                </div>
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
              ) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-gradient-sapphire rounded-full flex items-center justify-center mx-auto mb-6 shadow-sapphire-glow">
                    <span className="text-white text-2xl">⚙️</span>
                  </div>
                  <h4 className="text-xl font-semibold text-midnight-950 mb-4">Nenhuma instância vinculada</h4>
                  <p className="text-steel-600 max-w-md mx-auto mb-6">
                    Para receber mensagens aqui, você precisa vincular instâncias Evolution ao workspace.
                  </p>
                  <Link
                    to={`/workspace/${workspaceUuid}/settings`}
                    className="bg-gradient-sapphire hover:bg-midnight-700 text-white font-semibold py-3 px-8 rounded-lg transition-minimal shadow-sapphire-glow hover:shadow-blue-soft"
                  >
                    Configurar Instâncias
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeSystem === 'cloud' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-midnight-950">Central WhatsApp Cloud</h3>
              <Livechat />
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

export default WorkspaceChatAoVivo;