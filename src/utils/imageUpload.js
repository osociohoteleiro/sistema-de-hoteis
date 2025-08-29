// Utilitários para upload de imagens

// Validação de arquivo de imagem
export const validateImageFile = (file) => {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!file) {
    return { isValid: false, error: 'Nenhum arquivo selecionado' };
  }

  if (!validTypes.includes(file.type)) {
    return { 
      isValid: false, 
      error: 'Tipo de arquivo não suportado. Use JPG, PNG, WebP ou AVIF.' 
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

// Função principal de upload que escolhe o método baseado na configuração
export const uploadImage = async (file, uploadConfig) => {
  const validation = validateImageFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const { service, ...config } = uploadConfig;

  switch (service) {
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