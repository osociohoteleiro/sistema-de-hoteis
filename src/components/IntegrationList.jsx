import { useState } from 'react';
import { createPortal } from 'react-dom';

const IntegrationList = ({ integrations, onIntegrationUpdate }) => {
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [visibleFields, setVisibleFields] = useState({
    apikey: false,
    client_secret: false,
    token: false
  });

  const handleDelete = (integrationId) => {
    if (window.confirm('Tem certeza que deseja deletar esta integração?')) {
      onIntegrationUpdate(prev => prev.filter(integration => integration.id !== integrationId));
    }
  };

  const handleViewDetails = (integration) => {
    setSelectedIntegration(integration);
    setShowDetails(true);
    // Resetar visibilidade dos campos quando abrir modal
    setVisibleFields({
      apikey: false,
      client_secret: false,
      token: false
    });
  };

  const toggleFieldVisibility = (fieldName) => {
    setVisibleFields(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  const getStatusColor = (status = 'active') => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-300';
      case 'inactive':
        return 'bg-red-500/20 text-red-300';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  const getStatusText = (status = 'active') => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'inactive':
        return 'Inativo';
      case 'pending':
        return 'Pendente';
      default:
        return 'Desconhecido';
    }
  };

  if (integrations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-sidebar-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h4 className="text-lg font-medium text-white mb-2">Nenhuma integração configurada</h4>
        <p className="text-sidebar-400 text-sm">
          Clique em "Nova Integração" para cadastrar a primeira integração de IA.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {integrations.map((integration) => (
          <div
            key={integration.id}
            className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h4 className="font-medium text-white text-lg">{integration.integration_name}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(integration.status)}`}>
                    {getStatusText(integration.status)}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => handleViewDetails(integration)}
                  className="p-2 text-sidebar-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                  title="Ver detalhes"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(integration.id)}
                  className="p-2 text-sidebar-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Deletar integração"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Details Modal */}
      {showDetails && selectedIntegration && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
          <div className="bg-sidebar-900 border border-white/20 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Detalhes da Integração</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-sidebar-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-sidebar-300 mb-1">Nome da Integração</label>
                  <p className="text-white bg-white/5 px-3 py-2 rounded-lg">{selectedIntegration.integration_name}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-sidebar-300 mb-1">Hotel UUID</label>
                    <p className="text-white bg-white/5 px-3 py-2 rounded-lg font-mono text-sm">{selectedIntegration.hotel_uuid}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-sidebar-300 mb-1">Client ID</label>
                    <p className="text-white bg-white/5 px-3 py-2 rounded-lg font-mono text-sm">{selectedIntegration.client_id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-sidebar-300 mb-1">Nome da Instância</label>
                    <p className="text-white bg-white/5 px-3 py-2 rounded-lg">{selectedIntegration.instancia_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-sidebar-300 mb-1">Status</label>
                    <span className={`inline-block px-3 py-2 rounded-lg text-sm font-medium ${getStatusColor(selectedIntegration.status)}`}>
                      {getStatusText(selectedIntegration.status)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-sidebar-300 mb-1">URL da API</label>
                  <p className="text-white bg-white/5 px-3 py-2 rounded-lg font-mono text-sm break-all">{selectedIntegration.url_api}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-sidebar-300 mb-1">API Key</label>
                    <div className="flex items-center space-x-2">
                      <p className="text-white bg-white/5 px-3 py-2 rounded-lg font-mono text-sm flex-1">
                        {visibleFields.apikey ? selectedIntegration.apikey : '•'.repeat(20)}
                      </p>
                      <button
                        onClick={() => toggleFieldVisibility('apikey')}
                        className="p-2 text-sidebar-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title={visibleFields.apikey ? 'Ocultar API Key' : 'Mostrar API Key'}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {visibleFields.apikey ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          )}
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-sidebar-300 mb-1">Client Secret</label>
                    <div className="flex items-center space-x-2">
                      <p className="text-white bg-white/5 px-3 py-2 rounded-lg font-mono text-sm flex-1">
                        {visibleFields.client_secret ? selectedIntegration.client_secret || 'Não configurado' : '•'.repeat(20)}
                      </p>
                      <button
                        onClick={() => toggleFieldVisibility('client_secret')}
                        className="p-2 text-sidebar-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title={visibleFields.client_secret ? 'Ocultar Client Secret' : 'Mostrar Client Secret'}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {visibleFields.client_secret ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          )}
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-sidebar-300 mb-1">Token</label>
                  <div className="flex items-center space-x-2">
                    <p className="text-white bg-white/5 px-3 py-2 rounded-lg font-mono text-sm flex-1">
                      {visibleFields.token ? selectedIntegration.token || 'Não configurado' : '•'.repeat(30)}
                    </p>
                    <button
                      onClick={() => toggleFieldVisibility('token')}
                      className="p-2 text-sidebar-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      title={visibleFields.token ? 'Ocultar Token' : 'Mostrar Token'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {visibleFields.token ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        )}
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowDetails(false)}
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
    </>
  );
};

export default IntegrationList;