const winston = require('winston');
const path = require('path');

// Criar diretório de logs se não existir
const logDir = path.join(process.cwd(), 'logs');

// Configuração do logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'rate-shopper' },
  transports: [
    // Log de erros
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    }),
    // Log geral
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    })
  ]
});

// Em desenvolvimento, também log no console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(({ level, message, timestamp, ...meta }) => {
        return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
      })
    )
  }));
}

// Helper functions para logging estruturado
const logScrapingStart = (propertyName, dateRange) => {
  logger.info('Scraping started', {
    event: 'scraping_start',
    property: propertyName,
    date_range: dateRange
  });
};

const logScrapingEnd = (propertyName, totalPrices, duration) => {
  logger.info('Scraping completed', {
    event: 'scraping_end',
    property: propertyName,
    total_prices: totalPrices,
    duration_ms: duration
  });
};

const logScrapingError = (propertyName, error, url = null) => {
  logger.error('Scraping error', {
    event: 'scraping_error',
    property: propertyName,
    error: error.message,
    stack: error.stack,
    url: url
  });
};

const logPriceExtracted = (propertyName, date, price, bundleSize) => {
  logger.info('Price extracted', {
    event: 'price_extracted',
    property: propertyName,
    date: date,
    price: price,
    bundle_size: bundleSize
  });
};

const logRetryAttempt = (propertyName, attempt, maxAttempts, error) => {
  logger.warn('Retry attempt', {
    event: 'retry_attempt',
    property: propertyName,
    attempt: attempt,
    max_attempts: maxAttempts,
    error: error.message
  });
};

module.exports = {
  logger,
  logScrapingStart,
  logScrapingEnd,
  logScrapingError,
  logPriceExtracted,
  logRetryAttempt
};