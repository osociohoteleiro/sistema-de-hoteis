import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import ImageUpload from '../components/ImageUpload';
import { convertToBase64, getMediaType } from '../utils/imageUpload';

const API_BASE_URL = 'http://localhost:3003/api';

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
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [messagesOffset, setMessagesOffset] = useState(0);
  const [qrCode, setQrCode] = useState(null);
  const [profileImageError, setProfileImageError] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [loadingProfileImage, setLoadingProfileImage] = useState(false);
  const [conversationProfileImages, setConversationProfileImages] = useState({});
  const [loadingConversationImages, setLoadingConversationImages] = useState({});
  const [conversationContactNames, setConversationContactNames] = useState({});
  const [isPollingActive, setIsPollingActive] = useState(false);
  const [lastMessageCheck, setLastMessageCheck] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    loadWorkspaceData();
  }, [workspaceUuid]);

  // Auto scroll para a última mensagem apenas quando carregar nova conversa ou enviar mensagem
  useEffect(() => {
    if (messagesEndRef.current && selectedConversation && messages.length > 0) {
      // Só fazer auto-scroll se for uma nova conversa (offset === 12) ou se enviou uma mensagem
      if (messagesOffset <= 12) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages, selectedConversation, messagesOffset]);

  // Reset profile image error when conversation changes and load profile picture
  useEffect(() => {
    setProfileImageError(false);
    setProfileImageUrl(null);

    if (selectedConversation) {
      loadProfilePicture(selectedConversation.instance_name, selectedConversation.phone_number);
      // Marcar mensagens como lidas quando abrir a conversa
      markMessagesAsRead(selectedConversation.instance_name, selectedConversation.phone_number);
    }
  }, [selectedConversation]);

  const loadProfilePicture = async (instanceName, phoneNumber) => {
    if (!instanceName || !phoneNumber) return;

    // Validar e sanitizar parâmetros
    const cleanInstanceName = instanceName.trim();
    const cleanPhoneNumber = phoneNumber.replace(/\D/g, ''); // Apenas números

    if (!cleanInstanceName || !cleanPhoneNumber) {
      console.warn('⚠️ Parâmetros inválidos para loadProfilePicture:', {
        instanceName: cleanInstanceName,
        phoneNumber: cleanPhoneNumber
      });
      return;
    }

    // Validar formato do número de telefone
    if (cleanPhoneNumber.length < 8 || cleanPhoneNumber.length > 15) {
      console.warn('⚠️ Número de telefone fora do padrão (8-15 dígitos):', cleanPhoneNumber);
      setProfileImageError(true);
      return;
    }

    // Detectar números claramente inválidos (padrões problemáticos)
    if (cleanPhoneNumber.includes('555552772') || // Padrão específico problemático
        /(\d)\1{8,}/.test(cleanPhoneNumber) || // Muitos dígitos iguais seguidos
        cleanPhoneNumber.length === 15) { // 15 dígitos é suspeito
      console.warn('⚠️ Número de telefone suspeito detectado:', cleanPhoneNumber);
      setProfileImageError(true);
      return;
    }

    try {
      setLoadingProfileImage(true);

      // Buscar informações completas do contato (foto e nome)
      const encodedInstanceName = encodeURIComponent(cleanInstanceName);
      const response = await axios.get(`${API_BASE_URL}/evolution/contact/${encodedInstanceName}/${cleanPhoneNumber}`);

      if (response.data.success && response.data.data) {
        const contactData = response.data.data;

        if (contactData.picture) {
          setProfileImageUrl(contactData.picture);
          console.log('Foto de perfil do contato encontrada:', phoneNumber, contactData.picture);
        } else {
          setProfileImageError(true);
          console.log('Foto de perfil do contato não encontrada para:', phoneNumber);
        }
      } else {
        setProfileImageError(true);
        console.log('Resposta inválida ao buscar informações do contato para:', phoneNumber);
      }
    } catch (error) {
      // Tratar casos específicos de erro da Evolution API
      if (error.response?.status === 400) {
        const errorData = error.response?.data;
        if (errorData?.error?.response?.message?.[0]?.exists === false) {
          console.log(`📞 Contato ${cleanPhoneNumber} não existe no WhatsApp (${cleanInstanceName})`);
          // Marcar como erro de imagem, mas não logar erro crítico
          setProfileImageError(true);
        } else {
          console.warn(`⚠️ Erro 400 ao buscar foto do contato ${cleanPhoneNumber}:`, errorData);
          setProfileImageError(true);
        }
      } else {
        console.error(`❌ Erro ao buscar informações do contato:`, {
          instanceName: cleanInstanceName,
          phoneNumber: cleanPhoneNumber,
          status: error.response?.status,
          message: error.message
        });
        setProfileImageError(true);
      }
    } finally {
      setLoadingProfileImage(false);
    }
  };

  const loadConversationContactInfo = async (instanceName, phoneNumber) => {
    if (!instanceName || !phoneNumber) return;

    // Validar e sanitizar parâmetros
    const cleanInstanceName = instanceName.trim();
    const cleanPhoneNumber = phoneNumber.replace(/\D/g, ''); // Apenas números

    if (!cleanInstanceName || !cleanPhoneNumber) {
      console.warn('⚠️ Parâmetros inválidos para loadConversationContactInfo:', {
        instanceName: cleanInstanceName,
        phoneNumber: cleanPhoneNumber
      });
      return;
    }

    // Validar formato do número de telefone
    if (cleanPhoneNumber.length < 8 || cleanPhoneNumber.length > 15) {
      console.warn('⚠️ Número de telefone fora do padrão (8-15 dígitos):', cleanPhoneNumber);
      return;
    }

    // Detectar números claramente inválidos (padrões problemáticos)
    if (cleanPhoneNumber.includes('555552772') || // Padrão específico problemático
        /(\d)\1{8,}/.test(cleanPhoneNumber) || // Muitos dígitos iguais seguidos
        cleanPhoneNumber.length === 15) { // 15 dígitos é suspeito
      console.warn('⚠️ Número de telefone suspeito detectado:', cleanPhoneNumber);
      return;
    }

    const conversationKey = `${cleanInstanceName}-${cleanPhoneNumber}`;

    // Se já está carregando ou já tem as informações, não carregar novamente
    if (loadingConversationImages[conversationKey] ||
        (conversationProfileImages[conversationKey] && conversationContactNames[conversationKey])) {
      return;
    }

    try {
      setLoadingConversationImages(prev => ({ ...prev, [conversationKey]: true }));

      // Buscar informações completas do contato (nome e foto)
      const encodedInstanceName = encodeURIComponent(cleanInstanceName);
      const contactResponse = await axios.get(`${API_BASE_URL}/evolution/contact/${encodedInstanceName}/${cleanPhoneNumber}`);

      if (contactResponse.data.success && contactResponse.data.data) {
        const contactData = contactResponse.data.data;

        // Salvar nome do contato
        if (contactData.name) {
          setConversationContactNames(prev => ({
            ...prev,
            [conversationKey]: contactData.name
          }));
        }

        // Salvar foto de perfil
        if (contactData.picture) {
          setConversationProfileImages(prev => ({
            ...prev,
            [conversationKey]: contactData.picture
          }));
        }

        console.log(`Informações do contato carregadas: ${phoneNumber} - Nome: ${contactData.name}`);
      }
    } catch (error) {
      // Tratar casos específicos de erro da Evolution API
      if (error.response?.status === 400) {
        const errorData = error.response?.data;
        if (errorData?.error?.response?.message?.[0]?.exists === false) {
          console.log(`📞 Contato ${cleanPhoneNumber} não existe no WhatsApp (${cleanInstanceName})`);
          // Não mostrar erro para contatos que não existem
        } else {
          console.warn(`⚠️ Erro 400 ao buscar contato ${cleanPhoneNumber}:`, errorData);
        }
      } else {
        console.error(`❌ Erro ao buscar informações do contato ${cleanPhoneNumber}:`, {
          instanceName: cleanInstanceName,
          phoneNumber: cleanPhoneNumber,
          status: error.response?.status,
          message: error.message
        });
      }
    } finally {
      setLoadingConversationImages(prev => ({ ...prev, [conversationKey]: false }));
    }
  };

  // Carregar informações dos contatos das conversas quando a lista de conversas mudar
  useEffect(() => {
    if (conversations.length > 0) {
      conversations.forEach(conversation => {
        loadConversationContactInfo(conversation.instance_name, conversation.phone_number);
      });
    }
  }, [conversations]);

  // Listener para scroll na área de mensagens (carregar mais mensagens)
  useEffect(() => {
    const messagesContainer = messagesContainerRef.current;
    if (!messagesContainer) return;

    const handleScroll = () => {
      // Verificar se chegou no topo (scrollTop próximo de 0)
      if (messagesContainer.scrollTop <= 50 && hasMoreMessages && !loadingMessages) {
        console.log('📜 Carregando mais mensagens...');
        loadMoreMessages();
      }
    };

    messagesContainer.addEventListener('scroll', handleScroll);
    return () => messagesContainer.removeEventListener('scroll', handleScroll);
  }, [hasMoreMessages, loadingMessages, selectedConversation]);

  // Polling para atualizar contadores de mensagens não lidas e conversas
  useEffect(() => {
    if (linkedInstances.length === 0) return;

    const interval = setInterval(async () => {
      try {
        // Recarregar conversas para sincronizar contadores
        await loadAllLinkedConversations(linkedInstances);
      } catch (error) {
        console.error('Erro ao atualizar contadores:', error);
      }
    }, 5000); // Atualizar a cada 5 segundos

    return () => clearInterval(interval);
  }, [linkedInstances]);

  // Polling para atualizar mensagens da conversa selecionada
  useEffect(() => {
    if (!selectedConversation) return;

    setIsPollingActive(true);

    const interval = setInterval(async () => {
      try {
        setLastMessageCheck(new Date());

        // Buscar novas mensagens da conversa atual
        const response = await axios.get(`${API_BASE_URL}/whatsapp-messages/${selectedConversation.instance_name}/${selectedConversation.phone_number}?limit=12&offset=0`);

        if (response.data.success) {
          const newMessages = response.data.data.messages || [];

          // Verificar se há mensagens novas
          if (newMessages.length > 0) {
            if (messages.length === 0) {
              // Se não há mensagens atuais, carregar as novas
              setMessages(newMessages);
            } else {
              // Verificar se há mensagens realmente novas
              const currentMessageIds = new Set(messages.map(msg => msg.message_id || msg.id));
              const hasNewMessages = newMessages.some(msg => !currentMessageIds.has(msg.message_id || msg.id));

              if (hasNewMessages) {
                console.log('🔄 Nova mensagem detectada, atualizando...');

                // Verificar se o usuário está no final da conversa para auto-scroll
                const shouldAutoScroll = messagesContainerRef.current &&
                  (messagesContainerRef.current.scrollTop + messagesContainerRef.current.clientHeight >=
                   messagesContainerRef.current.scrollHeight - 100);

                setMessages(newMessages);

                // Auto scroll apenas se estava no final da conversa
                if (shouldAutoScroll) {
                  setTimeout(() => {
                    if (messagesEndRef.current) {
                      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
                    }
                  }, 100);
                }

                // Marcar mensagens como lidas automaticamente
                markMessagesAsRead(selectedConversation.instance_name, selectedConversation.phone_number);
              }
            }
          }
        }
      } catch (error) {
        console.error('Erro ao verificar novas mensagens:', error);
      }
    }, 3000); // Verificar a cada 3 segundos

    return () => {
      clearInterval(interval);
      setIsPollingActive(false);
    };
  }, [selectedConversation, messages]);

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

        // Filtrar e validar nomes de instâncias antes de usar
        const linkedNames = linked
          .map(item => item.instance_name)
          .filter(name => {
            if (!name || typeof name !== 'string') {
              console.warn('⚠️ Nome de instância inválido encontrado:', name);
              return false;
            }

            const trimmedName = name.trim();
            if (!trimmedName) {
              console.warn('⚠️ Nome de instância vazio encontrado:', name);
              return false;
            }

            // Verificar caracteres problemáticos
            if (trimmedName.includes('$(') || trimmedName.includes('%') || trimmedName.includes(' ')) {
              console.warn('⚠️ Nome de instância com caracteres especiais encontrado:', trimmedName);
              return false;
            }

            return true;
          });

        setLinkedInstances(linkedNames);
        setLinkedInstancesData(linked); // Armazenar dados completos incluindo custom_name
        console.log('✅ Instâncias vinculadas ao workspace (filtradas):', {
          total: linked.length,
          valid: linkedNames.length,
          names: linkedNames
        });

        // Carregar conversas de todas as instâncias vinculadas (apenas válidas)
        if (linkedNames.length > 0) {
          await loadAllLinkedConversations(linkedNames);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar instâncias vinculadas:', error);
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

      // Filtrar e validar nomes de instâncias antes de fazer requisições
      const validInstanceNames = instanceNames.filter(instanceName => {
        // Verificar se o nome da instância é válido
        if (!instanceName || typeof instanceName !== 'string') {
          console.warn('⚠️ Nome de instância inválido (não é string):', instanceName);
          return false;
        }

        // Verificar se contém caracteres especiais problemáticos
        if (instanceName.includes('$(') || instanceName.includes('%') || instanceName.includes(' ')) {
          console.warn('⚠️ Nome de instância contém caracteres inválidos:', instanceName);
          return false;
        }

        // Verificar se está vazio após trim
        const trimmedName = instanceName.trim();
        if (!trimmedName) {
          console.warn('⚠️ Nome de instância vazio após trim:', instanceName);
          return false;
        }

        return true;
      });

      console.log(`🔍 Instâncias filtradas: ${validInstanceNames.length}/${instanceNames.length}`, {
        original: instanceNames,
        valid: validInstanceNames
      });

      // Carregar conversas de cada instância vinculada (apenas válidas)
      for (const instanceName of validInstanceNames) {
        try {
          // Garantir que o instanceName está devidamente codificado para URL
          const encodedInstanceName = encodeURIComponent(instanceName);
          const response = await axios.get(`${API_BASE_URL}/whatsapp-messages/conversations/${encodedInstanceName}`);
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
          console.error(`❌ Erro ao carregar conversas da instância ${instanceName}:`, {
            instanceName,
            status: error.response?.status,
            message: error.message,
            url: error.config?.url
          });
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

  const loadMessages = async (instanceName, phoneNumber, isLoadMore = false) => {
    if (loadingMessages) return;

    try {
      setLoadingMessages(true);

      const limit = 12;
      const offset = isLoadMore ? messagesOffset : 0;

      const response = await axios.get(`${API_BASE_URL}/whatsapp-messages/${instanceName}/${phoneNumber}?limit=${limit}&offset=${offset}`);

      if (response.data.success) {
        const newMessages = response.data.data.messages || [];
        const pagination = response.data.data.pagination || {};

        if (isLoadMore) {
          // Adicionar mensagens mais antigas no início do array
          setMessages(prev => [...newMessages, ...prev]);
          setMessagesOffset(prev => prev + limit);
        } else {
          // Primeira carga - resetar tudo
          setMessages(newMessages);
          setMessagesOffset(limit);
        }

        // Verificar se há mais mensagens para carregar
        setHasMoreMessages(pagination.hasMore || false);

        console.log(`Carregadas ${newMessages.length} mensagens (offset: ${offset}, hasMore: ${pagination.hasMore})`);
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setLoadingMessages(false);
    }
  };

  const loadMoreMessages = async () => {
    if (!selectedConversation || !hasMoreMessages || loadingMessages) return;

    await loadMessages(selectedConversation.instance_name, selectedConversation.phone_number, true);
  };

  const markMessagesAsRead = async (instanceName, phoneNumber) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/whatsapp-messages/mark-read/${instanceName}/${phoneNumber}`);

      if (response.data.success) {
        // Atualizar contador local na lista de conversas
        setConversations(prev => prev.map(conv => {
          if (conv.instance_name === instanceName && conv.phone_number === phoneNumber) {
            return { ...conv, unread_count: 0 };
          }
          return conv;
        }));

        console.log(`✅ Mensagens marcadas como lidas: ${phoneNumber}`);
      }
    } catch (error) {
      console.error('Erro ao marcar mensagens como lidas:', error);
    }
  };

  const updateUnreadCount = (instanceName, phoneNumber, increment = 1) => {
    setConversations(prev => prev.map(conv => {
      if (conv.instance_name === instanceName && conv.phone_number === phoneNumber) {
        return {
          ...conv,
          unread_count: Math.max(0, conv.unread_count + increment)
        };
      }
      return conv;
    }));
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) {
      return;
    }

    const messageToSend = messageText.trim();
    setMessageText(''); // Limpar imediatamente para melhor UX

    try {
      const instanceName = selectedConversation.instance_name;
      const response = await axios.post(`${API_BASE_URL}/whatsapp-messages/send/${instanceName}`, {
        phoneNumber: selectedConversation.phone_number,
        message: messageToSend,
        messageType: 'text'
      });

      if (response.data.success) {
        // Adicionar mensagem enviada imediatamente ao estado local para aparecer instantaneamente
        const sentMessage = {
          id: `sent_${Date.now()}`,
          message_id: response.data.data?.message_id || `sent_${Date.now()}`,
          phone_number: selectedConversation.phone_number,
          contact_name: selectedConversation.contact_name,
          message_type: 'text',
          content: messageToSend,
          direction: 'outbound',
          timestamp: new Date().toISOString(),
          read_at: null,
          delivered_at: null
        };

        // Adicionar a mensagem ao final da lista atual
        setMessages(prev => [...prev, sentMessage]);

        // Auto scroll para a nova mensagem
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);

        // Atualizar a lista de conversas para refletir a nova última mensagem
        setTimeout(async () => {
          try {
            await loadAllLinkedConversations(linkedInstances);
          } catch (error) {
            console.error('Erro ao atualizar conversas:', error);
          }
        }, 500);

        toast.success('Mensagem enviada!');
      } else {
        toast.error('Erro ao enviar mensagem');
        setMessageText(messageToSend); // Restaurar texto se houve erro
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
      setMessageText(messageToSend); // Restaurar texto se houve erro
    }
  };

  const sendFileMessage = async (uploadResult) => {
    if (!uploadResult || !selectedConversation) {
      return;
    }

    setIsUploadingFile(true);

    try {
      const instanceName = selectedConversation.instance_name;

      console.log('📤 sendFileMessage: Iniciando envio com uploadResult:', {
        hasUrl: !!uploadResult.url,
        isBase64: uploadResult.isBase64,
        mediaType: uploadResult.mediaType,
        originalName: uploadResult.originalName,
        size: uploadResult.size,
        fallback: uploadResult.fallback
      });

      // Converter arquivo para Base64
      let mediaBase64;

      if (uploadResult.isBase64) {
        // Arquivo já está em Base64 (fallback usado)
        console.log('📤 Usando Base64 direto (fallback)');
        const base64Data = uploadResult.url;
        if (base64Data.includes(',')) {
          mediaBase64 = base64Data.split(',')[1];
        } else {
          mediaBase64 = base64Data;
        }
      } else if (uploadResult.url.startsWith('data:')) {
        // URL é Base64 data URL
        console.log('📤 Convertendo data URL para Base64');
        mediaBase64 = uploadResult.url.split(',')[1];
      } else {
        // Arquivo foi enviado para S3 ou outra URL - tentar fetch com fallback
        console.log('📤 Tentando fetch da URL S3:', uploadResult.url);
        try {
          const response = await fetch(uploadResult.url, {
            mode: 'cors',
            cache: 'no-cache'
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const blob = await response.blob();
          console.log('📤 Blob recebido:', {
            size: blob.size,
            type: blob.type
          });

          const file = new File([blob], uploadResult.originalName || 'file', {
            type: blob.type || 'application/octet-stream'
          });
          const base64String = await convertToBase64(file);
          mediaBase64 = base64String.split(',')[1];
          console.log('✅ Conversão S3 → Base64 concluída');
        } catch (fetchError) {
          console.error('❌ Erro ao buscar arquivo da URL S3:', fetchError);

          // Se não conseguir fazer fetch, verificar se temos dados alternativos
          if (uploadResult.base64Data) {
            console.log('📤 Usando base64Data alternativo do uploadResult');
            mediaBase64 = uploadResult.base64Data;
          } else {
            throw new Error(`Não foi possível acessar o arquivo: ${fetchError.message}`);
          }
        }
      }

      console.log('📤 Preparando envio:', {
        mediaType: uploadResult.mediaType,
        fileName: uploadResult.originalName,
        mediaSize: mediaBase64 ? mediaBase64.length : 0,
        isBase64: uploadResult.isBase64,
        hasMediaBase64: !!mediaBase64,
        instanceName,
        phoneNumber: selectedConversation.phone_number
      });

      // Validar dados antes do envio
      const finalMediaType = uploadResult.mediaType || getMediaType({ type: uploadResult.url.includes('pdf') ? 'application/pdf' : 'image/jpeg' });
      const finalFileName = uploadResult.originalName || 'arquivo';

      if (!mediaBase64) {
        throw new Error('Media base64 não foi gerado corretamente');
      }

      if (!finalMediaType) {
        throw new Error('Tipo de mídia não foi determinado');
      }

      const payload = {
        number: selectedConversation.phone_number,
        mediatype: finalMediaType.toLowerCase(),
        filename: finalFileName,
        caption: '',
        media: mediaBase64,
        workspaceName: workspace?.name || 'default'
      };

      console.log('📤 Payload final para Evolution API:', {
        endpoint: `${API_BASE_URL}/evolution/message/sendMedia/${instanceName}`,
        number: payload.number,
        mediatype: payload.mediatype,
        filename: payload.filename,
        hasMedia: !!payload.media,
        mediaLength: payload.media ? payload.media.length : 0
      });

      // Enviar arquivo via Evolution API
      const response = await axios.post(`${API_BASE_URL}/evolution/message/sendMedia/${instanceName}`, payload);

      if (response.data.success || response.status === 201) {
        // Adicionar mensagem de arquivo ao estado local
        const sentMessage = {
          id: `sent_file_${Date.now()}`,
          message_id: response.data.data?.message_id || `sent_file_${Date.now()}`,
          phone_number: selectedConversation.phone_number,
          contact_name: selectedConversation.contact_name,
          message_type: 'media',
          content: uploadResult.originalName || finalFileName || 'Arquivo',
          media_url: response.data.data?.media_url || uploadResult.url, // ✅ Usar URL do S3 se disponível
          media_type: uploadResult.mediaType || finalMediaType,
          direction: 'outbound',
          timestamp: new Date().toISOString(),
          read_at: null,
          delivered_at: null
        };

        // Adicionar a mensagem ao final da lista atual
        setMessages(prev => [...prev, sentMessage]);

        // Auto scroll para a nova mensagem
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);

        // Limpar arquivo selecionado
        setSelectedFile(null);

        // Atualizar a lista de conversas
        setTimeout(async () => {
          try {
            await loadAllLinkedConversations(linkedInstances);
          } catch (error) {
            console.error('Erro ao atualizar conversas:', error);
          }
        }, 500);

        toast.success('Arquivo enviado!');
      } else {
        toast.error('Erro ao enviar arquivo');
      }
    } catch (error) {
      console.error('❌ Erro completo ao enviar arquivo:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method
        },
        stack: error.stack?.split('\n').slice(0, 3)
      });

      // Tratamento de erro específico e detalhado
      let errorMessage = 'Erro ao enviar arquivo';

      if (error.response?.status === 400) {
        console.error('❌ Erro 400 - Detalhes:', error.response.data);
        if (error.response.data?.error) {
          errorMessage = `Erro 400: ${error.response.data.error}`;
        } else if (error.response.data?.message) {
          errorMessage = `Erro 400: ${error.response.data.message}`;
        } else {
          errorMessage = 'Erro 400: Dados inválidos para o upload';
        }
      } else if (error.response?.status === 401) {
        errorMessage = 'Erro 401: Não autorizado - verifique as credenciais da instância';
      } else if (error.response?.status === 404) {
        errorMessage = 'Instância não encontrada ou desconectada';
      } else if (error.response?.status === 500) {
        errorMessage = 'Erro interno do servidor Evolution';
      } else if (error.message.includes('Network Error')) {
        errorMessage = 'Erro de conexão com o servidor';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Timeout - arquivo muito grande ou conexão lenta';
      } else if (error.message.includes('base64')) {
        errorMessage = 'Erro ao processar arquivo - problema na conversão';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      toast.error(errorMessage);
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleFileUpload = (uploadResult) => {
    if (uploadResult) {
      setSelectedFile(uploadResult);
      // Enviar automaticamente após upload
      sendFileMessage(uploadResult);
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
                              // Reset paginação para nova conversa
                              setMessages([]);
                              setMessagesOffset(0);
                              setHasMoreMessages(true);
                              // Carregar primeiras mensagens
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
                                    {(() => {
                                      const conversationKey = `${conversation.instance_name}-${conversation.phone_number}`;
                                      const evolutionContactName = conversationContactNames[conversationKey];

                                      // Prioridade: 1. Nome da Evolution API, 2. Nome do banco, 3. Número
                                      return evolutionContactName || conversation.contact_name || `+${conversation.phone_number}`;
                                    })()}
                                  </p>
                                  {conversation.unread_count > 0 && (
                                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 flex-shrink-0 font-semibold shadow-lg animate-pulse">
                                      {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
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
                          <div className="flex items-center justify-between">
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
                                    {(() => {
                                      const conversationKey = `${selectedConversation.instance_name}-${selectedConversation.phone_number}`;
                                      const evolutionContactName = conversationContactNames[conversationKey];

                                      // Prioridade: 1. Nome da Evolution API, 2. Nome do banco, 3. Número
                                      return evolutionContactName || selectedConversation.contact_name || selectedConversation.phone_number;
                                    })()}
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

                            {/* Indicador de polling ativo */}
                            <div className="flex items-center space-x-2">
                              {isPollingActive && (
                                <div className="flex items-center space-x-2 text-xs text-green-600">
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                  <span>Tempo real</span>
                                </div>
                              )}
                              {lastMessageCheck && (
                                <div className="text-xs text-steel-500">
                                  Última verificação: {lastMessageCheck.toLocaleTimeString('pt-BR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Mensagens */}
                        <div
                          ref={messagesContainerRef}
                          className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 max-h-[calc(100vh-420px)]"
                        >
                          {/* Indicador de carregamento no topo */}
                          {loadingMessages && hasMoreMessages && (
                            <div className="text-center py-2">
                              <div className="inline-flex items-center gap-2 text-steel-500">
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-sapphire-600 border-t-transparent"></div>
                                <span className="text-sm">Carregando mensagens...</span>
                              </div>
                            </div>
                          )}

                          {messages.length === 0 && !loadingMessages ? (
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
                                    className={`max-w-xs rounded-lg overflow-hidden ${
                                      message.direction === 'outbound'
                                        ? 'bg-gradient-sapphire text-white'
                                        : 'bg-gray-200 text-midnight-950'
                                    }`}
                                  >
                                    {/* Renderizar mídia se for mensagem de arquivo */}
                                    {['image', 'video', 'audio', 'document'].includes(message.message_type) ? (
                                      <div className="media-content">
                                        {message.message_type === 'image' ? (
                                          <div className="relative">
                                            {message.media_url ? (
                                              <img
                                                src={message.media_url}
                                                alt={message.content || 'Imagem'}
                                                className="w-full max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                                style={{ maxHeight: '300px', objectFit: 'cover' }}
                                                onClick={() => window.open(message.media_url, '_blank')}
                                                onError={(e) => {
                                                  e.target.style.display = 'none';
                                                  e.target.nextSibling.style.display = 'block';
                                                }}
                                              />
                                            ) : null}
                                            {/* Fallback se imagem não carregar ou não tiver URL */}
                                            <div className={`p-4 text-center bg-gray-100 rounded-lg ${message.media_url ? 'hidden' : ''}`}>
                                              <div className="text-gray-600 mb-2">
                                                <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                                                  <path d="M5,4H7L9,2H15L17,4H19A2,2 0 0,1 21,6V18A2,2 0 0,1 19,20H5A2,2 0 0,1 3,18V6A2,2 0 0,1 5,4M12,7A5,5 0 0,0 7,12A5,5 0 0,0 12,17A5,5 0 0,0 17,12A5,5 0 0,0 12,7M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9Z" />
                                                </svg>
                                              </div>
                                              <p className="text-sm text-gray-700">{message.content}</p>
                                              <p className="text-xs text-gray-500 mt-1">Imagem enviada</p>
                                            </div>
                                          </div>
                                        ) : message.message_type === 'video' ? (
                                          <div className="relative">
                                            {message.media_url ? (
                                              <video
                                                className="w-full max-w-xs rounded-lg"
                                                style={{ maxHeight: '300px' }}
                                                controls
                                                preload="metadata"
                                              >
                                                <source src={message.media_url} type="video/mp4" />
                                                <source src={message.media_url} type="video/webm" />
                                                <source src={message.media_url} type="video/ogg" />
                                                Seu navegador não suporta reprodução de vídeo.
                                              </video>
                                            ) : (
                                              <div className="p-4 text-center bg-gray-100 rounded-lg">
                                                <div className="text-gray-600 mb-2">
                                                  <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z" />
                                                  </svg>
                                                </div>
                                                <p className="text-sm text-gray-700">{message.content}</p>
                                                <p className="text-xs text-gray-500 mt-1">Vídeo enviado</p>
                                              </div>
                                            )}
                                            {message.media_url && (
                                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div className="bg-black bg-opacity-50 rounded-full p-2">
                                                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M8,5.14V19.14L19,12.14L8,5.14Z" />
                                                  </svg>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        ) : message.message_type === 'audio' ? (
                                          <div className="p-4">
                                            <div className="flex items-center space-x-3">
                                              <div className="text-blue-500">
                                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                                  <path d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.85 14,18.71V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z" />
                                                </svg>
                                              </div>
                                              <div className="flex-1">
                                                {message.media_url ? (
                                                  <audio className="w-full" controls preload="metadata">
                                                    <source src={message.media_url} type="audio/mp3" />
                                                    <source src={message.media_url} type="audio/wav" />
                                                    <source src={message.media_url} type="audio/ogg" />
                                                    Seu navegador não suporta reprodução de áudio.
                                                  </audio>
                                                ) : (
                                                  <div className="text-center">
                                                    <p className="text-sm text-gray-700">{message.content}</p>
                                                    <p className="text-xs text-gray-500 mt-1">Áudio enviado</p>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        ) : (
                                          // Documento ou arquivo genérico
                                          <div className="p-4 flex items-center space-x-3 cursor-pointer hover:bg-opacity-80 transition-colors"
                                               onClick={() => window.open(message.media_url, '_blank')}>
                                            <div className="text-blue-500">
                                              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                                              </svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm font-medium truncate">{message.content}</p>
                                              <p className="text-xs opacity-70">Clique para abrir</p>
                                            </div>
                                          </div>
                                        )}

                                        {/* Timestamp para mídia */}
                                        <div className="px-4 pb-2">
                                          <p className={`text-xs ${
                                            message.direction === 'outbound' ? 'text-blue-100' : 'text-steel-500'
                                          }`}>
                                            {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
                                              hour: '2-digit',
                                              minute: '2-digit'
                                            })}
                                          </p>
                                        </div>
                                      </div>
                                    ) : (
                                      // Mensagem de texto normal (ou arquivo sem mídia)
                                      <div className="px-4 py-2">
                                        {/* Detectar se é um arquivo baseado na extensão do nome */}
                                        {/\.(jpg|jpeg|png|gif|webp|mp4|avi|mov|pdf|doc|docx|txt)$/i.test(message.content) ? (
                                          <div className="flex items-center space-x-3">
                                            <div className="text-blue-500">
                                              {/\.(jpg|jpeg|png|gif|webp)$/i.test(message.content) ? (
                                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                                                </svg>
                                              ) : /\.(mp4|avi|mov)$/i.test(message.content) ? (
                                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                                  <path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z" />
                                                </svg>
                                              ) : (
                                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                                                </svg>
                                              )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm font-medium truncate">{message.content}</p>
                                              <p className="text-xs opacity-70">Arquivo</p>
                                            </div>
                                          </div>
                                        ) : (
                                          <p className="text-sm">{message.content}</p>
                                        )}
                                        <p className={`text-xs mt-1 ${
                                          message.direction === 'outbound' ? 'text-blue-100' : 'text-steel-500'
                                        }`}>
                                          {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </p>
                                      </div>
                                    )}
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
                            {/* Botão de anexo */}
                            <ImageUpload
                              onChange={handleFileUpload}
                              workspaceName={workspace?.name}
                              compact={true}
                              className="flex-shrink-0"
                            />

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
                              disabled={isUploadingFile}
                            />

                            <button
                              onClick={sendMessage}
                              disabled={!messageText.trim() || isUploadingFile}
                              className="bg-gradient-sapphire hover:bg-midnight-700 text-white font-medium py-2 px-4 rounded-lg transition-minimal shadow-sapphire-glow hover:shadow-blue-soft disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isUploadingFile ? (
                                <div className="flex items-center space-x-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                  <span>Enviando...</span>
                                </div>
                              ) : (
                                'Enviar'
                              )}
                            </button>
                          </div>

                          {/* Preview do arquivo selecionado */}
                          {selectedFile && (
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    {selectedFile.mediaType === 'image' ? '🖼️' :
                                     selectedFile.mediaType === 'video' ? '🎥' :
                                     selectedFile.mediaType === 'audio' ? '🎵' :
                                     '📄'}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-blue-900">
                                      {selectedFile.originalName || 'Arquivo'}
                                    </p>
                                    <p className="text-xs text-blue-600">
                                      Pronto para enviar
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => setSelectedFile(null)}
                                  className="text-blue-400 hover:text-blue-600"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          )}
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