import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:3001/api';

const BotFieldsModal = ({ isVisible, onClose, bot }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingField, setEditingField] = useState(null);
  
  // Estados do formulário
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState('string');
  const [fieldValue, setFieldValue] = useState('');
  const [fieldDescription, setFieldDescription] = useState('');

  // Tipos disponíveis
  const fieldTypes = [
    { value: 'string', label: 'String (Texto)' },
    { value: 'integer', label: 'Integer (Número Inteiro)' },
    { value: 'float', label: 'Float (Número Decimal)' },
    { value: 'boolean', label: 'Boolean (Verdadeiro/Falso)' },
    { value: 'date', label: 'Date (Data)' },
    { value: 'datetime', label: 'DateTime (Data e Hora)' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone (Telefone)' },
    { value: 'url', label: 'URL' },
    { value: 'json', label: 'JSON (Objeto)' }
  ];

  // Resetar estados quando modal abrir
  useEffect(() => {
    if (isVisible) {
      loadBotFields();
      resetForm();
    }
  }, [isVisible]);

  const loadBotFields = async () => {
    console.log('🤖 Bot recebido no modal:', bot);
    console.log('🏨 Hotel UUID:', bot?.hotel_uuid);
    console.log('🏨 Hotel UUID alternativo:', bot?.hotel_id);
    
    const hotelUuid = bot?.hotel_uuid || bot?.hotel_id;
    if (!hotelUuid) {
      console.warn('Bot sem hotel_uuid, não é possível carregar campos. Bot completo:', bot);
      toast.error('Hotel não identificado para este bot');
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Carregando campos do bot para hotel:', hotelUuid);
      
      const response = await axios.get(`${API_BASE_URL}/bot-fields/${hotelUuid}`);
      
      if (response.data.success) {
        const apiFields = response.data.data || [];
        
        // Mapear dados da API para formato do frontend
        const mappedFields = apiFields.map(field => ({
          id: field.id,
          name: field.name || field.key,
          type: (field.type || field.var_type || 'string').toLowerCase(),
          value: field.value || '',
          description: field.description || '',
          source: field.source || 'general'
        }));
        
        setFields(mappedFields);
        console.log(`✅ ${mappedFields.length} campos carregados`);
      } else {
        console.error('❌ Erro na resposta da API:', response.data);
        setFields([]);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar campos do bot:', error);
      toast.error('Erro ao carregar campos do bot');
      setFields([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFieldName('');
    setFieldType('string');
    setFieldValue('');
    setFieldDescription('');
    setEditingField(null);
    setShowAddForm(false);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      resetForm();
      onClose();
    }, 400);
  };

  const handleSaveField = async () => {
    if (!fieldName.trim()) {
      toast.error('Por favor, preencha o nome do campo.');
      return;
    }

    const hotelUuid = bot?.hotel_uuid || bot?.hotel_id;
    if (!hotelUuid) {
      toast.error('Hotel UUID não encontrado');
      return;
    }

    try {
      setLoading(true);

      // Mapear tipos do frontend para API
      const apiTypeMap = {
        'string': 'STRING',
        'integer': 'NUMBER',
        'float': 'NUMBER',
        'boolean': 'BOOLEAN',
        'date': 'DATE',
        'datetime': 'TIME',
        'email': 'STRING',
        'phone': 'STRING',
        'url': 'STRING',
        'json': 'JSON'
      };

      const fieldData = {
        hotel_uuid: hotelUuid,
        var_ns: fieldName.trim(),
        name: fieldName.trim(),
        value: fieldValue,
        var_type: apiTypeMap[fieldType] || 'STRING',
        description: fieldDescription.trim(),
        source: 'onenode'
      };

      if (editingField) {
        // Para edição, usar o endpoint de update
        console.log('✏️ Editando campo:', fieldData);
        const response = await axios.post(`${API_BASE_URL}/bot-fields/update`, fieldData);
        
        if (response.data.success) {
          toast.success('Campo atualizado com sucesso!');
          await loadBotFields(); // Recarregar lista
        } else {
          throw new Error(response.data.message || 'Erro ao atualizar campo');
        }
      } else {
        // Para novo campo, usar o endpoint de update (que faz INSERT se não existir)
        console.log('➕ Criando novo campo:', fieldData);
        const response = await axios.post(`${API_BASE_URL}/bot-fields/update`, fieldData);
        
        if (response.data.success) {
          toast.success('Campo criado com sucesso!');
          await loadBotFields(); // Recarregar lista
        } else {
          throw new Error(response.data.message || 'Erro ao criar campo');
        }
      }

      resetForm();
    } catch (error) {
      console.error('❌ Erro ao salvar campo:', error);
      toast.error(error.response?.data?.message || 'Erro ao salvar campo');
    } finally {
      setLoading(false);
    }
  };

  const handleEditField = (field) => {
    setEditingField(field);
    setFieldName(field.name);
    setFieldType(field.type);
    setFieldValue(field.value);
    setFieldDescription(field.description);
    setShowAddForm(true);
  };

  const handleDeleteField = async (fieldId) => {
    if (!confirm('Deseja realmente excluir este campo?')) {
      return;
    }

    const hotelUuid = bot?.hotel_uuid || bot?.hotel_id;
    if (!hotelUuid) {
      toast.error('Hotel UUID não encontrado');
      return;
    }

    try {
      setLoading(true);
      console.log('🗑️ Deletando campo:', fieldId);
      
      const response = await axios.delete(`${API_BASE_URL}/bot-fields/${hotelUuid}/${fieldId}`);
      
      if (response.data.success) {
        toast.success('Campo deletado com sucesso!');
        await loadBotFields(); // Recarregar lista
      } else {
        throw new Error(response.data.message || 'Erro ao deletar campo');
      }
    } catch (error) {
      console.error('❌ Erro ao deletar campo:', error);
      toast.error(error.response?.data?.message || 'Erro ao deletar campo');
    } finally {
      setLoading(false);
    }
  };

  const renderFieldValue = (field) => {
    switch (field.type) {
      case 'boolean':
        return field.value === 'true' ? '✅ Verdadeiro' : '❌ Falso';
      case 'date':
        return field.value ? new Date(field.value).toLocaleDateString('pt-BR') : '-';
      case 'datetime':
        return field.value ? new Date(field.value).toLocaleString('pt-BR') : field.value;
      default:
        return field.value || '-';
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      string: 'bg-blue-100 text-blue-800 border-blue-200',
      integer: 'bg-green-100 text-green-800 border-green-200',
      float: 'bg-teal-100 text-teal-800 border-teal-200',
      boolean: 'bg-purple-100 text-purple-800 border-purple-200',
      date: 'bg-orange-100 text-orange-800 border-orange-200',
      datetime: 'bg-red-100 text-red-800 border-red-200',
      email: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      phone: 'bg-pink-100 text-pink-800 border-pink-200',
      url: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      json: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (!isVisible && !isClosing) return null;

  return createPortal(
    <>
      <style>{`
        .bot-fields-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 10000;
          opacity: ${isVisible ? 1 : 0};
          transition: opacity 0.3s ease;
        }

        .bot-fields-modal {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 244, 255, 0.9) 100%);
          border-radius: 20px;
          box-shadow: 0 25px 80px rgba(45, 71, 211, 0.3);
          border: 2px solid rgba(84, 122, 241, 0.2);
          backdrop-filter: blur(20px);
          width: 90vw;
          max-width: 900px;
          max-height: 85vh;
          z-index: 10001;
          transform: ${isVisible 
            ? 'translate(-50%, -50%) scale(1)' 
            : 'translate(-50%, -50%) scale(0.9)'
          };
          opacity: ${isVisible ? 1 : 0};
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          display: flex;
          flex-direction: column;
        }

        .modal-header {
          background: linear-gradient(145deg, #547af1 0%, #2d47d3 100%);
          color: white;
          padding: 24px 32px;
          border-radius: 18px 18px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
        }

        .modal-title {
          font-size: 20px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .modal-close {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          transition: all 0.2s ease;
        }

        .modal-close:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: rotate(90deg);
        }

        .modal-content {
          padding: 32px;
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .fields-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }

        .add-field-btn {
          background: linear-gradient(145deg, #22c55e 0%, #16a34a 100%);
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .add-field-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(34, 197, 94, 0.3);
        }

        .fields-grid {
          display: grid;
          gap: 16px;
        }

        .field-card {
          background: rgba(255, 255, 255, 0.7);
          border: 2px solid rgba(84, 122, 241, 0.15);
          border-radius: 12px;
          padding: 20px;
          transition: all 0.2s ease;
        }

        .field-card:hover {
          background: rgba(255, 255, 255, 0.9);
          border-color: rgba(84, 122, 241, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(84, 122, 241, 0.15);
        }

        .field-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
          gap: 16px;
        }

        .field-name {
          font-size: 16px;
          font-weight: 600;
          color: #2d47d3;
          font-family: 'Courier New', monospace;
        }

        .field-type {
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          border: 1px solid;
        }

        .field-actions {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          padding: 6px 10px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .edit-btn {
          background: #3b82f6;
          color: white;
        }

        .edit-btn:hover {
          background: #2563eb;
        }

        .delete-btn {
          background: #ef4444;
          color: white;
        }

        .delete-btn:hover {
          background: #dc2626;
        }

        .field-value {
          font-size: 14px;
          color: #1e293b;
          margin-bottom: 8px;
          padding: 8px 12px;
          background: rgba(84, 122, 241, 0.05);
          border-radius: 6px;
          border: 1px solid rgba(84, 122, 241, 0.1);
        }

        .field-description {
          font-size: 13px;
          color: #64748b;
          font-style: italic;
        }

        .add-form {
          background: rgba(84, 122, 241, 0.05);
          border: 2px solid rgba(84, 122, 241, 0.2);
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .form-title {
          font-size: 18px;
          font-weight: 600;
          color: #2d47d3;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
        }

        @media (max-width: 640px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-label {
          font-size: 14px;
          font-weight: 600;
          color: #2d47d3;
        }

        .form-input,
        .form-select,
        .form-textarea {
          padding: 12px;
          border: 2px solid rgba(84, 122, 241, 0.2);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.8);
          font-size: 14px;
          color: #2d47d3;
          transition: all 0.2s ease;
        }

        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
          outline: none;
          border-color: rgba(84, 122, 241, 0.5);
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 0 0 3px rgba(84, 122, 241, 0.1);
        }

        .form-textarea {
          resize: vertical;
          min-height: 80px;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .form-btn {
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .save-btn {
          background: linear-gradient(145deg, #22c55e 0%, #16a34a 100%);
          color: white;
        }

        .save-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
        }

        .cancel-btn {
          background: #6b7280;
          color: white;
        }

        .cancel-btn:hover {
          background: #4b5563;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #64748b;
        }

        .empty-state-icon {
          font-size: 64px;
          margin-bottom: 16px;
          opacity: 0.5;
        }
      `}</style>

      <div className="bot-fields-overlay" onClick={handleClose} />
      
      <div className="bot-fields-modal">
        <div className="modal-header">
          <div className="modal-title">
            🤖 Campos do Bot - {bot?.name}
          </div>
          <button className="modal-close" onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className="modal-content">
          <div className="fields-header">
            <div>
              <h3 style={{ color: '#2d47d3', marginBottom: '4px' }}>
                Campos Personalizados {loading && '⏳'}
              </h3>
              <p style={{ color: '#64748b', fontSize: '14px' }}>
                Configure campos específicos para este bot
              </p>
            </div>
            <button 
              className="add-field-btn"
              onClick={() => setShowAddForm(true)}
              disabled={loading}
            >
              ➕ Novo Campo
            </button>
          </div>

          {showAddForm && (
            <div className="add-form">
              <div className="form-title">
                {editingField ? '✏️ Editar Campo' : '➕ Adicionar Novo Campo'}
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Nome do Campo *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={fieldName}
                    onChange={(e) => setFieldName(e.target.value)}
                    placeholder="ex: hotel_name, check_in_time"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tipo *</label>
                  <select
                    className="form-select"
                    value={fieldType}
                    onChange={(e) => setFieldType(e.target.value)}
                  >
                    {fieldTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group full-width">
                  <label className="form-label">Valor</label>
                  <input
                    type="text"
                    className="form-input"
                    value={fieldValue}
                    onChange={(e) => setFieldValue(e.target.value)}
                    placeholder="Valor inicial do campo"
                  />
                </div>

                <div className="form-group full-width">
                  <label className="form-label">Descrição</label>
                  <textarea
                    className="form-textarea"
                    value={fieldDescription}
                    onChange={(e) => setFieldDescription(e.target.value)}
                    placeholder="Descreva para que serve este campo..."
                  />
                </div>
              </div>

              <div className="form-actions">
                <button 
                  className="form-btn cancel-btn"
                  onClick={resetForm}
                >
                  Cancelar
                </button>
                <button 
                  className="form-btn save-btn"
                  onClick={handleSaveField}
                  disabled={loading}
                >
                  {loading ? '⏳ Salvando...' : (editingField ? 'Salvar Alterações' : 'Adicionar Campo')}
                </button>
              </div>
            </div>
          )}

          <div className="fields-grid">
            {fields.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📦</div>
                <h3>Nenhum campo configurado</h3>
                <p>Clique em "Novo Campo" para começar</p>
              </div>
            ) : (
              fields.map(field => (
                <div key={field.id} className="field-card">
                  <div className="field-header">
                    <div>
                      <div className="field-name">{field.name}</div>
                      <span className={`field-type ${getTypeColor(field.type)}`}>
                        {fieldTypes.find(t => t.value === field.type)?.label}
                      </span>
                    </div>
                    <div className="field-actions">
                      <button 
                        className="action-btn edit-btn"
                        onClick={() => handleEditField(field)}
                      >
                        ✏️ Editar
                      </button>
                      <button 
                        className="action-btn delete-btn"
                        onClick={() => handleDeleteField(field.id)}
                      >
                        🗑️ Excluir
                      </button>
                    </div>
                  </div>
                  
                  <div className="field-value">
                    {renderFieldValue(field)}
                  </div>
                  
                  {field.description && (
                    <div className="field-description">
                      {field.description}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default BotFieldsModal;