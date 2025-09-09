import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, RotateCcw, AlertCircle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import axios from 'axios';

const ExtractionControl = ({ hotelId, properties, onExtractionUpdate }) => {
  const [extractionStatus, setExtractionStatus] = useState(null);
  const [selectedProperties, setSelectedProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  // Poll status durante extração
  useEffect(() => {
    let interval = null;
    
    if (extractionStatus?.status === 'RUNNING') {
      interval = setInterval(async () => {
        await checkExtractionStatus();
      }, 2000); // A cada 2 segundos
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [extractionStatus?.status, hotelId]);

  // Verificar status da extração
  const checkExtractionStatus = async () => {
    try {
      const response = await axios.get(`/api/rate-shopper-extraction/${hotelId}/extraction-status`);
      if (response.data.success) {
        setExtractionStatus(response.data.data);
        if (response.data.data.recentLogs) {
          setLogs(response.data.data.recentLogs);
        }
        if (onExtractionUpdate) {
          onExtractionUpdate(response.data.data);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    }
  };

  // Iniciar extração
  const startExtraction = async () => {
    if (selectedProperties.length === 0) {
      alert('Selecione pelo menos um concorrente para extrair preços');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`/api/rate-shopper-extraction/${hotelId}/start-extraction`, {
        properties: selectedProperties
      });

      if (response.data.success) {
        setExtractionStatus({ status: 'RUNNING', startTime: new Date() });
        // Começar polling
        setTimeout(checkExtractionStatus, 1000);
      }
    } catch (error) {
      console.error('Erro ao iniciar extração:', error);
      alert('Erro ao iniciar extração: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  // Parar extração
  const stopExtraction = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(`/api/rate-shopper-extraction/${hotelId}/stop-extraction`);
      if (response.data.success) {
        setExtractionStatus({ status: 'CANCELLED' });
      }
    } catch (error) {
      console.error('Erro ao parar extração:', error);
      alert('Erro ao parar extração: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle seleção de propriedade
  const toggleProperty = (propertyId) => {
    setSelectedProperties(prev => 
      prev.includes(propertyId) 
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  // Selecionar todos
  const selectAll = () => {
    setSelectedProperties(properties.map(p => p.id));
  };

  // Limpar seleção
  const clearSelection = () => {
    setSelectedProperties([]);
  };

  // Verificar status inicial
  useEffect(() => {
    checkExtractionStatus();
  }, [hotelId]);

  const getStatusIcon = () => {
    switch (extractionStatus?.status) {
      case 'RUNNING':
        return <RotateCcw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'COMPLETED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'FAILED':
      case 'CANCELLED':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (extractionStatus?.status) {
      case 'RUNNING':
        return 'Extraindo preços...';
      case 'COMPLETED':
        return 'Extração concluída!';
      case 'FAILED':
        return 'Extração falhou';
      case 'CANCELLED':
        return 'Extração cancelada';
      default:
        return 'Pronto para extrair';
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <TrendingUp className="h-5 w-5 text-blue-500 mr-2" />
            Controle de Extração de Preços
          </h3>
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className={`text-sm font-medium ${
              extractionStatus?.status === 'RUNNING' ? 'text-blue-600' :
              extractionStatus?.status === 'COMPLETED' ? 'text-green-600' :
              extractionStatus?.status === 'FAILED' || extractionStatus?.status === 'CANCELLED' ? 'text-red-600' :
              'text-gray-500'
            }`}>
              {getStatusText()}
            </span>
          </div>
        </div>

        {/* Seleção de Concorrentes */}
        {extractionStatus?.status !== 'RUNNING' && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">
                Selecionar Concorrentes ({selectedProperties.length}/{properties.length})
              </h4>
              <div className="flex space-x-2">
                <button
                  onClick={selectAll}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Todos
                </button>
                <button
                  onClick={clearSelection}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Limpar
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {properties.map(property => (
                <label
                  key={property.id}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedProperties.includes(property.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedProperties.includes(property.id)}
                    onChange={() => toggleProperty(property.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">
                      {property.property_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {property.category} • {property.location}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Controles */}
        <div className="flex items-center space-x-3 mb-6">
          {extractionStatus?.status !== 'RUNNING' ? (
            <button
              onClick={startExtraction}
              disabled={isLoading || selectedProperties.length === 0}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="h-4 w-4 mr-2" />
              {isLoading ? 'Iniciando...' : 'Iniciar Extração'}
            </button>
          ) : (
            <button
              onClick={stopExtraction}
              disabled={isLoading}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              <Square className="h-4 w-4 mr-2" />
              {isLoading ? 'Parando...' : 'Parar Extração'}
            </button>
          )}
        </div>

        {/* Progress e Status */}
        {extractionStatus?.status === 'RUNNING' && extractionStatus.progress && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progresso</span>
              <span className="text-sm text-gray-500">
                {extractionStatus.progress.current}/{extractionStatus.progress.total}
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(extractionStatus.progress.current / extractionStatus.progress.total) * 100}%`
                }}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Tempo decorrido:</span>
                <div className="font-medium">
                  {formatDuration(extractionStatus.duration || 0)}
                </div>
              </div>
              
              {extractionStatus.estimatedTimeRemaining && (
                <div>
                  <span className="text-gray-500">Tempo restante:</span>
                  <div className="font-medium">
                    {formatDuration(extractionStatus.estimatedTimeRemaining)}
                  </div>
                </div>
              )}
              
              <div>
                <span className="text-gray-500">Preços encontrados:</span>
                <div className="font-medium text-green-600">
                  {extractionStatus.progress.extractedPrices || 0}
                </div>
              </div>
              
              {extractionStatus.progress.currentProperty && (
                <div>
                  <span className="text-gray-500">Atual:</span>
                  <div className="font-medium truncate">
                    {extractionStatus.progress.currentProperty}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Logs em tempo real */}
        {logs.length > 0 && extractionStatus?.status === 'RUNNING' && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Log em tempo real:</h5>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {logs.slice(-5).map((log, index) => (
                <div
                  key={index}
                  className={`text-xs font-mono ${
                    log.type === 'error' ? 'text-red-600' : 'text-gray-600'
                  }`}
                >
                  <span className="text-gray-400">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  {' '}
                  {log.message.trim()}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExtractionControl;