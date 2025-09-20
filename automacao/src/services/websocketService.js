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

    // Evitar múltiplas tentativas de conexão simultâneas
    if (this.socket && !this.isConnected) {
      console.log('🔄 Conexão WebSocket já em andamento...');
      return new Promise((resolve) => {
        const checkConnection = () => {
          if (this.isConnected) {
            resolve();
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
      });
    }

    return new Promise((resolve, reject) => {
      try {
        console.log('🔄 Conectando ao WebSocket...', {
          workspaceUuid,
          socketUrl: import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001',
          currentUrl: window.location.href
        });

        this.currentWorkspaceUuid = workspaceUuid;

        // Configurar conexão otimizada
        this.socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001', {
          transports: ['websocket', 'polling'], // WebSocket primeiro, polling como fallback
          timeout: 20000, // Timeout reduzido para falhar mais rápido
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay,
          reconnectionDelayMax: 10000, // Máximo 10s entre reconexões
          randomizationFactor: 0.3, // Menos randomização para reconexão mais rápida
          forceNew: false,
          upgrade: true,
          rememberUpgrade: true,
          // Configurações adicionais para estabilidade
          pingTimeout: 60000,
          pingInterval: 25000
        });

        // Eventos de conexão
        this.socket.on('connect', () => {
          console.log('✅ WebSocket conectado com sucesso!', {
            socketId: this.socket.id,
            transport: this.socket.io.engine.transport.name,
            url: this.socket.io.uri,
            workspaceUuid: this.currentWorkspaceUuid
          });

          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.fallbackMode = false;
          this.lastConnectionTime = new Date();
          this.connectionQuality = 'good';
          this.startHealthCheck();

          // Reinscrever em instâncias após reconexão
          this.resubscribeToInstances();

          console.log(`🎉 CHAT AO VIVO: WebSocket conectado e pronto! ID: ${this.socket.id}`);
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

          // Só ativar modo fallback após múltiplas tentativas de reconexão
          if (this.reconnectAttempts >= 3) {
            this.enableFallbackMode();
          }

          // Tentar reconectar automaticamente
          if (reason !== 'io client disconnect') {
            this.handleReconnection();
          }
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ CHAT AO VIVO: Erro de conexão WebSocket:', {
            error: error.message,
            description: error.description,
            type: error.type,
            transport: error.transport,
            reconnectAttempts: this.reconnectAttempts,
            socketUrl: import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001',
            workspaceUuid: this.currentWorkspaceUuid
          });
          this.isConnected = false;
          this.connectionQuality = 'failed';

          // Ativar modo fallback após 2 tentativas para ser mais responsivo
          if (this.reconnectAttempts >= 2) {
            console.log('⚠️ CHAT AO VIVO: Ativando modo fallback (polling) após múltiplas falhas');
            this.enableFallbackMode();
          }

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

        // 🔧 DEBUG: Listener direto para testar
        this.socket.on('new-message', (data) => {
          console.log('🎉 MENSAGEM RECEBIDA DIRETAMENTE:', data);
          console.log(`📨 MENSAGEM DIRETA: ${JSON.stringify(data).substring(0, 100)}`);
        });

        // 🔧 DEBUG: Listener para teste direto do backend
        this.socket.on('test-message', (data) => {
          console.log('🧪 TESTE DIRETO RECEBIDO:', data);
          console.log(`🧪 TESTE BACKEND: ${data.message} - Socket: ${data.socketId}`);
        });

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
      console.log('🔥 WEBSOCKET SERVICE: EVENT RECEBIDO!', data);
      console.log('🔥 EMITINDO PARA LISTENERS...');
      this.emitToListeners('new-message', data);
      console.log('🔥 EMISSÃO CONCLUÍDA');
    });

    // TESTE DIRETO - verificar se eventos chegam ao frontend
    this.socket.on('test-direct-message', (data) => {
      console.log('🧪 TESTE DIRETO RECEBIDO:', data);
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
    console.log('🔔 TENTANDO INSCREVER-SE NA INSTÂNCIA:', {
      instanceName,
      isConnected: this.isConnected,
      socketExists: !!this.socket,
      socketId: this.socket?.id,
      workspaceUuid: this.currentWorkspaceUuid,
      validateInstance
    });

    // 🔧 DEBUG: Alert para mostrar tentativa de inscrição
    console.log(`📝 Tentando inscrever na instância: ${instanceName}`);

    if (!this.socket || !this.isConnected) {
      console.warn('⚠️ WebSocket não conectado para inscrição', {
        socket: !!this.socket,
        isConnected: this.isConnected
      });
      console.error(`❌ ERRO: WebSocket não conectado para inscrição. Socket: ${!!this.socket}, Conectado: ${this.isConnected}`);
      return false;
    }

    if (this.subscribedInstances.has(instanceName)) {
      console.log(`📝 Já inscrito na instância: ${instanceName}`);
      console.log(`✅ JÁ INSCRITO na instância: ${instanceName}`);
      return true;
    }

    // Validar se a instância é válida e pertence ao workspace
    if (validateInstance && this.currentWorkspaceUuid) {
      console.log(`🔍 VALIDANDO instância: ${instanceName} para workspace: ${this.currentWorkspaceUuid}`);
      const isValid = await this.validateInstance(instanceName, this.currentWorkspaceUuid);
      if (!isValid) {
        console.warn(`⚠️ Instância ${instanceName} não é válida para o workspace ${this.currentWorkspaceUuid}`);
        console.error(`❌ ERRO: Instância ${instanceName} NÃO É VÁLIDA para o workspace`);
        return false;
      }
      console.log(`✅ VALIDAÇÃO OK: Instância ${instanceName} é válida`);
    }

    console.log(`📝 Inscrevendo na instância: ${instanceName}`);

    const subscriptionData = {
      instanceName,
      workspaceUuid: this.currentWorkspaceUuid
    };

    console.log('📤 ENVIANDO INSCRIÇÃO:', subscriptionData);

    this.socket.emit('subscribe-instance', subscriptionData);

    console.log('✅ INSCRIÇÃO ENVIADA para instância:', instanceName);

    // 🔧 DEBUG: Alert de confirmação
    console.log(`📤 Inscrição ENVIADA para: ${instanceName}`);

    return true;
  }

  /**
   * Validar se uma instância pertence ao workspace e está ativa
   */
  async validateInstance(instanceName, workspaceUuid) {
    try {
      // Fazer requisição para validar a instância
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'}/workspace-instances/validate`, {
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
    console.log(`🎧 REGISTRANDO LISTENER PARA EVENTO: ${event}`);
    console.log(`🎧 CALLBACK:`, callback.toString().substring(0, 100));

    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);

    console.log(`🎧 LISTENER REGISTRADO! Total listeners para ${event}:`, this.eventListeners.get(event).size);
    console.log(`🎧 TODOS OS EVENTOS COM LISTENERS:`, Array.from(this.eventListeners.keys()));

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
    console.log(`🎯 EMITINDO EVENTO: ${event}`);
    console.log(`🎯 LISTENERS REGISTRADOS PARA ${event}:`, this.eventListeners.get(event)?.size || 0);
    console.log(`🎯 TODOS OS LISTENERS REGISTRADOS:`, Array.from(this.eventListeners.keys()));

    const listeners = this.eventListeners.get(event);
    if (listeners) {
      console.log(`🎯 CHAMANDO ${listeners.size} LISTENER(S) PARA ${event}`);
      listeners.forEach((callback, index) => {
        try {
          console.log(`🎯 CHAMANDO LISTENER ${index + 1}/${listeners.size} PARA ${event}`);
          callback(data);
          console.log(`🎯 LISTENER ${index + 1} EXECUTADO COM SUCESSO`);
        } catch (error) {
          console.error(`❌ Erro no listener ${event}:`, error);
        }
      });
    } else {
      console.warn(`⚠️ NENHUM LISTENER REGISTRADO PARA EVENTO: ${event}`);
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

      // Só marcar como poor após várias tentativas
      if (this.reconnectAttempts >= 3) {
        this.connectionQuality = 'poor';
      }

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
      console.log('🔌 Desconectando WebSocket...', {
        isConnected: this.isConnected,
        socketId: this.socket.id,
        subscribedInstances: this.subscribedInstances.size
      });
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
        }, 10000);

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