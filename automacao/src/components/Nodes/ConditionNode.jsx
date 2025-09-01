import React from 'react';
import { Handle, Position } from 'reactflow';
import { GitBranch, Settings, Check, X } from 'lucide-react';

const ConditionNode = ({ data, isConnectable, selected }) => {
  const variable = data.variable || 'variavel';
  const operator = data.operator || 'equals';
  const value = data.value || 'valor';
  
  const operatorLabels = {
    equals: '=',
    notEquals: '≠',
    contains: '⊃',
    notContains: '⊄',
    startsWith: '⌐',
    endsWith: '⌐¬',
    greaterThan: '>',
    lessThan: '<',
    isEmpty: '∅',
    isNotEmpty: '!∅'
  };

  return (
    <div className={`
      bg-white/10 backdrop-blur-sm border-2 rounded-2xl shadow-lg p-4 min-w-[240px] max-w-[280px] transform transition-all duration-300
      ${selected 
        ? 'border-yellow-400 shadow-yellow-400/20 shadow-xl scale-105 ring-4 ring-yellow-400/10' 
        : 'border-white/20 hover:border-yellow-400/50 hover:shadow-xl hover:scale-102'
      }
    `}>
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-yellow-500 !border-2 !border-white"
      />
      
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-md">
          <GitBranch className="w-4 h-4 text-white" />
        </div>
          <div>
            <div className="text-xs font-bold text-white uppercase tracking-wide">CONDIÇÃO</div>
            <div className="text-xs text-sidebar-300">
              {data.caseSensitive ? 'Case sensitive' : 'Case insensitive'}
            </div>
          </div>
        </div>
        <div className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer transition-colors group">
          <Settings className="w-3 h-3 text-sidebar-300 group-hover:text-white" />
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20 mb-4">
        <div className="text-xs text-white font-mono break-words">
          <span className="font-semibold text-blue-300">{variable}</span>
          <span className="mx-1 text-yellow-300 font-bold">
            {operatorLabels[operator] || operator}
          </span>
          <span className="font-semibold text-green-300">"{value}"</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs mb-3">
        <div className="flex items-center gap-1 text-yellow-300 font-medium">
          <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
          <span>🔀 Avaliar condição</span>
        </div>
        <div className="text-sidebar-300">↗↘</div>
      </div>

      {/* Handles de saída */}
      <div className="relative">
        <div className="absolute -right-1 -top-2">
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            isConnectable={isConnectable}
            className="w-3 h-3 !bg-green-500 !border-2 !border-white"
            style={{ top: '10px' }}
          />
          <div className="absolute -right-12 -top-1 text-xs text-green-300 font-medium">
            <Check className="w-3 h-3" />
          </div>
        </div>
        
        <div className="absolute -right-1 top-6">
          <Handle
            type="source"
            position={Position.Right}
            id="false"
            isConnectable={isConnectable}
            className="w-3 h-3 !bg-red-500 !border-2 !border-white"
            style={{ top: '10px' }}
          />
          <div className="absolute -right-12 -top-1 text-xs text-red-300 font-medium">
            <X className="w-3 h-3" />
          </div>
        </div>
      </div>

      <div className="mt-6 text-xs text-sidebar-300 text-center">
        <div>✅ Verdadeiro &nbsp;&nbsp; ❌ Falso</div>
      </div>

      {/* Selection indicator */}
      {selected && (
        <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-2xl opacity-20 -z-10"></div>
      )}
    </div>
  );
};

export default ConditionNode;