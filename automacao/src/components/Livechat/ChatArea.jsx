import { useState, useRef } from 'react';

const ChatArea = ({ 
  conversation, 
  messages, 
  onSendMessage, 
  sendingMessage, 
  messagesEndRef,
  onMarkAsRead 
}) => {
  const [messageInput, setMessageInput] = useState('');
  const textareaRef = useRef(null);

  const handleSend = async () => {
    if (!messageInput.trim() || sendingMessage) return;
    
    const message = messageInput.trim();
    setMessageInput('');
    
    // Reset height do textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    
    await onSendMessage(message);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };

  const renderMessage = (message, index) => {
    const isOutbound = message.direction === 'outbound';
    const previousMessage = messages[index - 1];
    const showDate = !previousMessage || 
      new Date(message.created_at).toDateString() !== new Date(previousMessage.created_at).toDateString();

    return (
      <div key={message.id || index}>
        {/* Divisor de data */}
        {showDate && (
          <div className="flex justify-center my-4">
            <span className="bg-sapphire-100 text-sapphire-700 text-xs px-3 py-1 rounded-full">
              {formatDate(message.created_at)}
            </span>
          </div>
        )}

        {/* Mensagem */}
        <div className={`flex mb-4 ${isOutbound ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-xs lg:max-w-md ${isOutbound ? 'order-2' : 'order-1'}`}>
            <div
              className={`px-4 py-2 rounded-2xl ${
                isOutbound
                  ? 'bg-gradient-sapphire text-white rounded-br-md'
                  : 'bg-white border border-sapphire-200/50 text-midnight-950 rounded-bl-md'
              } shadow-blue-subtle`}
            >
              {/* Conteúdo da mensagem */}
              <div className="text-sm leading-relaxed">
                {message.message_type === 'text' ? (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">
                      {message.message_type === 'image' && '🖼️'}
                      {message.message_type === 'video' && '🎥'}
                      {message.message_type === 'audio' && '🎵'}
                      {message.message_type === 'document' && '📄'}
                      {message.message_type === 'location' && '📍'}
                    </span>
                    <span className="text-xs opacity-80">
                      {message.message_type.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Timestamp e status */}
              <div className={`flex items-center justify-end mt-1 space-x-1 ${
                isOutbound ? 'text-white/70' : 'text-steel-500'
              }`}>
                <span className="text-xs">{formatTime(message.created_at)}</span>
                {isOutbound && (
                  <div className="flex">
                    {message.status === 'sent' && (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    {message.status === 'delivered' && (
                      <div className="flex">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <svg className="w-4 h-4 -ml-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    {message.status === 'read' && (
                      <div className="flex text-blue-300">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <svg className="w-4 h-4 -ml-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white/80 backdrop-blur-sm">
      {/* Header da conversa */}
      <div className="flex items-center justify-between p-4 border-b border-sapphire-200/30">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-sapphire rounded-full flex items-center justify-center shadow-sapphire-glow">
            <span className="text-white text-sm font-semibold">
              {conversation.contact_name 
                ? conversation.contact_name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase()
                : conversation.phone_number.slice(-2)
              }
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-midnight-950">
              {conversation.contact_name || 'Contato'}
            </h3>
            <p className="text-sm text-steel-600">{conversation.phone_number}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          <span className="text-sm text-steel-600">Online</span>
        </div>
      </div>

      {/* Área de mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-sapphire rounded-full flex items-center justify-center mx-auto mb-4 shadow-sapphire-glow">
                <span className="text-white text-2xl">💬</span>
              </div>
              <p className="text-steel-600 font-medium">Nenhuma mensagem ainda</p>
              <p className="text-steel-500 text-sm mt-1">Envie uma mensagem para começar a conversa.</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => renderMessage(message, index))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Área de digitação */}
      <div className="border-t border-sapphire-200/30 p-4">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={messageInput}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              className="w-full px-4 py-3 border border-sapphire-200/50 rounded-xl focus:ring-2 focus:ring-sapphire-500 focus:border-transparent bg-white/80 backdrop-blur-sm text-sm resize-none"
              style={{ minHeight: '44px', maxHeight: '120px' }}
              disabled={sendingMessage}
            />
          </div>
          
          <button
            onClick={handleSend}
            disabled={!messageInput.trim() || sendingMessage}
            className={`px-4 py-3 rounded-xl font-medium text-sm transition-minimal ${
              messageInput.trim() && !sendingMessage
                ? 'bg-gradient-sapphire text-white shadow-sapphire-glow hover:shadow-blue-soft'
                : 'bg-steel-200 text-steel-500 cursor-not-allowed'
            }`}
          >
            {sendingMessage ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Enviando</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1">
                <span>Enviar</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
            )}
          </button>
        </div>

        {/* Atalhos de teclado */}
        <div className="mt-2 text-xs text-steel-500 text-center">
          <span>Enter para enviar • Shift+Enter para nova linha</span>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;