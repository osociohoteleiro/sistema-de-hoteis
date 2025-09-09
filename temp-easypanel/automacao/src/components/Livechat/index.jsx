import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import ConversationList from './ConversationList';
import ChatArea from './ChatArea';
import ContactInfo from './ContactInfo';

const API_BASE_URL = 'http://localhost:3001/api';

const Livechat = () => {
  const { workspaceUuid } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  // Auto-scroll do chat
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadWorkspaceData();
  }, [workspaceUuid]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.phone_number);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadWorkspaceData = async () => {
    try {
      setLoading(true);
      
      // Carregar workspace do localStorage
      const savedWorkspace = localStorage.getItem('selectedWorkspace');
      if (savedWorkspace) {
        setWorkspace(JSON.parse(savedWorkspace));
      }

      // Verificar se WhatsApp Cloud está configurado
      const configResponse = await axios.get(`${API_BASE_URL}/whatsapp-cloud/credentials/${workspaceUuid}`);
      setIsConfigured(configResponse.data.configured);

      if (configResponse.data.configured) {
        // Carregar conversas
        await loadConversations();
      }
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao conectar com a API');
    } finally {
      setLoading(false);
    }
  };

  const loadConversations = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/whatsapp-cloud/conversations/${workspaceUuid}`);
      if (response.data.success) {
        setConversations(response.data.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    }
  };

  const loadMessages = async (phoneNumber) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/whatsapp-cloud/messages/${workspaceUuid}/${phoneNumber}`);
      if (response.data.success) {
        setMessages(response.data.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      toast.error('Erro ao carregar mensagens');
    }
  };

  const sendMessage = async (text) => {
    if (!selectedConversation || !text.trim()) return;

    try {
      setSendingMessage(true);

      const response = await axios.post(`${API_BASE_URL}/whatsapp-cloud/send-message/${workspaceUuid}`, {
        to: selectedConversation.phone_number,
        text: text.trim(),
        messageId: Date.now().toString()
      });

      if (response.data.success) {
        // Adicionar mensagem localmente (otimistic update)
        const newMessage = {
          id: Date.now(),
          content: text.trim(),
          direction: 'outbound',
          status: 'sent',
          message_type: 'text',
          created_at: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, newMessage]);
        
        // Atualizar lista de conversas
        await loadConversations();
        
        toast.success('Mensagem enviada!');
      } else {
        toast.error('Erro ao enviar mensagem: ' + response.data.error);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
    setMessages([]);
  };

  const markAsRead = async (messageId) => {
    try {
      await axios.post(`${API_BASE_URL}/whatsapp-cloud/mark-read/${workspaceUuid}`, {
        messageId
      });
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sapphire-600 mx-auto mb-4"></div>
          <p className="text-steel-600">Carregando livechat...</p>
        </div>
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-gradient-sapphire rounded-full flex items-center justify-center mx-auto mb-6 shadow-sapphire-glow">
          <span className="text-white text-2xl">⚙️</span>
        </div>
        <h3 className="text-2xl font-bold text-midnight-950 mb-4">WhatsApp Cloud não configurado</h3>
        <p className="text-steel-600 max-w-md mx-auto mb-8">
          Configure suas credenciais da WhatsApp Cloud API para começar a usar o livechat.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-gradient-sapphire hover:bg-midnight-700 text-white font-semibold py-3 px-8 rounded-lg transition-minimal shadow-sapphire-glow hover:shadow-blue-soft"
        >
          Atualizar Página
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 shadow-blue-elegant overflow-hidden">
      {/* Header */}
      <div className="border-b border-sapphire-200/30 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-sapphire rounded-lg flex items-center justify-center shadow-sapphire-glow">
              <span className="text-white text-lg">💬</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-midnight-950">Livechat WhatsApp Cloud</h2>
              <p className="text-steel-600 text-sm">
                {conversations.length} conversa(s) • {workspace?.workspace_name}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full border border-green-200">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold">Online</span>
              </div>
            </div>
            <button
              onClick={loadConversations}
              className="p-2 hover:bg-sapphire-50/50 rounded-lg transition-colors"
              title="Atualizar conversas"
            >
              <svg className="w-5 h-5 text-steel-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Layout principal */}
      <div className="flex h-96">
        {/* Lista de conversas - 1/3 da largura */}
        <div className="w-1/3 border-r border-sapphire-200/30">
          <ConversationList
            conversations={conversations}
            selectedConversation={selectedConversation}
            onConversationSelect={handleConversationSelect}
          />
        </div>

        {/* Área do chat - 2/3 da largura */}
        <div className="w-2/3 flex">
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <ChatArea
                conversation={selectedConversation}
                messages={messages}
                onSendMessage={sendMessage}
                sendingMessage={sendingMessage}
                messagesEndRef={messagesEndRef}
                onMarkAsRead={markAsRead}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-sapphire rounded-full flex items-center justify-center mx-auto mb-4 shadow-sapphire-glow">
                    <span className="text-white text-2xl">💬</span>
                  </div>
                  <h3 className="text-lg font-semibold text-midnight-950 mb-2">Selecione uma conversa</h3>
                  <p className="text-steel-600 text-sm">
                    Escolha uma conversa da lista para começar o atendimento.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Painel lateral de informações do contato */}
          {selectedConversation && (
            <div className="w-80 border-l border-sapphire-200/30">
              <ContactInfo
                conversation={selectedConversation}
                workspace={workspace}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Livechat;