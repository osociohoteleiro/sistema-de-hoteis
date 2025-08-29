import { useState, useCallback } from 'react';
import { uploadImage } from '../utils/imageUpload';
import { useApp } from '../context/AppContext';
import toast from 'react-hot-toast';

export const useImageUpload = () => {
  const { config } = useApp();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const upload = useCallback(async (file) => {
    if (!file) return null;

    setIsUploading(true);
    setUploadProgress(0);

    // Simular progresso para melhor UX
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    try {
      const uploadConfig = config.uploadConfig || {
        service: 'base64' // Fallback para Base64
      };

      const result = await uploadImage(file, uploadConfig);
      
      setUploadProgress(100);
      
      // Aguardar um pouco para mostrar 100%
      setTimeout(() => {
        setUploadProgress(0);
      }, 500);

      if (result.isBase64) {
        toast.success('Imagem processada localmente');
      } else {
        toast.success('Upload realizado com sucesso!');
      }

      return result;
    } catch (error) {
      toast.error(error.message || 'Erro ao fazer upload da imagem');
      setUploadProgress(0);
      throw error;
    } finally {
      clearInterval(progressInterval);
      setIsUploading(false);
    }
  }, [config.uploadConfig]);

  const uploadMultiple = useCallback(async (files) => {
    const results = [];
    
    for (const file of files) {
      try {
        const result = await upload(file);
        if (result) {
          results.push(result);
        }
      } catch (error) {
        console.error('Erro no upload de:', file.name, error);
      }
    }

    return results;
  }, [upload]);

  return {
    upload,
    uploadMultiple,
    isUploading,
    uploadProgress,
  };
};