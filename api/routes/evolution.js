const express = require('express');
const router = express.Router();
const evolutionService = require('../services/evolutionService');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

/**
 * Função para salvar mídia no S3
 */
async function saveMediaToS3(base64Data, fileName, mediaType, workspaceName = 'default') {
  try {
    console.log('📤 Salvando mídia no S3...', { fileName, mediaType, workspaceName });

    // Configurações AWS S3
    const s3Config = {
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    };

    const bucketName = process.env.AWS_BUCKET_NAME;

    // Se AWS não estiver configurado, usar URL local para desenvolvimento
    if (!bucketName || !s3Config.credentials.accessKeyId || !s3Config.credentials.secretAccessKey) {
      console.log('⚠️ AWS S3 não configurado, usando URL local para desenvolvimento');

      // Gerar nome único do arquivo
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2);
      const fileExtension = fileName.split('.').pop();
      const uniqueFileName = `${timestamp}_${randomString}.${fileExtension}`;

      // Retornar URL local fictícia para desenvolvimento
      const localUrl = `http://localhost:3001/uploads/chat-files/${workspaceName}/${uniqueFileName}`;

      return {
        success: true,
        url: localUrl,
        key: `chat-files/${workspaceName}/${uniqueFileName}`,
        bucket: 'local-dev',
        size: Buffer.from(base64Data, 'base64').length,
        etag: `"dev-${timestamp}"`,
        originalName: fileName,
        contentType: 'application/octet-stream',
        isDevelopment: true
      };
    }

    const s3Client = new S3Client(s3Config);

    // Gerar nome único do arquivo
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2);
    const fileExtension = fileName.split('.').pop();
    const uniqueFileName = `${timestamp}_${randomString}.${fileExtension}`;

    // Determinar pasta baseada no workspace
    const normalizedWorkspaceName = workspaceName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '');

    const folderPath = `chat-files/${normalizedWorkspaceName}/${uniqueFileName}`;

    // Converter Base64 para Buffer
    const buffer = Buffer.from(base64Data, 'base64');

    // Determinar Content-Type baseado no mediaType
    let contentType = 'application/octet-stream';
    switch (mediaType.toLowerCase()) {
      case 'image':
        contentType = 'image/jpeg';
        if (fileName.toLowerCase().includes('.png')) contentType = 'image/png';
        if (fileName.toLowerCase().includes('.gif')) contentType = 'image/gif';
        break;
      case 'video':
        contentType = 'video/mp4';
        break;
      case 'audio':
        contentType = 'audio/mpeg';
        break;
      case 'document':
        contentType = 'application/pdf';
        if (fileName.toLowerCase().includes('.doc')) contentType = 'application/msword';
        break;
    }

    // Upload para S3
    const uploadCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: folderPath,
      Body: buffer,
      ContentType: contentType,
      Metadata: {
        'original-name': fileName,
        'upload-timestamp': timestamp.toString(),
        'workspace': workspaceName,
        'source': 'chat-evolution'
      },
    });

    const response = await s3Client.send(uploadCommand);

    // Construir URL pública
    const publicUrl = `https://${bucketName}.s3.${s3Config.region}.amazonaws.com/${folderPath}`;

    console.log('✅ Mídia salva no S3:', publicUrl);

    return {
      success: true,
      url: publicUrl,
      key: folderPath,
      bucket: bucketName,
      size: buffer.length,
      etag: response.ETag,
      originalName: fileName,
      contentType: contentType
    };

  } catch (error) {
    console.error('❌ Erro ao salvar mídia no S3:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * POST /api/evolution/create
 * Criar nova instância da Evolution
 */
router.post('/create', async (req, res) => {
  try {
    const {
      instanceName,
      hotel_uuid,
      webhook_url,
      integration = 'WHATSAPP-BAILEYS',
      settings = {}
    } = req.body;

    // Validar dados obrigatórios
    if (!instanceName) {
      return res.status(400).json({
        success: false,
        error: 'instanceName é obrigatório'
      });
    }

    if (!hotel_uuid) {
      return res.status(400).json({
        success: false,
        error: 'hotel_uuid é obrigatório'
      });
    }

    console.log(`🚀 Criando instância: ${instanceName} para hotel: ${hotel_uuid}`);

    const result = await evolutionService.createInstance({
      instanceName,
      hotel_uuid,
      webhook_url,
      integration,
      ...settings
    });

    if (result.success) {
      res.status(201).json({
        success: true,
        message: 'Instância criada com sucesso!',
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Erro na rota create:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/evolution/connect/:instanceName
 * Conectar instância e obter QR Code
 */
router.get('/connect/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params;

    console.log(`🔗 Conectando instância: ${instanceName}`);

    const result = await evolutionService.connectInstance(instanceName);

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Erro na rota connect:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/evolution/qrcode/:instanceName
 * Obter QR Code para conexão (interface)
 */
router.get('/qrcode/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params;

    console.log(`📱 Obtendo QR Code para: ${instanceName}`);

    const result = await evolutionService.connectInstance(instanceName);

    if (result.success && result.data) {
      // A Evolution API retorna QR Code diretamente ou dentro de um campo qrcode
      const qrcodeData = result.data.qrcode || result.data;
      
      if (qrcodeData.base64) {
        // Retornar dados formatados para a interface
        res.json({
          success: true,
          data: {
            instanceName,
            qrcode: {
              base64: qrcodeData.base64,
              code: qrcodeData.code,
              pairingCode: qrcodeData.pairingCode
            },
            status: result.data.status || 'connecting'
          }
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'QR Code não disponível'
        });
      }
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'QR Code não disponível'
      });
    }

  } catch (error) {
    console.error('❌ Erro na rota qrcode:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/evolution/status/:instanceName
 * Verificar status da conexão
 */
router.get('/status/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params;

    const result = await evolutionService.getConnectionState(instanceName);

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Erro na rota status:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/evolution/instances
 * Listar instâncias da Evolution API
 */
router.get('/instances', async (req, res) => {
  try {
    const result = await evolutionService.fetchInstances();

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Erro na rota instances:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/evolution/database
 * Listar instâncias do banco de dados
 */
router.get('/database', async (req, res) => {
  try {
    const { hotel_uuid } = req.query;

    const result = await evolutionService.getInstancesFromDatabase(hotel_uuid);

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Erro na rota database:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * DELETE /api/evolution/delete/:instanceName
 * Deletar instância
 */
router.delete('/delete/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params;

    console.log(`🗑️ Deletando instância: ${instanceName}`);

    const result = await evolutionService.deleteInstance(instanceName);

    if (result.success) {
      res.json({
        success: true,
        message: 'Instância deletada com sucesso!',
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Erro na rota delete:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/evolution/logout/:instanceName
 * Desconectar instância do WhatsApp
 */
router.post('/logout/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params;

    console.log(`🔌 Desconectando instância: ${instanceName}`);

    const result = await evolutionService.logoutInstance(instanceName);

    if (result.success) {
      res.json({
        success: true,
        message: 'Instância desconectada com sucesso!',
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Erro na rota logout:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/evolution/import
 * Importar instâncias existentes da Evolution API para o banco de dados
 */
router.post('/import', async (req, res) => {
  try {
    console.log('📥 Importando instâncias da Evolution API...');

    const result = await evolutionService.importExistingInstances();

    if (result.success) {
      res.json({
        success: true,
        message: 'Instâncias importadas com sucesso!',
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Erro na rota import:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/evolution/instances/available
 * Listar instâncias disponíveis para relacionamento
 */
router.get('/instances/available', async (req, res) => {
  try {
    const result = await evolutionService.getAvailableInstances();

    if (result.success) {
      res.json({
        success: true,
        data: result.instances || result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Erro na rota instances/available:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/evolution/instances/relate
 * Relacionar uma instância a um hotel
 */
router.post('/instances/relate', async (req, res) => {
  try {
    const { instance_name, hotel_uuid } = req.body;

    if (!instance_name || !hotel_uuid) {
      return res.status(400).json({
        success: false,
        error: 'instance_name e hotel_uuid são obrigatórios'
      });
    }

    const result = await evolutionService.relateInstanceToHotel(instance_name, hotel_uuid);

    if (result.success) {
      res.json({
        success: true,
        message: 'Instância relacionada com sucesso!',
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Erro na rota instances/relate:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * DELETE /api/evolution/instances/unrelate
 * Desrelacionar uma instância de um hotel
 */
router.delete('/instances/unrelate', async (req, res) => {
  try {
    const { instance_name, hotel_uuid } = req.body;

    if (!instance_name || !hotel_uuid) {
      return res.status(400).json({
        success: false,
        error: 'instance_name e hotel_uuid são obrigatórios'
      });
    }

    const result = await evolutionService.unrelateInstanceFromHotel(instance_name, hotel_uuid);

    if (result.success) {
      res.json({
        success: true,
        message: 'Instância desrelacionada com sucesso!',
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Erro na rota instances/unrelate:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});


/**
 * POST /api/evolution/test
 * Testar conexão com Evolution API
 */
router.get('/test', async (req, res) => {
  try {
    console.log('🧪 Testando conexão com Evolution API...');

    const result = await evolutionService.fetchInstances();

    if (result.success) {
      res.json({
        success: true,
        message: 'Conexão com Evolution API funcionando!',
        data: {
          instances_count: Array.isArray(result.data) ? result.data.length : 0,
          response: result.data
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        message: 'Falha na conexão com Evolution API'
      });
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/evolution/webhook/:instanceName
 * Configurar webhook para uma instância
 */
router.post('/webhook/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params;
    const { webhook_url } = req.body;

    if (!webhook_url) {
      return res.status(400).json({
        success: false,
        error: 'webhook_url é obrigatório'
      });
    }

    const result = await evolutionService.setWebhook(instanceName, {
      url: webhook_url
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'Webhook configurado com sucesso!',
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error.message
      });
    }

  } catch (error) {
    console.error('❌ Erro na configuração de webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/evolution/profile-picture/:instanceName/:phoneNumber
 * Buscar foto de perfil de um contato
 */
router.get('/profile-picture/:instanceName/:phoneNumber', async (req, res) => {
  try {
    const { instanceName, phoneNumber } = req.params;

    console.log(`📷 Buscando foto de perfil: ${phoneNumber} na instância ${instanceName}`);

    const result = await evolutionService.fetchProfilePicture(instanceName, phoneNumber);

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Erro na rota profile-picture:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/evolution/contact/:instanceName/:phoneNumber
 * Buscar informações de um contato
 */
router.get('/contact/:instanceName/:phoneNumber', async (req, res) => {
  try {
    const { instanceName, phoneNumber } = req.params;

    console.log(`👤 Buscando informações do contato: ${phoneNumber} na instância ${instanceName}`);

    const result = await evolutionService.fetchContact(instanceName, phoneNumber);

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Erro na rota contact:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/evolution/message/sendMedia/:instanceName
 * Enviar mídia via Evolution API
 */
router.post('/message/sendMedia/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params;
    const { number, mediatype, filename, caption, media, workspaceName } = req.body;

    if (!number || !mediatype || !filename || !media) {
      return res.status(400).json({
        success: false,
        error: 'number, mediatype, filename e media são obrigatórios'
      });
    }

    console.log(`📤 Enviando mídia via Evolution API: ${instanceName} -> ${number}`);

    // 1. Primeiro, salvar mídia no S3
    console.log('📤 Salvando mídia no S3 antes de enviar...');
    const s3Result = await saveMediaToS3(media, filename, mediatype, workspaceName || 'default');

    if (!s3Result.success) {
      console.warn('⚠️ Falha ao salvar no S3, continuando sem URL:', s3Result.error);
    }

    // 2. Enviar para Evolution API
    const mediaData = {
      mediaType: mediatype,
      fileName: filename,
      caption: caption || '',
      media: media
    };

    // Para desenvolvimento: simular sucesso se S3 local funcionou
    let result;
    if (s3Result.success && s3Result.isDevelopment) {
      console.log('🧪 Modo desenvolvimento: simulando sucesso da Evolution API');
      result = {
        success: true,
        data: {
          key: { id: `dev_media_${Date.now()}` },
          status: 'success',
          message: 'Mídia enviada com sucesso (simulado)'
        }
      };
    } else {
      result = await evolutionService.sendMedia(instanceName, number, mediaData);
    }

    if (result.success) {
      // 3. Salvar mensagem de mídia no banco local COM URL do S3
      try {
        const { saveMessage } = require('./whatsapp-messages');

        // Determinar message_type baseado no mediatype para o enum do banco
        let dbMessageType = 'document'; // padrão
        switch (mediatype.toLowerCase()) {
          case 'image':
            dbMessageType = 'image';
            break;
          case 'video':
            dbMessageType = 'video';
            break;
          case 'audio':
            dbMessageType = 'audio';
            break;
          case 'document':
            dbMessageType = 'document';
            break;
          default:
            dbMessageType = 'document';
        }

        const messageData = {
          message_id: result.data.key?.id || `media_${Date.now()}`,
          instance_name: instanceName,
          phone_number: number,
          contact_name: null, // Será atualizado posteriormente
          message_type: dbMessageType, // ✅ Tipo válido do enum
          content: filename || 'Arquivo',
          media_url: s3Result.success ? s3Result.url : null, // ✅ URL do S3 salva no banco
          direction: 'outbound',
          timestamp: new Date(),
          raw_data: {
            ...result.data,
            s3_info: s3Result.success ? {
              url: s3Result.url,
              key: s3Result.key,
              bucket: s3Result.bucket,
              size: s3Result.size
            } : null
          }
        };

        await saveMessage(messageData);
        console.log('✅ Mensagem de mídia salva no banco local com URL do S3:', s3Result.success ? s3Result.url : 'sem URL');
      } catch (saveError) {
        console.error('⚠️ Erro ao salvar mensagem no banco (mídia enviada com sucesso):', saveError);
      }

      res.status(201).json({
        success: true,
        message: 'Mídia enviada com sucesso!',
        data: {
          ...result.data,
          media_url: s3Result.success ? s3Result.url : null,
          s3_saved: s3Result.success
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error.message
      });
    }

  } catch (error) {
    console.error('❌ Erro na rota sendMedia:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        fullError: error
      } : undefined
    });
  }
});

/**
 * GET /api/evolution/image-proxy
 * Proxy para imagens do WhatsApp
 */
router.get('/image-proxy', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL da imagem é obrigatória'
      });
    }

    console.log(`🖼️ Proxying imagem: ${url}`);

    const axios = require('axios');

    const response = await axios.get(url, {
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });

    // Definir os headers apropriados
    res.set({
      'Content-Type': response.headers['content-type'] || 'image/jpeg',
      'Cache-Control': 'public, max-age=86400', // Cache por 24 horas
      'Access-Control-Allow-Origin': '*'
    });

    // Pipe a imagem para a resposta
    response.data.pipe(res);

  } catch (error) {
    console.error('❌ Erro no proxy de imagem:', error.message);

    // Retornar uma imagem padrão em caso de erro
    res.status(404).json({
      success: false,
      error: 'Imagem não encontrada'
    });
  }
});

module.exports = router;