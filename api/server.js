const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

const db = require('./config/database');
const { initDatabase } = require('./init-database');

const app = express();
const server = http.createServer(app);

// Use PORT from environment (EasyPanel sets this) or default to 3001 for local dev
const PORT = process.env.PORT || 3001;

// Middleware de segurança
app.use(helmet());

// Rate limiting - Configuração diferente para desenvolvimento
const limiter = rateLimit({
  windowMs: process.env.NODE_ENV === 'production' ? 15 * 60 * 1000 : 1 * 60 * 1000, // 15 min em prod, 1 min em dev
  max: process.env.NODE_ENV === 'production' ? 500 : 2000, // 500 em prod, 2000 em dev
  skipSuccessfulRequests: true, // Não contar requests bem-sucedidos
  trustProxy: false, // Desabilitar trust proxy para resolver erro
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later.',
  handler: (req, res) => {
    console.log(`🚫 Rate limit atingido para IP: ${req.ip}, rota: ${req.path}`);
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.round(limiter.windowMs / 1000)
    });
  }
});
app.use(limiter);

// CORS - Permitir localhost para desenvolvimento e domínios configurados para produção
app.use(cors({
  origin: function (origin, callback) {
    // Lista de origins permitidos
    const allowedOrigins = [
      // Desenvolvimento local
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:5176', // PMS atualizado
      // EasyPanel domains (usar variável de ambiente se configurada)
      ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map(o => o.trim()) : [])
    ];
    
    // Log da configuração atual para debug (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 CORS Debug - Origins permitidos:', allowedOrigins);
      console.log('🔍 CORS Debug - Origin da requisição:', origin);
    }
    
    // Permitir requisições sem origin (como Postman, apps mobile, etc)
    if (!origin) {
      console.log('✅ CORS permitido: requisição sem origin');
      return callback(null, true);
    }
    
    // Verificar se origin está na lista permitida ou é localhost
    if (origin.startsWith('http://localhost:') || allowedOrigins.includes(origin)) {
      console.log(`✅ CORS permitido para: ${origin}`);
      return callback(null, true);
    }
    
    // Suporte a wildcards para subdomínios (opcional)
    const wildcardMatch = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.includes('*.')) {
        const regex = new RegExp('^' + allowedOrigin.replace('*.', '[\\w-]+\\.').replace(/\./g, '\\.') + '$');
        return regex.test(origin);
      }
      return false;
    });
    
    if (wildcardMatch) {
      console.log(`✅ CORS permitido via wildcard para: ${origin}`);
      return callback(null, true);
    }
    
    console.log(`🚫 CORS bloqueado para: ${origin}`);
    console.log('🔍 Origins permitidos:', allowedOrigins);
    callback(new Error(`Não permitido pelo CORS: ${origin}`));
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

// List database tables endpoint
app.get('/api/list-tables', async (req, res) => {
  try {
    console.log('📋 Listando tabelas do banco...');
    
    // Conectar ao banco
    await db.connect();
    
    // Listar tabelas
    const tables = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    // Verificar usuário admin se tabela users existir
    let adminUser = null;
    const userTableExists = tables.some(t => t.table_name === 'users');
    if (userTableExists) {
      try {
        const adminQuery = await db.query('SELECT id, name, email FROM users WHERE email = $1 LIMIT 1', ['admin@osh.com.br']);
        adminUser = adminQuery[0] || null;
      } catch (error) {
        console.log('⚠️ Erro ao buscar admin user:', error.message);
      }
    }
    
    res.json({
      success: true,
      message: 'Lista de tabelas obtida com sucesso!',
      tableCount: tables.length,
      tables: tables.map(t => t.table_name),
      adminUser: adminUser,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro ao listar tabelas:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Manual database initialization endpoint
app.post('/api/init-db', async (req, res) => {
  try {
    console.log('🔄 Forçando inicialização manual do banco...');
    
    // Conectar ao banco
    await db.connect();
    
    // Forçar inicialização
    await initDatabase();
    
    // Verificar tabelas criadas
    const tables = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    // Verificar usuário admin
    const adminUser = await db.query('SELECT id, name, email FROM users WHERE email = $1 LIMIT 1', ['admin@osh.com.br']);
    
    res.json({
      success: true,
      message: 'Banco inicializado com sucesso!',
      tables: tables.map(t => t.table_name),
      adminUser: adminUser[0] || null,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro na inicialização manual:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Initialize database using GET (easier for browser testing)
app.get('/api/init-db-get', async (req, res) => {
  try {
    console.log('🔄 Inicialização via GET...');
    
    // Conectar ao banco
    await db.connect();
    
    // Forçar inicialização
    await initDatabase();
    
    // Verificar tabelas criadas
    const tables = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    // Verificar usuário admin
    let adminUser = null;
    try {
      const adminQuery = await db.query('SELECT id, name, email FROM users WHERE email = $1 LIMIT 1', ['admin@osh.com.br']);
      adminUser = adminQuery[0] || null;
    } catch (error) {
      console.log('⚠️ Erro ao buscar admin:', error.message);
    }
    
    res.json({
      success: true,
      message: 'Banco inicializado com sucesso via GET!',
      tables: tables.map(t => t.table_name),
      adminUser: adminUser,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro na inicialização via GET:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Create contacts_cache table endpoint
app.get('/api/create-contacts-cache', async (req, res) => {
  try {
    console.log('🔄 Criando tabela contacts_cache...');

    // Conectar ao banco
    await db.connect();

    // Criar tabela
    await db.query(`
      CREATE TABLE IF NOT EXISTS contacts_cache (
          id SERIAL PRIMARY KEY,
          phone_number VARCHAR(20) NOT NULL,
          instance_name VARCHAR(100) NOT NULL,
          contact_name VARCHAR(255),
          profile_picture_url TEXT,
          contact_exists BOOLEAN DEFAULT true,
          last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(phone_number, instance_name)
      );
    `);

    // Criar índices
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_contacts_cache_phone ON contacts_cache(phone_number);
      CREATE INDEX IF NOT EXISTS idx_contacts_cache_instance ON contacts_cache(instance_name);
      CREATE INDEX IF NOT EXISTS idx_contacts_cache_updated ON contacts_cache(last_updated);
    `);

    // Verificar se a tabela foi criada
    const tables = await db.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'contacts_cache'
    `);

    res.json({
      success: true,
      message: 'Tabela contacts_cache criada com sucesso!',
      tableExists: tables.length > 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao criar tabela:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});


// Importar rotas
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
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
const rateShopperExtractionRoutes = require('./routes/rateShopperExtraction');
const testExtractionRoutes = require('./routes/testExtraction');
const sitesRoutes = require('./routes/sites');
const siteThemesRoutes = require('./routes/siteThemes');
const siteTemplatesRoutes = require('./routes/site-templates');
const hotelSitesRoutes = require('./routes/hotel-sites');
const migrateRoutes = require('./routes/migrate'); // Habilitado temporariamente
const appConfigurationsRoutes = require('./routes/app-configurations');
const dataImportRoutes = require('./routes/dataImport');
const whatsappMessagesRoutes = require('./routes/whatsapp-messages');
console.log('🔄 Carregando workspace-instances routes...');
const workspaceInstancesRoutes = require('./routes/workspace-instances');
console.log('✅ Workspace-instances routes carregadas');

console.log('🔄 Carregando leads routes...');
const leadsRoutes = require('./routes/leads');
console.log('✅ Leads routes carregadas');

console.log('🔄 Carregando contacts-cache routes...');
const contactsCacheRoutes = require('./routes/contacts-cache');
console.log('✅ Contacts-cache routes carregadas');

console.log('🔄 Carregando evolution-webhook routes...');
const evolutionWebhookRoutes = require('./routes/evolution-webhook');
console.log('✅ Evolution-webhook routes carregadas');

console.log('🔄 Carregando webhook-config routes...');
const webhookConfigRoutes = require('./routes/webhook-config');
console.log('✅ Webhook-config routes carregadas');

// Rotas da API
app.use('/api/data-import', dataImportRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
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
app.use('/api/rate-shopper-extraction', rateShopperExtractionRoutes);
app.use('/api/test-extraction', testExtractionRoutes);
app.use('/api/rate-shopper', rateShopperRoutes);
app.use('/api/sites', sitesRoutes);
app.use('/api/site-themes', siteThemesRoutes);
app.use('/api/site-templates', siteTemplatesRoutes);
app.use('/api/hotel-sites', hotelSitesRoutes);
app.use('/api/app-configurations', appConfigurationsRoutes);
app.use('/api/whatsapp-messages', whatsappMessagesRoutes);
app.use('/api/workspace-instances', workspaceInstancesRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/contacts-cache', contactsCacheRoutes);
app.use('/api/evolution-webhook', evolutionWebhookRoutes);
app.use('/api/webhook-config', webhookConfigRoutes);

app.use('/api/migrate', migrateRoutes); // Habilitado temporariamente

// 🚀 NOVO ENDPOINT: Health check para scripts automáticos
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

console.log('📍 Todas as rotas carregadas');

// Inicializar WebSocket Service
const websocketService = require('./services/websocketService');
websocketService.initialize(server);

// Fazer o websocketService disponível para as rotas
app.set('websocketService', websocketService);

// Legacy compatibility: fazer io disponível para rotas antigas
// FIXME: Migrar todas as rotas para websocketService
app.set('socketio', websocketService.io);

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
    console.log('🚀 Iniciando servidor (FORCANDO REINICIO)...');
    console.log('🔄 Testando conexão com banco de dados...');
    
    await db.connect();
    
    // Inicializar banco de dados (criar usuário admin se necessário)
    await initDatabase();
    
    server.listen(PORT, () => {
      console.log(`✅ Servidor rodando na porta ${PORT}`);
      console.log(`🔌 Socket.io habilitado`);
      console.log(`🌍 CORS configurado para: ${process.env.CORS_ORIGINS}`);
      console.log(`🗄️  Conectado ao banco: ${db.currentHost}/${process.env.POSTGRES_DB}`);
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
// restart
// force restart
// another restart
// restart Thu, Sep 18, 2025  2:13:41 PM

// restart
