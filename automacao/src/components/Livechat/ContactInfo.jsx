const ContactInfo = ({ conversation, workspace }) => {
  const getContactInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
  };

  const formatPhoneNumber = (phone) => {
    // Formatar número brasileiro se possível
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 13 && cleaned.startsWith('55')) {
      const ddd = cleaned.substring(2, 4);
      const number = cleaned.substring(4);
      const first = number.substring(0, 5);
      const second = number.substring(5);
      return `+55 (${ddd}) ${first}-${second}`;
    }
    return phone;
  };

  const quickReplies = [
    { id: 1, text: 'Olá! Como posso ajudá-lo?', category: 'Saudação' },
    { id: 2, text: 'Obrigado pelo contato!', category: 'Agradecimento' },
    { id: 3, text: 'Vou verificar isso para você.', category: 'Atendimento' },
    { id: 4, text: 'Posso ajudá-lo com mais alguma coisa?', category: 'Finalização' }
  ];

  return (
    <div className="h-full bg-white/80 backdrop-blur-sm">
      {/* Header do contato */}
      <div className="p-6 border-b border-sapphire-200/30 text-center">
        <div className="w-20 h-20 bg-gradient-sapphire rounded-full flex items-center justify-center mx-auto mb-4 shadow-sapphire-glow">
          <span className="text-white text-xl font-bold">
            {getContactInitials(conversation.contact_name || conversation.phone_number)}
          </span>
        </div>
        <h3 className="font-semibold text-midnight-950 text-lg">
          {conversation.contact_name || 'Contato'}
        </h3>
        <p className="text-steel-600 text-sm mt-1">
          {formatPhoneNumber(conversation.phone_number)}
        </p>
      </div>

      {/* Informações do contato */}
      <div className="p-4 space-y-4">
        
        {/* Status da conversa */}
        <div>
          <h4 className="text-sm font-semibold text-midnight-950 mb-2">Status</h4>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <span className="text-sm text-steel-600">Ativo</span>
          </div>
        </div>

        {/* Informações básicas */}
        <div>
          <h4 className="text-sm font-semibold text-midnight-950 mb-2">Informações</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-steel-600">Nome:</span>
              <span className="font-medium text-midnight-950">
                {conversation.contact_name || 'Não informado'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-steel-600">Telefone:</span>
              <span className="font-medium text-midnight-950">
                {conversation.phone_number}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-steel-600">Workspace:</span>
              <span className="font-medium text-midnight-950">
                {workspace?.workspace_name}
              </span>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div>
          <h4 className="text-sm font-semibold text-midnight-950 mb-2">Tags</h4>
          <div className="flex flex-wrap gap-2">
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              Cliente
            </span>
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
              Ativo
            </span>
          </div>
        </div>

        {/* Estatísticas */}
        <div>
          <h4 className="text-sm font-semibold text-midnight-950 mb-2">Estatísticas</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-sapphire-50/50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-sapphire-600">{conversation.unread_count || 0}</div>
              <div className="text-xs text-steel-600">Não lidas</div>
            </div>
            <div className="bg-green-50/50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-green-600">0</div>
              <div className="text-xs text-steel-600">Resolvidas</div>
            </div>
          </div>
        </div>

        {/* Respostas rápidas */}
        <div>
          <h4 className="text-sm font-semibold text-midnight-950 mb-2">Respostas Rápidas</h4>
          <div className="space-y-2">
            {quickReplies.map((reply) => (
              <button
                key={reply.id}
                className="w-full text-left p-2 bg-white border border-sapphire-200/50 rounded-lg hover:bg-sapphire-50/50 transition-colors text-xs"
              >
                <div className="font-medium text-midnight-950">{reply.category}</div>
                <div className="text-steel-600 truncate mt-1">{reply.text}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Ações */}
        <div>
          <h4 className="text-sm font-semibold text-midnight-950 mb-2">Ações</h4>
          <div className="space-y-2">
            <button className="w-full bg-gradient-sapphire text-white text-sm font-medium py-2 px-3 rounded-lg hover:shadow-blue-soft transition-minimal">
              Transferir Conversa
            </button>
            <button className="w-full bg-white border border-sapphire-200/50 text-midnight-950 text-sm font-medium py-2 px-3 rounded-lg hover:bg-sapphire-50/50 transition-colors">
              Adicionar Nota
            </button>
            <button className="w-full bg-white border border-red-200/50 text-red-600 text-sm font-medium py-2 px-3 rounded-lg hover:bg-red-50/50 transition-colors">
              Bloquear Contato
            </button>
          </div>
        </div>

        {/* Notas */}
        <div>
          <h4 className="text-sm font-semibold text-midnight-950 mb-2">Notas Internas</h4>
          <div className="bg-sapphire-50/30 rounded-lg p-3">
            <textarea 
              placeholder="Adicionar nota sobre este contato..."
              className="w-full bg-transparent text-sm text-steel-600 placeholder-steel-400 border-0 resize-none focus:outline-none"
              rows="3"
            ></textarea>
          </div>
        </div>

      </div>

      {/* Footer com última atividade */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-sapphire-50/30 border-t border-sapphire-200/30">
        <div className="text-center">
          <p className="text-xs text-steel-500">
            Última mensagem: {conversation.last_message_time ? 
              new Date(conversation.last_message_time).toLocaleString('pt-BR') : 
              'Não disponível'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContactInfo;