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

// Definindo tipos de nós personalizados
const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  webhook: WebhookNode,
  delay: DelayNode
};

// Dados iniciais com mais variedade
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
    type: 'condition',
    position: { x: 250, y: 250 },
    data: { 
      label: 'Verificar Horário',
      description: 'Verificar se está no horário comercial',
      icon: Clock,
      color: 'bg-yellow-500'
    },
  },
  {
    id: '3',
    type: 'action',
    position: { x: 100, y: 400 },
    data: { 
      label: 'Resposta Automática',
      description: 'Enviar resposta fora do horário',
      icon: Bot,
      color: 'bg-blue-500'
    },
  },
  {
    id: '4',
    type: 'action',
    position: { x: 400, y: 400 },
    data: { 
      label: 'Encaminhar para Atendente',
      description: 'Direcionar para atendimento humano',
      icon: MessageSquare,
      color: 'bg-purple-500'
    },
  },
  {
    id: '5',
    type: 'webhook',
    position: { x: 600, y: 250 },
    data: { 
      label: 'Webhook Externo',
      description: 'Enviar dados para sistema externo',
      icon: Webhook,
      color: 'bg-orange-500'
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
  },
  {
    id: 'e2-3',
    source: '2',
    target: '3',
    type: 'custom',
    animated: true,
    style: { stroke: '#eab308', strokeWidth: 2 },
    label: 'Fora do horário'
  },
  {
    id: 'e2-4',
    source: '2',
    target: '4',
    type: 'custom',
    animated: true,
    style: { stroke: '#10b981', strokeWidth: 2 },
    label: 'Horário comercial'
  }
];

// Componentes de nós personalizados
function TriggerNode({ data, selected }) {
  const Icon = data.icon;
  return (
    <div className={`px-4 py-3 shadow-lg rounded-lg border-2 ${
      selected ? 'border-blue-500' : 'border-gray-200'
    } ${data.color} text-white min-w-[200px]`}>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4" />
        <div className="font-semibold text-sm">{data.label}</div>
      </div>
      <div className="text-xs opacity-90">{data.description}</div>
    </div>
  );
}

function ActionNode({ data, selected }) {
  const Icon = data.icon;
  return (
    <div className={`px-4 py-3 shadow-lg rounded-lg border-2 ${
      selected ? 'border-blue-500' : 'border-gray-200'
    } ${data.color} text-white min-w-[200px]`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4" />
        <div className="font-semibold text-sm">{data.label}</div>
      </div>
      <div className="text-xs opacity-90">{data.description}</div>
    </div>
  );
}

function ConditionNode({ data, selected }) {
  const Icon = data.icon;
  return (
    <div className={`px-4 py-3 shadow-lg rounded-lg border-2 ${
      selected ? 'border-blue-500' : 'border-gray-200'
    } ${data.color} text-white min-w-[200px] transform rotate-45 relative`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
      <Handle type="source" position={Position.Left} className="w-3 h-3" />
      <div className="transform -rotate-45">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="h-4 w-4" />
          <div className="font-semibold text-sm">{data.label}</div>
        </div>
        <div className="text-xs opacity-90">{data.description}</div>
      </div>
    </div>
  );
}

function WebhookNode({ data, selected }) {
  const Icon = data.icon;
  return (
    <div className={`px-4 py-3 shadow-lg rounded-lg border-2 ${
      selected ? 'border-blue-500' : 'border-gray-200'
    } ${data.color} text-white min-w-[200px]`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4" />
        <div className="font-semibold text-sm">{data.label}</div>
      </div>
      <div className="text-xs opacity-90">{data.description}</div>
    </div>
  );
}

function DelayNode({ data, selected }) {
  const Icon = data.icon;
  return (
    <div className={`px-4 py-3 shadow-lg rounded-lg border-2 ${
      selected ? 'border-blue-500' : 'border-gray-200'
    } bg-gray-600 text-white min-w-[200px]`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4" />
        <div className="font-semibold text-sm">{data.label}</div>
      </div>
      <div className="text-xs opacity-90">{data.description}</div>
    </div>
  );
}

// Componente de aresta personalizada
function CustomEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, data, markerEnd }) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
          className="pointer-events-none"
        >
          <button className="pointer-events-auto bg-white px-2 py-1 rounded border text-xs font-medium shadow-sm hover:shadow-md transition-shadow">
            {data?.label}
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

const edgeTypes = {
  custom: CustomEdge,
};

// Modal para conexões
function ConnectionModal({ isOpen, onClose, onConnect, position, connectionData }) {
  const nodeOptions = [
    { type: 'action', label: 'Ação', icon: Bot, color: 'bg-blue-500' },
    { type: 'condition', label: 'Condição', icon: GitBranch, color: 'bg-yellow-500' },
    { type: 'webhook', label: 'Webhook', icon: Webhook, color: 'bg-orange-500' },
    { type: 'delay', label: 'Aguardar', icon: Clock, color: 'bg-gray-600' },
  ];

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          transform: 'translate(-50%, -50%)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Adicionar Novo Nó</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="space-y-2">
          {nodeOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.type}
                onClick={() => onConnect(option)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg ${option.color} text-white hover:opacity-90 transition-opacity`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

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
    setEdges((eds) => addEdge({ ...params, type: 'custom', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } }, eds)), [setEdges]);

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
      // Conexão terminou em espaço vazio - usar posição absoluta da tela
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

  // Modal drag handlers
  const handleModalMouseDown = useCallback((e) => {
    setIsDraggingModal(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }, []);

  const handleModalMouseMove = useCallback((e) => {
    if (isDraggingModal) {
      setModalPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  }, [isDraggingModal, dragOffset]);

  const handleModalMouseUp = useCallback(() => {
    setIsDraggingModal(false);
  }, []);

  // Adicionar novo nó
  const addNewNode = useCallback((nodeOption) => {
    const newNodeId = `node_${Date.now()}`;
    
    // Converter posição da tela para coordenadas do flow
    const reactFlowBounds = document.querySelector('.react-flow').getBoundingClientRect();
    const flowPosition = reactFlowInstance.project({
      x: modalPosition.x - reactFlowBounds.left,
      y: modalPosition.y - reactFlowBounds.top,
    });

    const newNode = {
      id: newNodeId,
      type: nodeOption.type,
      position: flowPosition,
      data: {
        label: nodeOption.label,
        description: `Nova ${nodeOption.label.toLowerCase()}`,
        icon: nodeOption.icon,
        color: nodeOption.color
      }
    };

    setNodes((nds) => nds.concat(newNode));

    // Conectar ao nó de origem se houver
    if (connectionData && connectionData.sourceNodeId) {
      const newEdge = {
        id: `e${connectionData.sourceNodeId}-${newNodeId}`,
        source: connectionData.sourceNodeId,
        target: newNodeId,
        type: 'custom',
        animated: true,
        style: { stroke: '#3b82f6', strokeWidth: 2 }
      };
      setEdges((eds) => eds.concat(newEdge));
    }

    setShowConnectionModal(false);
    setConnectionData(null);
  }, [modalPosition, reactFlowInstance, setNodes, setEdges, connectionData]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event) => {
    event.preventDefault();

    const reactFlowBounds = event.target.getBoundingClientRect();
    const type = event.dataTransfer.getData('application/reactflow');

    if (typeof type === 'undefined' || !type) return;

    const position = reactFlowInstance.project({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    });

    const newNode = {
      id: `${type}_${Date.now()}`,
      type,
      position,
      data: {
        label: type.charAt(0).toUpperCase() + type.slice(1),
        description: `Novo ${type}`,
        icon: type === 'trigger' ? MessageSquare : type === 'action' ? Bot : GitBranch,
        color: type === 'trigger' ? 'bg-green-500' : type === 'action' ? 'bg-blue-500' : 'bg-yellow-500'
      },
    };

    setNodes((nds) => nds.concat(newNode));
  }, [reactFlowInstance, setNodes]);

  const onDragStart = (event, nodeType) => {
    setDraggedType(nodeType);
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const deleteSelectedEdge = () => {
    if (selectedEdge) {
      setEdges((eds) => eds.filter((edge) => edge.id !== selectedEdge.id));
      setSelectedEdge(null);
    }
  };

  return (
    <div className="h-full bg-gray-50" onMouseMove={handleModalMouseMove} onMouseUp={handleModalMouseUp}>
      {/* Header com ações específicas do Flow Builder */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Editor de Fluxo</h2>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              Fluxo de Atendimento WhatsApp
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
            {selectedEdge && (
              <button 
                onClick={deleteSelectedEdge}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors text-sm"
              >
                <Trash2 className="h-4 w-4" />
                Excluir Conexão
              </button>
            )}
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
              onDragStart={(event) => onDragStart(event, 'trigger')}
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
              onDragStart={(event) => onDragStart(event, 'action')}
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
              onDragStart={(event) => onDragStart(event, 'condition')}
            >
              <GitBranch className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="font-medium text-gray-900">Condição</div>
                <div className="text-xs text-gray-600">Lógica condicional</div>
              </div>
            </div>
            <div 
              className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg cursor-move hover:bg-orange-100 transition-colors"
              draggable
              onDragStart={(event) => onDragStart(event, 'webhook')}
            >
              <Webhook className="h-5 w-5 text-orange-600" />
              <div>
                <div className="font-medium text-gray-900">Webhook</div>
                <div className="text-xs text-gray-600">Integração externa</div>
              </div>
            </div>
            <div 
              className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-move hover:bg-gray-100 transition-colors"
              draggable
              onDragStart={(event) => onDragStart(event, 'delay')}
            >
              <Clock className="h-5 w-5 text-gray-600" />
              <div>
                <div className="font-medium text-gray-900">Aguardar</div>
                <div className="text-xs text-gray-600">Delay temporal</div>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="mt-6">
            <h4 className="font-semibold text-gray-900 mb-3">Ações</h4>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors text-sm">
                <Upload className="h-4 w-4" />
                Importar Fluxo
              </button>
              <button className="w-full flex items-center gap-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors text-sm">
                <Settings className="h-4 w-4" />
                Configurações
              </button>
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
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            className="bg-gray-50"
            snapToGrid={true}
            snapGrid={[15, 15]}
          >
            <Controls />
            <Background color="#f3f4f6" gap={16} />
          </ReactFlow>
        </div>
      </div>

      {/* Modal para adicionar novos nós */}
      <ConnectionModal 
        isOpen={showConnectionModal}
        onClose={() => {setShowConnectionModal(false); setConnectionData(null);}}
        onConnect={addNewNode}
        position={modalPosition}
        connectionData={connectionData}
      />
    </div>
  );
}

// Main FlowBuilder component
function FlowBuilderComplete() {
  return (
    <ReactFlowProvider>
      <FlowComponent />
    </ReactFlowProvider>
  );
}

export default FlowBuilderComplete;