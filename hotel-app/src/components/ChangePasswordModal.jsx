import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ChangePasswordModal = ({ isOpen, onClose, user }) => {
  const { changePassword, isSuperAdmin } = useAuth();
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      setErrors({});
      setShowPasswords({
        current: false,
        new: false,
        confirm: false
      });
    }
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpar erro do campo quando usuário começa a digitar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Se não for Super Admin, senha atual é obrigatória
    if (!isSuperAdmin()) {
      if (!formData.current_password) {
        newErrors.current_password = 'Senha atual é obrigatória';
      }
    }

    if (!formData.new_password) {
      newErrors.new_password = 'Nova senha é obrigatória';
    } else if (formData.new_password.length < 6) {
      newErrors.new_password = 'Nova senha deve ter pelo menos 6 caracteres';
    }

    if (!formData.confirm_password) {
      newErrors.confirm_password = 'Confirmação de senha é obrigatória';
    } else if (formData.new_password !== formData.confirm_password) {
      newErrors.confirm_password = 'Confirmação de senha não confere';
    }

    // Verificar se nova senha é diferente da atual
    if (formData.current_password && formData.current_password === formData.new_password) {
      newErrors.new_password = 'Nova senha deve ser diferente da senha atual';
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

      const passwordData = {
        new_password: formData.new_password,
        confirm_password: formData.confirm_password
      };

      // Se não for Super Admin, incluir senha atual
      if (!isSuperAdmin()) {
        passwordData.current_password = formData.current_password;
      }

      await changePassword(user.id, passwordData);
      
      toast.success('Senha alterada com sucesso!');
      onClose();

    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      
      // Tratar erros específicos
      let errorMessage = 'Erro ao alterar senha';
      
      if (error.message) {
        if (error.message.includes('Senha atual incorreta')) {
          setErrors({ current_password: 'Senha atual incorreta' });
          return;
        } else if (error.message.includes('Confirmação de senha não confere')) {
          setErrors({ confirm_password: 'Confirmação de senha não confere' });
          return;
        } else if (error.message.includes('não tem permissão')) {
          errorMessage = 'Você não tem permissão para alterar a senha deste usuário';
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
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-sidebar-800/95 border border-white/10 rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-semibold text-white">Alterar Senha</h2>
            <p className="text-sidebar-400 text-sm mt-1">
              {isSuperAdmin() && user.id !== user.id 
                ? `Alterando senha de ${user.name}` 
                : 'Alterando sua senha'
              }
            </p>
          </div>
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
          {/* Senha Atual - só se não for Super Admin */}
          {!isSuperAdmin() && (
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Senha Atual *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  name="current_password"
                  value={formData.current_password}
                  onChange={handleInputChange}
                  autoComplete="current-password"
                  data-lpignore="true"
                  data-form-type="password"
                  className={`w-full px-4 py-3 pr-12 bg-white/5 border rounded-lg text-white placeholder-sidebar-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors ${
                    errors.current_password ? 'border-red-500' : 'border-white/20'
                  }`}
                  placeholder="Digite sua senha atual"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sidebar-400 hover:text-white transition-colors"
                  disabled={loading}
                >
                  {showPasswords.current ? (
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
              {errors.current_password && (
                <p className="text-red-400 text-sm mt-1">{errors.current_password}</p>
              )}
            </div>
          )}

          {/* Nova Senha */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Nova Senha *
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                name="new_password"
                value={formData.new_password}
                onChange={handleInputChange}
                autoComplete="new-password"
                data-lpignore="true"
                data-form-type="password"
                className={`w-full px-4 py-3 pr-12 bg-white/5 border rounded-lg text-white placeholder-sidebar-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors ${
                  errors.new_password ? 'border-red-500' : 'border-white/20'
                }`}
                placeholder="Digite a nova senha"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sidebar-400 hover:text-white transition-colors"
                disabled={loading}
              >
                {showPasswords.new ? (
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
            {errors.new_password && (
              <p className="text-red-400 text-sm mt-1">{errors.new_password}</p>
            )}
          </div>

          {/* Confirmar Nova Senha */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Confirmar Nova Senha *
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 pr-12 bg-white/5 border rounded-lg text-white placeholder-sidebar-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors ${
                  errors.confirm_password ? 'border-red-500' : 'border-white/20'
                }`}
                placeholder="Confirme a nova senha"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sidebar-400 hover:text-white transition-colors"
                disabled={loading}
              >
                {showPasswords.confirm ? (
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
            {errors.confirm_password && (
              <p className="text-red-400 text-sm mt-1">{errors.confirm_password}</p>
            )}
          </div>

          {/* Dicas de segurança */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <h4 className="text-white font-medium mb-2">🔐 Dicas de segurança:</h4>
            <ul className="text-sm text-sidebar-400 space-y-1">
              <li>• Use pelo menos 6 caracteres</li>
              <li>• Combine letras, números e símbolos</li>
              <li>• Evite informações pessoais</li>
              <li>• Não reutilize senhas de outros sites</li>
            </ul>
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
                  Alterando...
                </>
              ) : (
                'Alterar Senha'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;