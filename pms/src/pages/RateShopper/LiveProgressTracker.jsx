import React, { useState, useEffect } from 'react';
import {
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  DollarSign,
  Activity,
  Timer,
  Database
} from 'lucide-react';
import axios from 'axios';

const formatTime = (seconds) => {
  if (!seconds || seconds <= 0) return '0s';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

const formatETA = (seconds) => {
  if (!seconds || seconds <= 0) return 'Calculando...';
  return formatTime(seconds);
};

const LiveProgressTracker = ({ hotelId, onUpdateCounts }) => {
  const [progressData, setProgressData] = useState({
    running_searches: [],
    recent_completed: [],
    stats: { running_count: 0, pending_count: 0, completed_today: 0, failed_today: 0 }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProgress = async () => {
    try {
      setError(null);
      const response = await axios.get(`/api/rate-shopper/${hotelId}/searches/progress`);
      
      if (response.data.success) {
        setProgressData(response.data.data);
        
        // Atualizar contadores no componente pai
        if (onUpdateCounts) {
          onUpdateCounts(response.data.data.stats);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar progresso:', error);
      setError('Erro ao carregar progresso das extrações');
    }
  };

  useEffect(() => {
    // Buscar dados imediatamente
    fetchProgress();
    
    // Configurar polling a cada 3 segundos
    const interval = setInterval(fetchProgress, 3000);
    
    return () => clearInterval(interval);
  }, [hotelId]);

  const refreshProgress = async () => {
    setIsLoading(true);
    await fetchProgress();
    setIsLoading(false);
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
          <button 
            onClick={refreshProgress}
            className="ml-auto px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com estatísticas rápidas */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Status das Extrações
          </h3>
          <button
            onClick={refreshProgress}
            disabled={isLoading}
            className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-blue-600 text-sm font-medium">Em Execução</div>
            <div className="text-2xl font-bold text-blue-900">{progressData.stats.running_count}</div>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg">
            <div className="text-yellow-600 text-sm font-medium">Pendentes</div>
            <div className="text-2xl font-bold text-yellow-900">{progressData.stats.pending_count}</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-green-600 text-sm font-medium">Hoje Concluídas</div>
            <div className="text-2xl font-bold text-green-900">{progressData.stats.completed_today}</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="text-red-600 text-sm font-medium">Hoje Falhas</div>
            <div className="text-2xl font-bold text-red-900">{progressData.stats.failed_today}</div>
          </div>
        </div>
      </div>

      {/* Extrações em andamento */}
      {progressData.running_searches.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="h-4 w-4 mr-2 text-blue-500" />
            Extrações em Andamento ({progressData.running_searches.length})
          </h4>
          
          <div className="space-y-4">
            {progressData.running_searches.map((search) => (
              <div key={search.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h5 className="font-medium text-gray-900">{search.property_name}</h5>
                    <p className="text-sm text-gray-500">ID: {search.uuid}</p>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div>Tempo: {formatTime(search.elapsed_seconds)}</div>
                    <div>ETA: {search.progress_percent > 0 ? formatETA(search.eta_seconds) : 'Calculando...'}</div>
                  </div>
                </div>

                {/* Barra de progresso */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">
                      Progresso: {search.processed_dates || 0} / {search.total_dates || 0} datas
                    </span>
                    <span className="text-sm font-medium text-blue-600">
                      {search.progress_percent || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${search.progress_percent || 0}%` }}
                    />
                  </div>
                </div>

                {/* Informações detalhadas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center">
                    <Database className="h-4 w-4 mr-1 text-green-500" />
                    <span>{search.actual_prices_count || 0} preços</span>
                  </div>
                  <div className="flex items-center">
                    <Timer className="h-4 w-4 mr-1 text-orange-500" />
                    <span>{search.total_dates} dias</span>
                  </div>
                  <div className="flex items-center">
                    <Activity className="h-4 w-4 mr-1 text-blue-500" />
                    <span className="capitalize">{search.status.toLowerCase()}</span>
                  </div>
                  {search.actual_prices_count > 0 && (
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                      <span>{(search.actual_prices_count / (search.processed_dates || 1)).toFixed(1)} p/dia</span>
                    </div>
                  )}
                </div>

                {search.error_log && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    <strong>Erro:</strong> {search.error_log}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Extrações recém-completadas */}
      {progressData.recent_completed.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
            Recém Concluídas ({progressData.recent_completed.length})
          </h4>
          
          <div className="space-y-3">
            {progressData.recent_completed.map((search) => (
              <div key={search.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-gray-900">{search.property_name}</h5>
                    <p className="text-sm text-gray-500">
                      Concluída em {new Date(search.completed_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium ${
                      search.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-800'
                        : search.status === 'FAILED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {search.status === 'COMPLETED' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {search.status === 'FAILED' && <AlertCircle className="h-3 w-3 mr-1" />}
                      {search.status.toLowerCase()}
                    </div>
                  </div>
                </div>
                
                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    <span>{search.actual_prices_count || 0} preços</span>
                  </div>
                  <div className="flex items-center">
                    <Timer className="h-4 w-4 mr-1" />
                    <span>{search.total_dates} dias</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{formatTime(search.duration_seconds)}</span>
                  </div>
                  {search.actual_prices_count > 0 && (
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      <span>{(search.actual_prices_count / search.total_dates).toFixed(1)} p/dia</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mensagem quando não há atividade */}
      {progressData.running_searches.length === 0 && progressData.recent_completed.length === 0 && (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma extração em andamento</h3>
          <p className="text-gray-500">
            Inicie uma nova busca para monitorar o progresso em tempo real.
          </p>
        </div>
      )}
    </div>
  );
};

export default LiveProgressTracker;