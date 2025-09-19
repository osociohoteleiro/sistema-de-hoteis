import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:3001/api';

const EditLeadModal = ({ isOpen, onClose, lead, onLeadUpdated }) => {
  const { workspaceUuid } = useParams();

  const [formData, setFormData] = useState({
    contact_name: '',
    description: '',
    lead_status: 'NEW',
    lead_source: 'MANUAL',
    assigned_to: '',
    notes: '',
    tags: [],
    custom_fields: {}
  });

  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState([]);
  const [customFields, setCustomFields] = useState([]);

  useEffect(() => {
    if (isOpen && lead) {
      loadTags();
      loadCustomFields();
      populateForm();
    }
  }, [isOpen, lead]);

  const populateForm = () => {
    if (!lead) return;

    setFormData({
      contact_name: lead.contact_name || '',
      description: lead.description || '',
      lead_status: lead.lead_status || 'NEW',
      lead_source: lead.lead_source || 'MANUAL',
      assigned_to: lead.assigned_to || '',
      notes: lead.notes || '',
      tags: lead.tags ? lead.tags.map(tag => tag.id) : [],
      custom_fields: lead.custom_fields || {}
    });
  };

  const loadTags = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/leads/${workspaceUuid}/tags`);
      if (response.data.success) {
        setTags(response.data.data.tags || []);
      }
    } catch (error) {
      console.error('Erro ao carregar tags:', error);
    }
  };

  const loadCustomFields = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/leads/${workspaceUuid}/custom-fields`);
      if (response.data.success) {
        setCustomFields(response.data.data.fields || []);
      }
    } catch (error) {
      console.error('Erro ao carregar campos personalizados:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.contact_name.trim()) {
        toast.error('Nome do contato é obrigatório');
        return;
      }

      const payload = {
        ...formData,
        contact_name: formData.contact_name.trim(),
        tags: formData.tags
      };

      const response = await axios.put(`${API_BASE_URL}/leads/${workspaceUuid}/${lead.id}`, payload);

      if (response.data.success) {
        toast.success('Lead atualizado com sucesso!');
        onLeadUpdated?.(response.data.data.lead);
        onClose();
      }
    } catch (error) {
      console.error('Erro ao atualizar lead:', error);
      const errorMessage = error.response?.data?.error || 'Erro ao atualizar lead';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleTagToggle = (tagId) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter(id => id !== tagId)
        : [...prev.tags, tagId]
    }));
  };

  const handleCustomFieldChange = (fieldKey, value) => {
    setFormData(prev => ({
      ...prev,
      custom_fields: {
        ...prev.custom_fields,
        [fieldKey]: value
      }
    }));
  };

  const renderCustomField = (field) => {
    const value = formData.custom_fields[field.field_key] || '';

    switch (field.field_type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleCustomFieldChange(field.field_key, e.target.value)}
            className="w-full px-3 py-2 border border-sapphire-200 rounded-lg focus:ring-2 focus:ring-sapphire-500 focus:border-sapphire-500"
            placeholder={field.description}
            required={field.is_required}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleCustomFieldChange(field.field_key, e.target.value)}
            className="w-full px-3 py-2 border border-sapphire-200 rounded-lg focus:ring-2 focus:ring-sapphire-500 focus:border-sapphire-500"
            placeholder={field.description}
            required={field.is_required}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleCustomFieldChange(field.field_key, e.target.value)}
            className="w-full px-3 py-2 border border-sapphire-200 rounded-lg focus:ring-2 focus:ring-sapphire-500 focus:border-sapphire-500"
            required={field.is_required}
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleCustomFieldChange(field.field_key, e.target.value)}
            className="w-full px-3 py-2 border border-sapphire-200 rounded-lg focus:ring-2 focus:ring-sapphire-500 focus:border-sapphire-500"
            required={field.is_required}
          >
            <option value="">Selecione...</option>
            {field.field_options && field.field_options.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'boolean':
        return (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value === 'true' || value === true}
              onChange={(e) => handleCustomFieldChange(field.field_key, e.target.checked)}
              className="w-4 h-4 text-sapphire-600 border-sapphire-300 rounded focus:ring-sapphire-500"
            />
            <span className="text-sm text-steel-600">{field.description}</span>
          </label>
        );

      default:
        return (
          <textarea
            value={value}
            onChange={(e) => handleCustomFieldChange(field.field_key, e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-sapphire-200 rounded-lg focus:ring-2 focus:ring-sapphire-500 focus:border-sapphire-500"
            placeholder={field.description}
            required={field.is_required}
          />
        );
    }
  };

  if (!isOpen || !lead) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-steel-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-midnight-950">Editar Lead</h2>
              <p className="text-sm text-steel-600 mt-1">
                {lead.contact_name} - +{lead.phone_number}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-steel-400 hover:text-steel-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-midnight-950">Informações Básicas</h3>

            <div>
              <label className="block text-sm font-medium text-steel-700 mb-1">
                Nome do Contato *
              </label>
              <input
                type="text"
                value={formData.contact_name}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                className="w-full px-3 py-2 border border-sapphire-200 rounded-lg focus:ring-2 focus:ring-sapphire-500 focus:border-sapphire-500"
                placeholder="Nome completo"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-steel-700 mb-1">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-sapphire-200 rounded-lg focus:ring-2 focus:ring-sapphire-500 focus:border-sapphire-500"
                placeholder="Descrição do lead..."
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-midnight-950">Status e Origem</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-steel-700 mb-1">
                  Status do Lead
                </label>
                <select
                  value={formData.lead_status}
                  onChange={(e) => setFormData(prev => ({ ...prev, lead_status: e.target.value }))}
                  className="w-full px-3 py-2 border border-sapphire-200 rounded-lg focus:ring-2 focus:ring-sapphire-500 focus:border-sapphire-500"
                >
                  <option value="NEW">Novo</option>
                  <option value="CONTACTED">Contatado</option>
                  <option value="QUALIFIED">Qualificado</option>
                  <option value="CONVERTED">Convertido</option>
                  <option value="LOST">Perdido</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-steel-700 mb-1">
                  Origem do Lead
                </label>
                <select
                  value={formData.lead_source}
                  onChange={(e) => setFormData(prev => ({ ...prev, lead_source: e.target.value }))}
                  className="w-full px-3 py-2 border border-sapphire-200 rounded-lg focus:ring-2 focus:ring-sapphire-500 focus:border-sapphire-500"
                >
                  <option value="MANUAL">Manual</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="WEBSITE">Website</option>
                  <option value="REFERRAL">Indicação</option>
                  <option value="SOCIAL_MEDIA">Redes Sociais</option>
                  <option value="OTHER">Outro</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-steel-700 mb-1">
                Responsável
              </label>
              <input
                type="text"
                value={formData.assigned_to}
                onChange={(e) => setFormData(prev => ({ ...prev, assigned_to: e.target.value }))}
                className="w-full px-3 py-2 border border-sapphire-200 rounded-lg focus:ring-2 focus:ring-sapphire-500 focus:border-sapphire-500"
                placeholder="Nome do responsável"
              />
            </div>
          </div>

          {tags.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-midnight-950">Etiquetas</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleTagToggle(tag.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      formData.tags.includes(tag.id)
                        ? 'text-white'
                        : 'text-steel-600 border'
                    }`}
                    style={{
                      backgroundColor: formData.tags.includes(tag.id) ? tag.color : 'transparent',
                      borderColor: tag.color
                    }}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {customFields.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-midnight-950">Campos Personalizados</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customFields.map((field) => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-steel-700 mb-1">
                      {field.field_name}
                      {field.is_required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {renderCustomField(field)}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-midnight-950">Notas</h3>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-sapphire-200 rounded-lg focus:ring-2 focus:ring-sapphire-500 focus:border-sapphire-500"
              placeholder="Notas adicionais sobre o lead..."
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-steel-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-steel-600 hover:text-steel-800 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-sapphire hover:bg-midnight-700 text-white rounded-lg transition-colors flex items-center space-x-2"
              disabled={loading}
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              )}
              <span>{loading ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditLeadModal;