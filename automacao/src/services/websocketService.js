import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.subscribedInstances = new Set();
    this.currentWorkspaceUuid = null;
    this.eventListeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // 1 segundo inicial
    this.fallbackMode = false; // Modo fallback para polling
    this.lastConnectionTime = null;
    this.connectionQuality = 'good'; // good, poor, failed
    this.healthCheckInterval = null;
    this.reconnectTimeout = null;
  }

  /**
   * Conectar ao servidor WebSocket
   */
  connect(workspaceUuid) {
    if (this.socket && this.isConnected) {
      console.log('🔌 WebSocket já conectado');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        console.log('🔄 Conectando ao WebSocket...');

        this.currentWorkspaceUuid = workspaceUuid;

        // Configurar conexão
        this.socket = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001', {
          transports: ['websocket', 'polling'],
          timeout: 20000,
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay,
          forceNew: false
        });

        // Eventos de conexão
        this.socket.on('connect', () => {
          console.log('✅ WebSocket conectado:', this.socket.id);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.fallbackMode = false;
          this.lastConnectionTime = new Date();
          this.connectionQuality = 'good';
          this.startHealthCheck();

          // Reinscrever em instâncias após reconexão
          this.resubscribeToInstances();

          resolve();
        });

        this.socket.on('connected', (data) => {
          console.log('🎉 Confirmação de conexão:', data);
        });

        this.socket.on('disconnect', (reason) => {
          console.log('🔌 WebSocket desconectado:', reason);
          this.isConnected = false;
          this.connectionQuality = 'failed';
          this.stopHealthCheck();

          // Ativar modo fallback imediatamente
          this.enableFallbackMode();

          // Tentar reconectar automaticamente
          if (reason !== 'io client disconnect') {
            this.handleReconnection();
          }
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ Erro de conexão WebSocket:', error);
          this.isConnected = false;
          this.connectionQuality = 'failed';

          // Ativar modo fallback
          this.enableFallbackMode();

          if (this.reconnectAttempts === 0) {
            reject(error);
          }
        });

        // Eventos de resposta do servidor
        this.socket.on('subscription-confirmed', (data) => {
          console.log('✅ Inscrição confirmada:', data);
          this.subscribedInstances.add(data.instanceName);
        });

        this.socket.on('unsubscription-confirmed', (data) => {
          console.log('✅ Desinscrição confirmada:', data);
          this.subscribedInstances.delete(data.instanceName);
        });

        this.socket.on('error', (error) => {
          console.error('❌ Erro WebSocket:', error);
        });

        // Eventos de dados
        this.setupDataEventListeners();

        // Ping/Pong para manter conexão viva
        this.socket.on('pong', () => {
          // console.log('🏓 Pong recebido');
        });

        this.startPing();

      } catch (error) {
        console.error('❌ Erro ao conectar WebSocket:', error);
        reject(error);
      }
    });
  }

  /**
   * Configurar listeners para eventos de dados
   */
  setupDataEventListeners() {
    // Nova mensagem
    this.socket.on('new-message', (data) => {
      console.log('💬 Nova mensagem via WebSocket:', data);
      this.emitToListeners('new-message', data);
    });

    // Atualização de mensagem
    this.socket.on('message-update', (data) => {
      console.log('📝 Atualização de mensagem:', data);
      this.emitToListeners('message-update', data);
    });

    // Atualização de conexão
    this.socket.on('connection-update', (data) => {
      console.log('🔗 Atualização de conexão:', data);
      this.emitToListeners('connection-update', data);
    });

    // Atualização de contato
    this.socket.on('contact-update', (data) => {
      console.log('👤 Atualização de contato:', data);
      this.emitToListeners('contact-update', data);
    });

    // Mensagens marcadas como lidas
    this.socket.on('messages-marked-read', (data) => {
      console.log('✅ Mensagens marcadas como lidas:', data);
      this.emitToListeners('messages-marked-read', data);
    });

    // Evento genérico da Evolution
    this.socket.on('evolution-event', (data) => {
      console.log('📨 Evento Evolution:', data);
      this.emitToListeners('evolution-event', data);
    });
  }

  /**
   * Inscrever-se em uma instância
   */
  async subscribeToInstance(instanceName, validateInstance = true) {
    if (!this.socket || !this.isConnected) {
      console.warn('⚠️ WebSocket não conectado para inscrição');
      return false;
    }

    if (this.subscribedInstances.has(instanceName)) {
      console.log(`📝 Já inscrito na instância: ${instanceName}`);
      return true;
    }

    // Validar se a instância é válida e pertence ao workspace
    if (validateInstance && this.currentWorkspaceUuid) {
      const isValid = await this.validateInstance(instanceName, this.currentWorkspaceUuid);
      if (!isValid) {
        console.warn(`⚠️ Instância ${instanceName} não é válida para o workspace ${this.currentWorkspaceUuid}`);
        return false;
      }
    }

    console.log(`📝 Inscrevendo na instância: ${instanceName}`);

    this.socket.emit('subscribe-instance', {
      instanceName,
      workspaceUuid: this.currentWorkspaceUuid
    });

    return true;
  }

  /**
   * Validar se uma instância pertence ao workspace e está ativa
   */
  async validateInstance(instanceName, workspaceUuid) {
    try {
      // Fazer requisição para validar a instância
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/workspace-instances/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instanceName,
          workspaceUuid
        })
      });

      if (!response.ok) {
        console.warn(`⚠️ Falha na validação da instância ${instanceName}: ${response.status}`);
        return false;
      }

      const data = await response.json();
      const isValid = data.success && data.isValid;

      if (!isValid) {
        console.warn(`⚠️ Instância ${instanceName} não é válida:`, data.reason);
      }

      return isValid;
    } catch (error) {
      console.error(`❌ Erro ao validar instância ${instanceName}:`, error);
      // Em caso de erro na validação, permitir inscrição (fallback)
      return true;
    }
  }

  /**
   * Desinscrever-se de uma instância
   */
  unsubscribeFromInstance(instanceName) {
    if (!this.socket || !this.isConnected) {
      console.warn('⚠️ WebSocket não conectado para desinscrição');
      return false;
    }

    console.log(`📝 Desinscrevendo da instância: ${instanceName}`);

    this.socket.emit('unsubscribe-instance', {
      instanceName
    });

    this.subscribedInstances.delete(instanceName);
    return true;
  }

  /**
   * Marcar mensagens como lidas
   */
  markMessagesAsRead(instanceName, phoneNumber) {
    if (!this.socket || !this.isConnected) {
      console.warn('⚠️ WebSocket não conectado para marcar como lido');
      return false;
    }

    this.socket.emit('mark-messages-read', {
      instanceName,
      phoneNumber
    });

    return true;
  }

  /**
   * Adicionar listener para eventos
   */
  addEventListener(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);

    // Retornar função para remover o listener
    return () => {
      this.removeEventListener(event, callback);
    };
  }

  /**
   * Remover listener de evento
   */
  removeEventListener(event, callback) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.eventListeners.delete(event);
      }
    }
  }

  /**
   * Emitir evento para todos os listeners
   */
  emitToListeners(event, data) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Erro no listener ${event}:`, error);
        }
      });
    }
  }

  /**
   * Iniciar ping periódico
   */
  startPing() {
    setInterval(() => {
      if (this.socket && this.isConnected) {
        this.socket.emit('ping');
      }
    }, 30000); // Ping a cada 30 segundos
  }

  /**
   * Manipular reconexão
   */
  handleReconnection() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000); // Max 30s

      console.log(`🔄 Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts} em ${delay}ms`);

      this.connectionQuality = 'poor';
      this.emitToListeners('connection-status', {
        status: 'reconnecting',
        attempt: this.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts
      });

      this.reconnectTimeout = setTimeout(() => {
        if (!this.isConnected) {
          this.connect(this.currentWorkspaceUuid).catch(error => {
            console.error('❌ Falha na reconexão:', error);
          });
        }
      }, delay);
    } else {
      console.error('❌ Máximo de tentativas de reconexão atingido - entrando em modo fallback permanente');
      this.enableFallbackMode(true); // Fallback permanente
      this.emitToListeners('connection-status', {
        status: 'failed',
        fallbackMode: true
      });
    }
  }

  /**
   * Desconectar WebSocket
   */
  disconnect() {
    if (this.socket) {
      console.log('🔌 Desconectando WebSocket...');
      this.isConnected = false;
      this.subscribedInstances.clear();
      this.eventListeners.clear();
      this.stopHealthCheck();

      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }

      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Obter status da conexão
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id,
      subscribedInstances: Array.from(this.subscribedInstances),
      workspaceUuid: this.currentWorkspaceUuid,
      eventListeners: Array.from(this.eventListeners.keys()),
      fallbackMode: this.fallbackMode,
      connectionQuality: this.connectionQuality,
      lastConnectionTime: this.lastConnectionTime,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  /**
   * Reconectar manualmente
   */
  reconnect() {
    this.disconnect();
    this.reconnectAttempts = 0; // Reset attempts for manual reconnection
    this.fallbackMode = false;
    return this.connect(this.currentWorkspaceUuid);
  }

  /**
   * Ativar modo fallback para polling
   */
  enableFallbackMode(permanent = false) {
    this.fallbackMode = true;
    this.connectionQuality = 'failed';

    console.log(`⚠️ Modo fallback ${permanent ? 'permanente' : 'temporário'} ativado - usando polling`);

    this.emitToListeners('fallback-mode', {
      enabled: true,
      permanent,
      reason: 'websocket_disconnected'
    });
  }

  /**
   * Reinscres em instâncias após reconexão
   */
  resubscribeToInstances() {
    if (this.subscribedInstances.size > 0) {
      console.log('🔄 Reinscrevendo em instâncias após reconexão...');
      const instances = Array.from(this.subscribedInstances);
      this.subscribedInstances.clear();

      instances.forEach(instanceName => {
        this.subscribeToInstance(instanceName);
      });
    }
  }

  /**
   * Iniciar verificação de saúde da conexão
   */
  startHealthCheck() {
    this.stopHealthCheck(); // Limpar anterior

    this.healthCheckInterval = setInterval(() => {
      if (this.socket && this.isConnected) {
        const start = Date.now();

        this.socket.emit('ping', { timestamp: start });

        const timeout = setTimeout(() => {
          console.warn('⚠️ Health check timeout - conexão pode estar lenta');
          this.connectionQuality = 'poor';
        }, 5000);

        this.socket.once('pong', (data) => {
          clearTimeout(timeout);
          const latency = Date.now() - (data?.timestamp || start);

          this.connectionQuality = latency < 1000 ? 'good' : 'poor';

          this.emitToListeners('connection-health', {
            latency,
            quality: this.connectionQuality
          });
        });
      }
    }, 30000); // Check a cada 30 segundos
  }

  /**
   * Parar verificação de saúde
   */
  stopHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Verificar se está em modo fallback
   */
  isFallbackMode() {
    return this.fallbackMode;
  }

  /**
   * Verificar qualidade da conexão
   */
  getConnectionQuality() {
    return this.connectionQuality;
  }
}

// Instância singleton
const websocketService = new WebSocketService();

export default websocketService;