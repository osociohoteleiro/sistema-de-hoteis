import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';

const MarketingMessageList = ({ messages, onMessageUpdate, onMessageEdit, selectedHotelUuid }) => {
  const { deleteMarketingMessage } = useApp();
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [visibleContent, setVisibleContent] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = (message) => {
    setMessageToDelete(message);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!messageToDelete) return;
    
    setIsDeleting(true);
    
    try {
      await deleteMarketingMessage(messageToDelete.id);
      setShowDeleteModal(false);
      setMessageToDelete(null);
      // A lista será atualizada automaticamente pelo contexto
    } catch (error) {
      console.error('Erro ao excluir mensagem:', error);
      alert('Erro ao excluir mensagem. Tente novamente.');
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setMessageToDelete(null);
  };

  const handleViewDetails = (message) => {
    setSelectedMessage(message);
    setShowDetails(true);
    // Resetar visibilidade do conteúdo quando abrir modal
    setVisibleContent(false);
  };

  const toggleContentVisibility = () => {
    setVisibleContent(prev => !prev);
  };


  if (messages.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-sidebar-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h4 className="text-lg font-medium text-white mb-2">Nenhuma campanha configurada</h4>
        <p className="text-sidebar-400 text-sm">
          Clique em "Nova" para cadastrar a primeira campanha de marketing.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h4 className="font-medium text-white text-lg">{message.nome}</h4>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 capitalize">
                    {message.referencia || 'checkin'}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => handleViewDetails(message)}
                  className="p-2 text-sidebar-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                  title="Ver detalhes"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                <button
                  onClick={() => onMessageEdit && onMessageEdit(message)}
                  className="p-2 text-sidebar-400 hover:text-yellow-300 hover:bg-yellow-500/10 rounded-lg transition-colors"
                  title="Editar mensagem"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(message)}
                  className="p-2 text-sidebar-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Deletar mensagem"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Details Modal */}
      {showDetails && selectedMessage && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
          <div className="bg-sidebar-900 border border-white/20 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Detalhes da Campanha</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-sidebar-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-sidebar-300 mb-1">Nome da Campanha</label>
                  <p className="text-white bg-white/5 px-3 py-2 rounded-lg">{selectedMessage.nome}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-sidebar-300 mb-1">Descrição</label>
                  <p className="text-white bg-white/5 px-3 py-2 rounded-lg">{selectedMessage.descricao}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-sidebar-300 mb-1">Tempo</label>
                    <p className="text-white bg-white/5 px-3 py-2 rounded-lg">{selectedMessage.offset_tempo} {selectedMessage.unidade_tempo}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-sidebar-300 mb-1">Momento</label>
                    <p className="text-white bg-white/5 px-3 py-2 rounded-lg capitalize">{selectedMessage.antes_apos}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-sidebar-300 mb-1">Referência</label>
                    <p className="text-white bg-white/5 px-3 py-2 rounded-lg capitalize">{selectedMessage.referencia}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-sidebar-300 mb-1">Canal</label>
                    <p className="text-white bg-white/5 px-3 py-2 rounded-lg capitalize">{selectedMessage.canal}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-sidebar-300 mb-1">Hotel UUID</label>
                    <p className="text-white bg-white/5 px-3 py-2 rounded-lg font-mono text-sm">{selectedMessage.hotel_uuid}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-sidebar-300 mb-1">Modelo da Mensagem</label>
                  <div className="flex items-start space-x-2">
                    <div className="text-white bg-white/5 px-3 py-2 rounded-lg flex-1 min-h-[100px]">
                      {visibleContent ? (
                        <pre className="whitespace-pre-wrap font-sans text-sm">{selectedMessage.modelo_mensagem}</pre>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <span className="text-sidebar-400 text-sm">Clique no ícone para visualizar o modelo</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={toggleContentVisibility}
                      className="p-2 text-sidebar-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                      title={visibleContent ? 'Ocultar Modelo' : 'Mostrar Modelo'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {visibleContent ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        )}
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <p className="text-blue-300 text-sm">
                    <strong>Resumo:</strong> {selectedMessage.offset_tempo} {selectedMessage.unidade_tempo} {selectedMessage.antes_apos} do {selectedMessage.referencia} via {selectedMessage.canal}
                  </p>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowDetails(false)}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && messageToDelete && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
          <div className="bg-sidebar-900 border border-white/20 rounded-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Confirmar Exclusão</h3>
                <button
                  onClick={cancelDelete}
                  className="text-sidebar-400 hover:text-white transition-colors"
                  disabled={isDeleting}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 bg-red-500/20 rounded-full">
                    <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium">Tem certeza que deseja excluir esta campanha?</p>
                    <p className="text-sidebar-300 text-sm mt-1">
                      <strong>"{messageToDelete.nome}"</strong>
                    </p>
                  </div>
                </div>
                <p className="text-sidebar-400 text-sm">
                  Esta ação não pode ser desfeita. A campanha será permanentemente removida.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 text-sidebar-300 hover:text-white transition-colors"
                  disabled={isDeleting}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Excluindo...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Excluir</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default MarketingMessageList;