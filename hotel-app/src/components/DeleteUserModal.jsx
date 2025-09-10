import { useState } from 'react';

const DeleteUserModal = ({ isOpen, onClose, onConfirm, user }) => {
  const [deleting, setDeleting] = useState(false);

  if (!isOpen || !user) return null;

  const handleConfirm = async () => {
    try {
      setDeleting(true);
      await onConfirm();
      onClose();
    } catch (error) {
      // O erro já será tratado no componente pai
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    if (!deleting) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-sidebar-800/95 border border-red-500/20 rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-red-500/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-500/20 rounded-full">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Excluir Usuário</h2>
              <p className="text-red-400 text-sm">Ação irreversível</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={deleting}
            className="text-sidebar-400 hover:text-white transition-colors p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-white mb-4">
              Tem certeza que deseja excluir o usuário <strong className="text-red-400">"{user.name}"</strong>?
            </p>
            
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div className="text-sm">
                  <h4 className="text-red-300 font-medium mb-1">⚠️ Atenção!</h4>
                  <ul className="text-red-200 space-y-1">
                    <li>• Esta ação não pode ser desfeita</li>
                    <li>• Todos os dados do usuário serão removidos permanentemente</li>
                    <li>• O usuário perderá acesso imediatamente ao sistema</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
            <h4 className="text-white font-medium mb-3">Informações do usuário:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-sidebar-400">Nome:</span>
                <span className="text-white">{user.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sidebar-400">Email:</span>
                <span className="text-white">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sidebar-400">Tipo:</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  user.user_type === 'SUPER_ADMIN' ? 'bg-red-500/20 text-red-400' :
                  user.user_type === 'ADMIN' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {user.user_type === 'SUPER_ADMIN' ? 'Super Admin' :
                   user.user_type === 'ADMIN' ? 'Admin' : 'Hoteleiro'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sidebar-400">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  user.active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {user.active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={deleting}
              className="flex-1 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={deleting}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:bg-red-800 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {deleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Excluindo...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Excluir Usuário
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteUserModal;