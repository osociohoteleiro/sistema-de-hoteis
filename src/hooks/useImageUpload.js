import { useState, useCallback } from 'react';
import { uploadImage } from '../utils/imageUpload';
import { useApp } from '../context/AppContext';
import toast from 'react-hot-toast';

export const useImageUpload = (hotelName = null) => {
  const { config } = useApp();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const upload = useCallback(async (file, customHotelName = null) => {
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

      console.log('🚀 useImageUpload: Iniciando upload com config:', {
        service: uploadConfig.service,
        awsRegion: uploadConfig.awsRegion,
        bucketName: uploadConfig.awsBucketName,
        hasAccessKey: !!uploadConfig.awsAccessKeyId,
        hasSecretKey: !!uploadConfig.awsSecretAccessKey
      });

      // Usar nome do hotel passado como parâmetro ou o padrão do hook
      const targetHotelName = customHotelName || hotelName;
      console.log('🏨 useImageUpload: Nome do hotel alvo:', targetHotelName);
      
      const result = await uploadImage(file, uploadConfig, targetHotelName);
      console.log('✅ useImageUpload: Upload concluído com resultado:', result);
      
      setUploadProgress(100);
      
      // Aguardar um pouco para mostrar 100%
      setTimeout(() => {
        setUploadProgress(0);
      }, 500);

      if (result.fallback === 'imgbb') {
        toast.success(`S3 com problemas de CORS. Upload realizado via ImgBB!`);
      } else if (result.fallback === 'base64') {
        toast.error(`Falha no S3: ${result.originalError}. Usando processamento local.`);
      } else if (result.isBase64) {
        toast.success('Arquivo processado localmente');
      } else if (result.folder) {
        toast.success(`Upload S3 realizado com sucesso para ${result.folder}!`);
      } else {
        toast.success('Upload realizado com sucesso!');
      }

      return result;
    } catch (error) {
      toast.error(error.message || 'Erro ao fazer upload do arquivo');
      setUploadProgress(0);
      throw error;
    } finally {
      clearInterval(progressInterval);
      setIsUploading(false);
    }
  }, [config.uploadConfig, hotelName]);

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