import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import toast from 'react-hot-toast';

const BotFieldsUpdateForm = ({ field, onUpdated, onCancel }) => {
  const { updateBotFields, selectedHotelUuid, loading } = useApp();
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    field_name: '',
    type: '',
    value: '',
    description: '',
    hotel_uuid: selectedHotelUuid || ''
  });

  useEffect(() => {
    if (field) {
      setFormData({
        id: field.id || '',
        name: field.name || field.field_name || '',
        field_name: field.field_name || field.name || '',
        type: field.type || 'text',
        value: field.value !== undefined ? String(field.value) : '',
        description: field.description || '',
        hotel_uuid: field.hotel_uuid || selectedHotelUuid || ''
      });
    }
  }, [field, selectedHotelUuid]);

  const handleInputChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.hotel_uuid) {
      toast.error('UUID do hotel é obrigatório');
      return;
    }

    try {
      // Prepare data for the API - only send editable fields
      const updateData = {
        id: formData.id,
        name: formData.name,
        field_name: formData.field_name,
        type: formData.type,
        value: formatValueByType(formData.value, formData.type),
        description: formData.description,
        hotel_uuid: formData.hotel_uuid
      };

      console.log('Enviando dados para atualizar campo (apenas valor e descrição):', updateData);

      await updateBotFields(updateData);
      toast.success('Campo do bot atualizado com sucesso!');
      
      if (onUpdated) {
        onUpdated(updateData);
      }
    } catch (error) {
      console.error('Erro ao atualizar campo do bot:', error);
      toast.error(`Erro ao atualizar campo: ${error.message}`);
    }
  };

  const formatValueByType = (value, type) => {
    if (!value) return value;
    
    switch (type?.toLowerCase()) {
      case 'number':
      case 'integer':
        const num = parseFloat(value);
        return isNaN(num) ? value : num;
      case 'boolean':
        if (typeof value === 'boolean') return value;
        return value === 'true' || value === '1' || value === 1;
      case 'date':
      case 'datetime':
        return value; // Keep as string for now
      default:
        return String(value);
    }
  };

  const renderValueInput = () => {
    const type = formData.type?.toLowerCase();
    
    switch (type) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={Boolean(formData.value === 'true' || formData.value === true || formData.value === '1')}
              onChange={(e) => handleInputChange('value', e.target.checked)}
              className="w-4 h-4 bg-white/10 border border-white/20 rounded focus:ring-2 focus:ring-primary-500"
            />
            <span className="text-sm text-sidebar-300">
              {formData.value === 'true' || formData.value === true || formData.value === '1' ? 'Verdadeiro' : 'Falso'}
            </span>
          </div>
        );
      
      case 'number':
      case 'integer':
        return (
          <input
            type="number"
            value={formData.value}
            onChange={(e) => handleInputChange('value', e.target.value)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-sidebar-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Digite o valor numérico"
          />
        );
      
      case 'date':
        return (
          <input
            type="date"
            value={formData.value}
            onChange={(e) => handleInputChange('value', e.target.value)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        );
      
      case 'datetime':
        return (
          <input
            type="datetime-local"
            value={formData.value}
            onChange={(e) => handleInputChange('value', e.target.value)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        );
      
      default:
        return (
          <textarea
            value={formData.value}
            onChange={(e) => handleInputChange('value', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-sidebar-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-vertical"
            placeholder="Digite o valor do campo"
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white">
          Editar Campo do Bot
        </h3>
        <p className="text-sm text-sidebar-400 mt-1">
          Edite apenas o valor e a descrição deste campo
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Field Information (Read-only) */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <h4 className="text-white font-medium mb-3">Informações do Campo</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-sidebar-400 mb-1">Nome do Campo</label>
              <p className="text-white bg-white/10 px-3 py-2 rounded-lg text-sm">{formData.name}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-sidebar-400 mb-1">Tipo</label>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  formData.type === 'text' || formData.type === 'string' ? 'bg-blue-500/20 text-blue-300' :
                  formData.type === 'number' || formData.type === 'integer' ? 'bg-orange-500/20 text-orange-300' :
                  formData.type === 'boolean' ? 'bg-green-500/20 text-green-300' :
                  formData.type === 'date' || formData.type === 'datetime' ? 'bg-purple-500/20 text-purple-300' :
                  'bg-gray-500/20 text-gray-300'
                }`}>
                  {formData.type?.toUpperCase() || 'N/A'}
                </span>
              </div>
            </div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3 mt-3">
            <p className="text-blue-200 text-xs">
              <strong>Informação:</strong> Apenas o valor e a descrição podem ser editados. Outros campos são somente leitura.
            </p>
          </div>
        </div>

        {/* Field Value - EDITABLE */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Valor *
            <span className="text-xs text-sidebar-400 ml-2">(Campo editável)</span>
          </label>
          {renderValueInput()}
        </div>

        {/* Description - EDITABLE */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Descrição
            <span className="text-xs text-sidebar-400 ml-2">(Campo editável)</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-sidebar-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-vertical"
            placeholder="Descrição do campo (opcional)"
          />
        </div>

        {/* Hidden Fields */}
        <input type="hidden" value={formData.hotel_uuid} />
        <input type="hidden" value={formData.id} />

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sidebar-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            {loading && (
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            <span>{loading ? 'Salvando...' : 'Salvar'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default BotFieldsUpdateForm;