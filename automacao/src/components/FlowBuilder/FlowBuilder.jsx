import React, { useState, useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  Handle,
  Position,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  EdgeLabelRenderer,
  getSmoothStepPath,
  BaseEdge,
  ReactFlowProvider,
} from "reactflow";
import { 
  MessageSquare, 
  HelpCircle, 
  Zap, 
  GitBranch, 
  ArrowRight,
  Bot,
  Play,
  Save,
  Upload,
  Trash2,
  Settings,
  BarChart3,
  Bell,
  X,
  Unlink,
  Webhook,
  Volume2,
  Video,
  Image,
  Clock
} from 'lucide-react';

import "reactflow/dist/style.css";

// Dados iniciais - vou manter apenas alguns exemplos para não sobrecarregar o arquivo
const initialNodes = [
  {
    id: '1',
    type: 'trigger',
    position: { x: 250, y: 100 },
    data: { 
      label: 'Mensagem Recebida',
      description: 'Quando uma nova mensagem é recebida no WhatsApp',
      icon: MessageSquare,
      color: 'bg-green-500'
    },
  },
  {
    id: '2',
    type: 'action',
    position: { x: 250, y: 250 },
    data: { 
      label: 'Resposta Automática',
      description: 'Enviar uma resposta automática',
      icon: Bot,
      color: 'bg-blue-500'
    },
  }
];

const initialEdges = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    type: 'custom',
    animated: true,
    style: { stroke: '#3b82f6', strokeWidth: 2 }
  }
];

// Wrapper component that has access to ReactFlow context
function FlowComponent() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [draggedType, setDraggedType] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [connectionData, setConnectionData] = useState(null);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [isDraggingModal, setIsDraggingModal] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const reactFlowInstance = useReactFlow();

  const onConnect = useCallback((params) => 
    setEdges((eds) => addEdge({ ...params, type: 'custom', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } }, eds)), []);

  const onConnectStart = useCallback((event, { nodeId, handleId, handleType }) => {
    setConnectionData({
      sourceNodeId: nodeId,
      sourceHandle: handleId,
      sourceHandleType: handleType,
      position: null
    });
  }, []);

  const onConnectEnd = useCallback((event) => {
    if (!connectionData) return;
    
    const targetIsPane = event.target.classList.contains('react-flow__pane');
    if (targetIsPane) {
      const position = {
        x: event.clientX,
        y: event.clientY,
      };
      
      setConnectionData({
        ...connectionData,
        position
      });
      setModalPosition({ 
        x: position.x, 
        y: position.y,
        dragging: false 
      });
      setShowConnectionModal(true);
    }
  }, [connectionData]);

  const onEdgeClick = useCallback((event, edge) => {
    event.stopPropagation();
    setSelectedEdge(edge);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedEdge(null);
  }, []);

  return (
    <div className="h-full bg-gray-50">
      {/* Header com ações específicas do Flow Builder */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Editor de Fluxo</h2>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              Fluxo sem título
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors text-sm">
              <Save className="h-4 w-4" />
              Salvar
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors text-sm">
              <Play className="h-4 w-4" />
              Executar
            </button>
          </div>
        </div>
      </div>

      {/* Flow Editor */}
      <div className="flex h-[calc(100vh-180px)]">
        {/* Sidebar com nós */}
        <div className="w-64 bg-white border-r border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Componentes</h3>
          <div className="space-y-2">
            <div 
              className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg cursor-move hover:bg-green-100 transition-colors"
              draggable
            >
              <MessageSquare className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium text-gray-900">Trigger</div>
                <div className="text-xs text-gray-600">Iniciar fluxo</div>
              </div>
            </div>
            <div 
              className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg cursor-move hover:bg-blue-100 transition-colors"
              draggable
            >
              <Bot className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium text-gray-900">Ação</div>
                <div className="text-xs text-gray-600">Executar ação</div>
              </div>
            </div>
            <div 
              className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg cursor-move hover:bg-yellow-100 transition-colors"
              draggable
            >
              <GitBranch className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="font-medium text-gray-900">Condição</div>
                <div className="text-xs text-gray-600">Lógica condicional</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main flow area */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onConnectStart={onConnectStart}
            onConnectEnd={onConnectEnd}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            className="bg-gray-50"
            snapToGrid={true}
            snapGrid={[15, 15]}
          >
            <Controls />
            <Background color="#f3f4f6" gap={16} />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}

// Main FlowBuilder component
function FlowBuilder() {
  return (
    <ReactFlowProvider>
      <FlowComponent />
    </ReactFlowProvider>
  );
}

export default FlowBuilder;