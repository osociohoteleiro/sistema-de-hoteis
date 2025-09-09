import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Calendar, MapPin, DollarSign, Clock, Package } from 'lucide-react';

const SearchDetailsModal = ({ isOpen, onClose, search }) => {
  const [searchDetails, setSearchDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && search) {
      loadSearchDetails();
    }
  }, [isOpen, search]);

  const loadSearchDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/api/rate-shopper/searches/${search.id}`);
      
      if (response.data.success) {
        setSearchDetails(response.data.data);
      } else {
        setError('Não foi possível carregar os detalhes da busca');
      }
    } catch (error) {
      console.error('Error loading search details:', error);
      setError('Erro ao carregar detalhes da busca');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED': return '✅';
      case 'RUNNING': return '🔄';
      case 'PENDING': return '⏳';
      case 'FAILED': return '❌';
      default: return '❓';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Detalhes da Busca #{search?.id}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-600">
                  {search?.property_name}
                </span>
                <span className="text-2xl">
                  {getStatusIcon(search?.status)}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          
          {loading && (
            <div className="p-6 text-center">
              <div className="animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent text-blue-600 rounded-full"></div>
              <p className="mt-2 text-gray-600">Carregando detalhes...</p>
            </div>
          )}

          {error && (
            <div className="p-6 text-center">
              <p className="text-red-600">{error}</p>
              <button
                onClick={loadSearchDetails}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Tentar Novamente
              </button>
            </div>
          )}

          {searchDetails && (
            <div className="p-6 space-y-6">
              
              {/* Search Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-600">Período</span>
                  </div>
                  <p className="text-sm">
                    {formatDate(searchDetails.start_date)} → {formatDate(searchDetails.end_date)}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-600">Progresso</span>
                  </div>
                  <p className="text-sm">
                    {searchDetails.processed_dates || 0}/{searchDetails.total_dates || 0} datas
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-600">Preços Encontrados</span>
                  </div>
                  <p className="text-sm font-semibold text-green-600">
                    {searchDetails.total_prices_found || 0} preços
                  </p>
                </div>
              </div>

              {/* Prices */}
              {searchDetails.prices && searchDetails.prices.length > 0 ? (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    💰 Preços Extraídos ({searchDetails.prices.length})
                  </h3>
                  
                  <div className="grid gap-3">
                    {searchDetails.prices.map((price, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          
                          <div className="flex items-center gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium">
                                  {formatDate(price.check_in_date)} → {formatDate(price.check_out_date)}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2 mt-1">
                                <MapPin className="h-4 w-4 text-gray-500" />
                                <span className="text-sm text-gray-600">
                                  {price.room_type || 'Standard'}
                                </span>
                              </div>
                            </div>

                            {price.is_bundle && (
                              <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                <Package className="h-3 w-3" />
                                {price.bundle_size} dias
                              </div>
                            )}
                          </div>

                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">
                              {formatPrice(price.price)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(price.scraped_at).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchDetails.status === 'COMPLETED' 
                      ? 'Nenhum preço foi encontrado nesta busca' 
                      : 'A extração ainda não foi concluída'}
                  </p>
                </div>
              )}

              {/* Statistics */}
              {searchDetails.statistics && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">📊 Estatísticas</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Preço Médio:</span>
                      <p className="font-medium">
                        {searchDetails.statistics.avg_price 
                          ? formatPrice(searchDetails.statistics.avg_price)
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Preço Min:</span>
                      <p className="font-medium">
                        {searchDetails.statistics.min_price 
                          ? formatPrice(searchDetails.statistics.min_price)
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Preço Max:</span>
                      <p className="font-medium">
                        {searchDetails.statistics.max_price 
                          ? formatPrice(searchDetails.statistics.max_price)
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Preços:</span>
                      <p className="font-medium">{searchDetails.statistics.total_prices || 0}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchDetailsModal;