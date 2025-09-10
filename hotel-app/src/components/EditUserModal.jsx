import { useState, useEffect } from 'react';
import { USER_TYPES, useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const EditUserModal = ({ isOpen, onClose, user, onUserUpdated }) => {
  const { isSuperAdmin } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    user_type: USER_TYPES.HOTEL,
    active: true
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Preencher dados quando o modal é aberto
  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        user_type: user.user_type || USER_TYPES.HOTEL,
        active: user.active !== undefined ? user.active : true
      });
      setErrors({});
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
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

      // Dados a serem enviados (só enviar o que pode ser alterado)
      const updateData = {
        name: formData.name.trim(),
        email: formData.email.trim()
      };

      // Super Admin pode alterar tipo e status
      if (isSuperAdmin()) {
        updateData.user_type = formData.user_type;
        updateData.active = formData.active;
      }

      await onUserUpdated(updateData);

    } catch (error) {
      console.error('Erro ao editar usuário:', error);
      
      // Tratar erros específicos
      let errorMessage = 'Erro ao editar usuário';
      
      if (error.message) {
        if (error.message.includes('Email já está em uso')) {
          errorMessage = 'Este email já está sendo usado por outro usuário';
        } else if (error.message.includes('Dados inválidos')) {
          errorMessage = 'Dados inválidos. Verifique os campos preenchidos';
        } else if (error.message.includes('não tem permissão')) {
          errorMessage = 'Você não tem permissão para editar este usuário';
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
      setErrors({});
      onClose();
    }
  };

  // Definir labels para os tipos de usuário
  const USER_TYPE_LABELS = {
    [USER_TYPES.SUPER_ADMIN]: 'Super Administrador',
    [USER_TYPES.ADMIN]: 'Administrador',
    [USER_TYPES.HOTEL]: 'Hoteleiro'
  };

  const canEditType = isSuperAdmin();
  const canEditStatus = isSuperAdmin();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-sidebar-800/95 border border-white/10 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Editar Usuário</h2>
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

          {/* Tipo de Usuário - só Super Admin pode alterar */}
          {canEditType && (
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
          )}

          {/* Status Ativo - só Super Admin pode alterar */}
          {canEditStatus && (
            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-primary-600 bg-white/10 border-white/20 rounded focus:ring-primary-500 focus:ring-2"
                  disabled={loading}
                />
                <span className="text-white text-sm font-medium">
                  Usuário ativo
                </span>
              </label>
              <p className="text-sidebar-400 text-sm mt-1">
                Usuários inativos não podem fazer login no sistema
              </p>
            </div>
          )}

          {/* Info sobre permissões */}
          {!canEditType && !canEditStatus && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">ℹ️ Informação:</h4>
              <p className="text-sm text-sidebar-400">
                Você pode editar apenas o nome e email deste usuário. 
                Para alterar tipo ou status, contate um Super Administrador.
              </p>
            </div>
          )}

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
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;