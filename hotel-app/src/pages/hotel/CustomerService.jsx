import { useState } from 'react';

const CustomerService = () => {
  const [activeConversation, setActiveConversation] = useState(null);

  // Sistema de atendimento não implementado ainda - conectar à API quando disponível
  const conversations = [];

  const messages = [];

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-500',
      pending: 'bg-yellow-500',
      resolved: 'bg-blue-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusLabel = (status) => {
    const labels = {
      active: 'Ativo',
      pending: 'Pendente',
      resolved: 'Resolvido'
    };
    return labels[status] || 'Desconhecido';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Central de Atendimento</h1>
          <p className="text-sidebar-400">Gerencie o atendimento aos hóspedes em tempo real</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Conversas */}
        <div className="lg:col-span-1">
          <div className="bg-sidebar-800/50 backdrop-blur-sm rounded-lg border border-white/10 p-6 h-[600px] flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-4">Conversas Ativas</h3>
            
            <div className="flex-1 overflow-y-auto space-y-3">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setActiveConversation(conversation)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                    activeConversation?.id === conversation.id
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {conversation.avatar}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-white font-medium">{conversation.guest}</h4>
                        <p className="text-sidebar-400 text-sm">Quarto {conversation.room}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-1">
                      <span className="text-sidebar-400 text-xs">{conversation.time}</span>
                      {conversation.unread > 0 && (
                        <span className="bg-primary-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {conversation.unread}
                        </span>
                      )}
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(conversation.status)}`}></div>
                    </div>
                  </div>
                  
                  <p className="text-sidebar-300 text-sm truncate">
                    {conversation.lastMessage}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Area de Chat */}
        <div className="lg:col-span-2">
          {activeConversation ? (
            <div className="bg-sidebar-800/50 backdrop-blur-sm rounded-lg border border-white/10 p-6 h-[600px] flex flex-col">
              {/* Header da Conversa */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">
                      {activeConversation.avatar}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{activeConversation.guest}</h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-sidebar-400 text-sm">Quarto {activeConversation.room}</span>
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(activeConversation.status)}`}></div>
                      <span className="text-sidebar-400 text-sm">{getStatusLabel(activeConversation.status)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button className="p-2 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 rounded-lg transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'hotel' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender === 'hotel'
                          ? 'bg-primary-600 text-white'
                          : 'bg-white/10 text-white'
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender === 'hotel' ? 'text-primary-200' : 'text-sidebar-400'
                      }`}>
                        {message.time} {message.sender === 'hotel' && (message.read ? '✓✓' : '✓')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input de Mensagem */}
              <div className="border-t border-white/10 pt-4">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Digite sua mensagem..."
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-sidebar-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors pr-12"
                    />
                    <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sidebar-400 hover:text-white transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </button>
                  </div>
                  <button className="bg-primary-600 hover:bg-primary-500 text-white p-3 rounded-lg transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
                
                {/* Quick Actions */}
                <div className="flex items-center space-x-2 mt-3">
                  <button className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-sm hover:bg-blue-500/20 transition-colors">
                    Ligar para o quarto
                  </button>
                  <button className="px-3 py-1 bg-green-500/10 text-green-400 rounded-lg text-sm hover:bg-green-500/20 transition-colors">
                    Solicitar limpeza
                  </button>
                  <button className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-lg text-sm hover:bg-purple-500/20 transition-colors">
                    Room service
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-sidebar-800/50 backdrop-blur-sm rounded-lg border border-white/10 p-12 h-[600px] flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Selecione uma conversa
                </h3>
                <p className="text-sidebar-400">
                  Escolha uma conversa da lista ao lado para começar a interação com o hóspede.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Development Notice */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-blue-400 font-semibold">Sistema de Chat em Desenvolvimento</h4>
            <p className="text-blue-300 text-sm mt-1">
              O sistema de chat em tempo real, integração com IA e automações de atendimento estão sendo desenvolvidos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerService;