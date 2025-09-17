const winston = require('winston');
const path = require('path');
const fs = require('fs');

/**
 * Sistema de logs robusto e multiplataforma
 * Funciona tanto em Windows quanto em Linux/Docker
 */

// Detectar ambiente
const platform = process.platform;
const isProduction = process.env.NODE_ENV === 'production';
const isDocker = fs.existsSync('/.dockerenv') || process.env.DOCKER === 'true';

console.log(`🔍 Logger Environment Detection:`);
console.log(`   Platform: ${platform}`);
console.log(`   Production: ${isProduction}`);
console.log(`   Docker: ${isDocker}`);

// Função para criar diretório de logs de forma segura
async function ensureLogDirectory() {
  const logDir = path.join(process.cwd(), 'logs');
  try {
    await fs.promises.mkdir(logDir, { recursive: true });
    // Testar se consegue escrever no diretório
    const testFile = path.join(logDir, '.write-test');
    await fs.promises.writeFile(testFile, 'test');
    await fs.promises.unlink(testFile);
    console.log(`✅ Log directory ready: ${logDir}`);
    return logDir;
  } catch (error) {
    console.warn(`⚠️  Cannot write to logs directory: ${error.message}`);
    // Fallback para diretório temporário
    const fallbackDir = path.join(require('os').tmpdir(), 'rate-shopper-logs');
    try {
      await fs.promises.mkdir(fallbackDir, { recursive: true });
      console.log(`⚡ Using fallback log directory: ${fallbackDir}`);
      return fallbackDir;
    } catch (fallbackError) {
      console.error(`❌ Cannot create any log directory: ${fallbackError.message}`);
      return null; // Logs só no console
    }
  }
}

// Inicializar diretório de logs
let logDir = null;
let logDirPromise = ensureLogDirectory().then(dir => {
  logDir = dir;
  return dir;
});

// Configuração robusta do logger
const loggerConfig = {
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS'
    }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
      const metaStr = Object.keys(meta).length ? ` | ${JSON.stringify(meta)}` : '';
      return `${timestamp} [${level.toUpperCase()}] [${service || 'rate-shopper'}] ${message}${metaStr}`;
    })
  ),
  defaultMeta: {
    service: 'rate-shopper',
    platform: platform,
    environment: isProduction ? 'production' : 'development',
    docker: isDocker
  },
  transports: []
};

// Console transport (sempre ativo)
loggerConfig.transports.push(
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      loggerConfig.format
    ),
    handleExceptions: true,
    handleRejections: true
  })
);

// File transports (apenas se logDir estiver disponível)
logDirPromise.then(dir => {
  if (dir) {
    // Log de erros
    logger.add(new winston.transports.File({
      filename: path.join(dir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: isProduction ? 10 : 5,
      tailable: true,
      handleExceptions: true,
      handleRejections: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }));

    // Log geral
    logger.add(new winston.transports.File({
      filename: path.join(dir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: isProduction ? 10 : 5,
      tailable: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }));

    // Log específico de extração (para debug)
    logger.add(new winston.transports.File({
      filename: path.join(dir, 'extraction.log'),
      level: 'info',
      maxsize: 20971520, // 20MB
      maxFiles: 3,
      tailable: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          if (meta.event && meta.event.includes('extraction')) {
            return `${timestamp} [EXTRACTION] ${message} ${JSON.stringify(meta)}`;
          }
          return null; // Não loggar neste arquivo se não for evento de extração
        }),
        winston.format((info) => info.message ? info : false)() // Filtrar nulls
      )
    }));

    console.log(`📝 File logging enabled in: ${dir}`);
  } else {
    console.log(`📝 File logging disabled - using console only`);
  }
}).catch(error => {
  console.error(`❌ Logger initialization error: ${error.message}`);
});

// Criar logger
const logger = winston.createLogger(loggerConfig);

// Helper functions para logging estruturado e robusto
const logScrapingStart = (propertyName, dateRange) => {
  logger.info('Scraping started', {
    event: 'extraction_scraping_start',
    property: propertyName,
    date_range: dateRange,
    timestamp: new Date().toISOString()
  });
};

const logScrapingEnd = (propertyName, totalPrices, duration) => {
  logger.info('Scraping completed', {
    event: 'extraction_scraping_end',
    property: propertyName,
    total_prices: totalPrices,
    duration_ms: duration,
    avg_time_per_price: totalPrices > 0 ? Math.round(duration / totalPrices) : 0,
    timestamp: new Date().toISOString()
  });
};

const logScrapingError = (propertyName, error, url = null) => {
  logger.error('Scraping error occurred', {
    event: 'extraction_scraping_error',
    property: propertyName,
    error_message: error.message,
    error_name: error.name,
    stack: error.stack,
    url: url,
    timestamp: new Date().toISOString()
  });
};

const logPriceExtracted = (propertyName, date, price, bundleSize) => {
  logger.info('Price extracted successfully', {
    event: 'extraction_price_extracted',
    property: propertyName,
    date: date,
    price: price,
    bundle_size: bundleSize,
    timestamp: new Date().toISOString()
  });
};

const logRetryAttempt = (propertyName, attempt, maxAttempts, error) => {
  logger.warn('Retry attempt in progress', {
    event: 'extraction_retry_attempt',
    property: propertyName,
    attempt: attempt,
    max_attempts: maxAttempts,
    error_message: error.message,
    timestamp: new Date().toISOString()
  });
};

// Funções adicionais para logging avançado
const logEnvironmentInfo = () => {
  logger.info('Environment information', {
    event: 'extraction_environment_info',
    node_version: process.version,
    platform: process.platform,
    arch: process.arch,
    memory_usage: process.memoryUsage(),
    uptime: process.uptime(),
    env_vars: {
      NODE_ENV: process.env.NODE_ENV,
      HEADLESS: process.env.HEADLESS,
      PUPPETEER_EXECUTABLE_PATH: process.env.PUPPETEER_EXECUTABLE_PATH ? 'SET' : 'NOT_SET'
    },
    timestamp: new Date().toISOString()
  });
};

const logBrowserConfig = (config) => {
  logger.debug('Browser configuration', {
    event: 'extraction_browser_config',
    headless: config.headless,
    executable_path: config.executablePath || 'auto-detect',
    args_count: config.args ? config.args.length : 0,
    timeout: config.timeout,
    timestamp: new Date().toISOString()
  });
};

const logDatabaseConnection = (success, config = null, error = null) => {
  if (success) {
    logger.info('Database connection established', {
      event: 'extraction_database_connected',
      host: config?.host,
      port: config?.port,
      database: config?.database,
      ssl_enabled: config?.ssl !== false,
      timestamp: new Date().toISOString()
    });
  } else {
    logger.error('Database connection failed', {
      event: 'extraction_database_error',
      error_message: error?.message,
      host: config?.host,
      port: config?.port,
      timestamp: new Date().toISOString()
    });
  }
};

// Sistema de logging de performance
const createPerformanceTimer = (operation) => {
  const startTime = Date.now();
  return {
    end: (details = {}) => {
      const duration = Date.now() - startTime;
      logger.info(`Performance: ${operation}`, {
        event: 'extraction_performance',
        operation: operation,
        duration_ms: duration,
        ...details,
        timestamp: new Date().toISOString()
      });
      return duration;
    }
  };
};

module.exports = {
  logger,
  logScrapingStart,
  logScrapingEnd,
  logScrapingError,
  logPriceExtracted,
  logRetryAttempt,
  logEnvironmentInfo,
  logBrowserConfig,
  logDatabaseConnection,
  createPerformanceTimer
};