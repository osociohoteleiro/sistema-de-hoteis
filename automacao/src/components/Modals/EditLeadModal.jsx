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
  const [syncingWhatsApp, setSyncingWhatsApp] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState(null);

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

    // Definir informação de última sincronização
    setLastSyncAt(lead.last_sync_at || null);
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

  const handleSyncWhatsApp = async () => {
    setSyncingWhatsApp(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/leads/${workspaceUuid}/${lead.id}/sync-whatsapp`);

      if (response.data.success) {
        const { lead: updatedLead, changes } = response.data.data;

        // Atualizar formulário com novos dados se houve mudanças
        if (changes.nameUpdated && updatedLead.contact_name) {
          setFormData(prev => ({
            ...prev,
            contact_name: updatedLead.contact_name
          }));
        }

        // Atualizar timestamp de sincronização
        setLastSyncAt(updatedLead.last_sync_at);

        // Notificar sobre mudanças
        if (changes.nameUpdated || changes.pictureUpdated) {
          toast.success(
            `Dados atualizados: ${changes.nameUpdated ? 'Nome' : ''}${changes.nameUpdated && changes.pictureUpdated ? ' e ' : ''}${changes.pictureUpdated ? 'Foto de perfil' : ''}`
          );
        } else {
          toast.success('Dados verificados - já estão atualizados');
        }

        // Notificar componente pai sobre a atualização
        if (onLeadUpdated) {
          onLeadUpdated(updatedLead);
        }
      }
    } catch (error) {
      console.error('Erro ao sincronizar com WhatsApp:', error);
      const errorMessage = error.response?.data?.error || 'Erro ao sincronizar dados';

      if (error.response?.data?.rateLimited) {
        toast.error('Aguarde alguns minutos antes de tentar novamente (proteção anti-banimento)');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setSyncingWhatsApp(false);
    }
  };

  const formatLastSync = (timestamp) => {
    if (!timestamp) return 'Nunca sincronizado';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Há menos de 1 minuto';
    if (diffMins < 60) return `Há ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    return `Há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
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

          {/* 🚀 NOVA SEÇÃO: Sincronização com WhatsApp */}
          <div className="pt-6 border-t border-steel-200">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-blue-900 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    Sincronizar dados do WhatsApp
                  </h4>
                  <p className="text-xs text-blue-700">
                    {formatLastSync(lastSyncAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSyncWhatsApp}
                  disabled={syncingWhatsApp || loading}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  {syncingWhatsApp && (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  )}
                  <span>{syncingWhatsApp ? 'Sincronizando...' : 'Atualizar dados'}</span>
                </button>
              </div>
              <p className="text-xs text-blue-600">
                Busca nome e foto de perfil atualizados do WhatsApp (respeita limite de requisições para evitar banimento)
              </p>
            </div>
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