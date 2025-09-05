const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

const db = require('./config/database');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      // Permitir requisições sem origin e qualquer localhost
      if (!origin || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(new Error('Não permitido pelo CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 3001;

// Middleware de segurança
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500 // máximo 500 requests por IP por janela (aumentado para desenvolvimento)
});
app.use(limiter);

// CORS - Permitir todas as portas locais para desenvolvimento
app.use(cors({
  origin: function (origin, callback) {
    // Permitir requisições sem origin (como Postman) e qualquer localhost
    if (!origin || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(new Error('Não permitido pelo CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  preflightContinue: false,
  optionsSuccessStatus: 204
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
const qdrantRoutes = require('./routes/qdrant');
const setupRoutes = require('./routes/setup');
const evolutionRoutes = require('./routes/evolution');
const flowiseRoutes = require('./routes/flowise');
const onenodeRoutes = require('./routes/onenode');
const pmsMotorChannelRoutes = require('./routes/pms-motor-channel');
const systemsCatalogRoutes = require('./routes/systems-catalog');
const botFieldsRoutes = require('./routes/botFields');
const workspacesRoutes = require('./routes/workspaces');
const botsRoutes = require('./routes/bots');
const foldersRoutes = require('./routes/folders');
const flowsRoutes = require('./routes/flows');
const reportsRoutes = require('./routes/reports');
const webhooksRoutes = require('./routes/webhooks');
const metaRoutes = require('./routes/meta');
const marketingMessagesRoutes = require('./routes/marketing-messages');
const logosRoutes = require('./routes/logos');
const whatsappCloudRoutes = require('./routes/whatsapp-cloud');
const rateShopperRoutes = require('./routes/rateShopper');
const sitesRoutes = require('./routes/sites');
const siteThemesRoutes = require('./routes/siteThemes');
const siteTemplatesRoutes = require('./routes/site-templates');
const hotelSitesRoutes = require('./routes/hotel-sites');
// const migrateRoutes = require('./routes/migrate'); // Removido por segurança

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/config', configRoutes);
app.use('/api/qdrant', qdrantRoutes);
app.use('/api/setup', setupRoutes);
app.use('/api/evolution', evolutionRoutes);
app.use('/api/flowise', flowiseRoutes);
app.use('/api/onenode', onenodeRoutes);
app.use('/api/pms-motor-channel', pmsMotorChannelRoutes);
app.use('/api/systems-catalog', systemsCatalogRoutes);
app.use('/api/bot-fields', botFieldsRoutes);
app.use('/api/workspaces', workspacesRoutes);
app.use('/api/bots', botsRoutes);
app.use('/api/folders', foldersRoutes);
app.use('/api/flows', flowsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/meta', metaRoutes);
app.use('/api/marketing-messages', marketingMessagesRoutes);
app.use('/api/logos', logosRoutes);
app.use('/api/whatsapp-cloud', whatsappCloudRoutes);
app.use('/api/rate-shopper', rateShopperRoutes);
app.use('/api/sites', sitesRoutes);
app.use('/api/site-themes', siteThemesRoutes);
app.use('/api/site-templates', siteTemplatesRoutes);
app.use('/api/hotel-sites', hotelSitesRoutes);

// Rate Shopper Extraction Control
const rateShopperExtractionRoutes = require('./routes/rateShopperExtraction');
app.use('/api/rate-shopper-extraction', rateShopperExtractionRoutes);
// app.use('/api/migrate', migrateRoutes); // Removido por segurança

// Socket.io configuration
io.on('connection', (socket) => {
  console.log('🔌 Cliente conectado:', socket.id);
  
  // Join room baseado no hotel ID para segregar eventos
  socket.on('join-hotel-room', (hotelId) => {
    const roomName = `hotel-${hotelId}`;
    socket.join(roomName);
    console.log(`👥 Socket ${socket.id} entrou na sala: ${roomName}`);
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Cliente desconectado:', socket.id);
  });
});

// Fazer o io disponível para as rotas
app.set('socketio', io);

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
    
    server.listen(PORT, () => {
      console.log(`✅ Servidor rodando na porta ${PORT}`);
      console.log(`🔌 Socket.io habilitado`);
      console.log(`🌍 CORS configurado para: ${process.env.CORS_ORIGIN}`);
      console.log(`🗄️  Conectado ao banco: ${db.currentHost}/${process.env.DB_NAME}`);
      console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🧪 DB test: http://localhost:${PORT}/api/db-test`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error.message);
    console.log('⚠️  Servidor iniciando sem conexão com banco...');
    
    server.listen(PORT, () => {
      console.log(`⚠️  Servidor rodando na porta ${PORT} (sem DB)`);
      console.log(`🔌 Socket.io habilitado`);
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