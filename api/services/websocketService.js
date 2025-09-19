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
    if (!client) return;

    // Adicionar instância ao cliente
    client.subscribedInstances.add(instanceName);
    client.workspaceUuid = workspaceUuid;

    // Adicionar cliente à lista da instância
    if (!this.subscribedInstances.has(instanceName)) {
      this.subscribedInstances.set(instanceName, new Set());
    }
    this.subscribedInstances.get(instanceName).add(socketId);

    // Fazer cliente entrar na sala da instância
    client.socket.join(`instance-${instanceName}`);
    client.socket.join(`workspace-${workspaceUuid}`);
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

    if (excludeSocketId) {
      // Emitir para todos na sala, exceto o socket especificado
      this.io.to(room).except(excludeSocketId).emit(event, data);
    } else {
      // Emitir para todos na sala
      this.io.to(room).emit(event, data);
    }

    console.log(`📡 Evento '${event}' enviado para instância ${instanceName}:`, {
      data: data.type || data.message || 'dados',
      excludeSocket: excludeSocketId ? 'sim' : 'não'
    });
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
   * Manipular nova mensagem
   */
  handleNewMessage(instance, messageData) {
    if (!messageData || !messageData.messages) return;

    for (const message of messageData.messages) {
      const processedMessage = {
        messageId: message.key?.id,
        instanceName: instance,
        phoneNumber: message.key?.remoteJid?.replace('@s.whatsapp.net', ''),
        fromMe: message.key?.fromMe || false,
        messageType: message.messageType,
        content: message.message || message.body,
        timestamp: new Date(message.messageTimestamp * 1000),
        status: message.status,
        raw: message
      };

      // Emitir para clientes inscritos nesta instância
      this.broadcastToInstance(instance, 'new-message', {
        type: 'new-message',
        message: processedMessage,
        instance,
        timestamp: new Date()
      });

      console.log(`💬 Nova mensagem via WebSocket: ${instance}/${processedMessage.phoneNumber}`);
    }
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
}

module.exports = new WebSocketService();