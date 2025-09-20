const axios = require('axios');
const { saveMessage } = require('../routes/whatsapp-messages');

/**
 * Serviço para sincronizar mensagens da Evolution API
 * Este serviço faz polling das mensagens da Evolution e salva no banco local
 */
class MessagesSyncService {
  constructor() {
    this.isRunning = false;
    this.syncInterval = null;
    this.syncFrequency = 30000; // 30 segundos - configuração segura contra banimento
    this.lastSyncTimes = new Map(); // instance -> último timestamp de sync
    this.evolutionBaseUrl = process.env.EVOLUTION_HOST || 'https://osh-ia-evolution-api.d32pnk.easypanel.host';
    this.evolutionApiKey = process.env.EVOLUTION_API_KEY || 'E9E10572E76A-448E-A7F6-066263DAE1DB';
    this.websocketService = null; // Referência para emitir eventos WebSocket
  }

  /**
   * Iniciar sincronização automática
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ Sync de mensagens já está rodando');
      return;
    }

    console.log('🚀 Iniciando sincronização de mensagens da Evolution API (POLLING PRINCIPAL)...');
    this.isRunning = true;

    // Obter referência do WebSocket Service para emitir eventos
    try {
      this.websocketService = require('./websocketService');
      console.log('✅ WebSocket Service conectado ao MessagesSyncService');
    } catch (error) {
      console.warn('⚠️ WebSocket Service não disponível para MessagesSyncService');
    }

    this.syncInterval = setInterval(async () => {
      try {
        await this.syncAllInstancesMessages();
      } catch (error) {
        console.error('❌ Erro na sincronização automática:', error.message);
      }
    }, this.syncFrequency);

    console.log(`✅ Sync de mensagens iniciado (MÉTODO PRINCIPAL) - verificando a cada ${this.syncFrequency / 1000}s`);
  }

  /**
   * Parar sincronização automática
   */
  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isRunning = false;
    console.log('🛑 Sincronização de mensagens parada');
  }

  /**
   * Sincronizar mensagens de todas as instâncias ativas
   */
  async syncAllInstancesMessages() {
    try {
      // Buscar instâncias ativas da Evolution
      const activeInstances = await this.getActiveInstances();

      if (activeInstances.length === 0) {
        console.log('📭 Nenhuma instância ativa para sincronizar');
        return;
      }

      console.log(`🔄 Sincronizando ${activeInstances.length} instâncias...`);

      // Sincronizar cada instância
      const syncPromises = activeInstances.map(instance =>
        this.syncInstanceMessages(instance.name)
      );

      await Promise.allSettled(syncPromises);

    } catch (error) {
      console.error('❌ Erro ao sincronizar todas as instâncias:', error.message);
    }
  }

  /**
   * Obter instâncias ativas do banco local
   */
  async getActiveInstances() {
    try {
      // Buscar da nossa API local (que já tem as instâncias)
      const response = await axios.get('http://localhost:3001/api/evolution/instances');

      if (response.data.success && response.data.data) {
        // Filtrar apenas instâncias conectadas/abertas
        return response.data.data.filter(instance =>
          instance.connectionStatus === 'open' ||
          instance.connectionStatus === 'connecting'
        );
      }

      return [];
    } catch (error) {
      console.error('❌ Erro ao buscar instâncias ativas:', error.message);
      return [];
    }
  }

  /**
   * Sincronizar mensagens de uma instância específica
   */
  async syncInstanceMessages(instanceName) {
    try {
      // Obter timestamp da última sincronização
      const lastSync = this.lastSyncTimes.get(instanceName) || Date.now() - (60000 * 5); // 5 minutos atrás se primeira vez
      const currentTime = Date.now();

      // Buscar mensagens da Evolution API
      const messages = await this.fetchEvolutionMessages(instanceName, lastSync);

      if (messages.length > 0) {
        console.log(`📥 Sincronizando ${messages.length} mensagens da instância ${instanceName}`);

        // Processar cada mensagem
        for (const message of messages) {
          await this.processMessage(instanceName, message);
        }

        console.log(`✅ ${messages.length} mensagens sincronizadas para ${instanceName}`);
      }

      // Atualizar timestamp da última sincronização
      this.lastSyncTimes.set(instanceName, currentTime);

    } catch (error) {
      console.error(`❌ Erro ao sincronizar instância ${instanceName}:`, error.message);
    }
  }

  /**
   * Buscar mensagens da Evolution API
   */
  async fetchEvolutionMessages(instanceName, sinceTimestamp) {
    try {
      // TEMPORARIAMENTE DESABILITADO - endpoint não existe na Evolution API
      console.log(`⚠️ POLLING DESABILITADO: Usando apenas webhook para ${instanceName}`);
      return [];

      // Endpoint da Evolution para buscar mensagens (NÃO FUNCIONA - 404)
      // const url = `${this.evolutionBaseUrl}/message/findMany/${instanceName}`;

      const params = {
        where: {
          messageTimestamp: {
            gte: Math.floor(sinceTimestamp / 1000) // Evolution usa timestamp em segundos
          }
        },
        limit: 100
      };

      const response = await axios.get(url, {
        headers: {
          'apikey': this.evolutionApiKey,
          'Content-Type': 'application/json'
        },
        params: params,
        timeout: 10000
      });

      if (response.data && Array.isArray(response.data)) {
        // Filtrar apenas mensagens recebidas (não enviadas por nós)
        return response.data.filter(msg =>
          msg.key &&
          !msg.key.fromMe && // Apenas mensagens recebidas
          msg.messageTimestamp &&
          (msg.messageTimestamp * 1000) > sinceTimestamp
        );
      }

      return [];
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        console.warn(`⏱️ Timeout ao buscar mensagens de ${instanceName}`);
      } else {
        console.error(`❌ Erro ao buscar mensagens da Evolution ${instanceName}:`, error.message);
      }
      return [];
    }
  }

  /**
   * Processar e salvar uma mensagem
   */
  async processMessage(instanceName, evolutionMessage) {
    try {
      // Extrair informações da mensagem
      const messageInfo = this.extractMessageInfo(instanceName, evolutionMessage);

      if (!messageInfo) {
        return;
      }

      // Verificar se mensagem já existe no banco
      const exists = await this.messageExists(messageInfo.message_id);
      if (exists) {
        return; // Já processada
      }

      // Salvar no banco
      await saveMessage(messageInfo);

      console.log(`💾 Mensagem sincronizada: ${instanceName}/${messageInfo.phone_number} - ${messageInfo.message_type}`);

      // 🚀 NOVO: Emitir evento WebSocket para tempo real
      this.emitWebSocketEvent(instanceName, messageInfo);

    } catch (error) {
      console.error('❌ Erro ao processar mensagem:', error.message);
    }
  }

  /**
   * Extrair informações da mensagem da Evolution
   */
  extractMessageInfo(instanceName, message) {
    try {
      const phoneNumber = message.key?.remoteJid?.replace('@s.whatsapp.net', '');
      if (!phoneNumber) return null;

      // Determinar tipo da mensagem
      let messageType = 'text';
      let content = '';
      let mediaUrl = null;
      let caption = '';

      if (message.message) {
        if (message.message.conversation) {
          messageType = 'text';
          content = message.message.conversation;
        } else if (message.message.extendedTextMessage) {
          messageType = 'text';
          content = message.message.extendedTextMessage.text;
        } else if (message.message.imageMessage) {
          messageType = 'image';
          content = 'Imagem';
          caption = message.message.imageMessage.caption || '';
          mediaUrl = message.message.imageMessage.url;
        } else if (message.message.videoMessage) {
          messageType = 'video';
          content = 'Vídeo';
          caption = message.message.videoMessage.caption || '';
          mediaUrl = message.message.videoMessage.url;
        } else if (message.message.audioMessage) {
          messageType = 'audio';
          content = 'Áudio';
          mediaUrl = message.message.audioMessage.url;
        } else if (message.message.documentMessage) {
          messageType = 'document';
          content = message.message.documentMessage.fileName || 'Documento';
          caption = message.message.documentMessage.caption || '';
          mediaUrl = message.message.documentMessage.url;
        } else if (message.message.stickerMessage) {
          messageType = 'sticker';
          content = 'Sticker';
          mediaUrl = message.message.stickerMessage.url;
        } else {
          messageType = 'text';
          content = JSON.stringify(message.message);
        }
      }

      return {
        message_id: message.key?.id || `sync_${Date.now()}_${Math.random()}`,
        instance_name: instanceName,
        phone_number: phoneNumber,
        contact_name: null, // Será atualizado posteriormente
        message_type: messageType,
        content: content,
        media_url: mediaUrl,
        direction: 'inbound', // Sempre inbound pois filtramos fromMe=false
        timestamp: new Date(message.messageTimestamp * 1000),
        caption: caption,
        status: 'delivered',
        raw_data: message
      };

    } catch (error) {
      console.error('❌ Erro ao extrair informações da mensagem:', error);
      return null;
    }
  }

  /**
   * Verificar se mensagem já existe no banco
   */
  async messageExists(messageId) {
    try {
      const response = await axios.get(`http://localhost:3001/api/whatsapp-messages/exists/${messageId}`);
      return response.data.exists;
    } catch (error) {
      // Se der erro, assumir que não existe
      return false;
    }
  }

  /**
   * Obter estatísticas da sincronização
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      syncFrequency: this.syncFrequency,
      lastSyncTimes: Object.fromEntries(this.lastSyncTimes),
      activeInstances: this.lastSyncTimes.size
    };
  }

  /**
   * Forçar sincronização manual
   */
  async forcSync() {
    console.log('🔄 Forçando sincronização manual...');
    await this.syncAllInstancesMessages();
    console.log('✅ Sincronização manual concluída');
  }

  /**
   * 🚀 NOVO: Emitir evento WebSocket para tempo real
   */
  emitWebSocketEvent(instanceName, messageInfo) {
    if (!this.websocketService || !this.websocketService.isInitialized()) {
      return; // WebSocket não disponível, tudo bem
    }

    try {
      // Preparar dados da mensagem para o WebSocket
      const websocketData = {
        type: 'new-message',
        message: {
          messageId: messageInfo.message_id,
          instanceName: instanceName,
          phoneNumber: messageInfo.phone_number,
          contactName: messageInfo.contact_name,
          messageType: messageInfo.message_type,
          content: messageInfo.content,
          mediaUrl: messageInfo.media_url,
          direction: messageInfo.direction,
          timestamp: messageInfo.timestamp,
          fromMe: messageInfo.direction === 'outbound'
        },
        instance: instanceName,
        timestamp: new Date()
      };

      // Emitir para clientes inscritos nesta instância
      this.websocketService.broadcastToInstance(instanceName, 'new-message', websocketData);

      console.log(`📡 Evento WebSocket emitido para ${instanceName}: ${messageInfo.phone_number}`);
    } catch (error) {
      console.error('❌ Erro ao emitir evento WebSocket:', error.message);
      // Não interromper o fluxo principal se WebSocket falhar
    }
  }

  /**
   * 🚀 NOVO: Configurar WebSocket Service externamente
   */
  setWebSocketService(websocketService) {
    this.websocketService = websocketService;
    console.log('✅ WebSocket Service configurado no MessagesSyncService');
  }
}

module.exports = new MessagesSyncService();