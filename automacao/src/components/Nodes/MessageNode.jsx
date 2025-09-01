import React from 'react';
import { Handle, Position } from 'reactflow';
import { MessageCircle, Settings, Clock } from 'lucide-react';

const MessageNode = ({ data, isConnectable, selected }) => {
  const message = data.message || 'Digite sua mensagem...';
  const displayMessage = message.length > 50 ? message.substring(0, 50) + '...' : message;
  const delay = data.delay || 1000;

  return (
    <div className={`
      relative bg-white rounded-2xl shadow-lg border-2 p-4 min-w-[240px] max-w-[280px] transform transition-all duration-300
      ${selected 
        ? 'border-primary-500 shadow-primary-500/20 shadow-xl scale-105 ring-4 ring-primary-500/10' 
        : 'border-blue-200 hover:border-primary-400 hover:shadow-xl hover:scale-102'
      }
    `}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-md">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-xs font-bold text-blue-700 uppercase tracking-wide">MENSAGEM</div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{delay}ms</span>
            </div>
          </div>
        </div>
        <div className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center cursor-pointer transition-colors group">
          <Settings className="w-3 h-3 text-gray-400 group-hover:text-gray-600" />
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
          <div className="text-sm text-gray-800 break-words leading-relaxed">
            {displayMessage}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-blue-600 font-medium">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
          <span>Enviar mensagem</span>
        </div>
        <div className="text-gray-400">→</div>
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-4 h-4 !bg-gradient-to-r !from-primary-500 !to-primary-600 !border-2 !border-white shadow-lg"
      />
      
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-4 h-4 !bg-gradient-to-r !from-primary-500 !to-primary-600 !border-2 !border-white shadow-lg"
      />

      {/* Selection indicator */}
      {selected && (
        <div className="absolute -inset-1 bg-gradient-to-r from-primary-400 to-primary-600 rounded-2xl opacity-20 -z-10"></div>
      )}
    </div>
  );
};

export default MessageNode;