const { Server } = require('socket.io');

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedClients = new Map();
    this.subscribedInstances = new Map(); // instance -> Set<socketIds>
    this.initialized = false;
  }

  /**
   * Verificar se já foi inicializado
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * Inicializar servidor WebSocket
   */
  initialize(server) {
    if (this.initialized) {
      console.log('⚠️ WebSocket Service já foi inicializado');
      return;
    }
    this.io = new Server(server, {
      cors: {
        origin: function (origin, callback) {
          // Lista de origins permitidos para Socket.io
          const allowedOrigins = [
            // Desenvolvimento local
            'http://localhost:3000',
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:5175',
            'http://localhost:5176',
            'http://localhost:5177',
            'http://localhost:5178',
            'http://localhost:5179',
            'http://localhost:5180',
            'http://localhost:5181',
            // EasyPanel domains (usar variável de ambiente se configurada)
            ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map(o => o.trim()) : [])
          ];

          // Permitir requisições sem origin
          if (!origin) {
            return callback(null, true);
          }

          // Verificar se origin está na lista permitida ou é localhost
          if (origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:') || allowedOrigins.includes(origin)) {
            return callback(null, true);
          }

          console.log(`🚫 WebSocket CORS bloqueado para: ${origin}`);
          callback(new Error('WebSocket: Não permitido pelo CORS'));
        },
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
    this.initialized = true;
    console.log('✅ WebSocket Service inicializado');
  }

  /**
   * Configurar manipuladores de eventos
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 Cliente WebSocket conectado: ${socket.id}`);

      this.connectedClients.set(socket.id, {
        socket,
        subscribedInstances: new Set(),
        connectedAt: new Date()
      });

      // 🔧 DEBUG: Enviar mensagem de teste direto para o cliente
      setTimeout(() => {
        console.log(`📤 ENVIANDO TESTE DIRETO para cliente ${socket.id}`);
        socket.emit('test-message', {
          message: 'Teste direto do backend',
          timestamp: new Date(),
          socketId: socket.id
        });
      }, 2000);

      // Evento: Cliente quer se inscrever em uma instância
      socket.on('subscribe-instance', (data) => {
        try {
          const { instanceName, workspaceUuid } = data;

          if (!instanceName || !workspaceUuid) {
            socket.emit('error', { message: 'instanceName e workspaceUuid são obrigatórios' });
            return;
          }

          this.subscribeToInstance(socket.id, instanceName, workspaceUuid);

          socket.emit('subscription-confirmed', {
            instanceName,
            workspaceUuid,
            message: `Inscrito em ${instanceName}`
          });

          console.log(`📝 Cliente ${socket.id} inscrito em instância: ${instanceName}`);
        } catch (error) {
          console.error('❌ Erro ao inscrever em instância:', error);
          socket.emit('error', { message: 'Erro ao se inscrever na instância' });
        }
      });

      // Evento: Cliente quer se desinscrever de uma instância
      socket.on('unsubscribe-instance', (data) => {
        try {
          const { instanceName } = data;
          this.unsubscribeFromInstance(socket.id, instanceName);

          socket.emit('unsubscription-confirmed', {
            instanceName,
            message: `Desinscrito de ${instanceName}`
          });

          console.log(`📝 Cliente ${socket.id} desinscrito da instância: ${instanceName}`);
        } catch (error) {
          console.error('❌ Erro ao desinscrever da instância:', error);
        }
      });

      // Evento: Marcar mensagens como lidas
      socket.on('mark-messages-read', (data) => {
        try {
          const { instanceName, phoneNumber } = data;

          // Emitir para outros clientes conectados na mesma instância
          this.broadcastToInstance(instanceName, 'messages-marked-read', {
            instanceName,
            phoneNumber,
            timestamp: new Date()
          }, socket.id); // Excluir o remetente

          console.log(`✅ Mensagens marcadas como lidas: ${instanceName}/${phoneNumber}`);
        } catch (error) {
          console.error('❌ Erro ao marcar mensagens como lidas:', error);
        }
      });

      // Evento: Ping/Pong para manter conexão viva
      socket.on('ping', () => {
        socket.emit('pong');
      });

      // Evento: Cliente se desconectou
      socket.on('disconnect', (reason) => {
        console.log(`🔌 Cliente WebSocket desconectado: ${socket.id} (${reason})`);
        this.removeClient(socket.id);
      });

      // Evento: Erro de conexão
      socket.on('error', (error) => {
        console.error(`❌ Erro WebSocket ${socket.id}:`, error);
      });

      // Enviar status inicial
      socket.emit('connected', {
        socketId: socket.id,
        serverTime: new Date(),
        message: 'Conectado ao servidor WebSocket OSH'
      });
    });
  }

  /**
   * Inscrever cliente em uma instância
   */
  subscribeToInstance(socketId, instanceName, workspaceUuid) {
    const client = this.connectedClients.get(socketId);
    if (!client) {
      console.warn(`⚠️ Cliente ${socketId} não encontrado para inscrição na instância ${instanceName}`);
      return;
    }

    // Adicionar instância ao cliente
    client.subscribedInstances.add(instanceName);
    client.workspaceUuid = workspaceUuid;

    // Adicionar cliente à lista da instância
    if (!this.subscribedInstances.has(instanceName)) {
      this.subscribedInstances.set(instanceName, new Set());
    }
    this.subscribedInstances.get(instanceName).add(socketId);

    // Fazer cliente entrar na sala da instância
    const roomInstance = `instance-${instanceName}`;
    const roomWorkspace = `workspace-${workspaceUuid}`;

    client.socket.join(roomInstance);
    client.socket.join(roomWorkspace);

    console.log(`✅ INSCRIÇÃO REALIZADA: Cliente ${socketId} inscrito em:`, {
      instanceName: instanceName,
      workspaceUuid: workspaceUuid,
      roomInstance: roomInstance,
      roomWorkspace: roomWorkspace,
      totalClientesInstancia: this.subscribedInstances.get(instanceName).size,
      totalClientesConectados: this.connectedClients.size
    });
  }

  /**
   * Desinscrever cliente de uma instância
   */
  unsubscribeFromInstance(socketId, instanceName) {
    const client = this.connectedClients.get(socketId);
    if (!client) return;

    // Remover instância do cliente
    client.subscribedInstances.delete(instanceName);

    // Remover cliente da lista da instância
    const instanceClients = this.subscribedInstances.get(instanceName);
    if (instanceClients) {
      instanceClients.delete(socketId);
      if (instanceClients.size === 0) {
        this.subscribedInstances.delete(instanceName);
      }
    }

    // Fazer cliente sair da sala
    client.socket.leave(`instance-${instanceName}`);
  }

  /**
   * Remover cliente completamente
   */
  removeClient(socketId) {
    const client = this.connectedClients.get(socketId);
    if (!client) return;

    // Desinscrever de todas as instâncias
    for (const instanceName of client.subscribedInstances) {
      this.unsubscribeFromInstance(socketId, instanceName);
    }

    this.connectedClients.delete(socketId);
  }

  /**
   * Emitir evento para todos os clientes de uma instância específica
   */
  broadcastToInstance(instanceName, event, data, excludeSocketId = null) {
    const room = `instance-${instanceName}`;

    // 🔧 MELHOR LOGGING: Verificar quantos clientes estão conectados
    const roomSockets = this.io.sockets.adapter.rooms.get(room);
    const clientCount = roomSockets ? roomSockets.size : 0;

    console.log(`📡 BROADCAST DEBUG: instância '${instanceName}', evento '${event}'`, {
      room: room,
      clientesConectados: clientCount,
      temClientes: clientCount > 0,
      data: data.type || 'dados',
      excludeSocket: excludeSocketId ? 'sim' : 'não'
    });

    if (clientCount === 0) {
      console.warn(`⚠️ NENHUM CLIENTE conectado na sala '${room}' para receber evento '${event}'`);
      return;
    }

    if (excludeSocketId) {
      // Emitir para todos na sala, exceto o socket especificado
      this.io.to(room).except(excludeSocketId).emit(event, data);
    } else {
      // Emitir para todos na sala
      this.io.to(room).emit(event, data);
    }

    console.log(`✅ Evento '${event}' enviado para ${clientCount} clientes na instância '${instanceName}'`);
  }

  /**
   * Emitir evento para todos os clientes de um workspace específico
   */
  broadcastToWorkspace(workspaceUuid, event, data) {
    const room = `workspace-${workspaceUuid}`;
    this.io.to(room).emit(event, data);

    console.log(`📡 Evento '${event}' enviado para workspace ${workspaceUuid}:`, {
      data: data.type || data.message || 'dados'
    });
  }

  /**
   * Processar webhook da Evolution API
   */
  processEvolutionWebhook(webhookData) {
    try {
      const { instance, event, data } = webhookData;

      if (!instance || !event) {
        console.warn('⚠️ Webhook inválido: faltam instance ou event');
        return;
      }

      console.log(`📨 Webhook recebido: ${event} da instância ${instance}`);

      switch (event) {
        case 'MESSAGES_UPSERT':
          this.handleNewMessage(instance, data);
          break;

        case 'MESSAGES_UPDATE':
          this.handleMessageUpdate(instance, data);
          break;

        case 'CONNECTION_UPDATE':
          this.handleConnectionUpdate(instance, data);
          break;

        case 'CONTACTS_UPSERT':
          this.handleContactUpdate(instance, data);
          break;

        default:
          // Repassar evento genérico
          this.broadcastToInstance(instance, 'evolution-event', {
            type: event,
            instance,
            data,
            timestamp: new Date()
          });
      }
    } catch (error) {
      console.error('❌ Erro ao processar webhook:', error);
    }
  }

  /**
   * Manipular nova mensagem - Melhorado para suportar diferentes formatos
   */
  handleNewMessage(instance, messageData) {
    try {
      let messages = [];

      // Suportar diferentes estruturas de dados
      if (messageData && messageData.messages && Array.isArray(messageData.messages)) {
        messages = messageData.messages;
      } else if (messageData && Array.isArray(messageData)) {
        messages = messageData;
      } else if (messageData && (messageData.key || messageData.message)) {
        messages = [messageData];
      } else if (messageData && messageData.data && messageData.data.key && messageData.data.message) {
        // 🔧 CORREÇÃO: Formato novo da Evolution API - dados em messageData.data
        messages = [messageData.data];
        console.log(`📥 WebSocket processando mensagem Evolution formato novo:`, {
          messageType: messageData.data.messageType,
          fromMe: messageData.data.key.fromMe,
          content: messageData.data.message.conversation || 'Mídia/Outro tipo',
          pushName: messageData.data.pushName
        });
      } else {
        console.warn(`⚠️ Estrutura de mensagem não reconhecida para ${instance}:`, messageData);
        return;
      }

      for (const message of messages) {
        try {
          // 🔧 CORREÇÃO: Melhorar filtro de mensagens enviadas
          const isFromMe = message.key?.fromMe === true || message.key?.fromMe === 'true';

          console.log(`🔍 FILTRO DEBUG: ${instance} - fromMe: ${message.key?.fromMe} (${typeof message.key?.fromMe}), isFromMe: ${isFromMe}`);

          if (isFromMe) {
            console.log(`⏩ PULANDO mensagem enviada por nós: ${instance}/${message.key?.remoteJid}`);
            continue; // Pular mensagens enviadas
          }

          const processedMessage = {
            messageId: message.key?.id || `ws_${Date.now()}_${Math.random()}`,
            instanceName: instance,
            phoneNumber: message.key?.remoteJid?.replace('@s.whatsapp.net', '') || 'unknown',
            fromMe: message.key?.fromMe || false,
            messageType: this.extractMessageType(message),
            content: this.extractMessageContent(message),
            timestamp: new Date(message.messageTimestamp ? message.messageTimestamp * 1000 : Date.now()),
            status: message.status || 'delivered',
            raw: message
          };

          // Emitir para clientes inscritos nesta instância
          const websocketData = {
            type: 'new-message',
            message: processedMessage,
            instance,
            timestamp: new Date()
          };

          console.log(`📤 ENVIANDO VIA WEBSOCKET: ${instance}/${processedMessage.phoneNumber}`, {
            messageId: processedMessage.messageId,
            content: processedMessage.content.substring(0, 50) + '...',
            phoneNumber: processedMessage.phoneNumber,
            messageType: processedMessage.messageType,
            timestamp: processedMessage.timestamp,
            websocketDataCompleto: websocketData
          });

          console.log('🔧 DEBUG: Estrutura completa da mensagem WebSocket:', JSON.stringify(websocketData, null, 2));
          this.broadcastToInstance(instance, 'new-message', websocketData);

          console.log(`✅ Mensagem WebSocket emitida: ${instance}/${processedMessage.phoneNumber}`);
        } catch (messageError) {
          console.error(`❌ Erro ao processar mensagem individual:`, messageError);
        }
      }
    } catch (error) {
      console.error(`❌ Erro ao manipular nova mensagem:`, error);
    }
  }

  /**
   * Extrair tipo da mensagem
   */
  extractMessageType(message) {
    if (!message.message) return 'text';

    if (message.message.conversation) return 'text';
    if (message.message.extendedTextMessage) return 'text';
    if (message.message.imageMessage) return 'image';
    if (message.message.videoMessage) return 'video';
    if (message.message.audioMessage) return 'audio';
    if (message.message.documentMessage) return 'document';
    if (message.message.stickerMessage) return 'sticker';

    return 'text';
  }

  /**
   * Extrair conteúdo da mensagem
   */
  extractMessageContent(message) {
    if (!message.message) return 'Mensagem sem conteúdo';

    if (message.message.conversation) {
      return message.message.conversation;
    }
    if (message.message.extendedTextMessage?.text) {
      return message.message.extendedTextMessage.text;
    }
    if (message.message.imageMessage) {
      return message.message.imageMessage.caption || '[Imagem]';
    }
    if (message.message.videoMessage) {
      return message.message.videoMessage.caption || '[Vídeo]';
    }
    if (message.message.audioMessage) {
      return '[Áudio]';
    }
    if (message.message.documentMessage) {
      return message.message.documentMessage.caption || '[Documento]';
    }
    if (message.message.stickerMessage) {
      return '[Sticker]';
    }

    return JSON.stringify(message.message).substring(0, 100);
  }

  /**
   * Manipular atualização de mensagem
   */
  handleMessageUpdate(instance, updateData) {
    this.broadcastToInstance(instance, 'message-update', {
      type: 'message-update',
      update: updateData,
      instance,
      timestamp: new Date()
    });
  }

  /**
   * Manipular atualização de conexão
   */
  handleConnectionUpdate(instance, connectionData) {
    this.broadcastToInstance(instance, 'connection-update', {
      type: 'connection-update',
      connection: connectionData,
      instance,
      timestamp: new Date()
    });

    console.log(`🔗 Atualização de conexão: ${instance} - ${connectionData.state}`);
  }

  /**
   * Manipular atualização de contato
   */
  handleContactUpdate(instance, contactData) {
    this.broadcastToInstance(instance, 'contact-update', {
      type: 'contact-update',
      contact: contactData,
      instance,
      timestamp: new Date()
    });
  }

  /**
   * Obter estatísticas do WebSocket
   */
  getStats() {
    return {
      connectedClients: this.connectedClients.size,
      subscribedInstances: this.subscribedInstances.size,
      totalSubscriptions: Array.from(this.subscribedInstances.values())
        .reduce((total, clientSet) => total + clientSet.size, 0),
      instances: Array.from(this.subscribedInstances.keys()),
      clients: Array.from(this.connectedClients.entries()).map(([socketId, client]) => ({
        socketId,
        subscribedInstances: Array.from(client.subscribedInstances),
        connectedAt: client.connectedAt,
        workspaceUuid: client.workspaceUuid
      }))
    };
  }

  /**
   * TESTE: Enviar mensagem direto para todos os sockets conectados
   */
  testDirectMessage() {
    const testMessage = {
      type: 'test-direct-message',
      message: 'TESTE DIRETO DE TODOS OS SOCKETS',
      timestamp: new Date()
    };

    console.log('🧪 ENVIANDO TESTE DIRETO PARA TODOS OS SOCKETS:', testMessage);
    this.io.emit('test-direct-message', testMessage);

    console.log(`✅ Teste enviado para ${this.connectedClients.size} clientes conectados`);
  }

  /**
   * TESTE: Enviar new-message direto para todos os sockets
   */
  testNewMessageDirect() {
    const testMessage = {
      type: 'new-message',
      message: {
        messageId: 'TEST_123',
        content: 'TESTE NEW-MESSAGE DIRETO',
        phoneNumber: '5511999999999',
        messageType: 'text',
        timestamp: new Date()
      },
      instance: 'osociohoteleiro_notificacoes',
      timestamp: new Date()
    };

    console.log('🧪 ENVIANDO NEW-MESSAGE DIRETO PARA TODOS OS SOCKETS:', testMessage);
    this.io.emit('new-message', testMessage);

    console.log(`✅ new-message enviado para ${this.connectedClients.size} clientes conectados`);
  }
}

module.exports = new WebSocketService();