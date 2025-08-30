import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useHotelList } from '../hooks/useHotelList';
import IntegrationForm from '../components/IntegrationForm';
import IntegrationList from '../components/IntegrationList';
import BotFieldsList from '../components/BotFieldsList';
import toast from 'react-hot-toast';

const AIConfiguracoes = () => {
  const { fetchIntegrations, integrations, fetchBotFields, botFields, updateAllBotFields, loading, setIntegrations, selectedHotelUuid, selectHotel } = useApp();
  const { hotels, loading: loadingHotels } = useHotelList();
  const [showIntegrationForm, setShowIntegrationForm] = useState(false);

  // Buscar integrações e campos do bot quando hotel for selecionado
  useEffect(() => {
    if (selectedHotelUuid) {
      // Buscar integrações
      fetchIntegrations(selectedHotelUuid).catch(error => {
        console.error('Erro ao buscar integrações:', error);
        setIntegrations([]);
      });

      // Buscar campos do bot
      fetchBotFields(selectedHotelUuid).catch(error => {
        console.error('Erro ao buscar campos do bot:', error);
      });
    }
  }, [selectedHotelUuid]);

  const handleIntegrationAdded = (newIntegration) => {
    // Recarregar integrações do hotel após adicionar nova integração
    if (selectedHotelUuid) {
      fetchIntegrations(selectedHotelUuid);
    }
    setShowIntegrationForm(false);
  };

  const handleBulkUpdateBotFields = async () => {
    if (!selectedHotelUuid) {
      toast.error('Selecione um hotel primeiro');
      return;
    }

    if (!botFields || botFields.length === 0) {
      toast.error('Nenhum campo do bot encontrado para atualizar');
      return;
    }

    try {
      await updateAllBotFields(botFields);
      toast.success(`${botFields.length} campos do bot atualizados com sucesso!`);
    } catch (error) {
      console.error('Erro ao atualizar campos do bot em lote:', error);
      toast.error(`Erro ao atualizar campos: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Configurações de IA
            </h2>
            <p className="text-sidebar-300">
              Configure as integrações e parâmetros da inteligência artificial.
            </p>
          </div>
          <Link
            to="/ia"
            className="flex items-center space-x-2 text-sidebar-300 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Voltar para IA</span>
          </Link>
        </div>
      </div>

      {/* Hotel Selector */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Selecionar Hotel</h3>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <select
              value={selectedHotelUuid}
              onChange={(e) => selectHotel(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={loadingHotels}
            >
              <option value="" className="bg-sidebar-800 text-sidebar-300">
                {loadingHotels ? 'Carregando hotéis...' : 'Selecione um hotel para configurar suas integrações'}
              </option>
              {hotels.map((hotel) => (
                <option key={hotel.value} value={hotel.value} className="bg-sidebar-800">
                  {hotel.label}
                </option>
              ))}
            </select>
          </div>
          {selectedHotelUuid && (
            <div className="flex items-center text-green-300">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm">Hotel selecionado</span>
            </div>
          )}
        </div>
      </div>

      {/* Integration and Bot Fields Management */}
      {selectedHotelUuid && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Integration Management */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-white">Integrações</h3>
                <p className="text-sidebar-300 text-sm mt-1">
                  Configure as integrações com sistemas externos para IA ({integrations.length} integrações)
                </p>
              </div>
              <button
                onClick={() => setShowIntegrationForm(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Nova</span>
              </button>
            </div>

            {/* Integration Form */}
            {showIntegrationForm && (
              <div className="mb-6 p-6 bg-white/5 rounded-lg border border-white/10">
                <IntegrationForm
                  selectedHotelUuid={selectedHotelUuid}
                  onIntegrationAdded={handleIntegrationAdded}
                  onCancel={() => setShowIntegrationForm(false)}
                />
              </div>
            )}

            {/* Integration List */}
            <IntegrationList 
              integrations={integrations}
              onIntegrationUpdate={setIntegrations}
            />
          </div>

          {/* Bot Fields Management */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-white">Campos do Bot</h3>
                <p className="text-sidebar-300 text-sm mt-1">
                  {botFields.length > 5 
                    ? `Exibindo 5 de ${botFields.length} campos configurados no bot de IA`
                    : `Visualize os campos configurados no bot de IA (${botFields.length} campos)`
                  }
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => fetchBotFields(selectedHotelUuid)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 text-sm"
                  disabled={loading}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Atualizar</span>
                </button>
                {botFields && botFields.length > 0 && (
                  <button
                    onClick={handleBulkUpdateBotFields}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 text-sm"
                    disabled={loading}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Salvar Todos</span>
                  </button>
                )}
              </div>
            </div>

            {/* Bot Fields List */}
            <BotFieldsList 
              botFields={botFields}
              loading={loading}
            />
          </div>
        </div>
      )}

      {/* Integration Status Overview */}
      {selectedHotelUuid && (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Status das Integrações</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.length === 0 ? (
              <div className="col-span-full">
                <p className="text-sidebar-400 text-center py-8">
                  Nenhuma integração configurada para este hotel
                </p>
              </div>
            ) : (
              integrations.map((integration) => (
                <div key={integration.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-white text-sm">{integration.integration_name}</h4>
                    <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-300">
                      Ativo
                    </span>
                  </div>
                  <p className="text-sidebar-400 text-xs mb-3">{integration.platform}</p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-sidebar-400">Última sincronização:</span>
                      <span className="text-sidebar-300">Agora</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-sidebar-400">Status:</span>
                      <span className="text-green-300">Conectado</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIConfiguracoes;