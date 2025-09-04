const DatabaseProcessor = require('./database-processor');
const { logger } = require('./logger');

/**
 * Auto-processador que executa em loop para processar searches PENDING
 */
class AutoProcessor {
  constructor(intervalSeconds = 30) {
    this.intervalSeconds = intervalSeconds;
    this.isRunning = false;
    this.processor = new DatabaseProcessor();
    this.intervalId = null;
  }

  /**
   * Inicia o auto-processador
   */
  async start() {
    if (this.isRunning) {
      console.log('⚠️  Auto-processador já está rodando!');
      return;
    }

    this.isRunning = true;
    console.log(`🚀 Iniciando auto-processador (intervalo: ${this.intervalSeconds}s)`);
    
    // Executar uma vez imediatamente
    await this.processOnce();

    // Agendar execuções periódicas
    this.intervalId = setInterval(async () => {
      await this.processOnce();
    }, this.intervalSeconds * 1000);

    console.log('✅ Auto-processador iniciado com sucesso');
  }

  /**
   * Para o auto-processador
   */
  stop() {
    if (!this.isRunning) {
      console.log('⚠️  Auto-processador não está rodando');
      return;
    }

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('🛑 Auto-processador parado');
  }

  /**
   * Executa uma iteração do processador
   */
  async processOnce() {
    try {
      const timestamp = new Date().toISOString();
      console.log(`\n⏰ [${timestamp}] Verificando buscas pendentes...`);
      
      await this.processor.start();
      
    } catch (error) {
      logger.error('Auto-processor error', { error: error.message });
      console.error(`❌ [${new Date().toISOString()}] Erro no auto-processador:`, error.message);
    }
  }

  /**
   * Status do auto-processador
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalSeconds: this.intervalSeconds,
      nextRun: this.intervalId ? new Date(Date.now() + this.intervalSeconds * 1000) : null
    };
  }
}

// Se executado diretamente, iniciar o auto-processador
if (require.main === module) {
  const autoProcessor = new AutoProcessor(30); // 30 segundos

  // Tratamento de sinais para parar graciosamente
  process.on('SIGINT', () => {
    console.log('\n🛑 Recebido SIGINT, parando auto-processador...');
    autoProcessor.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Recebido SIGTERM, parando auto-processador...');
    autoProcessor.stop();
    process.exit(0);
  });

  autoProcessor.start().catch((error) => {
    console.error('💥 Erro fatal no auto-processador:', error);
    process.exit(1);
  });

  // Manter o processo vivo
  setInterval(() => {
    const status = autoProcessor.getStatus();
    if (status.isRunning) {
      console.log(`💓 Auto-processador ativo (próxima execução: ${status.nextRun?.toLocaleString()})`);
    }
  }, 60000); // Log a cada minuto
}

module.exports = AutoProcessor;