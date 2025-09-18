import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

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
  const [instances, setInstances] = useState([]);
  const [instancesStatus, setInstancesStatus] = useState(new Map());
  const [instancesSummary, setInstancesSummary] = useState([]);
  const [linkedInstances, setLinkedInstances] = useState([]);
  const [linkedInstancesData, setLinkedInstancesData] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [qrCode, setQrCode] = useState(null);
  const [profileImageError, setProfileImageError] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [loadingProfileImage, setLoadingProfileImage] = useState(false);
  const [conversationProfileImages, setConversationProfileImages] = useState({});
  const [loadingConversationImages, setLoadingConversationImages] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadWorkspaceData();
  }, [workspaceUuid]);

  // Auto scroll para a última mensagem quando messages mudam
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Reset profile image error when conversation changes and load profile picture
  useEffect(() => {
    setProfileImageError(false);
    setProfileImageUrl(null);

    if (selectedConversation) {
      loadProfilePicture(selectedConversation.instance_name, selectedConversation.phone_number);
    }
  }, [selectedConversation]);

  const loadProfilePicture = async (instanceName, phoneNumber) => {
    if (!instanceName || !phoneNumber) return;

    try {
      setLoadingProfileImage(true);

      // Buscar foto de perfil específica do contato
      const response = await axios.get(`${API_BASE_URL}/evolution/profile-picture/${instanceName}/${phoneNumber}`);

      if (response.data.success && response.data.data) {
        const profilePictureUrl = response.data.data.profilePictureUrl;
        if (profilePictureUrl) {
          setProfileImageUrl(profilePictureUrl);
          console.log('Foto de perfil do contato encontrada:', phoneNumber, profilePictureUrl);
        } else {
          setProfileImageError(true);
          console.log('Foto de perfil do contato não encontrada para:', phoneNumber);
        }
      } else {
        setProfileImageError(true);
        console.log('Resposta inválida ao buscar foto de perfil para:', phoneNumber);
      }
    } catch (error) {
      console.log('Erro ao buscar foto de perfil do contato:', error);
      setProfileImageError(true);
    } finally {
      setLoadingProfileImage(false);
    }
  };

  const loadConversationProfilePicture = async (instanceName, phoneNumber) => {
    if (!instanceName || !phoneNumber) return;

    const conversationKey = `${instanceName}-${phoneNumber}`;

    // Se já está carregando ou já tem a imagem, não carregar novamente
    if (loadingConversationImages[conversationKey] || conversationProfileImages[conversationKey]) {
      return;
    }

    try {
      setLoadingConversationImages(prev => ({ ...prev, [conversationKey]: true }));

      const response = await axios.get(`${API_BASE_URL}/evolution/profile-picture/${instanceName}/${phoneNumber}`);

      if (response.data.success && response.data.data && response.data.data.profilePictureUrl) {
        setConversationProfileImages(prev => ({
          ...prev,
          [conversationKey]: response.data.data.profilePictureUrl
        }));
      }
    } catch (error) {
      console.log(`Erro ao buscar foto de perfil da conversa ${phoneNumber}:`, error);
    } finally {
      setLoadingConversationImages(prev => ({ ...prev, [conversationKey]: false }));
    }
  };

  // Carregar fotos de perfil das conversas quando a lista de conversas mudar
  useEffect(() => {
    if (conversations.length > 0) {
      conversations.forEach(conversation => {
        loadConversationProfilePicture(conversation.instance_name, conversation.phone_number);
      });
    }
  }, [conversations]);

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
        setLinkedInstancesData(linked); // Armazenar dados completos incluindo custom_name
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

  const getInstanceDisplayName = (instanceName) => {
    const linkedData = linkedInstancesData.find(item => item.instance_name === instanceName);
    return linkedData?.custom_name || instanceName;
  };

  const isGroupConversation = (phoneNumber) => {
    // Verificar se é um grupo baseado no padrão do número
    // Grupos geralmente contêm '@g.us' ou têm mais de 15 dígitos (identificadores de grupo)
    return phoneNumber && (
      phoneNumber.includes('@g.us') ||
      phoneNumber.includes('-') ||
      phoneNumber.length > 15
    );
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

      {/* Chat ao Vivo */}
      <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 shadow-blue-elegant">
        <div className="p-6">
          <div className="space-y-6">
            {linkedInstances.length > 0 ? (
              <div className="grid grid-cols-12 gap-6 h-[calc(100vh-240px)]">
                {/* Lista de Conversas */}
                <div className="col-span-4 bg-white/80 backdrop-blur-sm rounded-lg border border-sapphire-200/50 shadow-blue-subtle">
                    <div className="p-4 border-b border-sapphire-200/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-midnight-950">Conversas</h4>
                          <p className="text-sm text-steel-600">{conversations.length} conversa(s)</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-steel-500">
                            {conversations.length > 0 && conversations[0]?.last_message_at &&
                              new Date(conversations[0].last_message_at).toLocaleString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="overflow-y-auto" style={{height: 'calc(100vh - 360px)'}}>
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
                            <div className="flex items-start gap-3">
                              {/* Foto de perfil */}
                              <div className="w-12 h-12 rounded-full overflow-hidden shadow-sapphire-glow border-2 border-sapphire-200 flex-shrink-0">
                                {(() => {
                                  const conversationKey = `${conversation.instance_name}-${conversation.phone_number}`;
                                  const profilePictureUrl = conversationProfileImages[conversationKey];
                                  const isLoadingImage = loadingConversationImages[conversationKey];

                                  if (isLoadingImage) {
                                    return (
                                      <div className="w-full h-full bg-gradient-sapphire flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                      </div>
                                    );
                                  } else if (profilePictureUrl) {
                                    return (
                                      <img
                                        src={profilePictureUrl}
                                        alt="Foto de perfil"
                                        className="w-full h-full object-cover"
                                        onError={() => {
                                          setConversationProfileImages(prev => {
                                            const newState = { ...prev };
                                            delete newState[conversationKey];
                                            return newState;
                                          });
                                        }}
                                      />
                                    );
                                  } else {
                                    return (
                                      <div className="w-full h-full bg-gradient-sapphire flex items-center justify-center">
                                        <span className="text-white text-lg">
                                          {isGroupConversation(conversation.phone_number) ? '👥' :
                                           (conversation.contact_name ?
                                            conversation.contact_name.charAt(0).toUpperCase() :
                                            conversation.phone_number.charAt(0)
                                           )
                                          }
                                        </span>
                                      </div>
                                    );
                                  }
                                })()}
                              </div>

                              <div className="flex-1 min-w-0">
                                {/* Nome do usuário (principal) ou número se não houver nome */}
                                <div className="flex items-center gap-2 mb-1">
                                  {isGroupConversation(conversation.phone_number) && (
                                    <span className="text-blue-600 text-sm flex-shrink-0" title="Conversa em grupo">
                                      👥
                                    </span>
                                  )}
                                  <p className="font-medium text-midnight-950 truncate text-base">
                                    {conversation.contact_name || `+${conversation.phone_number}`}
                                  </p>
                                  {conversation.unread_count > 0 && (
                                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 flex-shrink-0">
                                      {conversation.unread_count}
                                    </span>
                                  )}
                                </div>

                                {/* Número pequeno abaixo (se houver nome) */}
                                {conversation.contact_name && (
                                  <p className="text-xs text-steel-500 mb-2">
                                    +{conversation.phone_number}
                                  </p>
                                )}

                                {/* Nome personalizado da instância */}
                                <div className="flex items-center justify-between">
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                    {getInstanceDisplayName(conversation.instance_name)}
                                  </span>
                                  <p className="text-xs text-steel-500">
                                    {conversation.last_message_at && new Date(conversation.last_message_at).toLocaleString('pt-BR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>

                                {/* Última mensagem */}
                                <p className="text-sm text-steel-600 truncate mt-2">
                                  {conversation.last_message_content || 'Sem mensagens'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Chat */}
                  <div className="col-span-8 bg-white/80 backdrop-blur-sm rounded-lg border border-sapphire-200/50 shadow-blue-subtle flex flex-col h-full">
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
                            <div className="w-10 h-10 rounded-full overflow-hidden shadow-sapphire-glow border-2 border-sapphire-200">
                              {loadingProfileImage ? (
                                <div className="w-full h-full bg-gradient-sapphire flex items-center justify-center">
                                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                </div>
                              ) : profileImageUrl && !profileImageError ? (
                                <img
                                  src={profileImageUrl}
                                  alt="Foto de perfil"
                                  className="w-full h-full object-cover"
                                  onError={() => {
                                    setProfileImageError(true);
                                    setProfileImageUrl(null);
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-sapphire flex items-center justify-center">
                                  <span className="text-white text-lg">
                                    {isGroupConversation(selectedConversation.phone_number) ? '👥' :
                                     (selectedConversation.contact_name ?
                                      selectedConversation.contact_name.charAt(0).toUpperCase() :
                                      selectedConversation.phone_number.charAt(0)
                                     )
                                    }
                                  </span>
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-midnight-950">
                                  {selectedConversation.contact_name || selectedConversation.phone_number}
                                </h4>
                                {isGroupConversation(selectedConversation.phone_number) && (
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                    Grupo
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-steel-600">
                                {selectedConversation.contact_name ? selectedConversation.phone_number : getInstanceDisplayName(selectedConversation.instance_name)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Mensagens */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 max-h-[calc(100vh-420px)]">
                          {messages.length === 0 ? (
                            <div className="text-center text-steel-500">
                              <p>Nenhuma mensagem encontrada</p>
                            </div>
                          ) : (
                            <>
                              {messages.map((message) => (
                                <div
                                  key={message.id}
                                  className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'} items-end gap-2`}
                                >
                                  {message.direction === 'inbound' && (
                                    <div className="w-6 h-6 rounded-full overflow-hidden border border-sapphire-200 flex-shrink-0">
                                      {profileImageUrl && !profileImageError ? (
                                        <img
                                          src={profileImageUrl}
                                          alt="Foto de perfil"
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full bg-gradient-sapphire flex items-center justify-center">
                                          <span className="text-white text-xs">
                                            {isGroupConversation(selectedConversation.phone_number) ? '👥' :
                                             (selectedConversation.contact_name ?
                                              selectedConversation.contact_name.charAt(0).toUpperCase() :
                                              selectedConversation.phone_number.charAt(0)
                                             )
                                            }
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  )}
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
                              ))}
                              <div ref={messagesEndRef} />
                            </>
                          )}
                        </div>

                        {/* Input de Mensagem */}
                        <div className="p-4 border-t border-sapphire-200/30 mt-auto flex-shrink-0">
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