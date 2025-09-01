import React from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Settings, 
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Zap,
  Clock,
  Bell
} from 'lucide-react';

const FlowControls = ({ 
  flowStatus = 'draft',
  onPublish,
  onPause,
  onStop,
  onSettings,
  onAnalytics,
  nodeCount = 0,
  connectionCount = 0,
  validationErrors = []
}) => {
  const getStatusInfo = (status) => {
    const statusConfig = {
      draft: {
        color: 'bg-white/10 text-white border-white/20',
        icon: <Settings className="w-4 h-4" />,
        label: 'Rascunho',
        description: 'Fluxo em desenvolvimento'
      },
      active: {
        color: 'bg-green-500/20 text-green-300 border-green-500/30',
        icon: <CheckCircle className="w-4 h-4" />,
        label: 'Ativo',
        description: 'Executando automaticamente'
      },
      paused: {
        color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
        icon: <Pause className="w-4 h-4" />,
        label: 'Pausado',
        description: 'Temporariamente desabilitado'
      },
      stopped: {
        color: 'bg-red-500/20 text-red-300 border-red-500/30',
        icon: <Square className="w-4 h-4" />,
        label: 'Parado',
        description: 'Desativado pelo usuário'
      }
    };
    return statusConfig[status] || statusConfig.draft;
  };

  const statusInfo = getStatusInfo(flowStatus);
  const hasErrors = validationErrors.length > 0;

  const getPageTitle = () => {
    switch (flowStatus) {
      case 'active':
        return 'Bot de Automação Ativo';
      case 'paused':
        return 'Bot de Automação Pausado';
      case 'stopped':
        return 'Bot de Automação Parado';
      default:
        return 'Constructor de Bot WhatsApp';
    }
  };

  const getPageDescription = () => {
    switch (flowStatus) {
      case 'active':
        return 'Seu bot está processando mensagens automaticamente';
      case 'paused':
        return 'Bot pausado temporariamente - clique em retomar para continuar';
      case 'stopped':
        return 'Bot desativado - configure e publique para ativar';
      default:
        return 'Crie fluxos de automação profissionais para WhatsApp';
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 relative overflow-visible z-50 ml-64 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Left Section - Title & Description */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">
            {getPageTitle()}
          </h1>
          <p className="text-gray-600 mt-1">
            {getPageDescription()}
          </p>
          
          {/* Statistics */}
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary-400 rounded-full"></div>
              <span className="text-gray-500 text-sm">
                <strong className="text-gray-800">{nodeCount}</strong> componentes
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-gray-500 text-sm">
                <strong className="text-gray-800">{connectionCount}</strong> conexões
              </span>
            </div>
            {hasErrors && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                <span className="text-red-600 text-sm">
                  <strong>{validationErrors.length}</strong> erro{validationErrors.length > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center space-x-4">
          {/* Status Badge */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border bg-gray-50 border-gray-200`}>
            {statusInfo.icon}
            <div>
              <div className="font-medium text-sm">{statusInfo.label}</div>
              <div className="text-xs opacity-75">{statusInfo.description}</div>
            </div>
          </div>

          {/* Notification Bell */}
          <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors relative">
            <Bell className="w-5 h-5 text-gray-600" />
            {hasErrors && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-bold">{validationErrors.length}</span>
              </div>
            )}
          </button>

          {/* Analytics Button */}
          <button
            onClick={onAnalytics}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            title="Ver Analytics"
          >
            <BarChart3 className="w-5 h-5 text-gray-600" />
          </button>

          {/* Settings Button */}
          <button
            onClick={onSettings}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            title="Configurações"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </button>

          {/* Main Action Buttons */}
          <div className="flex items-center gap-3 ml-3 pl-3 border-l border-white/20">
            {flowStatus === 'draft' && (
              <button
                onClick={onPublish}
                disabled={hasErrors}
                className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${
                  hasErrors 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-300'
                    : 'bg-primary-500 text-white hover:bg-primary-600 shadow-lg border border-primary-400'
                }`}
                title={hasErrors ? 'Corrija os erros antes de publicar' : 'Publicar e ativar bot'}
              >
                <Play className="w-4 h-4" />
                <span>Publicar Bot</span>
                {!hasErrors && <Zap className="w-3 h-3 opacity-75" />}
              </button>
            )}

            {flowStatus === 'active' && (
              <button
                onClick={onPause}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-lg font-medium transition-all duration-200 border border-yellow-300"
                title="Pausar bot temporariamente"
              >
                <Pause className="w-4 h-4" />
                <span>Pausar</span>
                <Clock className="w-3 h-3 opacity-75" />
              </button>
            )}

            {flowStatus === 'paused' && (
              <>
                <button
                  onClick={onPublish}
                  disabled={hasErrors}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${
                    hasErrors 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-300'
                      : 'bg-primary-500 text-white hover:bg-primary-600 border border-primary-400'
                  }`}
                  title="Retomar execução do bot"
                >
                  <Play className="w-4 h-4" />
                  <span>Retomar</span>
                </button>
                <button
                  onClick={onStop}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-medium transition-all duration-200 border border-red-300"
                  title="Parar bot completamente"
                >
                  <Square className="w-4 h-4" />
                  <span>Parar</span>
                </button>
              </>
            )}

            {(flowStatus === 'active' || flowStatus === 'paused') && (
              <button
                onClick={onStop}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-medium transition-all duration-200 border border-red-300 ml-2"
                title="Parar bot completamente"
              >
                <Square className="w-4 h-4" />
                <span>Parar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Validation Errors Details */}
      {hasErrors && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-semibold text-red-700 mb-2">Erros de Validação:</div>
              <ul className="list-disc list-inside text-red-600 space-y-1 text-sm">
                {validationErrors.slice(0, 3).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
                {validationErrors.length > 3 && (
                  <li className="font-semibold">
                    ... e mais {validationErrors.length - 3} erro{validationErrors.length - 3 > 1 ? 's' : ''}
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default FlowControls;