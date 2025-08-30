const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de segurança
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 requests por IP por janela
});
app.use(limiter);

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5174',
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = db.getStatus();
    
    // Teste de conexão
    if (!dbStatus.connected) {
      await db.connect();
    }
    
    const status = db.getStatus();
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: status,
      environment: process.env.NODE_ENV,
      version: '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message,
      database: { connected: false }
    });
  }
});

// Test database connection endpoint
app.get('/api/db-test', async (req, res) => {
  try {
    console.log('🧪 Testando conexão com banco de dados...');
    
    // Teste de conexão
    await db.connect();
    
    // Teste de query simples
    const result = await db.query('SELECT 1 as test');
    
    res.json({
      success: true,
      message: 'Conexão com banco de dados funcionando!',
      host: db.currentHost,
      testResult: result[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro no teste de banco:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Importar rotas
const authRoutes = require('./routes/auth');
const hotelRoutes = require('./routes/hotels');
const configRoutes = require('./routes/config');

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/config', configRoutes);

// Middleware de erro global
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  
  res.status(err.status || 500).json({
    error: {
      message: process.env.NODE_ENV === 'development' ? err.message : 'Erro interno do servidor',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      message: 'Rota não encontrada',
      path: req.originalUrl
    }
  });
});

// Inicialização do servidor
async function startServer() {
  try {
    // Testar conexão com banco na inicialização
    console.log('🚀 Iniciando servidor...');
    console.log('🔄 Testando conexão com banco de dados...');
    
    await db.connect();
    
    app.listen(PORT, () => {
      console.log(`✅ Servidor rodando na porta ${PORT}`);
      console.log(`🌍 CORS configurado para: ${process.env.CORS_ORIGIN}`);
      console.log(`🗄️  Conectado ao banco: ${db.currentHost}/${process.env.DB_NAME}`);
      console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🧪 DB test: http://localhost:${PORT}/api/db-test`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error.message);
    console.log('⚠️  Servidor iniciando sem conexão com banco...');
    
    app.listen(PORT, () => {
      console.log(`⚠️  Servidor rodando na porta ${PORT} (sem DB)`);
      console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
    });
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 Recebido SIGTERM, encerrando servidor...');
  await db.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔄 Recebido SIGINT, encerrando servidor...');
  await db.close();
  process.exit(0);
});

startServer();