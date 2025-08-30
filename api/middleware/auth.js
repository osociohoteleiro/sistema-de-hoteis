const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Token de acesso requerido' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar usuário no banco para verificar se ainda existe e está ativo
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.active) {
      return res.status(401).json({ 
        error: 'Usuário não encontrado ou inativo' 
      });
    }

    // Adicionar dados do usuário à requisição
    req.user = user.toJSON();
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