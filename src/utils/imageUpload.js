import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Utilitários para upload de imagens e documentos

// Validação de arquivo
export const validateFile = (file) => {
  const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
  const validDocumentTypes = ['application/pdf'];
  const validTypes = [...validImageTypes, ...validDocumentTypes];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!file) {
    return { isValid: false, error: 'Nenhum arquivo selecionado' };
  }

  if (!validTypes.includes(file.type)) {
    return { 
      isValid: false, 
      error: 'Tipo de arquivo não suportado. Use JPG, PNG, WebP, AVIF ou PDF.' 
    };
  }

  if (file.size > maxSize) {
    return { 
      isValid: false, 
      error: 'Arquivo muito grande. Tamanho máximo: 5MB.' 
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
export const uploadToS3 = async (file, awsConfig, hotelName = null) => {
  console.log('🔧 uploadToS3: Iniciando upload para S3...', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    hotelName: hotelName,
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

  // Determinar pasta baseada no hotel
  let folderPath;
  if (hotelName) {
    // Normalizar nome do hotel para usar como pasta
    const normalizedHotelName = hotelName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '');
    folderPath = `${normalizedHotelName}/${fileName}`;
  } else {
    folderPath = `app/${fileName}`;
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
      'hotel': hotelName || 'app',
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
      folder: hotelName || 'app',
      originalName: file.name,
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
        folder: hotelName || 'app',
        originalName: file.name,
        method: 'presigned'
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
export const uploadImage = async (file, uploadConfig, hotelName = null) => {
  const validation = validateFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const { service, ...config } = uploadConfig;

  switch (service) {
    case 'aws-s3':
      try {
        return await uploadToS3(file, {
          accessKeyId: config.awsAccessKeyId,
          secretAccessKey: config.awsSecretAccessKey,
          region: config.awsRegion,
          bucketName: config.awsBucketName,
        }, hotelName);
      } catch (s3Error) {
        console.warn('⚠️ Falha no upload S3, tentando ImgBB como fallback...', s3Error.message);
        
        // Tentar ImgBB como fallback se S3 falhar por CORS
        if (config.imgbbApiKey && s3Error.message.includes('CORS')) {
          try {
            console.log('📤 Tentando upload via ImgBB...');
            const imgbbResult = await uploadToImgBB(file, config.imgbbApiKey);
            return {
              ...imgbbResult,
              fallback: 'imgbb',
              originalError: s3Error.message
            };
          } catch (imgbbError) {
            console.warn('⚠️ ImgBB também falhou, usando Base64:', imgbbError.message);
          }
        }
        
        // Fallback final para Base64
        const base64 = await convertToBase64(file);
        return {
          url: base64,
          size: file.size,
          isBase64: true,
          fallback: 'base64',
          originalError: s3Error.message
        };
      }
      
    case 'imgbb':
      return await uploadToImgBB(file, config.apiKey);
    
    case 'cloudinary':
      return await uploadToCloudinary(file, config.cloudName, config.uploadPreset);
    
    case 'custom':
      return await uploadToCustomEndpoint(file, config.endpoint);
    
    case 'base64':
    default:
      // Fallback para Base64
      const base64 = await convertToBase64(file);
      return {
        url: base64,
        size: file.size,
        isBase64: true,
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