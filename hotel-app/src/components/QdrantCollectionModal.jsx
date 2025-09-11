import { useState, useEffect } from 'react';
import { API_CONFIG } from '../config/api.js';
import toast from 'react-hot-toast';

const QdrantCollectionModal = ({ isOpen, onClose, selectedHotelUuid, onCollectionRelated }) => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState('');

  // Buscar collections disponíveis quando modal abrir
  useEffect(() => {
    if (isOpen) {
      fetchAvailableCollections();
    }
  }, [isOpen]);

  const fetchAvailableCollections = async () => {
    if (!isOpen) return;
    
    setLoading(true);
    try {
      console.log('🔍 Buscando collections disponíveis...');
      
      const response = await fetch('${API_CONFIG.baseURLWithPath}/qdrant/collections/available');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Collections recebidas:', data);
      
      if (data.success) {
        setCollections(data.collections || []);
      } else {
        throw new Error(data.message || 'Erro ao buscar collections');
      }
    } catch (error) {
      console.error('❌ Erro ao buscar collections:', error);
      toast.error(`Erro ao carregar collections: ${error.message}`);
      setCollections([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRelateCollection = async () => {
    if (!selectedCollection) {
      toast.error('Selecione uma collection para relacionar');
      return;
    }

    if (!selectedHotelUuid) {
      toast.error('Nenhum hotel selecionado');
      return;
    }

    setSubmitting(true);
    try {
      console.log('🔗 Relacionando collection:', { selectedCollection, selectedHotelUuid });
      
      const response = await fetch('${API_CONFIG.baseURLWithPath}/qdrant/collections/relate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collection_name: selectedCollection,
          hotel_uuid: selectedHotelUuid
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Collection relacionada:', result);

      if (result.success) {
        toast.success(result.message || 'Collection relacionada com sucesso!');
        
        // Fechar modal e notificar o componente pai
        onClose();
        if (onCollectionRelated) {
          onCollectionRelated(result);
        }
      } else {
        throw new Error(result.message || 'Erro ao relacionar collection');
      }
    } catch (error) {
      console.error('❌ Erro ao relacionar collection:', error);
      toast.error(`Erro ao relacionar collection: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnrelateCollection = async (collectionName) => {
    if (!selectedHotelUuid) {
      toast.error('Nenhum hotel selecionado');
      return;
    }

    if (!confirm(`Tem certeza que deseja desrelacionar a collection "${collectionName}" do hotel?`)) {
      return;
    }

    setSubmitting(true);
    try {
      console.log('🔓 Desrelacionando collection:', { collectionName, selectedHotelUuid });
      
      const response = await fetch('${API_CONFIG.baseURLWithPath}/qdrant/collections/unrelate', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collection_name: collectionName,
          hotel_uuid: selectedHotelUuid
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Collection desrelacionada:', result);

      if (result.success) {
        toast.success(result.message || 'Collection desrelacionada com sucesso!');
        
        // Recarregar collections para atualizar a lista
        await fetchAvailableCollections();
        
        // Notificar o componente pai
        if (onCollectionRelated) {
          onCollectionRelated(result);
        }
      } else {
        throw new Error(result.message || 'Erro ao desrelacionar collection');
      }
    } catch (error) {
      console.error('❌ Erro ao desrelacionar collection:', error);
      toast.error(`Erro ao desrelacionar collection: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedCollection('');
    setCollections([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-sidebar-800 rounded-xl border border-white/20 p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-white">Relacionar Collection ao Hotel</h3>
            <p className="text-sidebar-300 text-sm mt-1">
              Selecione uma collection do Qdrant para relacionar ao hotel atual
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-sidebar-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              <span className="ml-3 text-sidebar-300">Carregando collections...</span>
            </div>
          ) : collections.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-sidebar-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-sidebar-400">Nenhuma collection disponível no Qdrant</p>
              <p className="text-sidebar-500 text-sm mt-1">
                Verifique se há collections configuradas no seu servidor Qdrant
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Selecione uma Collection
                </label>
                <select
                  value={selectedCollection}
                  onChange={(e) => setSelectedCollection(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={submitting}
                >
                  <option value="" className="bg-sidebar-800 text-sidebar-300">
                    Selecione uma collection...
                  </option>
                  {collections.map((collection) => (
                    <option 
                      key={collection.name} 
                      value={collection.name} 
                      className="bg-sidebar-800"
                      disabled={collection.is_related}
                    >
                      {collection.name} 
                      {collection.is_related ? ' (já relacionada)' : ` (${collection.vectors_count} vetores)`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Collections List */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  Collections Disponíveis ({collections.length})
                </label>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {collections.map((collection) => (
                    <div
                      key={collection.name}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedCollection === collection.name
                          ? 'bg-primary-500/20 border-primary-500/50'
                          : collection.is_related
                          ? 'bg-white/5 border-white/10 opacity-50 cursor-not-allowed'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                      }`}
                      onClick={() => !collection.is_related && !submitting && setSelectedCollection(collection.name)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-white text-sm">
                            {collection.name}
                          </h4>
                          <p className="text-sidebar-400 text-xs mt-1">
                            {collection.description}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <div className="text-sidebar-300 text-xs">
                              {collection.vectors_count.toLocaleString()} vetores
                            </div>
                            <div className={`text-xs mt-1 px-2 py-1 rounded-full ${
                              collection.is_related 
                                ? 'bg-yellow-500/20 text-yellow-300'
                                : 'bg-green-500/20 text-green-300'
                            }`}>
                              {collection.is_related ? 'Relacionada' : 'Disponível'}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {collection.is_related && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUnrelateCollection(collection.name);
                                }}
                                disabled={submitting}
                                className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded transition-colors flex items-center space-x-1"
                                title="Desrelacionar collection"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <span>Desrelacionar</span>
                              </button>
                            )}
                            {selectedCollection === collection.name && (
                              <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && collections.length > 0 && (
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-white/10">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sidebar-300 hover:text-white transition-colors"
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              onClick={handleRelateCollection}
              disabled={!selectedCollection || submitting}
              className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Relacionando...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span>Relacionar Collection</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QdrantCollectionModal;