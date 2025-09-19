import { useState, useRef, useCallback } from 'react';
import { useImageUpload } from '../hooks/useImageUpload';
import { formatFileSize } from '../utils/imageUpload';

const ImageUpload = ({ value, onChange, label = 'Arquivo', className = '', workspaceName = null, acceptFiles = 'image/*,application/pdf,video/*,audio/*', compact = false }) => {
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [preview, setPreview] = useState(value || null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);

  const { upload, isUploading, uploadProgress } = useImageUpload(workspaceName);

  const handleFileSelect = useCallback(async (file) => {
    if (!file) return;

    // Criar preview imediato (apenas para imagens)
    let previewUrl = null;
    if (file.type.startsWith('image/')) {
      previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
    } else if (file.type.startsWith('video/')) {
      setPreview('video'); // Indicador para vídeo
    } else if (file.type.startsWith('audio/')) {
      setPreview('audio'); // Indicador para áudio
    } else {
      setPreview('document'); // Indicador para documentos
    }

    setFileName(file.name);
    setFileSize(file.size);

    try {
      // Upload do arquivo
      const result = await upload(file);

      if (result) {
        // Limpar o preview local se houver
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }

        // Para arquivos que não são imagens, manter o indicador
        if (!file.type.startsWith('image/')) {
          if (file.type.startsWith('video/')) {
            setPreview('video');
          } else if (file.type.startsWith('audio/')) {
            setPreview('audio');
          } else {
            setPreview('document');
          }
        } else {
          setPreview(result.url);
        }

        // Notificar componente pai sem enviar automaticamente
        if (onChange) {
          console.log('🔄 ImageUpload: Notificando componente pai com resultado (sem envio automático):', result);
          onChange(result);
        }
      }
    } catch (error) {
      // Em caso de erro, manter preview local
      console.error('Erro no upload:', error);
    }
  }, [upload, onChange]);

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const validFile = files.find(file =>
      file.type.startsWith('image/') ||
      file.type.startsWith('video/') ||
      file.type.startsWith('audio/') ||
      file.type === 'application/pdf' ||
      file.type.includes('document')
    );

    if (validFile) {
      handleFileSelect(validFile);
    }
  };

  const handleRemove = () => {
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setFileName('');
    setFileSize(0);
    if (onChange) {
      onChange(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const getFileIcon = (type) => {
    if (type === 'video') {
      return (
        <svg className="w-16 h-16 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z" />
        </svg>
      );
    } else if (type === 'audio') {
      return (
        <svg className="w-16 h-16 text-green-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.85 14,18.71V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z" />
        </svg>
      );
    } else if (type === 'document') {
      return (
        <svg className="w-16 h-16 text-red-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
      );
    }

    // Default para imagens
    return (
      <svg className="w-16 h-16 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    );
  };

  if (compact) {
    // Versão compacta para usar dentro do chat
    return (
      <div className={className}>
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptFiles}
          onChange={handleInputChange}
          className="hidden"
        />

        <button
          type="button"
          onClick={handleClick}
          disabled={isUploading}
          className="p-2 text-steel-600 hover:text-sapphire-600 hover:bg-sapphire-50 rounded-lg transition-colors disabled:opacity-50"
          title="Anexar arquivo"
        >
          {isUploading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-sapphire-600 border-t-transparent"></div>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-3 max-w-[350px] ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-white">
          {label}
        </label>
      )}

      {!preview ? (
        // Upload Area
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
            ${isDragOver
              ? 'border-primary-400 bg-primary-500/10'
              : 'border-white/30 hover:border-white/50 hover:bg-white/5'
            }
            ${isUploading ? 'pointer-events-none opacity-50' : ''}
          `}
        >
          {isUploading ? (
            <div className="space-y-3">
              <div className="w-12 h-12 mx-auto">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
              </div>
              <p className="text-white">Fazendo upload...</p>
              {uploadProgress > 0 && (
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto mb-4 text-white/60">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-white mb-2">
                Clique ou arraste um arquivo aqui
              </p>
              <p className="text-white/60 text-sm">
                Imagens, vídeos, áudios, documentos até 16MB
              </p>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={acceptFiles}
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
      ) : (
        // Preview Area
        <div className="relative bg-white/10 rounded-lg border border-white/20 overflow-hidden">
          <div className="aspect-video relative">
            {preview === 'document' || preview === 'video' || preview === 'audio' ? (
              // Preview para arquivos não-imagem
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center text-white">
                  {getFileIcon(preview)}
                  <p className="text-sm font-medium mt-2 capitalize">{preview}</p>
                  <p className="text-xs text-white/70">{fileName}</p>
                </div>
              </div>
            ) : (
              // Preview para imagens
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}

            {/* Overlay com informações */}
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
              <div className="text-center text-white">
                <p className="font-medium">{fileName}</p>
                {fileSize > 0 && (
                  <p className="text-sm opacity-80">{formatFileSize(fileSize)}</p>
                )}
              </div>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="p-3 flex items-center justify-between">
            <div className="text-white text-sm">
              <p className="font-medium truncate max-w-[200px]" title={fileName}>
                {fileName || 'Arquivo carregado'}
              </p>
              {fileSize > 0 && (
                <p className="text-white/60 text-xs">{formatFileSize(fileSize)}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleClick}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Substituir arquivo"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Remover arquivo"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Input file escondido para substituição */}
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptFiles}
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
};

export default ImageUpload;