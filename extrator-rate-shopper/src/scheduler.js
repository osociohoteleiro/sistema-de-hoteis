const cron = require('node-cron');
const path = require('path');
const fs = require('fs').promises;
const { logger } = require('./logger');
const { extract_prices_from_booking } = require('./booking-extractor-optimized');
const { convert_csv_to_xlsx } = require('./conversor');

/**
 * Sistema de agendamento automático para Rate Shopper
 */
class RateShopperScheduler {
  constructor() {
    this.scheduledTasks = new Map();
    this.isRunning = false;
    this.configPath = path.join(process.cwd(), 'src', 'scheduler-config.json');
  }

  /**
   * Inicia o sistema de agendamento
   */
  async start() {
    try {
      this.isRunning = true;
      await this.loadSchedulerConfig();
      logger.info('Rate Shopper Scheduler started', {
        event: 'scheduler_start',
        pid: process.pid
      });
      console.log('🕐 Rate Shopper Scheduler started');
    } catch (error) {
      logger.error('Failed to start scheduler', {
        event: 'scheduler_error',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Para o sistema de agendamento
   */
  stop() {
    this.isRunning = false;
    this.scheduledTasks.forEach((task, name) => {
      task.destroy();
      logger.info(`Stopped scheduled task: ${name}`);
    });
    this.scheduledTasks.clear();
    logger.info('Rate Shopper Scheduler stopped', {
      event: 'scheduler_stop'
    });
    console.log('🛑 Rate Shopper Scheduler stopped');
  }

  /**
   * Carrega configuração de agendamento
   */
  async loadSchedulerConfig() {
    try {
      const configExists = await fs.access(this.configPath).then(() => true).catch(() => false);
      
      if (!configExists) {
        await this.createDefaultConfig();
      }

      const configData = await fs.readFile(this.configPath, 'utf8');
      const config = JSON.parse(configData);
      
      await this.setupScheduledTasks(config);
    } catch (error) {
      logger.error('Failed to load scheduler config', {
        event: 'config_error',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Cria configuração padrão
   */
  async createDefaultConfig() {
    const defaultConfig = {
      enabled: true,
      timezone: 'America/Sao_Paulo',
      schedules: [
        {
          name: 'daily_morning_extraction',
          enabled: true,
          cron: '0 8 * * *', // 8:00 AM todos os dias
          description: 'Extração diária matinal',
          properties: 'all'
        },
        {
          name: 'weekly_full_analysis',
          enabled: false,
          cron: '0 2 * * 1', // 2:00 AM segunda-feira
          description: 'Análise completa semanal',
          properties: 'all'
        }
      ]
    };

    await fs.writeFile(this.configPath, JSON.stringify(defaultConfig, null, 2));
    logger.info('Created default scheduler config');
  }

  /**
   * Configura tarefas agendadas
   */
  async setupScheduledTasks(config) {
    if (!config.enabled) {
      logger.info('Scheduler is disabled in config');
      return;
    }

    for (const schedule of config.schedules) {
      if (!schedule.enabled) {
        logger.info(`Schedule ${schedule.name} is disabled`);
        continue;
      }

      try {
        const task = cron.schedule(schedule.cron, async () => {
          await this.executeScheduledExtraction(schedule);
        }, {
          scheduled: false,
          timezone: config.timezone || 'America/Sao_Paulo'
        });

        task.start();
        this.scheduledTasks.set(schedule.name, task);

        logger.info(`Scheduled task created: ${schedule.name}`, {
          event: 'schedule_created',
          schedule: schedule.name,
          cron: schedule.cron,
          timezone: config.timezone
        });

        console.log(`📅 Scheduled: ${schedule.description} (${schedule.cron})`);
      } catch (error) {
        logger.error(`Failed to create schedule: ${schedule.name}`, {
          event: 'schedule_error',
          schedule: schedule.name,
          error: error.message
        });
      }
    }
  }

  /**
   * Executa extração agendada
   */
  async executeScheduledExtraction(schedule) {
    const startTime = Date.now();
    const executionId = `scheduled_${Date.now()}`;

    logger.info(`Starting scheduled extraction: ${schedule.name}`, {
      event: 'scheduled_extraction_start',
      schedule: schedule.name,
      execution_id: executionId
    });

    console.log(`\n🚀 Executing scheduled task: ${schedule.description}`);

    try {
      // Carregar propriedades
      const properties = await this.getPropertiesToExtract(schedule.properties);
      
      if (!properties || !properties.length) {
        throw new Error('No properties configured for extraction');
      }

      let successCount = 0;
      let errorCount = 0;

      // Processar cada propriedade
      for (let i = 0; i < properties.length; i++) {
        const property = properties[i];
        
        try {
          console.log(`\n📊 Processing property ${i + 1}/${properties.length}: ${property.name}`);
          
          const parsed_start_date = new Date(property.start_date);
          const parsed_end_date = new Date(property.end_date);

          // Validar datas
          if (isNaN(parsed_start_date.getTime()) || isNaN(parsed_end_date.getTime())) {
            throw new Error(`Invalid dates for property ${property.name}`);
          }

          // Gerar nomes de arquivo
          const timestamp = new Date().toISOString().replace(/[.:]+/g, "-");
          const filename_base = `${property.name}_scheduled_${timestamp}_from_${property.start_date}_to_${property.end_date}`;
          
          const csv_path = path.join(process.cwd(), 'results', 'extracted-data', 'csv', `${filename_base}.csv`);
          const xlsx_path = path.join(process.cwd(), 'results', 'extracted-data', 'xlsx', `${filename_base}.xlsx`);

          // Extrair preços
          await extract_prices_from_booking(
            property.url,
            parsed_start_date,
            parsed_end_date,
            property.max_bundle_size || 7,
            csv_path
          );

          // Converter para Excel
          await convert_csv_to_xlsx(csv_path, xlsx_path);

          successCount++;
          console.log(`✅ Property ${i + 1} completed successfully`);

        } catch (error) {
          errorCount++;
          logger.error(`Scheduled extraction failed for property: ${property.name}`, {
            event: 'scheduled_property_error',
            execution_id: executionId,
            property: property.name,
            error: error.message
          });
          console.log(`❌ Property ${i + 1} failed: ${error.message}`);
        }
      }

      const duration = Math.round((Date.now() - startTime) / 1000);

      logger.info(`Scheduled extraction completed: ${schedule.name}`, {
        event: 'scheduled_extraction_end',
        execution_id: executionId,
        schedule: schedule.name,
        total_properties: properties.length,
        success_count: successCount,
        error_count: errorCount,
        duration_seconds: duration
      });

      console.log(`\n🎉 Scheduled extraction completed`);
      console.log(`📊 Total properties: ${properties.length}`);
      console.log(`✅ Successful: ${successCount}`);
      console.log(`❌ Failed: ${errorCount}`);
      console.log(`⏱️  Duration: ${duration}s`);

    } catch (error) {
      logger.error(`Scheduled extraction failed: ${schedule.name}`, {
        event: 'scheduled_extraction_error',
        execution_id: executionId,
        schedule: schedule.name,
        error: error.message,
        stack: error.stack
      });
      console.error(`💥 Scheduled extraction failed: ${error.message}`);
    }
  }

  /**
   * Obtém propriedades para extração
   */
  async getPropertiesToExtract(propertyFilter) {
    try {
      const configPath = path.join(process.cwd(), 'src', 'config.json');
      const configData = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(configData);

      if (propertyFilter === 'all') {
        return config.properties;
      }

      // Filtrar propriedades específicas se necessário
      if (Array.isArray(propertyFilter)) {
        return config.properties.filter(prop => propertyFilter.includes(prop.name));
      }

      return config.properties;
    } catch (error) {
      logger.error('Failed to load properties config', {
        event: 'properties_config_error',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Executa uma extração manual
   */
  async executeManualExtraction() {
    console.log('\n🔧 Executing manual extraction...');
    
    const manualSchedule = {
      name: 'manual_execution',
      description: 'Manual extraction',
      properties: 'all'
    };

    await this.executeScheduledExtraction(manualSchedule);
  }

  /**
   * Retorna status do agendador
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      scheduledTasks: Array.from(this.scheduledTasks.keys()),
      pid: process.pid,
      uptime: process.uptime()
    };
  }
}

// Singleton instance
let schedulerInstance = null;

/**
 * Obtém instância do agendador
 */
function getScheduler() {
  if (!schedulerInstance) {
    schedulerInstance = new RateShopperScheduler();
  }
  return schedulerInstance;
}

/**
 * Inicia o agendador como processo principal
 */
async function runAsMainProcess() {
  const scheduler = getScheduler();
  
  try {
    await scheduler.start();
    
    // Handlers para encerramento gracioso
    process.on('SIGINT', () => {
      console.log('\n🛑 Received SIGINT, stopping scheduler...');
      scheduler.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Received SIGTERM, stopping scheduler...');
      scheduler.stop();
      process.exit(0);
    });

    // Manter processo vivo
    setInterval(() => {
      const status = scheduler.getStatus();
      logger.info('Scheduler heartbeat', {
        event: 'scheduler_heartbeat',
        ...status
      });
    }, 300000); // A cada 5 minutos

  } catch (error) {
    console.error('💥 Failed to start scheduler:', error.message);
    process.exit(1);
  }
}

// Se executado diretamente, iniciar como processo principal
if (require.main === module) {
  runAsMainProcess();
}

module.exports = {
  RateShopperScheduler,
  getScheduler,
  runAsMainProcess
};