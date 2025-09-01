import React from 'react';
import { Handle, Position } from 'reactflow';
import { Zap, Globe, Settings, CheckCircle, XCircle } from 'lucide-react';

const ActionNode = ({ data, isConnectable, selected }) => {
  const url = data.url || 'https://api.exemplo.com/endpoint';
  const method = data.method || 'GET';
  const displayUrl = url.length > 35 ? url.substring(0, 35) + '...' : url;
  const variable = data.variable || 'response';

  const getMethodColor = (method) => {
    const colors = {
      'GET': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'POST': 'bg-green-500/20 text-green-300 border-green-500/30',
      'PUT': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      'DELETE': 'bg-red-500/20 text-red-300 border-red-500/30',
      'PATCH': 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    };
    return colors[method] || 'bg-white/10 text-sidebar-300 border-white/20';
  };

  return (
    <div className={`
      relative bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg border-2 p-4 min-w-[260px] max-w-[300px] transform transition-all duration-300
      ${selected 
        ? 'border-green-400 shadow-green-400/20 shadow-xl scale-105 ring-4 ring-green-400/10' 
        : 'border-white/20 hover:border-green-400/50 hover:shadow-xl hover:scale-102'
      }
    `}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-xs font-bold text-white uppercase tracking-wide">AÇÃO HTTP</div>
            <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getMethodColor(method)}`}>
              {method}
            </div>
          </div>
        </div>
        <div className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer transition-colors group">
          <Settings className="w-3 h-3 text-sidebar-300 group-hover:text-white" />
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-3 h-3 text-green-400 flex-shrink-0" />
            <div className="text-xs text-white font-mono break-all leading-relaxed">
              {displayUrl}
            </div>
          </div>
          {variable && (
            <div className="text-xs text-sidebar-300">
              💾 Salvar em: <span className="font-semibold text-green-300">{variable}</span>
            </div>
          )}
        </div>
      </div>

      {/* Output handles info */}
      <div className="mb-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 text-xs text-green-300 bg-green-500/20 rounded-lg px-2 py-1">
            <CheckCircle className="w-3 h-3" />
            <span className="font-medium">Sucesso</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-red-300 bg-red-500/20 rounded-lg px-2 py-1">
            <XCircle className="w-3 h-3" />
            <span className="font-medium">Erro</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-green-300 font-medium">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          <span>Executar requisição</span>
        </div>
      </div>

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-4 h-4 !bg-gradient-to-r !from-green-500 !to-green-600 !border-2 !border-white shadow-lg"
      />

      {/* Success Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="success"
        isConnectable={isConnectable}
        className="w-4 h-4 !bg-gradient-to-r !from-green-500 !to-green-600 !border-2 !border-white shadow-lg"
        style={{ top: '40%' }}
      />

      {/* Error Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="error"
        isConnectable={isConnectable}
        className="w-4 h-4 !bg-gradient-to-r !from-red-500 !to-red-600 !border-2 !border-white shadow-lg"
        style={{ top: '70%' }}
      />

      {/* Selection indicator */}
      {selected && (
        <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-green-600 rounded-2xl opacity-20 -z-10"></div>
      )}
    </div>
  );
};

export default ActionNode;