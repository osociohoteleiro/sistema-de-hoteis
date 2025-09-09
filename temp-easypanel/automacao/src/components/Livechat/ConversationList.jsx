import { useState } from 'react';

const ConversationList = ({ conversations, selectedConversation, onConversationSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = conversations.filter(conversation => 
    conversation.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conversation.phone_number.includes(searchTerm)
  );

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = (now - date) / (1000 * 60 * 60);

    if (diffHours < 1) {
      return 'Agora';
    } else if (diffHours < 24) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  const truncateMessage = (message, maxLength = 50) => {
    if (!message) return 'Sem mensagens';
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
  };

  const getContactInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="h-full flex flex-col bg-white/80 backdrop-blur-sm">
      {/* Barra de busca */}
      <div className="p-4 border-b border-sapphire-200/30">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-steel-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-sapphire-200/50 rounded-lg focus:ring-2 focus:ring-sapphire-500 focus:border-transparent bg-white/80 backdrop-blur-sm text-sm"
            placeholder="Buscar conversa..."
          />
        </div>
      </div>

      {/* Lista de conversas */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-6 text-center">
            {conversations.length === 0 ? (
              <div>
                <div className="w-12 h-12 bg-gradient-sapphire rounded-full flex items-center justify-center mx-auto mb-3 shadow-sapphire-glow">
                  <span className="text-white text-lg">📱</span>
                </div>
                <p className="text-steel-600 text-sm font-medium">Nenhuma conversa ainda</p>
                <p className="text-steel-500 text-xs mt-1">As conversas aparecerão aqui quando alguém enviar uma mensagem.</p>
              </div>
            ) : (
              <div>
                <p className="text-steel-600 text-sm">Nenhuma conversa encontrada</p>
                <p className="text-steel-500 text-xs mt-1">Tente buscar por outro termo.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-sapphire-200/30">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.phone_number}
                onClick={() => onConversationSelect(conversation)}
                className={`w-full p-4 text-left hover:bg-sapphire-50/50 transition-colors relative ${
                  selectedConversation?.phone_number === conversation.phone_number
                    ? 'bg-sapphire-100/80 border-r-2 border-sapphire-500'
                    : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-sapphire rounded-full flex items-center justify-center shadow-sapphire-glow">
                      <span className="text-white text-sm font-semibold">
                        {getContactInitials(conversation.contact_name || conversation.phone_number)}
                      </span>
                    </div>
                  </div>

                  {/* Informações da conversa */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-midnight-950 truncate">
                        {conversation.contact_name || conversation.phone_number}
                      </p>
                      <span className="text-xs text-steel-500 flex-shrink-0 ml-2">
                        {formatTime(conversation.last_message_time)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-steel-600 truncate flex-1">
                        {conversation.last_message_direction === 'outbound' && '✓ '}
                        {truncateMessage(conversation.last_message)}
                      </p>
                      
                      {conversation.unread_count > 0 && (
                        <span className="ml-2 bg-sapphire-500 text-white text-xs rounded-full px-2 py-0.5 min-w-0 flex-shrink-0">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-steel-500">
                        {conversation.phone_number}
                      </span>
                      
                      {/* Status indicators */}
                      <div className="flex items-center space-x-1">
                        {conversation.last_message_direction === 'outbound' && (
                          <div className="flex items-center">
                            <svg className="w-3 h-3 text-sapphire-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Indicador de seleção */}
                {selectedConversation?.phone_number === conversation.phone_number && (
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-sapphire-500 rounded-l"></div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer com estatísticas */}
      <div className="p-3 border-t border-sapphire-200/30 bg-sapphire-50/30">
        <div className="flex items-center justify-between text-xs text-steel-600">
          <span>{filteredConversations.length} conversa(s)</span>
          <span>
            {filteredConversations.reduce((acc, conv) => acc + (conv.unread_count || 0), 0)} não lida(s)
          </span>
        </div>
      </div>
    </div>
  );
};

export default ConversationList;