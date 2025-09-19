import { useState, useEffect } from 'react';

const MediaCaptionModal = ({
  isOpen,
  onClose,
  fileData,
  onSend
}) => {
  const [caption, setCaption] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Resetar caption quando modal abre/fecha
  useEffect(() => {
    if (!isOpen) {
      setCaption('');
      setIsSending(false);
    }
  }, [isOpen]);

  if (!isOpen || !fileData) {
    return null;
  }

  const handleSend = async () => {
    setIsSending(true);
    try {
      await onSend(fileData, caption);
      onClose();
    } catch (error) {
      console.error('Erro ao enviar arquivo:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendWithoutCaption = async () => {
    setIsSending(true);
    try {
      await onSend(fileData, '');
      onClose();
    } catch (error) {
      console.error('Erro ao enviar arquivo:', error);
    } finally {
      setIsSending(false);
    }
  };

  const getFileIcon = (mediaType) => {
    switch (mediaType) {
      case 'image':
        return '🖼️';
      case 'video':
        return '🎥';
      case 'audio':
        return '🎵';
      default:
        return '📄';
    }
  };

  const getPreviewElement = () => {
    if (fileData.mediaType === 'image' && fileData.url) {
      return (
        <img
          src={fileData.url}
          alt="Preview"
          className="w-full h-48 object-cover rounded-lg"
          onError={() => {
            // Se houver erro no carregamento da imagem, mostrar ícone
            console.warn('Erro ao carregar preview da imagem');
          }}
        />
      );
    } else if (fileData.mediaType === 'video' && fileData.url) {
      return (
        <video
          className="w-full h-48 object-cover rounded-lg"
          controls
          preload="metadata"
        >
          <source src={fileData.url} type="video/mp4" />
          <source src={fileData.url} type="video/webm" />
          <source src={fileData.url} type="video/ogg" />
          Seu navegador não suporta reprodução de vídeo.
        </video>
      );
    } else {
      // Para outros tipos de arquivo ou quando não há URL, mostrar ícone
      return (
        <div className="w-full h-48 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="text-6xl mb-2">
              {getFileIcon(fileData.mediaType)}
            </div>
            <p className="text-sm font-medium text-gray-700">
              {fileData.originalName || 'Arquivo'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {fileData.mediaType.charAt(0).toUpperCase() + fileData.mediaType.slice(1)}
            </p>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Enviar Arquivo
            </h3>
            <button
              onClick={onClose}
              disabled={isSending}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Preview do arquivo */}
        <div className="p-6">
          <div className="mb-4">
            {getPreviewElement()}
          </div>

          {/* Informações do arquivo */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">
                {getFileIcon(fileData.mediaType)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {fileData.originalName || 'Arquivo'}
                </p>
                <p className="text-xs text-gray-500">
                  {fileData.size && `${(fileData.size / 1024 / 1024).toFixed(2)} MB`} • {fileData.mediaType}
                </p>
              </div>
            </div>
          </div>

          {/* Campo de legenda */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Legenda (opcional)
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Digite uma legenda para o arquivo..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
              maxLength={1000}
              disabled={isSending}
            />
            <div className="text-xs text-gray-500 mt-1">
              {caption.length}/1000 caracteres
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex flex-col space-y-2">
            <button
              onClick={handleSend}
              disabled={isSending}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Enviando...
                </>
              ) : (
                <>
                  {caption.trim() ? 'Enviar com Legenda' : 'Enviar Arquivo'}
                </>
              )}
            </button>

            {/* Botão para enviar sem legenda (apenas se há legenda digitada) */}
            {caption.trim() && (
              <button
                onClick={handleSendWithoutCaption}
                disabled={isSending}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enviar sem Legenda
              </button>
            )}

            <button
              onClick={onClose}
              disabled={isSending}
              className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg border border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaCaptionModal;