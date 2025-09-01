import React from 'react';
import { NODE_CONFIGS } from '../../utils/nodeTypes';
import { Plus, Save, Play, Trash2, Download, Upload, Zap, Bot, Settings } from 'lucide-react';

const Sidebar = ({ onAddNode, onSave, onLoad, onClear, onTest }) => {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen fixed left-0 top-0 z-40 shadow-lg">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-primary-500 rounded-lg flex items-center justify-center">
            <Bot className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-gray-800 font-semibold text-lg">
              Bot Builder
            </h1>
            <p className="text-gray-600 text-sm">Sistema de Automação</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-gray-200">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onSave}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 border border-gray-300"
          >
            <Save className="w-3 h-3" />
            <span className="font-medium">Salvar</span>
          </button>
          <button
            onClick={onTest}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all duration-200 shadow-lg"
          >
            <Play className="w-3 h-3" />
            <span className="font-medium">Testar</span>
          </button>
          <button
            onClick={onLoad}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 border border-gray-300"
          >
            <Upload className="w-3 h-3" />
            <span className="font-medium">Carregar</span>
          </button>
          <button
            onClick={onClear}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all duration-200 border border-red-200"
          >
            <Trash2 className="w-3 h-3" />
            <span className="font-medium">Limpar</span>
          </button>
        </div>
      </div>

      {/* Components Section */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4">
          <h3 className="text-gray-800 font-semibold mb-1">Componentes</h3>
          <p className="text-gray-500 text-xs">Arraste para o canvas</p>
        </div>
        
        <div className="space-y-2">
          {Object.values(NODE_CONFIGS).map((config) => (
            <div
              key={config.type}
              className="group cursor-move select-none"
              draggable
              onDragStart={(event) => onDragStart(event, config.type)}
              onClick={() => onAddNode(config.type)}
            >
              <div className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-200 border border-gray-200 hover:border-gray-300 cursor-grab active:cursor-grabbing">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold shadow-lg transition-all duration-300 group-hover:scale-110"
                    style={{ 
                      backgroundColor: config.color + '20',
                      color: config.color,
                      border: `1px solid ${config.color}40`
                    }}
                  >
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-800 group-hover:text-gray-900 transition-colors">
                      {config.label}
                    </div>
                    <div className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors line-clamp-1">
                      {getNodeDescription(config.type)}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                        <span>{config.inputs}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                        <span>{config.outputs}</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-6 h-6 rounded bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors">
                    <Plus className="w-3 h-3 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="space-y-2 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse"></div>
            <span><strong className="text-gray-700">Dica:</strong> Clique ou arraste</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span><strong className="text-gray-700">Conexões:</strong> Arraste das bolinhas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            <span><strong className="text-gray-700">Config:</strong> Clique duplo no nó</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const getNodeDescription = (type) => {
  const descriptions = {
    message: 'Enviar mensagem de texto',
    question: 'Fazer pergunta e aguardar',
    action: 'Requisição HTTP externa',
    condition: 'Avaliar e bifurcar fluxo',
    goto: 'Redirecionar para outro nó'
  };
  return descriptions[type] || 'Componente de automação';
};

export default Sidebar;