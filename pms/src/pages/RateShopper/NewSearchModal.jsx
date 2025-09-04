import React, { useState, useEffect } from 'react';
import { X, Calendar, Building, Search, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';

const NewSearchModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    selectedCompetitors: [], // Array de IDs dos concorrentes selecionados
    start_date: '',
    end_date: '',
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
      start_date: '',
      end_date: '',
      max_bundle_size: 7
    });
    setErrors({});
    setNotification(null);
  };

  // Carregar lista de concorrentes pré-cadastrados
  const loadCompetitors = async () => {
    try {
      setLoadingProperties(true);
      const hotelId = 2; // Usar hotel_id dinâmico futuramente
      
      const response = await axios.get(`/api/rate-shopper/${hotelId}/properties`);
      
      if (response.data.success) {
        setCompetitors(response.data.data);
      }
    } catch (error) {
      console.error('Error loading competitors:', error);
      setNotification({
        type: 'error',
        message: 'Erro ao carregar concorrentes'
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
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (startDate < today) {
        newErrors.start_date = 'Data de início não pode ser no passado';
      }

      if (endDate <= startDate) {
        newErrors.end_date = 'Data de fim deve ser após a data de início';
      }

      // Validar limite de 12 meses
      const maxDate = new Date(startDate);
      maxDate.setMonth(maxDate.getMonth() + 12);
      
      if (endDate > maxDate) {
        newErrors.end_date = 'Período não pode exceder 12 meses';
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

    setLoading(true);
    try {
      // Criar uma busca para cada concorrente selecionado
      const hotelId = 2; // Usar hotel_id dinâmico futuramente
      const searchPromises = [];

      for (const competitorId of formData.selectedCompetitors) {
        const searchData = {
          property_id: competitorId,
          start_date: formData.start_date,
          end_date: formData.end_date,
          max_bundle_size: formData.max_bundle_size
        };

        searchPromises.push(
          axios.post(`/api/rate-shopper/${hotelId}/searches`, searchData)
        );
      }

      await Promise.all(searchPromises);

      setNotification({
        type: 'success',
        message: `${formData.selectedCompetitors.length} busca(s) criada(s) com sucesso!`
      });

      // Aguardar um momento para mostrar o sucesso, depois fechar
      setTimeout(() => {
        onSubmit?.();
        onClose();
      }, 1500);

    } catch (error) {
      console.error('Error creating searches:', error);
      setNotification({
        type: 'error',
        message: 'Erro ao criar buscas: ' + (error.response?.data?.error || error.message)
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateDateRange = () => {
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const diffTime = Math.abs(end - start);
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

              {/* Datas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Início
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  {errors.start_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Fim
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                      min={formData.start_date || new Date().toISOString().split('T')[0]}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  {errors.end_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>
                  )}
                </div>
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