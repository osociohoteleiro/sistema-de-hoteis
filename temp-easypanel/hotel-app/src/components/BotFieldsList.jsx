import { useState } from 'react';
import { createPortal } from 'react-dom';
import BotFieldsUpdateForm from './BotFieldsUpdateForm';

const BotFieldsList = ({ botFields, loading }) => {
  const [selectedField, setSelectedField] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);

  const handleViewDetails = (field) => {
    setSelectedField(field);
    setShowDetails(true);
  };

  const closeModal = () => {
    setShowDetails(false);
    setSelectedField(null);
  };

  const handleEditField = (field) => {
    setEditingField(field);
    setShowEditForm(true);
  };

  const handleEditFormClose = () => {
    setShowEditForm(false);
    setEditingField(null);
  };

  const handleFieldUpdated = () => {
    setShowEditForm(false);
    setEditingField(null);
    // The updateBotFields function in AppContext will automatically refresh the fields
  };

  const handleShowMore = () => {
    setVisibleCount(prev => Math.min(prev + 5, botFields.length));
  };

  const handleShowLess = () => {
    setVisibleCount(5);
  };

  const visibleFields = botFields.slice(0, visibleCount);
  const hasMore = visibleCount < botFields.length;

  const getFieldTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'text':
      case 'string':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'number':
      case 'integer':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
          </svg>
        );
      case 'boolean':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'date':
      case 'datetime':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
    }
  };

  const formatFieldValue = (value) => {
    if (value === null || value === undefined) return 'Não definido';
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
    if (typeof value === 'string' && value.length > 50) {
      return value.substring(0, 50) + '...';
    }
    return String(value);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-sidebar-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <p className="text-sidebar-300">Carregando campos do bot...</p>
      </div>
    );
  }

  if (!botFields || botFields.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-sidebar-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h4 className="text-lg font-medium text-white mb-2">Nenhum campo encontrado</h4>
        <p className="text-sidebar-400 text-sm">
          Não há campos do bot configurados para este hotel.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Fields List with Scroll */}
      <div className="space-y-3">
        {/* Show total count */}
        {botFields.length > 5 && (
          <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-blue-300 text-sm font-medium">
                Total de {botFields.length} campos encontrados
              </span>
            </div>
            <span className="text-blue-200 text-xs">
              Mostrando {visibleCount} de {botFields.length}
            </span>
          </div>
        )}

        {/* Fields container */}
        <div className="space-y-3">
          {visibleFields.map((field, index) => (
            <div
              key={field.id || `field-${index}`}
              className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="text-blue-400">
                      {getFieldTypeIcon(field.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-white">{field.name || field.field_name || 'Campo sem nome'}</h4>
                        {field.type && (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs font-medium">
                            {field.type}
                          </span>
                        )}
                      </div>
                      {field.description && (
                        <p className="text-sidebar-400 text-sm mt-1 line-clamp-2">{field.description}</p>
                      )}
                      {field.value !== undefined && (
                        <p className="text-sidebar-300 text-sm mt-1">
                          <span className="text-sidebar-500">Valor:</span> {formatFieldValue(field.value)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleEditField(field)}
                    className="p-2 text-sidebar-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-colors"
                    title="Editar campo"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleViewDetails(field)}
                    className="p-2 text-sidebar-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                    title="Ver detalhes"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {/* Show More / Show Less buttons */}
          {botFields.length > 5 && (
            <div className="flex items-center justify-center space-x-4 py-4">
              {hasMore && (
                <button
                  onClick={handleShowMore}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <span>Ver mais ({botFields.length - visibleCount} restantes)</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
              
              {visibleCount > 5 && (
                <button
                  onClick={handleShowLess}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <span>Mostrar menos</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetails && selectedField && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
          <div className="bg-sidebar-900 border border-white/20 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Detalhes do Campo</h3>
                <button
                  onClick={closeModal}
                  className="text-sidebar-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-sidebar-300 mb-1">Nome do Campo</label>
                  <p className="text-white bg-white/5 px-3 py-2 rounded-lg">
                    {selectedField.name || selectedField.field_name || 'N/A'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-sidebar-300 mb-1">Tipo</label>
                    <div className="flex items-center space-x-2">
                      <div className="text-blue-400">
                        {getFieldTypeIcon(selectedField.type)}
                      </div>
                      <p className="text-white bg-white/5 px-3 py-2 rounded-lg flex-1">
                        {selectedField.type || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-sidebar-300 mb-1">ID</label>
                    <p className="text-white bg-white/5 px-3 py-2 rounded-lg font-mono text-sm">
                      {selectedField.id || 'N/A'}
                    </p>
                  </div>
                </div>

                {selectedField.description && (
                  <div>
                    <label className="block text-sm font-medium text-sidebar-300 mb-1">Descrição</label>
                    <p className="text-white bg-white/5 px-3 py-2 rounded-lg">
                      {selectedField.description}
                    </p>
                  </div>
                )}

                {selectedField.value !== undefined && (
                  <div>
                    <label className="block text-sm font-medium text-sidebar-300 mb-1">Valor Atual</label>
                    <p className="text-white bg-white/5 px-3 py-2 rounded-lg">
                      {formatFieldValue(selectedField.value)}
                    </p>
                  </div>
                )}

                {selectedField.default_value !== undefined && (
                  <div>
                    <label className="block text-sm font-medium text-sidebar-300 mb-1">Valor Padrão</label>
                    <p className="text-white bg-white/5 px-3 py-2 rounded-lg">
                      {formatFieldValue(selectedField.default_value)}
                    </p>
                  </div>
                )}

                {selectedField.required !== undefined && (
                  <div>
                    <label className="block text-sm font-medium text-sidebar-300 mb-1">Obrigatório</label>
                    <p className={`inline-block px-3 py-2 rounded-lg text-sm font-medium ${
                      selectedField.required 
                        ? 'bg-red-500/20 text-red-300' 
                        : 'bg-green-500/20 text-green-300'
                    }`}>
                      {selectedField.required ? 'Sim' : 'Não'}
                    </p>
                  </div>
                )}

                {/* Display all other properties */}
                {Object.keys(selectedField).map((key) => {
                  if (['name', 'field_name', 'type', 'id', 'description', 'value', 'default_value', 'required'].includes(key)) {
                    return null;
                  }
                  
                  const value = selectedField[key];
                  if (value === null || value === undefined || value === '') return null;

                  return (
                    <div key={key}>
                      <label className="block text-sm font-medium text-sidebar-300 mb-1 capitalize">
                        {key.replace(/_/g, ' ')}
                      </label>
                      <p className="text-white bg-white/5 px-3 py-2 rounded-lg break-all">
                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={closeModal}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Form Modal */}
      {showEditForm && editingField && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
          <div className="bg-sidebar-900 border border-white/20 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Editar Campo do Bot</h3>
                <button
                  onClick={handleEditFormClose}
                  className="text-sidebar-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <BotFieldsUpdateForm
                field={editingField}
                onUpdated={handleFieldUpdated}
                onCancel={handleEditFormClose}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default BotFieldsList;