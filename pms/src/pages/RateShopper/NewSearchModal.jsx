import React, { useState, useEffect } from 'react';
import { X, Calendar, Building, Search, AlertCircle, CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import apiService from '../../services/api';

const NewSearchModal = ({ isOpen, onClose, onSubmit }) => {
  const { selectedHotelUuid } = useApp();
  const [formData, setFormData] = useState({
    selectedCompetitors: [], // Array de IDs dos concorrentes selecionados
    start_date: null,
    end_date: null,
    max_bundle_size: 7
  });

  const [loading, setLoading] = useState(false);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [competitors, setCompetitors] = useState([]);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (isOpen) {
      resetForm();
      loadCompetitors();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData({
      selectedCompetitors: [],
      start_date: null,
      end_date: null,
      max_bundle_size: 7
    });
    setErrors({});
    setNotification(null);
  };

  // Carregar lista de concorrentes pré-cadastrados
  const loadCompetitors = async () => {
    if (!selectedHotelUuid) {
      setNotification({
        type: 'error',
        message: 'Nenhum hotel selecionado'
      });
      setLoadingProperties(false);
      return;
    }

    try {
      setLoadingProperties(true);
      const response = await apiService.getRateShopperProperties(selectedHotelUuid, { active: true });
      
      if (response.success && response.data.length > 0) {
        setCompetitors(response.data);
      } else {
        setCompetitors([]);
        setNotification({
          type: 'error',
          message: 'Nenhuma propriedade concorrente cadastrada. Configure primeiro em Gerenciar Propriedades.'
        });
      }
    } catch (error) {
      console.error('Error loading competitors:', error);
      setCompetitors([]);
      setNotification({
        type: 'error',
        message: 'Erro ao carregar concorrentes: ' + (error.message || 'Erro desconhecido')
      });
    } finally {
      setLoadingProperties(false);
    }
  };

  // Toggle seleção de concorrente
  const toggleCompetitor = (competitorId) => {
    setFormData(prev => ({
      ...prev,
      selectedCompetitors: prev.selectedCompetitors.includes(competitorId)
        ? prev.selectedCompetitors.filter(id => id !== competitorId)
        : [...prev.selectedCompetitors, competitorId]
    }));
  };

  // Selecionar/Desselecionar todos
  const toggleAll = () => {
    setFormData(prev => ({
      ...prev,
      selectedCompetitors: prev.selectedCompetitors.length === competitors.length
        ? []
        : competitors.map(c => c.id)
    }));
  };

  // Validações
  const validateForm = () => {
    const newErrors = {};

    if (formData.selectedCompetitors.length === 0) {
      newErrors.competitors = 'Selecione pelo menos um concorrente';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Data de início é obrigatória';
    }

    if (!formData.end_date) {
      newErrors.end_date = 'Data de fim é obrigatória';
    }

    if (formData.start_date && formData.end_date) {
      const startDate = formData.start_date;
      const endDate = formData.end_date;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (startDate < today) {
        newErrors.dateRange = 'Data de início não pode ser no passado';
      }

      if (endDate <= startDate) {
        newErrors.dateRange = 'Data de fim deve ser após a data de início';
      }

      // Validar limite de 12 meses
      const maxDate = new Date(startDate);
      maxDate.setMonth(maxDate.getMonth() + 12);
      
      if (endDate > maxDate) {
        newErrors.dateRange = 'Período não pode exceder 12 meses';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!selectedHotelUuid) {
      setNotification({
        type: 'error',
        message: 'Nenhum hotel selecionado'
      });
      return;
    }

    setLoading(true);
    try {
      
      // Criar buscas reais na API
      const searchPromises = [];

      for (const competitorId of formData.selectedCompetitors) {
        const searchData = {
          property_id: competitorId,
          start_date: formData.start_date?.toISOString().split('T')[0],
          end_date: formData.end_date?.toISOString().split('T')[0],
          max_bundle_size: formData.max_bundle_size
        };

        
        searchPromises.push(
          apiService.request(`/rate-shopper/${selectedHotelUuid}/searches`, {
            method: 'POST',
            body: JSON.stringify(searchData)
          })
        );
      }

      const results = await Promise.all(searchPromises);

      setNotification({
        type: 'success',
        message: `${formData.selectedCompetitors.length} busca(s) criada(s) com sucesso!`
      });

      // Recarregar dados imediatamente
      onSubmit?.();

      // Aguardar um momento para mostrar o sucesso, depois fechar
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (error) {
      console.error('Error creating searches:', error);
      setNotification({
        type: 'error',
        message: 'Erro ao criar buscas: ' + (error.response?.data?.error || error.response?.data?.message || error.message)
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateDateRange = () => {
    if (formData.start_date && formData.end_date) {
      const diffTime = Math.abs(formData.end_date - formData.start_date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 0;
  };

  const estimatedExtractions = formData.selectedCompetitors.length * calculateDateRange();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Search className="h-6 w-6 text-blue-600 mr-3" />
                <h3 className="text-lg font-medium text-gray-900">
                  Nova Busca de Preços
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Notification */}
            {notification && (
              <div className={`mb-4 p-4 rounded-lg border-l-4 ${
                notification.type === 'success' 
                  ? 'bg-green-50 border-green-500 text-green-800' 
                  : 'bg-red-50 border-red-500 text-red-800'
              }`}>
                <div className="flex items-center">
                  {notification.type === 'success' ? (
                    <CheckCircle className="h-5 w-5 mr-2" />
                  ) : (
                    <AlertCircle className="h-5 w-5 mr-2" />
                  )}
                  {notification.message}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Seleção de Concorrentes */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    Selecionar Concorrentes ({formData.selectedCompetitors.length}/{competitors.length})
                  </label>
                  <button
                    type="button"
                    onClick={toggleAll}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {formData.selectedCompetitors.length === competitors.length ? 'Desselecionar todos' : 'Selecionar todos'}
                  </button>
                </div>

                {loadingProperties ? (
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <p className="text-sm text-gray-500 mt-2">Carregando concorrentes...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto border rounded-lg p-3">
                    {competitors.map(competitor => (
                      <label
                        key={competitor.id}
                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                          formData.selectedCompetitors.includes(competitor.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.selectedCompetitors.includes(competitor.id)}
                          onChange={() => toggleCompetitor(competitor.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center">
                            <Building className="h-4 w-4 text-gray-400 mr-2" />
                            <div className="text-sm font-medium text-gray-900">
                              {competitor.property_name}
                            </div>
                            {/* Badge da plataforma */}
                            <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              competitor.platform === 'artaxnet' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {competitor.platform === 'artaxnet' ? '🏛️ Artaxnet' : '🏨 Booking'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {competitor.category} • {competitor.location}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {errors.competitors && (
                  <p className="mt-2 text-sm text-red-600">{errors.competitors}</p>
                )}
              </div>

              {/* Período de Datas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Período de Monitoramento
                </label>
                <div className="grid grid-cols-2 gap-3 p-4 border border-gray-300 rounded-lg bg-gray-50">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Data de Início
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        type="date"
                        value={formData.start_date ? formData.start_date.toISOString().split('T')[0] : ''}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : null;
                          setFormData(prev => ({...prev, start_date: date}));
                          // Limpar erros
                          if (errors.start_date || errors.dateRange) {
                            setErrors(prev => ({
                              ...prev,
                              start_date: undefined,
                              dateRange: undefined
                            }));
                          }
                        }}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Data de Fim
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        type="date"
                        value={formData.end_date ? formData.end_date.toISOString().split('T')[0] : ''}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : null;
                          setFormData(prev => ({...prev, end_date: date}));
                          // Limpar erros
                          if (errors.end_date || errors.dateRange) {
                            setErrors(prev => ({
                              ...prev,
                              end_date: undefined,
                              dateRange: undefined
                            }));
                          }
                        }}
                        min={formData.start_date ? formData.start_date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                        className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      />
                    </div>
                  </div>
                </div>
                
                {(errors.start_date || errors.end_date || errors.dateRange) && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.start_date || errors.end_date || errors.dateRange}
                  </p>
                )}
                
                {/* Indicador visual do período */}
                {formData.start_date && formData.end_date && (
                  <div className="mt-2 text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-md border border-blue-200">
                    📅 Período: <span className="font-medium">
                      {formData.start_date.toLocaleDateString('pt-BR')} → {formData.end_date.toLocaleDateString('pt-BR')}
                    </span>
                    <span className="ml-2 text-blue-600">({calculateDateRange()} dias)</span>
                  </div>
                )}
              </div>

              {/* Resumo */}
              {formData.selectedCompetitors.length > 0 && calculateDateRange() > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Resumo da Busca:</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">Concorrentes:</span>
                      <div className="font-medium text-blue-900">{formData.selectedCompetitors.length}</div>
                    </div>
                    <div>
                      <span className="text-blue-700">Período:</span>
                      <div className="font-medium text-blue-900">{calculateDateRange()} dias</div>
                    </div>
                    <div>
                      <span className="text-blue-700">Total de extrações:</span>
                      <div className="font-medium text-blue-900">{estimatedExtractions}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Botões */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || formData.selectedCompetitors.length === 0}
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Criando...
                    </div>
                  ) : (
                    'Criar Buscas'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewSearchModal;