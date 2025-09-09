const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Cache simples para usuários (expire em 5 minutos)
const userCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

const getCachedUser = (userId) => {
  const cached = userCache.get(userId);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.user;
  }
  return null;
};

const setCachedUser = (userId, user) => {
  userCache.set(userId, {
    user: user,
    timestamp: Date.now()
  });
  
  // Limpar cache antigo periodicamente
  if (userCache.size > 100) {
    const now = Date.now();
    for (const [key, value] of userCache.entries()) {
      if ((now - value.timestamp) > CACHE_TTL) {
        userCache.delete(key);
      }
    }
  }
};

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Token de acesso requerido' 
    });
  }

  // Em desenvolvimento, aceitar tokens fake do sistema de fallback
  if (process.env.NODE_ENV === 'development' && token.startsWith('fake_token_')) {
    console.log('🔧 [DEV] Usando token fake para desenvolvimento');
    
    // Extrair user_id do token fake (formato: fake_token_{id}_{timestamp})
    const parts = token.split('_');
    const userId = parseInt(parts[2]);
    
    // Criar usuário mockado baseado no ID
    const mockUser = {
      id: userId,
      name: userId === 1 ? 'Super Admin (Dev)' : userId === 2 ? 'Admin (Dev)' : 'Hotel User (Dev)',
      email: userId === 1 ? 'superadmin@hotel.com' : userId === 2 ? 'admin@hotel.com' : 'hotel@hotel.com',
      user_type: userId === 1 ? 'SUPER_ADMIN' : userId === 2 ? 'ADMIN' : 'HOTEL',
      active: true
    };
    
    req.user = mockUser;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Tentar buscar no cache primeiro
    let user = getCachedUser(decoded.userId);
    
    if (!user) {
      // Se não está no cache, buscar no banco
      user = await User.findById(decoded.userId);
      
      if (user && user.active) {
        // Adicionar ao cache
        setCachedUser(decoded.userId, user);
      }
    }
    
    if (!user || !user.active) {
      return res.status(401).json({ 
        error: 'Usuário não encontrado ou inativo' 
      });
    }

    // Adicionar dados do usuário à requisição
    req.user = user.toJSON ? user.toJSON() : user;
    next();
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expirado' 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Token inválido' 
      });
    }

    console.error('Erro na autenticação:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor' 
    });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Usuário não autenticado' 
      });
    }

    const userRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!userRoles.includes(req.user.user_type)) {
      return res.status(403).json({ 
        error: 'Permissão insuficiente' 
      });
    }

    next();
  };
};

const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (user && user.active) {
      req.user = user.toJSON();
    } else {
      req.user = null;
    }
    
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  optionalAuth
};