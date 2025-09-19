import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const EditWorkspaceModal = ({ isOpen, onClose, workspace, onWorkspaceUpdated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Preencher formulário quando workspace mudar
  useEffect(() => {
    if (workspace) {
      setFormData({
        name: workspace.name || '',
        description: workspace.description || ''
      });
    }
  }, [workspace]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Nome da workspace é obrigatório');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.put(`${API_BASE_URL}/workspaces/${workspace.id}`, {
        name: formData.name.trim(),
        description: formData.description.trim() || null
      });

      if (response.data.success) {
        // Chamar callback para atualizar a lista
        if (onWorkspaceUpdated) {
          onWorkspaceUpdated(response.data.data);
        }

        // Fechar modal
        onClose();
      } else {
        setError(response.data.message || 'Erro ao atualizar workspace');
      }
    } catch (error) {
      console.error('Erro ao atualizar workspace:', error);
      setError(error.response?.data?.message || 'Erro interno do servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClose = () => {
    if (!loading) {
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-sapphire px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">
              ✏️ Editar Workspace
            </h3>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-white/80 hover:text-white transition-colors disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sapphire-100 text-sm mt-1">
            Editando: {workspace?.name}
          </p>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <span className="text-red-500">⚠️</span>
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-steel-700 mb-2">
              Nome da Workspace *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              disabled={loading}
              placeholder="Ex: Recepção, Vendas, Marketing..."
              className="w-full px-3 py-2 border border-steel-300 rounded-lg focus:ring-2 focus:ring-sapphire-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              maxLength={100}
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-steel-700 mb-2">
              Descrição (Opcional)
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              disabled={loading}
              placeholder="Descreva o propósito desta workspace..."
              className="w-full px-3 py-2 border border-steel-300 rounded-lg focus:ring-2 focus:ring-sapphire-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              rows={3}
              maxLength={500}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-steel-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-steel-600 hover:text-steel-800 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="px-6 py-2 bg-gradient-sapphire text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ Salvando...' : '💾 Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditWorkspaceModal;