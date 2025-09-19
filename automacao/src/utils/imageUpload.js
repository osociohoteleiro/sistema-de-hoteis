import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Utilitários para upload de imagens e documentos

// Validação de arquivo
export const validateFile = (file) => {
  const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
  const validDocumentTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const validVideoTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'];
  const validAudioTypes = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mpeg'];
  const validTypes = [...validImageTypes, ...validDocumentTypes, ...validVideoTypes, ...validAudioTypes];
  const maxSize = 16 * 1024 * 1024; // 16MB para suportar vídeos

  if (!file) {
    return { isValid: false, error: 'Nenhum arquivo selecionado' };
  }

  if (!validTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Tipo de arquivo não suportado. Use JPG, PNG, WebP, GIF, PDF, DOC, MP4, MP3, etc.'
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'Arquivo muito grande. Tamanho máximo: 16MB.'
    };
  }

  return { isValid: true, error: null };
};

// Manter compatibilidade com função antiga
export const validateImageFile = validateFile;

// Converter arquivo para Base64 (fallback)
export const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

// Determinar tipo de mídia para Evolution API
export const getMediaType = (file) => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  if (file.type === 'application/pdf') return 'document';
  if (file.type.includes('document') || file.type.includes('word')) return 'document';
  return 'document'; // fallback
};

// Upload para ImgBB (serviço gratuito)
export const uploadToImgBB = async (file, apiKey) => {
  if (!apiKey) {
    throw new Error('API Key do ImgBB não configurada');
  }

  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Erro ao fazer upload para ImgBB');
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error?.message || 'Erro desconhecido no ImgBB');
  }

  return {
    url: data.data.url,
    displayUrl: data.data.display_url,
    deleteUrl: data.data.delete_url,
    size: data.data.size,
  };
};

// Upload para Cloudinary
export const uploadToCloudinary = async (file, cloudName, uploadPreset) => {
  if (!cloudName || !uploadPreset) {
    throw new Error('Configurações do Cloudinary incompletas');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Erro ao fazer upload para Cloudinary');
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || 'Erro no Cloudinary');
  }

  return {
    url: data.secure_url,
    publicId: data.public_id,
    size: data.bytes,
    format: data.format,
  };
};

// Upload para endpoint customizado
export const uploadToCustomEndpoint = async (file, endpoint) => {
  if (!endpoint) {
    throw new Error('Endpoint de upload não configurado');
  }

  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Erro no upload: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // Assume que o endpoint retorna { url: "..." } ou { success: true, url: "..." }
  if (data.url) {
    return {
      url: data.url,
      size: file.size,
    };
  } else if (data.success && data.data?.url) {
    return {
      url: data.data.url,
      size: file.size,
    };
  } else {
    throw new Error('Resposta do servidor não contém URL da imagem');
  }
};

// Upload para AWS S3
export const uploadToS3 = async (file, awsConfig, workspaceName = null) => {
  console.log('🔧 uploadToS3: Iniciando upload para S3...', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    workspaceName: workspaceName,
    awsConfig: {
      region: awsConfig.region,
      bucketName: awsConfig.bucketName,
      hasAccessKey: !!awsConfig.accessKeyId,
      hasSecretKey: !!awsConfig.secretAccessKey
    }
  });

  const { accessKeyId, secretAccessKey, region, bucketName } = awsConfig;

  if (!accessKeyId || !secretAccessKey || !region || !bucketName) {
    const error = 'Configurações AWS S3 incompletas';
    console.error('❌ uploadToS3:', error, {
      hasAccessKeyId: !!accessKeyId,
      hasSecretAccessKey: !!secretAccessKey,
      hasRegion: !!region,
      hasBucketName: !!bucketName
    });
    throw new Error(error);
  }

  // Configurar cliente S3 com headers CORS
  const s3Client = new S3Client({
    region: region,
    credentials: {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
    },
    requestHandler: {
      requestTimeout: 60000,
      httpsAgent: undefined,
    },
    forcePathStyle: false, // Usar virtual hosted-style URLs
    useAccelerateEndpoint: false,
  });

  // Gerar nome único do arquivo
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2);
  const fileExtension = file.name.split('.').pop();
  const fileName = `${timestamp}_${randomString}.${fileExtension}`;

  // Determinar pasta baseada no workspace
  let folderPath;
  if (workspaceName) {
    // Normalizar nome do workspace para usar como pasta
    const normalizedWorkspaceName = workspaceName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '');
    folderPath = `chat-files/${normalizedWorkspaceName}/${fileName}`;
  } else {
    folderPath = `chat-files/default/${fileName}`;
  }

  // Converter File para ArrayBuffer (necessário para o browser)
  console.log('🔄 uploadToS3: Convertendo arquivo para ArrayBuffer...');
  const fileBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(fileBuffer);
  console.log('✅ uploadToS3: Arquivo convertido para buffer de', fileBuffer.byteLength, 'bytes');

  // Configurar comando de upload
  const uploadCommand = new PutObjectCommand({
    Bucket: bucketName,
    Key: folderPath,
    Body: uint8Array, // Usar Uint8Array em vez de File diretamente
    ContentType: file.type,
    // ACL removido - assumindo que o bucket já está configurado para acesso público
    Metadata: {
      'original-name': file.name,
      'upload-timestamp': timestamp.toString(),
      'workspace': workspaceName || 'default',
      'source': 'chat-upload'
    },
  });

  try {
    console.log('📤 uploadToS3: Tentativa 1 - Upload direto via SDK...');

    // Tentar upload direto primeiro
    const response = await s3Client.send(uploadCommand);
    console.log('✅ uploadToS3: Resposta do S3 (direto):', response);

    // Construir URL pública
    const publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${folderPath}`;

    const result = {
      url: publicUrl,
      key: folderPath,
      size: file.size,
      etag: response.ETag,
      bucket: bucketName,
      region: region,
      folder: workspaceName || 'default',
      originalName: file.name,
      mediaType: getMediaType(file)
    };

    console.log('🎉 uploadToS3: Upload direto concluído com sucesso!', result);
    return result;

  } catch (directUploadError) {
    console.warn('⚠️ uploadToS3: Upload direto falhou, tentando presigned URL...', directUploadError.message);

    try {
      // Método alternativo: Presigned URL
      console.log('📤 uploadToS3: Tentativa 2 - Gerando presigned URL...');

      const presignedUrl = await getSignedUrl(s3Client, uploadCommand, {
        expiresIn: 3600, // 1 hora
      });

      console.log('🔗 uploadToS3: URL presignada gerada:', presignedUrl.substring(0, 100) + '...');

      // Upload usando fetch com presigned URL - método sem preflight
      const fetchResponse = await fetch(presignedUrl, {
        method: 'PUT',
        body: uint8Array,
        // Remover Content-Type para evitar preflight request
      });

      if (!fetchResponse.ok) {
        throw new Error(`Presigned URL upload failed: ${fetchResponse.status} ${fetchResponse.statusText}`);
      }

      console.log('✅ uploadToS3: Upload via presigned URL concluído!');

      // Construir URL pública
      const publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${folderPath}`;

      const result = {
        url: publicUrl,
        key: folderPath,
        size: file.size,
        etag: fetchResponse.headers.get('ETag') || 'unknown',
        bucket: bucketName,
        region: region,
        folder: workspaceName || 'default',
        originalName: file.name,
        method: 'presigned',
        mediaType: getMediaType(file)
      };

      console.log('🎉 uploadToS3: Upload via presigned URL concluído com sucesso!', result);
      return result;

    } catch (presignedError) {
      console.error('❌ uploadToS3: Ambos os métodos falharam');
      console.error('❌ Erro direto:', directUploadError.message);
      console.error('❌ Erro presigned:', presignedError.message);

      throw new Error(`Erro no upload para S3 - Direto: ${directUploadError.message}, Presigned: ${presignedError.message}`);
    }
  }
};

// Função principal de upload que escolhe o método baseado na configuração
export const uploadImage = async (file, uploadConfig, workspaceName = null) => {
  const validation = validateFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const { service, ...config } = uploadConfig;

  // Sempre gerar Base64 como backup para o WhatsApp
  console.log('🔄 Gerando Base64 como backup...');
  const base64Backup = await convertToBase64(file);
  const base64Data = base64Backup.split(',')[1]; // Remover prefixo data:...;base64,

  switch (service) {
    case 'aws-s3':
      try {
        console.log('📤 Tentando upload S3...');
        const s3Result = await uploadToS3(file, {
          accessKeyId: config.awsAccessKeyId,
          secretAccessKey: config.awsSecretAccessKey,
          region: config.awsRegion,
          bucketName: config.awsBucketName,
        }, workspaceName);

        // Retornar resultado S3 com Base64 como backup
        return {
          ...s3Result,
          base64Data, // Dados Base64 para fallback no envio
          mediaType: getMediaType(file),
          originalName: file.name
        };
      } catch (s3Error) {
        console.warn('⚠️ Falha no upload S3:', s3Error.message);

        // Tentar ImgBB como fallback se S3 falhar e API key disponível
        if (config.imgbbApiKey) {
          try {
            console.log('📤 Tentando upload via ImgBB como fallback...');
            const imgbbResult = await uploadToImgBB(file, config.imgbbApiKey);
            return {
              ...imgbbResult,
              base64Data, // Backup para WhatsApp
              fallback: 'imgbb',
              originalError: s3Error.message,
              mediaType: getMediaType(file),
              originalName: file.name
            };
          } catch (imgbbError) {
            console.warn('⚠️ ImgBB também falhou:', imgbbError.message);
          }
        }

        // Fallback final para Base64 puro
        console.log('📋 Usando Base64 puro como fallback final');
        return {
          url: base64Backup,
          size: file.size,
          isBase64: true,
          fallback: 'base64',
          originalError: s3Error.message,
          mediaType: getMediaType(file),
          originalName: file.name,
          base64Data
        };
      }

    case 'imgbb':
      try {
        const imgbbResult = await uploadToImgBB(file, config.apiKey);
        return {
          ...imgbbResult,
          base64Data, // Backup para WhatsApp
          mediaType: getMediaType(file),
          originalName: file.name
        };
      } catch (imgbbError) {
        console.warn('⚠️ ImgBB falhou, usando Base64:', imgbbError.message);
        return {
          url: base64Backup,
          size: file.size,
          isBase64: true,
          fallback: 'base64',
          originalError: imgbbError.message,
          mediaType: getMediaType(file),
          originalName: file.name,
          base64Data
        };
      }

    case 'cloudinary':
      try {
        const cloudinaryResult = await uploadToCloudinary(file, config.cloudName, config.uploadPreset);
        return {
          ...cloudinaryResult,
          base64Data, // Backup para WhatsApp
          mediaType: getMediaType(file),
          originalName: file.name
        };
      } catch (cloudinaryError) {
        console.warn('⚠️ Cloudinary falhou, usando Base64:', cloudinaryError.message);
        return {
          url: base64Backup,
          size: file.size,
          isBase64: true,
          fallback: 'base64',
          originalError: cloudinaryError.message,
          mediaType: getMediaType(file),
          originalName: file.name,
          base64Data
        };
      }

    case 'custom':
      try {
        const customResult = await uploadToCustomEndpoint(file, config.endpoint);
        return {
          ...customResult,
          base64Data, // Backup para WhatsApp
          mediaType: getMediaType(file),
          originalName: file.name
        };
      } catch (customError) {
        console.warn('⚠️ Endpoint customizado falhou, usando Base64:', customError.message);
        return {
          url: base64Backup,
          size: file.size,
          isBase64: true,
          fallback: 'base64',
          originalError: customError.message,
          mediaType: getMediaType(file),
          originalName: file.name,
          base64Data
        };
      }

    case 'base64':
    default:
      // Usar Base64 diretamente
      console.log('📋 Usando Base64 direto');
      return {
        url: base64Backup,
        size: file.size,
        isBase64: true,
        mediaType: getMediaType(file),
        originalName: file.name,
        base64Data
      };
  }
};

// Formatar tamanho do arquivo
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};