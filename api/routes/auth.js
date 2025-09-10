const express = require('express');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// Validação schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  user_type: Joi.string().valid('SUPER_ADMIN', 'ADMIN', 'HOTEL').default('HOTEL')
});

const changePasswordSchema = Joi.object({
  current_password: Joi.string().required(),
  new_password: Joi.string().min(6).required()
});

// Utility function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email, 
      userType: user.user_type 
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 Tentativa de login...');
    console.log('📝 Dados recebidos:', req.body);
    
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      console.log('❌ Erro de validação:', error.details);
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      });
    }

    const { email, password } = value;
    console.log('📧 Email:', email);
    console.log('🔑 Senha recebida (length):', password.length);

    // Buscar usuário
    console.log('🔍 Buscando usuário...');
    const user = await User.findByEmail(email);
    if (!user) {
      console.log('❌ Usuário não encontrado');
      return res.status(401).json({
        error: 'Email ou senha inválidos'
      });
    }
    console.log('✅ Usuário encontrado:', user.id, user.name);

    // Verificar se usuário está ativo
    if (!user.active) {
      console.log('❌ Usuário inativo');
      return res.status(401).json({
        error: 'Conta inativa. Entre em contato com o administrador.'
      });
    }
    console.log('✅ Usuário ativo');

    // Validar senha
    console.log('🔐 Validando senha...');
    const isValidPassword = await user.validatePassword(password);
    console.log('✅ Senha válida?', isValidPassword);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Email ou senha inválidos'
      });
    }

    // Gerar token
    console.log('🎫 Gerando token...');
    const token = generateToken(user);

    // Buscar hotéis do usuário
    console.log('🏨 Buscando hotéis do usuário...');
    const hotels = await user.getHotels();
    console.log('✅ Hotéis encontrados:', hotels.length);

    // Buscar permissões do usuário
    console.log('🔐 Buscando permissões do usuário...');
    const permissions = await user.getPermissions();
    console.log('✅ Permissões encontradas:', permissions.length);

    console.log('🎉 Login realizado com sucesso!');
    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: user.toJSON(),
      permissions,
      hotels
    });

  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/auth/register
router.post('/register', authenticateToken, async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      });
    }

    const { name, email, password, user_type } = value;
    
    // Verificar se usuário logado pode criar usuários
    if (!req.user || (req.user.user_type !== 'SUPER_ADMIN' && req.user.user_type !== 'ADMIN')) {
      return res.status(403).json({
        error: 'Apenas Super Admin e Admin podem criar usuários'
      });
    }
    
    // Apenas Super Admin pode criar outros Super Admins
    if (user_type === 'SUPER_ADMIN' && req.user.user_type !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: 'Apenas Super Admin pode criar outros Super Admins'
      });
    }

    // Verificar se email já existe
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: 'Email já está em uso'
      });
    }

    // Criar novo usuário
    const user = new User({
      name,
      email,
      user_type,
      active: true,
      email_verified: false
    });

    await user.setPassword(password);
    await user.save();
    
    // Log específico para Super Admins
    if (user_type === 'SUPER_ADMIN') {
      console.log('👑 Super Admin criado com sucesso!', {
        id: user.id,
        name: user.name,
        email: user.email,
        createdBy: req.user.name,
        message: 'Super Admin automaticamente recebe todas as permissões no frontend'
      });
    } else {
      console.log(`✅ Usuário ${user_type} criado:`, {
        id: user.id,
        name: user.name,
        email: user.email,
        createdBy: req.user.name,
        message: 'Vincular a hotéis usando o botão "Gerenciar Hotéis" se necessário'
      });
    }

    // Gerar token
    const token = generateToken(user);

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      token,
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }

    const hotels = await user.getHotels();
    const permissions = await user.getPermissions();

    res.json({
      user: user.toJSON(),
      permissions,
      hotels
    });

  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// PUT /api/auth/profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const updateSchema = Joi.object({
      name: Joi.string().min(2).max(255),
      email: Joi.string().email()
    });

    const { error, value } = updateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }

    // Verificar se email está sendo alterado e se já existe
    if (value.email && value.email !== user.email) {
      const existingUser = await User.findByEmail(value.email);
      if (existingUser) {
        return res.status(409).json({
          error: 'Email já está em uso'
        });
      }
      user.email = value.email;
      user.email_verified = false;
    }

    if (value.name) {
      user.name = value.name;
    }

    await user.save();

    res.json({
      message: 'Perfil atualizado com sucesso',
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/auth/change-password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      });
    }

    const { current_password, new_password } = value;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }

    // Verificar senha atual
    const isValidPassword = await user.validatePassword(current_password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Senha atual incorreta'
      });
    }

    // Definir nova senha
    await user.setPassword(new_password);
    await user.save();

    res.json({
      message: 'Senha alterada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/auth/refresh
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.active) {
      return res.status(401).json({
        error: 'Usuário não encontrado ou inativo'
      });
    }

    // Gerar novo token
    const token = generateToken(user);

    res.json({
      message: 'Token renovado com sucesso',
      token
    });

  } catch (error) {
    console.error('Erro ao renovar token:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, async (req, res) => {
  // No caso de JWT stateless, apenas retornamos sucesso
  // O cliente deve descartar o token
  res.json({
    message: 'Logout realizado com sucesso'
  });
});

module.exports = router;