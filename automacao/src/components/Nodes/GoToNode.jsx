import React from 'react';
import { Handle, Position } from 'reactflow';
import { ArrowRight, Settings, ExternalLink } from 'lucide-react';

const GoToNode = ({ data, isConnectable, selected }) => {
  const targetNodeId = data.targetNodeId || 'Selecionar destino...';
  const targetFlowId = data.targetFlowId;
  const displayTarget = targetNodeId.length > 25 ? targetNodeId.substring(0, 25) + '...' : targetNodeId;

  return (
    <div className={`
      bg-white/10 backdrop-blur-sm border-2 rounded-2xl shadow-lg p-4 min-w-[240px] max-w-[280px] transform transition-all duration-300
      ${selected 
        ? 'border-red-400 shadow-red-400/20 shadow-xl scale-105 ring-4 ring-red-400/10' 
        : 'border-white/20 hover:border-red-400/50 hover:shadow-xl hover:scale-102'
      }
    `}>
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-4 h-4 !bg-gradient-to-r !from-red-500 !to-red-600 !border-2 !border-white shadow-lg"
      />
      
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-md">
          <ArrowRight className="w-4 h-4 text-white" />
        </div>
          <div>
            <div className="text-xs font-bold text-white uppercase tracking-wide">IR PARA</div>
            <div className="text-xs text-sidebar-300">
              {targetFlowId ? 'Outro fluxo' : 'Mesmo fluxo'}
            </div>
          </div>
        </div>
        <div className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer transition-colors group">
          <Settings className="w-3 h-3 text-sidebar-300 group-hover:text-white" />
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20 mb-4">
        <div className="flex items-center gap-2">
          {targetFlowId && <ExternalLink className="w-3 h-3 text-sidebar-300" />}
          <div className="text-sm text-white break-words flex-1">
            {displayTarget}
          </div>
        </div>
        {targetFlowId && (
          <div className="text-xs text-sidebar-300 mt-1">
            Fluxo: <span className="font-semibold text-red-300">{targetFlowId}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs mb-3">
        <div className="flex items-center gap-1 text-red-300 font-medium">
          <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
          <span>➡️ Redirecionar fluxo</span>
        </div>
        <div className="text-sidebar-300">↪</div>
      </div>

      <div className="mt-2 p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg text-xs backdrop-blur-sm">
        <div className="text-orange-300 font-medium">⚠️ Fim da execução atual</div>
      </div>

      {/* Selection indicator */}
      {selected && (
        <div className="absolute -inset-1 bg-gradient-to-r from-red-400 to-red-600 rounded-2xl opacity-20 -z-10"></div>
      )}

      {/* Este nó não tem handle de saída pois redireciona o fluxo */}
    </div>
  );
};

export default GoToNode;