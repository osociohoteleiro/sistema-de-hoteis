import React from 'react';
import { Handle, Position } from 'reactflow';
import { HelpCircle, Clock, Settings, Timer } from 'lucide-react';

const QuestionNode = ({ data, isConnectable, selected }) => {
  const question = data.question || 'Digite sua pergunta...';
  const displayQuestion = question.length > 50 ? question.substring(0, 50) + '...' : question;
  const timeout = Math.floor((data.timeout || 300000) / 60000);

  return (
    <div className={`
      relative bg-white rounded-2xl shadow-lg border-2 p-4 min-w-[240px] max-w-[280px] transform transition-all duration-300
      ${selected 
        ? 'border-purple-500 shadow-purple-500/20 shadow-xl scale-105 ring-4 ring-purple-500/10' 
        : 'border-purple-200 hover:border-purple-400 hover:shadow-xl hover:scale-102'
      }
    `}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
            <HelpCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-xs font-bold text-white uppercase tracking-wide">PERGUNTA</div>
            <div className="flex items-center gap-1 text-xs text-sidebar-300">
              <Timer className="w-3 h-3" />
              <span>{timeout}min timeout</span>
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
          <div className="text-sm text-white break-words leading-relaxed">
            {displayQuestion}
          </div>
        </div>
      </div>

      {/* Status indicator */}
      <div className="mb-3">
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            <span className="text-yellow-300 font-medium">Aguardando resposta do usuário</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-purple-300 font-medium">
          <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
          <span>Fazer pergunta</span>
        </div>
        <div className="text-sidebar-300">→</div>
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-4 h-4 !bg-gradient-to-r !from-purple-500 !to-purple-600 !border-2 !border-white shadow-lg"
      />
      
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-4 h-4 !bg-gradient-to-r !from-purple-500 !to-purple-600 !border-2 !border-white shadow-lg"
      />

      {/* Selection indicator */}
      {selected && (
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-purple-600 rounded-2xl opacity-20 -z-10"></div>
      )}
    </div>
  );
};

export default QuestionNode;