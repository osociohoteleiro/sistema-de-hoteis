import { useState, useEffect } from 'react';
import { USER_TYPES, useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import toast from 'react-hot-toast';

const NewUserModal = ({ isOpen, onClose, onUserCreated }) => {
  const { isSuperAdmin } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    user_type: USER_TYPES.HOTEL
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: '',
    color: '',
    suggestions: []
  });

  if (!isOpen) return null;

  // Função para calcular a força da senha
  const calculatePasswordStrength = (password) => {
    if (!password) {
      return { score: 0, label: '', color: '', suggestions: [] };
    }

    let score = 0;
    const suggestions = [];

    // Critérios de força
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password);
    const hasLength = password.length >= 8;
    const isVeryLong = password.length >= 12;

    // Pontuação
    if (hasLowerCase) score += 1;
    else suggestions.push('Adicione letras minúsculas');

    if (hasUpperCase) score += 1;
    else suggestions.push('Adicione letras maiúsculas');

    if (hasNumbers) score += 1;
    else suggestions.push('Adicione números');

    if (hasSpecialChars) score += 1;
    else suggestions.push('Adicione símbolos (!@#$%^&*)');

    if (hasLength) score += 1;
    else suggestions.push('Use pelo menos 8 caracteres');

    if (isVeryLong) score += 1;

    // Penalidades
    if (password.length < 6) score = Math.max(0, score - 2);
    
    // Verificar sequências comuns
    const commonPatterns = ['123', 'abc', 'qwe', '111', '000', 'admin', 'pass'];
    const lowerPassword = password.toLowerCase();
    if (commonPatterns.some(pattern => lowerPassword.includes(pattern))) {
      score = Math.max(0, score - 1);
      suggestions.push('Evite sequências óbvias como 123, abc, qwe');
    }

    // Determinar nível
    let label, color;
    if (score === 0) {
      label = '';
      color = '';
    } else if (score <= 2) {
      label = 'Muito Fraca';
      color = 'text-red-400';
    } else if (score <= 3) {
      label = 'Fraca';
      color = 'text-orange-400';
    } else if (score <= 4) {
      label = 'Média';
      color = 'text-yellow-400';
    } else if (score <= 5) {
      label = 'Forte';
      color = 'text-blue-400';
    } else {
      label = 'Muito Forte';
      color = 'text-green-400';
    }

    return { score: Math.min(score, 6), label, color, suggestions };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Calcular força da senha quando o campo password mudar
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
    
    // Limpar erro do campo quando usuário começa a digitar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };


  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    } else if (passwordStrength.score <= 2) {
      newErrors.password = 'Senha muito fraca. Siga as sugestões para torná-la mais segura';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirmação de senha é obrigatória';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }

    if (!formData.user_type) {
      newErrors.user_type = 'Tipo de usuário é obrigatório';
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Preparar dados sem o campo confirmPassword
      const { confirmPassword, ...userDataToSend } = formData;
      
      // Chama a função passada como prop para criar o usuário
      await onUserCreated(userDataToSend);

      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        user_type: USER_TYPES.HOTEL
      });
      setErrors({});
      
      toast.success('Usuário criado com sucesso!');
      onClose();

    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      
      // Tratar erros específicos
      let errorMessage = 'Erro ao criar usuário';
      
      if (error.message) {
        if (error.message.includes('Email já está em uso')) {
          errorMessage = 'Este email já está sendo usado por outro usuário';
        } else if (error.message.includes('Dados inválidos')) {
          errorMessage = 'Dados inválidos. Verifique os campos preenchidos';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        user_type: USER_TYPES.HOTEL
      });
      setErrors({});
      setShowPassword(false);
      setShowConfirmPassword(false);
      setPasswordStrength({ score: 0, label: '', color: '', suggestions: [] });
      onClose();
    }
  };

  // Definir labels para os tipos de usuário
  const ALL_USER_TYPE_LABELS = {
    [USER_TYPES.SUPER_ADMIN]: 'Super Administrador',
    [USER_TYPES.ADMIN]: 'Administrador',
    [USER_TYPES.HOTEL]: 'Hoteleiro'
  };

  // Filtrar tipos baseado no usuário logado
  const getAvailableUserTypes = () => {
    if (isSuperAdmin()) {
      // Super Admin pode criar qualquer tipo de usuário
      return ALL_USER_TYPE_LABELS;
    } else {
      // Admin e outros só podem criar Admin e Hoteleiro
      return {
        [USER_TYPES.ADMIN]: 'Administrador',
        [USER_TYPES.HOTEL]: 'Hoteleiro'
      };
    }
  };

  const USER_TYPE_LABELS = getAvailableUserTypes();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-sidebar-800/95 border border-white/10 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Novo Usuário</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-sidebar-400 hover:text-white transition-colors p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Nome *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white placeholder-sidebar-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors ${
                errors.name ? 'border-red-500' : 'border-white/20'
              }`}
              placeholder="Digite o nome completo"
              disabled={loading}
            />
            {errors.name && (
              <p className="text-red-400 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white placeholder-sidebar-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors ${
                errors.email ? 'border-red-500' : 'border-white/20'
              }`}
              placeholder="usuario@exemplo.com"
              disabled={loading}
            />
            {errors.email && (
              <p className="text-red-400 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Senha */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Senha *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                autoComplete="new-password"
                data-lpignore="true"
                data-form-type="password"
                className={`w-full px-4 py-3 pr-12 bg-white/5 border rounded-lg text-white placeholder-sidebar-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors ${
                  errors.password ? 'border-red-500' : 'border-white/20'
                }`}
                placeholder="Mínimo 6 caracteres, use letras, números e símbolos"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sidebar-400 hover:text-white transition-colors"
                disabled={loading}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.05 6.05M9.878 9.878a3 3 0 004.242 4.242m6.02-4.242a9.97 9.97 0 01-1.563 3.029m0 0L16.05 20.95m-4.242-4.242L16.05 20.95" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.543 7-1.275 4.057-5.065 7-9.543 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            
            {/* Indicador de Força da Senha */}
            {formData.password && (
              <div className="mt-3">
                {/* Barra de Força */}
                <div className="flex space-x-1 mb-2">
                  {[1, 2, 3, 4, 5, 6].map((level) => (
                    <div
                      key={level}
                      className={`h-2 flex-1 rounded-full transition-colors ${
                        level <= passwordStrength.score
                          ? level <= 2
                            ? 'bg-red-400'
                            : level <= 3
                            ? 'bg-orange-400'
                            : level <= 4
                            ? 'bg-yellow-400'
                            : level <= 5
                            ? 'bg-blue-400'
                            : 'bg-green-400'
                          : 'bg-white/20'
                      }`}
                    />
                  ))}
                </div>
                
                {/* Label da Força */}
                {passwordStrength.label && (
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm text-sidebar-400">Força da senha:</span>
                    <span className={`text-sm font-medium ${passwordStrength.color}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                )}
                
                {/* Sugestões */}
                {passwordStrength.suggestions.length > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <h4 className="text-white text-sm font-medium mb-1">💡 Dicas para melhorar:</h4>
                    <ul className="text-sidebar-400 text-xs space-y-1">
                      {passwordStrength.suggestions.slice(0, 3).map((suggestion, index) => (
                        <li key={index}>• {suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            {errors.password && (
              <p className="text-red-400 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          {/* Confirmar Senha */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Confirmar Senha *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                autoComplete="new-password"
                data-lpignore="true"
                data-form-type="password"
                className={`w-full px-4 py-3 pr-12 bg-white/5 border rounded-lg text-white placeholder-sidebar-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors ${
                  errors.confirmPassword ? 'border-red-500' : 'border-white/20'
                }`}
                placeholder="Digite a senha novamente"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sidebar-400 hover:text-white transition-colors"
                disabled={loading}
              >
                {showConfirmPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.05 6.05M9.878 9.878a3 3 0 004.242 4.242m6.02-4.242a9.97 9.97 0 01-1.563 3.029m0 0L16.05 20.95m-4.242-4.242L16.05 20.95" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.543 7-1.275 4.057-5.065 7-9.543 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Indicador visual de correspondência */}
            {formData.confirmPassword && (
              <div className="flex items-center mt-2 space-x-2">
                {formData.password === formData.confirmPassword ? (
                  <>
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-green-400 text-sm">Senhas coincidem</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-red-400 text-sm">Senhas não coincidem</span>
                  </>
                )}
              </div>
            )}

            {errors.confirmPassword && (
              <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Tipo de Usuário */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Tipo de Usuário *
            </label>
            <select
              name="user_type"
              value={formData.user_type}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors ${
                errors.user_type ? 'border-red-500' : 'border-white/20'
              }`}
              disabled={loading}
            >
              {Object.entries(USER_TYPE_LABELS).map(([type, label]) => (
                <option key={type} value={type} className="bg-sidebar-800 text-white">
                  {label}
                </option>
              ))}
            </select>
            {errors.user_type && (
              <p className="text-red-400 text-sm mt-1">{errors.user_type}</p>
            )}
          </div>


          {/* Descrição dos tipos */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <h4 className="text-white font-medium mb-2">Tipos de Usuário:</h4>
            <div className="text-sm text-sidebar-400 space-y-1">
              {isSuperAdmin() && (
                <p><span className="text-red-400">Super Admin:</span> Acesso total ao sistema (apenas Super Admins podem criar)</p>
              )}
              <p><span className="text-blue-400">Admin:</span> Gerencia hotéis e configurações</p>
              <p><span className="text-green-400">Hoteleiro:</span> Acessa apenas área do hotel (vinculação feita após criação)</p>
            </div>
            {!isSuperAdmin() && (
              <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-yellow-300 text-sm">
                  ℹ️ Apenas Super Administradores podem criar outros Super Admins
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-500 disabled:bg-primary-800 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Criando...
                </>
              ) : (
                'Criar Usuário'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewUserModal;