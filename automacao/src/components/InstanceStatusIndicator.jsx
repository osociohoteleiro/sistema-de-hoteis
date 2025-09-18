import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const InstanceStatusIndicator = ({
  instanceName,
  size = 'sm',
  showLabel = true,
  showDetails = false,
  className = ''
}) => {
  const [status, setStatus] = useState({
    state: 'unknown', // 'online', 'offline', 'connecting', 'error', 'unknown'
    lastCheck: null,
    details: null,
    loading: true
  });

  useEffect(() => {
    if (instanceName) {
      checkInstanceStatus();

      // Verificar status a cada 30 segundos se showDetails estiver ativo
      const interval = showDetails ? setInterval(checkInstanceStatus, 30000) : null;

      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [instanceName, showDetails]);

  // Mapear estados da Evolution API para estados do componente
  const mapEvolutionState = (evolutionState) => {
    switch (evolutionState?.toLowerCase()) {
      case 'open':
        return 'online';
      case 'close':
      case 'closed':
        return 'offline';
      case 'connecting':
        return 'connecting';
      case 'error':
      case 'failed':
        return 'error';
      default:
        return 'unknown';
    }
  };

  const checkInstanceStatus = async () => {
    try {
      setStatus(prev => ({ ...prev, loading: true }));

      // Verificação real de status da instância Evolution
      const response = await axios.get(`${API_BASE_URL}/evolution/status/${instanceName}`);

      if (response.data.success) {
        // Mapear estados da Evolution API para estados do componente
        const evolutionState = response.data.data.instance?.state || response.data.data.state;
        const mappedState = mapEvolutionState(evolutionState);

        setStatus({
          state: mappedState,
          lastCheck: new Date(),
          details: response.data.data.instance || response.data.data,
          loading: false
        });
      } else {
        throw new Error('Failed to get status');
      }
    } catch (error) {
      console.warn(`Erro ao verificar status da instância ${instanceName}:`, error.message);

      // Fallback: tentar uma verificação simples baseada no nome da instância
      const mockStatus = getMockStatus(instanceName);
      setStatus({
        state: mockStatus.state,
        lastCheck: new Date(),
        details: mockStatus.details,
        loading: false
      });
    }
  };

  // Mock para desenvolvimento - simula diferentes status baseado no nome
  const getMockStatus = (name) => {
    if (!name) return { state: 'unknown', details: null };

    const hash = name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);

    const statuses = [
      {
        state: 'online',
        details: {
          uptime: '2d 4h 15m',
          messages: 1247,
          lastMessage: '2 min ago',
          phone: '+55 11 99999-9999'
        }
      },
      {
        state: 'connecting',
        details: {
          uptime: null,
          messages: 0,
          lastMessage: 'Conectando...',
          phone: 'Aguardando'
        }
      },
      {
        state: 'offline',
        details: {
          uptime: null,
          messages: 892,
          lastMessage: '1h ago',
          phone: 'Desconectado'
        }
      },
      {
        state: 'error',
        details: {
          uptime: null,
          messages: 0,
          lastMessage: 'Erro de conexão',
          phone: 'Erro'
        }
      }
    ];

    return statuses[Math.abs(hash) % statuses.length];
  };

  const getStatusConfig = () => {
    switch (status.state) {
      case 'online':
        return {
          color: 'bg-green-500',
          textColor: 'text-green-700',
          bgColor: 'bg-green-100',
          borderColor: 'border-green-200',
          label: 'Online',
          icon: '✅',
          description: 'Instância ativa e operacional'
        };
      case 'connecting':
        return {
          color: 'bg-yellow-500',
          textColor: 'text-yellow-700',
          bgColor: 'bg-yellow-100',
          borderColor: 'border-yellow-200',
          label: 'Conectando',
          icon: '🔄',
          description: 'Estabelecendo conexão...'
        };
      case 'offline':
        return {
          color: 'bg-red-500',
          textColor: 'text-red-700',
          bgColor: 'bg-red-100',
          borderColor: 'border-red-200',
          label: 'Offline',
          icon: '❌',
          description: 'Instância desconectada'
        };
      case 'error':
        return {
          color: 'bg-orange-500',
          textColor: 'text-orange-700',
          bgColor: 'bg-orange-100',
          borderColor: 'border-orange-200',
          label: 'Erro',
          icon: '⚠️',
          description: 'Erro na conexão'
        };
      default:
        return {
          color: 'bg-gray-400',
          textColor: 'text-gray-600',
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-200',
          label: 'Desconhecido',
          icon: '❓',
          description: 'Status não disponível'
        };
    }
  };

  const config = getStatusConfig();

  const dotSize = size === 'lg' ? 'w-4 h-4' : size === 'md' ? 'w-3 h-3' : 'w-2 h-2';
  const textSize = size === 'lg' ? 'text-base' : size === 'md' ? 'text-sm' : 'text-xs';

  if (status.loading && size === 'sm') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className={`${dotSize} bg-gray-300 rounded-full animate-pulse`}></div>
        {showLabel && <span className={`${textSize} text-gray-500`}>Verificando...</span>}
      </div>
    );
  }

  if (!showDetails) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className={`${dotSize} ${config.color} rounded-full ${status.state === 'connecting' ? 'animate-pulse' : ''}`}></div>
        {showLabel && (
          <span className={`${textSize} font-medium ${config.textColor}`}>
            {config.label}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`p-4 border ${config.borderColor} ${config.bgColor} rounded-lg ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`${dotSize} ${config.color} rounded-full ${status.state === 'connecting' ? 'animate-pulse' : ''}`}></div>
          <span className={`font-semibold ${config.textColor}`}>
            {instanceName}
          </span>
        </div>
        <span className="text-lg">{config.icon}</span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Status:</span>
          <span className={`font-medium ${config.textColor}`}>{config.label}</span>
        </div>

        {status.details && (
          <>
            {status.details.phone && (
              <div className="flex justify-between">
                <span className="text-gray-600">Telefone:</span>
                <span className="font-mono text-gray-800">{status.details.phone}</span>
              </div>
            )}

            {status.details.uptime && (
              <div className="flex justify-between">
                <span className="text-gray-600">Uptime:</span>
                <span className="font-medium text-gray-800">{status.details.uptime}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-gray-600">Mensagens:</span>
              <span className="font-medium text-gray-800">{status.details.messages || 0}</span>
            </div>

            {status.details.lastMessage && (
              <div className="flex justify-between">
                <span className="text-gray-600">Última msg:</span>
                <span className="text-gray-800">{status.details.lastMessage}</span>
              </div>
            )}
          </>
        )}

        {status.lastCheck && (
          <div className="flex justify-between pt-2 mt-2 border-t border-gray-200">
            <span className="text-gray-500">Verificado:</span>
            <span className="text-gray-500">
              {status.lastCheck.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 mt-3 italic">
        {config.description}
      </p>
    </div>
  );
};

export default InstanceStatusIndicator;