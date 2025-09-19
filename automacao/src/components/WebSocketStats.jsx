import { useState, useEffect } from 'react';
import websocketService from '../services/websocketService';

const WebSocketStats = ({ isVisible = true, workspaceUuid }) => {
  const [stats, setStats] = useState({
    requestsSaved: 0,
    connectionUptime: 0,
    pollingReduction: 0,
    lastUpdate: null
  });
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!workspaceUuid) return;

    // Calcular estatísticas baseadas no modo atual
    const calculateStats = () => {
      const status = websocketService.getStatus();
      const now = new Date();

      let requestsSaved = 0;
      let pollingReduction = 0;
      let connectionUptime = 0;

      if (status.isConnected && status.lastConnectionTime) {
        connectionUptime = Math.floor((now - new Date(status.lastConnectionTime)) / 1000);

        if (!status.fallbackMode) {
          // WebSocket ativo - economizamos significativamente em requisições
          // Polling normal: 1 req/30s = 120 req/hora
          // WebSocket: 1 req/300s = 12 req/hora
          // Economia: ~90%
          pollingReduction = 90;
          requestsSaved = Math.floor(connectionUptime / 30) * 0.9; // Aproximação
        } else {
          // Modo fallback - ainda economizamos um pouco
          pollingReduction = 50;
          requestsSaved = Math.floor(connectionUptime / 30) * 0.5;
        }
      }

      setStats({
        requestsSaved: Math.floor(requestsSaved),
        connectionUptime,
        pollingReduction,
        lastUpdate: now
      });
    };

    // Calcular inicialmente
    calculateStats();

    // Atualizar a cada 30 segundos
    const interval = setInterval(calculateStats, 30000);

    // Listener para mudanças de status
    const removeStatusListener = websocketService.addEventListener('connection-status', () => {
      setTimeout(calculateStats, 1000); // Delay para garantir que o status foi atualizado
    });

    const removeFallbackListener = websocketService.addEventListener('fallback-mode', () => {
      setTimeout(calculateStats, 1000);
    });

    return () => {
      clearInterval(interval);
      removeStatusListener();
      removeFallbackListener();
    };
  }, [workspaceUuid]);

  if (!isVisible) return null;

  const formatUptime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const status = websocketService.getStatus();

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 mb-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Status principal */}
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              status.isConnected && !status.fallbackMode ? 'bg-green-400 animate-pulse' :
              status.isConnected && status.fallbackMode ? 'bg-orange-400 animate-pulse' :
              'bg-red-400'
            }`}></div>
            <span className="text-sm font-medium text-gray-700">
              {status.isConnected && !status.fallbackMode ? 'WebSocket Otimizado' :
               status.isConnected && status.fallbackMode ? 'Modo Fallback' :
               'Polling Tradicional'}
            </span>
          </div>

          {/* Estatísticas resumidas */}
          <div className="flex items-center space-x-4 text-xs text-gray-600">
            <div className="flex items-center space-x-1">
              <span className="font-medium text-green-600">
                ↓{stats.pollingReduction}%
              </span>
              <span>requisições</span>
            </div>

            {status.isConnected && (
              <div className="flex items-center space-x-1">
                <span className="font-medium text-blue-600">
                  {formatUptime(stats.connectionUptime)}
                </span>
                <span>ativo</span>
              </div>
            )}

            <div className="flex items-center space-x-1">
              <span className="font-medium text-purple-600">
                ~{stats.requestsSaved}
              </span>
              <span>req economizadas</span>
            </div>
          </div>
        </div>

        {/* Botão expandir */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          {expanded ? 'Menos detalhes' : 'Mais detalhes'}
        </button>
      </div>

      {/* Painel expandido */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-blue-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            {/* Status da conexão */}
            <div className="bg-white rounded p-2 border border-blue-100">
              <div className="font-medium text-gray-700 mb-1">Status</div>
              <div className={`${
                status.isConnected ? 'text-green-600' : 'text-red-600'
              }`}>
                {status.isConnected ? 'Conectado' : 'Desconectado'}
              </div>
              {status.connectionQuality && (
                <div className="text-gray-500 mt-1">
                  Qualidade: {status.connectionQuality === 'good' ? 'Boa' : 'Ruim'}
                </div>
              )}
            </div>

            {/* Instâncias inscritas */}
            <div className="bg-white rounded p-2 border border-blue-100">
              <div className="font-medium text-gray-700 mb-1">Instâncias</div>
              <div className="text-blue-600">
                {status.subscribedInstances?.length || 0} inscritas
              </div>
              {status.subscribedInstances?.length > 0 && (
                <div className="text-gray-500 mt-1">
                  {status.subscribedInstances.slice(0, 2).join(', ')}
                  {status.subscribedInstances.length > 2 && '...'}
                </div>
              )}
            </div>

            {/* Eventos ouvindo */}
            <div className="bg-white rounded p-2 border border-blue-100">
              <div className="font-medium text-gray-700 mb-1">Eventos</div>
              <div className="text-purple-600">
                {status.eventListeners?.length || 0} tipos
              </div>
              <div className="text-gray-500 mt-1">
                Mensagens, contatos, conexão
              </div>
            </div>

            {/* Política de prevenção */}
            <div className="bg-white rounded p-2 border border-blue-100">
              <div className="font-medium text-gray-700 mb-1">Prevenção</div>
              <div className="text-green-600">
                ✓ Anti-banimento
              </div>
              <div className="text-gray-500 mt-1">
                Rate limit, cache, delays
              </div>
            </div>
          </div>

          {/* Informações técnicas */}
          <div className="mt-3 text-xs text-gray-500">
            <span>Socket ID: {status.socketId || 'N/A'}</span>
            {status.reconnectAttempts > 0 && (
              <span className="ml-3">Tentativas: {status.reconnectAttempts}</span>
            )}
            {stats.lastUpdate && (
              <span className="ml-3">
                Atualizado: {stats.lastUpdate.toLocaleTimeString('pt-BR')}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WebSocketStats;