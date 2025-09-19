import { useState, useContext } from 'react';
import { uploadImage } from '../utils/imageUpload';
import toast from 'react-hot-toast';

export const useImageUpload = (workspaceName = null) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Configuração padrão para o ambiente de automação
  const getUploadConfig = () => {
    // Buscar configurações do ambiente (apenas import.meta.env no frontend)
    const awsAccessKeyId = import.meta.env.VITE_AWS_ACCESS_KEY_ID ||
                          import.meta.env.VITE_AWS_ACCESS_KEY;

    const awsSecretAccessKey = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY ||
                              import.meta.env.VITE_AWS_SECRET_KEY;

    const awsRegion = import.meta.env.VITE_AWS_REGION || 'us-east-1';

    const awsBucketName = import.meta.env.VITE_AWS_BUCKET_NAME ||
                         import.meta.env.VITE_AWS_S3_BUCKET;

    const useBase64Fallback = import.meta.env.VITE_USE_BASE64_FALLBACK === 'true';

    console.log('🔍 Verificando configurações AWS:', {
      hasAccessKey: !!awsAccessKeyId,
      hasSecretKey: !!awsSecretAccessKey,
      hasRegion: !!awsRegion,
      hasBucketName: !!awsBucketName,
      region: awsRegion,
      useBase64Fallback
    });

    // Se Base64 fallback estiver ativado ou AWS não configurado, usar Base64 diretamente
    if (useBase64Fallback || !awsAccessKeyId || !awsSecretAccessKey || !awsBucketName) {
      console.log('📋 Usando Base64 como método principal:', {
        reason: useBase64Fallback ? 'FALLBACK_ATIVADO' : 'AWS_INCOMPLETO',
        accessKey: awsAccessKeyId ? 'DEFINIDA' : 'NÃO DEFINIDA',
        secretKey: awsSecretAccessKey ? 'DEFINIDA' : 'NÃO DEFINIDA',
        bucket: awsBucketName ? 'DEFINIDA' : 'NÃO DEFINIDA'
      });
      return {
        service: 'base64'
      };
    }

    const awsConfig = {
      service: 'aws-s3',
      awsAccessKeyId,
      awsSecretAccessKey,
      awsRegion,
      awsBucketName,
      imgbbApiKey: import.meta.env.VITE_IMGBB_API_KEY, // Fallback adicional
    };

    console.log('✅ Configurações AWS completas, tentando S3 primeiro');
    return awsConfig;
  };

  const upload = async (file) => {
    if (!file) {
      toast.error('Nenhum arquivo selecionado');
      return null;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      console.log('🔄 useImageUpload: Iniciando upload...', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        workspaceName
      });

      // Simular progresso durante o upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return prev; // Parar em 90% até completar
          return prev + Math.random() * 20;
        });
      }, 200);

      const uploadConfig = getUploadConfig();
      const result = await uploadImage(file, uploadConfig, workspaceName);

      // Completar progresso
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result?.url) {
        console.log('✅ useImageUpload: Upload concluído com sucesso!', {
          url: result.url,
          mediaType: result.mediaType,
          size: result.size,
          fallback: result.fallback
        });

        // Mostrar mensagem de sucesso
        if (result.fallback) {
          toast.success(`Arquivo enviado (via ${result.fallback})`);
        } else {
          toast.success('Arquivo enviado com sucesso!');
        }

        return result;
      } else {
        throw new Error('URL do arquivo não foi retornada');
      }

    } catch (error) {
      console.error('❌ useImageUpload: Erro no upload:', error);

      // Mensagem de erro específica
      if (error.message.includes('Tipo de arquivo')) {
        toast.error(error.message);
      } else if (error.message.includes('muito grande')) {
        toast.error(error.message);
      } else {
        toast.error('Erro ao fazer upload do arquivo');
      }

      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return {
    upload,
    isUploading,
    uploadProgress
  };
};