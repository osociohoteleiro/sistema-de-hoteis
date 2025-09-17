const DatabaseProcessor = require('./database-processor');
const { logger, logEnvironmentInfo, createPerformanceTimer } = require('./logger');

/**
 * Auto-processador robusto para ambiente de produção
 * Executa em loop para processar searches PENDING com tratamento de erros avançado
 */
class AutoProcessor {
  constructor(intervalSeconds = 30) {
    this.intervalSeconds = Math.max(10, intervalSeconds); // Mínimo 10s
    this.isRunning = false;
    this.processor = new DatabaseProcessor();
    this.intervalId = null;
    this.consecutiveErrors = 0;
    this.maxConsecutiveErrors = 5;
    this.lastSuccessTime = null;
    this.processCount = 0;
    this.isProcessing = false; // Flag para evitar execuções concorrentes

    // Detectar ambiente
    this.isProduction = process.env.NODE_ENV === 'production';
    this.platform = process.platform;

    console.log(`🔧 AutoProcessor Configuration:`);
    console.log(`   Interval: ${this.intervalSeconds}s`);
    console.log(`   Environment: ${this.isProduction ? 'production' : 'development'}`);
    console.log(`   Platform: ${this.platform}`);
    console.log(`   Max consecutive errors: ${this.maxConsecutiveErrors}`);
  }

  /**
   * Inicia o auto-processador com tratamento robusto de erros
   */
  async start() {
    if (this.isRunning) {
      console.log('⚠️  Auto-processador já está rodando!');
      return false;
    }

    try {
      this.isRunning = true;

      // Loggar informações do ambiente
      logEnvironmentInfo();

      console.log(`🚀 Iniciando auto-processador (intervalo: ${this.intervalSeconds}s)`);
      logger.info('Auto-processor starting', {
        event: 'auto_processor_start',
        interval_seconds: this.intervalSeconds,
        environment: this.isProduction ? 'production' : 'development',
        platform: this.platform
      });

      // Executar uma vez imediatamente
      await this.processOnce();

      // Agendar execuções periódicas com tratamento de erro
      this.intervalId = setInterval(() => {
        this.processOnce().catch(error => {
          console.error(`❌ Erro no intervalo do auto-processor: ${error.message}`);
          logger.error('Auto-processor interval error', {
            event: 'auto_processor_interval_error',
            error: error.message,
            stack: error.stack
          });
        });
      }, this.intervalSeconds * 1000);

      console.log('✅ Auto-processador iniciado com sucesso');
      return true;

    } catch (error) {
      console.error(`❌ Erro ao iniciar auto-processador: ${error.message}`);
      logger.error('Auto-processor start failed', {
        event: 'auto_processor_start_failed',
        error: error.message,
        stack: error.stack
      });
      this.isRunning = false;
      return false;
    }
  }

  /**
   * Para o auto-processador de forma segura
   */
  stop() {
    if (!this.isRunning) {
      console.log('⚠️  Auto-processador não está rodando');
      return false;
    }

    console.log('🔴 Parando auto-processador...');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('🛑 Auto-processador parado');
  }

  /**
   * Executa uma iteração do processador com controle de concorrência e tratamento robusto
   */
  async processOnce() {
    // Evitar execuções concorrentes
    if (this.isProcessing) {
      console.log(`⏭️  [${new Date().toISOString()}] Processamento já em andamento, pulando iteração`);
      return;
    }

    const timer = createPerformanceTimer('auto_processor_iteration');
    this.isProcessing = true;
    this.processCount++;

    try {
      const timestamp = new Date().toISOString();
      console.log(`\n⏰ [${timestamp}] Verificando buscas pendentes (iteração #${this.processCount})...`);

      logger.info('Auto-processor iteration starting', {
        event: 'auto_processor_iteration_start',
        iteration: this.processCount,
        consecutive_errors: this.consecutiveErrors,
        last_success: this.lastSuccessTime
      });

      // Executar processamento
      await this.processor.start();

      // Sucesso - resetar contador de erros
      this.consecutiveErrors = 0;
      this.lastSuccessTime = new Date().toISOString();

      const duration = timer.end({
        iteration: this.processCount,
        success: true
      });

      console.log(`✅ [${new Date().toISOString()}] Iteração #${this.processCount} concluída (${duration}ms)`);

      logger.info('Auto-processor iteration completed successfully', {
        event: 'auto_processor_iteration_success',
        iteration: this.processCount,
        duration_ms: duration
      });

    } catch (error) {
      this.consecutiveErrors++;

      const duration = timer.end({
        iteration: this.processCount,
        success: false,
        error: error.message
      });

      console.error(`❌ [${new Date().toISOString()}] Erro na iteração #${this.processCount} (${this.consecutiveErrors}/${this.maxConsecutiveErrors}): ${error.message}`);

      logger.error('Auto-processor iteration failed', {
        event: 'auto_processor_iteration_error',
        iteration: this.processCount,
        consecutive_errors: this.consecutiveErrors,
        max_consecutive_errors: this.maxConsecutiveErrors,
        error_message: error.message,
        error_name: error.name,
        stack: error.stack,
        duration_ms: duration
      });

      // Se muitos erros consecutivos, aumentar intervalo
      if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
        const originalInterval = this.intervalSeconds;
        this.intervalSeconds = Math.min(this.intervalSeconds * 2, 300); // Máximo 5 minutos

        console.log(`⚠️  Muitos erros consecutivos (${this.consecutiveErrors}). Aumentando intervalo de ${originalInterval}s para ${this.intervalSeconds}s`);

        logger.warn('Auto-processor increasing interval due to consecutive errors', {
          event: 'auto_processor_interval_increased',
          original_interval: originalInterval,
          new_interval: this.intervalSeconds,
          consecutive_errors: this.consecutiveErrors
        });

        // Reiniciar com novo intervalo
        if (this.intervalId) {
          clearInterval(this.intervalId);
          this.intervalId = setInterval(() => {
            this.processOnce().catch(err => {
              console.error(`❌ Erro no intervalo atualizado: ${err.message}`);
            });
          }, this.intervalSeconds * 1000);
        }

        // Resetar contador após ajuste
        this.consecutiveErrors = 0;
      }

    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Status detalhado do auto-processador
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      isProcessing: this.isProcessing,
      intervalSeconds: this.intervalSeconds,
      processCount: this.processCount,
      consecutiveErrors: this.consecutiveErrors,
      maxConsecutiveErrors: this.maxConsecutiveErrors,
      lastSuccessTime: this.lastSuccessTime,
      nextRun: this.intervalId ? new Date(Date.now() + this.intervalSeconds * 1000) : null,
      environment: this.isProduction ? 'production' : 'development',
      platform: this.platform,
      uptime: this.isRunning ? Math.floor((Date.now() - Date.parse(this.lastSuccessTime || new Date())) / 1000) : null
    };
  }

  /**
   * Retorna métricas de saúde do processador
   */
  getHealthMetrics() {
    const status = this.getStatus();
    const isHealthy = status.isRunning &&
                     status.consecutiveErrors < status.maxConsecutiveErrors &&
                     (status.lastSuccessTime || Date.now() - 300000 < Date.now()); // Último sucesso há menos de 5 min

    return {
      healthy: isHealthy,
      status: status.isRunning ? 'running' : 'stopped',
      issues: [
        ...(status.consecutiveErrors > 0 ? [`${status.consecutiveErrors} consecutive errors`] : []),
        ...(status.isProcessing ? ['currently processing'] : []),
        ...(status.lastSuccessTime === null ? ['no successful runs yet'] : [])
      ],
      ...status
    };
  }
}

// Se executado diretamente, iniciar o auto-processador
if (require.main === module) {
  // Configurar intervalo baseado no ambiente
  const isProduction = process.env.NODE_ENV === 'production';
  const interval = parseInt(process.env.AUTO_PROCESSOR_INTERVAL) || (isProduction ? 60 : 30);

  const autoProcessor = new AutoProcessor(interval);

  // Tratamento de sinais para parar graciosamente
  let isShuttingDown = false;

  const gracefulShutdown = (signal) => {
    if (isShuttingDown) {
      console.log(`\n🔴 Forçando saída (${signal})...`);
      process.exit(1);
    }

    isShuttingDown = true;
    console.log(`\n🛑 Recebido ${signal}, parando auto-processador graciosamente...`);

    logger.info('Auto-processor shutting down', {
      event: 'auto_processor_shutdown',
      signal: signal,
      graceful: true
    });

    autoProcessor.stop();

    setTimeout(() => {
      console.log('✅ Auto-processador parado. Saindo...');
      process.exit(0);
    }, 2000);
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  // Tratamento de erros não capturados
  process.on('uncaughtException', (error) => {
    console.error('💥 Exceção não capturada:', error);
    logger.error('Uncaught exception in auto-processor', {
      event: 'auto_processor_uncaught_exception',
      error: error.message,
      stack: error.stack
    });

    gracefulShutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Promise rejeitada não tratada:', reason);
    logger.error('Unhandled promise rejection in auto-processor', {
      event: 'auto_processor_unhandled_rejection',
      reason: reason,
      promise: promise
    });
  });

  // Iniciar o auto-processador
  autoProcessor.start().then(success => {
    if (!success) {
      console.error('💥 Falha ao iniciar auto-processador');
      process.exit(1);
    }

    console.log(`🚀 Auto-processador iniciado em modo ${isProduction ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'}`);
    console.log(`⏰ Intervalo: ${interval}s`);

  }).catch((error) => {
    console.error('💥 Erro fatal no auto-processador:', error);
    logger.error('Fatal error starting auto-processor', {
      event: 'auto_processor_fatal_error',
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  });

  // Health check e keep-alive
  const healthCheckInterval = isProduction ? 300000 : 60000; // 5 min prod, 1 min dev
  setInterval(() => {
    const health = autoProcessor.getHealthMetrics();

    if (health.healthy) {
      console.log(`💓 Auto-processador saudável (iteração #${health.processCount}, próxima: ${health.nextRun?.toLocaleTimeString()})`);
    } else {
      console.log(`⚠️  Auto-processador com problemas: ${health.issues.join(', ')}`);
      logger.warn('Auto-processor health check failed', {
        event: 'auto_processor_health_warning',
        health: health
      });
    }

    // Log detalhado em produção
    if (isProduction) {
      logger.info('Auto-processor health check', {
        event: 'auto_processor_health_check',
        ...health
      });
    }
  }, healthCheckInterval);
}

module.exports = AutoProcessor;