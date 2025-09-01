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
  const handleModalMouseDown = useCallback((event) => {
    if (event.target.closest('.modal-drag-handle')) {
      setIsDraggingModal(true);
      const modalRect = event.currentTarget.getBoundingClientRect();
      setDragOffset({
        x: event.clientX - modalRect.left,
        y: event.clientY - modalRect.top
      });
      event.preventDefault();
    }
  }, []);

  const handleModalMouseMove = useCallback((event) => {
    if (isDraggingModal) {
      setModalPosition({
        x: event.clientX - dragOffset.x,
        y: event.clientY - dragOffset.y,
        dragging: true
      });
    }
  }, [isDraggingModal, dragOffset]);

  const handleModalMouseUp = useCallback(() => {
    setIsDraggingModal(false);
  }, []);

  // Add global mouse event listeners for modal dragging
  React.useEffect(() => {
    if (isDraggingModal) {
      document.addEventListener('mousemove', handleModalMouseMove);
      document.addEventListener('mouseup', handleModalMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleModalMouseMove);
        document.removeEventListener('mouseup', handleModalMouseUp);
      };
    }
  }, [isDraggingModal, handleModalMouseMove, handleModalMouseUp]);

  const handleComponentSelect = useCallback((componentType) => {
    if (!connectionData) return;

    const { position } = connectionData;
    
    // Converter coordenadas da tela para coordenadas do flow
    const flowPosition = reactFlowInstance.project({
      x: position.x - 100,
      y: position.y - 50
    });

    // Criar novo nó
    const newNodeId = `${componentType}-${Date.now()}`;
    const newNode = {
      id: newNodeId,
      type: componentType,
      position: flowPosition,
      data: { 
        name: componentType === 'start' ? 'Início' :
              componentType === 'message' ? 'Nova Mensagem' : 
              componentType === 'question' ? 'Nova Pergunta' :
              componentType === 'action' ? 'Nova Ação' :
              componentType === 'condition' ? 'Nova Condição' :
              componentType === 'webhook' ? 'Novo Webhook' :
              componentType === 'audio' ? 'Novo Áudio' :
              componentType === 'video' ? 'Novo Vídeo' :
              componentType === 'image' ? 'Nova Imagem' :
              componentType === 'delay' ? 'Novo Delay' : 'Novo Componente',
        message: componentType === 'message' ? 'Digite sua mensagem...' : undefined,
        question: componentType === 'question' ? 'Faça uma pergunta...' : undefined,
        url: componentType === 'action' ? 'https://api.exemplo.com' : 
             componentType === 'webhook' ? 'https://webhook.exemplo.com' : undefined,
        condition: componentType === 'condition' ? 'Se... então...' : undefined,
        audioUrl: componentType === 'audio' ? '' : undefined,
        videoUrl: componentType === 'video' ? '' : undefined,
        imageUrl: componentType === 'image' ? '' : undefined,
        delayType: componentType === 'delay' ? 'time' : undefined,
        delayAmount: componentType === 'delay' ? '5' : undefined,
        delayUnit: componentType === 'delay' ? 'minutes' : undefined
      },
    };

    // Adicionar o novo nó
    setNodes((nds) => nds.concat(newNode));

    // Criar a conexão
    const newEdge = {
      id: `e-${connectionData.sourceNodeId}-${newNodeId}`,
      source: connectionData.sourceNodeId,
      sourceHandle: connectionData.sourceHandle,
      target: newNodeId,
      type: 'custom',
      animated: true,
      style: { stroke: '#3b82f6', strokeWidth: 2 }
    };

    // Adicionar a nova edge
    setEdges((eds) => eds.concat(newEdge));

    // Fechar o modal e limpar dados
    setShowConnectionModal(false);
    setConnectionData(null);
  }, [connectionData, reactFlowInstance, setNodes, setEdges]);

  const deleteSelectedEdge = useCallback(() => {
    if (selectedEdge) {
      setEdges((eds) => eds.filter(e => e.id !== selectedEdge.id));
      setSelectedEdge(null);
    }
  }, [selectedEdge, setEdges]);

  const deleteEdgeById = useCallback((edgeId) => {
    setEdges((eds) => eds.filter(e => e.id !== edgeId));
    setSelectedEdge(null);
  }, [setEdges]);

  // Keyboard shortcut for deleting selected edge
  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedEdge) {
          deleteSelectedEdge();
          event.preventDefault();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEdge, deleteSelectedEdge]);

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
    setDraggedType(nodeType);
  };

  const onDrop = useCallback((event) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow');
    
    if (typeof type === 'undefined' || !type) {
      return;
    }

    const reactFlowBounds = event.target.getBoundingClientRect();
    const position = {
      x: event.clientX - reactFlowBounds.left - 100,
      y: event.clientY - reactFlowBounds.top - 50,
    };

    const newNode = {
      id: `${type}-${Date.now()}`,
      type,
      position,
      data: { 
        name: type === 'start' ? 'Início' :
              type === 'message' ? 'Nova Mensagem' : 
              type === 'question' ? 'Nova Pergunta' :
              type === 'action' ? 'Nova Ação' :
              type === 'condition' ? 'Nova Condição' :
              type === 'webhook' ? 'Novo Webhook' :
              type === 'audio' ? 'Novo Áudio' :
              type === 'video' ? 'Novo Vídeo' :
              type === 'image' ? 'Nova Imagem' :
              type === 'delay' ? 'Novo Delay' : 'Novo Componente',
        message: type === 'message' ? 'Digite sua mensagem...' : undefined,
        question: type === 'question' ? 'Faça uma pergunta...' : undefined,
        url: type === 'action' ? 'https://api.exemplo.com' : 
             type === 'webhook' ? 'https://webhook.exemplo.com' : undefined,
        condition: type === 'condition' ? 'Se... então...' : undefined,
        audioUrl: type === 'audio' ? '' : undefined,
        videoUrl: type === 'video' ? '' : undefined,
        imageUrl: type === 'image' ? '' : undefined,
        delayType: type === 'delay' ? 'time' : undefined,
        delayAmount: type === 'delay' ? '5' : undefined,
        delayUnit: type === 'delay' ? 'minutes' : undefined
      },
    };

    setNodes((nds) => nds.concat(newNode));
    setDraggedType(null);
  }, [setNodes]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges.map(edge => ({
          ...edge,
          data: {
            ...edge.data,
            selected: selectedEdge?.id === edge.id,
            onDeleteEdge: deleteEdgeById
          },
          animated: selectedEdge?.id === edge.id ? false : edge.animated
        }))}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        className="bg-transparent"
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        <Background color="#e5e7eb" gap={20} size={1} />
        <Controls className="bg-white border border-gray-300 rounded-lg shadow-lg" />
      </ReactFlow>

      {/* Empty State */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl mx-auto">
              <Bot className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              Crie seu Primeiro Bot
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Arraste componentes da barra lateral para começar a construir seu fluxo de automação WhatsApp
            </p>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-lg max-w-sm mx-auto">
              <div className="flex items-center gap-2 text-blue-600 text-sm font-medium mb-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>💡 Dica Profissional</span>
              </div>
              <p className="text-gray-600 text-sm">
                Comece com um nó de "Mensagem" para dar boas-vindas aos seus clientes
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Seleção de Componente */}
      {showConnectionModal && connectionData && (
        <div 
          className="fixed z-50 pointer-events-none"
          style={{
            left: `${modalPosition.x}px`,
            top: `${modalPosition.y}px`,
            transform: modalPosition.dragging ? 'none' : 'translate(-50%, -50%)'
          }}
        >
          <div 
            className={`pointer-events-auto bg-white rounded-2xl shadow-2xl border w-80 animate-modal-appear ${isDraggingModal ? 'cursor-grabbing border-green-400 bg-green-50' : 'border-gray-100'}`}
            onMouseDown={handleModalMouseDown}
          >
            <div className={`p-4 border-b modal-drag-handle cursor-grab ${isDraggingModal ? 'border-green-200 bg-green-100' : 'border-gray-100'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 text-sm">Escolher Componente</h3>
                  <p className="text-gray-500 text-xs">Arraste para mover • Selecione para conectar</p>
                </div>
                <button
                  onClick={() => {
                    setShowConnectionModal(false);
                    setConnectionData(null);
                  }}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
              {componentTypes.map((component) => {
                const IconComponent = component.icon;
                return (
                  <button
                    key={component.type}
                    onClick={() => handleComponentSelect(component.type)}
                    className="w-full p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-xl transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 ${component.color} rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-200`}>
                        <IconComponent className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <h4 className="font-medium text-gray-800 text-xs">{component.name}</h4>
                        <p className="text-gray-500 text-xs">{component.description}</p>
                      </div>
                      <div className="w-5 h-5 rounded-md bg-white group-hover:bg-blue-100 border border-gray-200 flex items-center justify-center transition-colors">
                        <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-blue-600" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-3 pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center">
                Componente será criado e conectado
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Node Components
function MessageNode({ data, id }) {
  const [isEditing, setIsEditing] = useState(false);
  const [nodeName, setNodeName] = useState(data.name || "Mensagem");
  const [message, setMessage] = useState(data.message || "Digite sua mensagem...");

  const handleNameChange = (newName) => {
    setNodeName(newName);
    // TODO: Update node data in the flow
  };

  const handleMessageChange = (newMessage) => {
    setMessage(newMessage);
    // TODO: Update node data in the flow
  };

  return (
    <div className="bg-white border-2 border-blue-200 rounded-xl shadow-lg px-4 py-3 text-center w-56 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
          <MessageSquare className="w-4 h-4 text-white" />
        </div>
        <div className="text-left flex-1">
          {isEditing ? (
            <input
              type="text"
              value={nodeName}
              onChange={(e) => handleNameChange(e.target.value)}
              onBlur={() => setIsEditing(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
              className="text-gray-800 font-semibold text-sm bg-transparent border-none outline-none w-full"
              autoFocus
            />
          ) : (
            <h3 
              className="text-gray-800 font-semibold text-sm cursor-pointer hover:text-blue-600 transition-colors"
              onClick={() => setIsEditing(true)}
              title="Clique para editar"
            >
              {nodeName}
            </h3>
          )}
          <p className="text-gray-500 text-xs">Enviar texto</p>
        </div>
      </div>
      <div className="text-gray-600 text-sm bg-blue-50 p-2 rounded">
        <textarea
          value={message}
          onChange={(e) => handleMessageChange(e.target.value)}
          className="w-full bg-transparent resize-none border-none outline-none text-sm"
          placeholder="Digite sua mensagem..."
          rows="2"
        />
      </div>
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-blue-500" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-500" />
    </div>
  );
}

function QuestionNode({ data, id }) {
  const [isEditing, setIsEditing] = useState(false);
  const [nodeName, setNodeName] = useState(data.name || "Pergunta");
  const [question, setQuestion] = useState(data.question || "Faça uma pergunta...");

  const handleNameChange = (newName) => {
    setNodeName(newName);
    // TODO: Update node data in the flow
  };

  const handleQuestionChange = (newQuestion) => {
    setQuestion(newQuestion);
    // TODO: Update node data in the flow
  };

  return (
    <div className="bg-white border-2 border-purple-200 rounded-xl shadow-lg px-4 py-3 text-center w-56 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
          <HelpCircle className="w-4 h-4 text-white" />
        </div>
        <div className="text-left flex-1">
          {isEditing ? (
            <input
              type="text"
              value={nodeName}
              onChange={(e) => handleNameChange(e.target.value)}
              onBlur={() => setIsEditing(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
              className="text-gray-800 font-semibold text-sm bg-transparent border-none outline-none w-full"
              autoFocus
            />
          ) : (
            <h3 
              className="text-gray-800 font-semibold text-sm cursor-pointer hover:text-purple-600 transition-colors"
              onClick={() => setIsEditing(true)}
              title="Clique para editar"
            >
              {nodeName}
            </h3>
          )}
          <p className="text-gray-500 text-xs">Aguardar resposta</p>
        </div>
      </div>
      <div className="text-gray-600 text-sm bg-purple-50 p-2 rounded">
        <textarea
          value={question}
          onChange={(e) => handleQuestionChange(e.target.value)}
          className="w-full bg-transparent resize-none border-none outline-none text-sm"
          placeholder="Faça uma pergunta..."
          rows="2"
        />
      </div>
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-purple-500" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-purple-500" />
    </div>
  );
}

function ActionNode({ data, id }) {
  const [isEditing, setIsEditing] = useState(false);
  const [nodeName, setNodeName] = useState(data.name || "Ação HTTP");
  const [url, setUrl] = useState(data.url || "https://api.exemplo.com");

  const handleNameChange = (newName) => {
    setNodeName(newName);
    // TODO: Update node data in the flow
  };

  const handleUrlChange = (newUrl) => {
    setUrl(newUrl);
    // TODO: Update node data in the flow
  };

  return (
    <div className="bg-white border-2 border-green-200 rounded-xl shadow-lg px-4 py-3 text-center w-56 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div className="text-left flex-1">
          {isEditing ? (
            <input
              type="text"
              value={nodeName}
              onChange={(e) => handleNameChange(e.target.value)}
              onBlur={() => setIsEditing(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
              className="text-gray-800 font-semibold text-sm bg-transparent border-none outline-none w-full"
              autoFocus
            />
          ) : (
            <h3 
              className="text-gray-800 font-semibold text-sm cursor-pointer hover:text-green-600 transition-colors"
              onClick={() => setIsEditing(true)}
              title="Clique para editar"
            >
              {nodeName}
            </h3>
          )}
          <p className="text-gray-500 text-xs">Fazer requisição</p>
        </div>
      </div>
      <div className="text-gray-600 text-sm bg-green-50 p-2 rounded">
        <input
          type="text"
          value={url}
          onChange={(e) => handleUrlChange(e.target.value)}
          className="w-full bg-transparent border-none outline-none text-sm"
          placeholder="https://api.exemplo.com"
        />
      </div>
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-green-500" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-green-500" />
    </div>
  );
}

function ConditionNode({ data, id }) {
  const [isEditing, setIsEditing] = useState(false);
  const [nodeName, setNodeName] = useState(data.name || "Condição");
  const [condition, setCondition] = useState(data.condition || "Se... então...");

  const handleNameChange = (newName) => {
    setNodeName(newName);
    // TODO: Update node data in the flow
  };

  const handleConditionChange = (newCondition) => {
    setCondition(newCondition);
    // TODO: Update node data in the flow
  };

  return (
    <div className="bg-white border-2 border-yellow-200 rounded-xl shadow-lg px-4 py-3 text-center w-56 hover:shadow-xl transition-all duration-300 relative">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
          <GitBranch className="w-4 h-4 text-white" />
        </div>
        <div className="text-left flex-1">
          {isEditing ? (
            <input
              type="text"
              value={nodeName}
              onChange={(e) => handleNameChange(e.target.value)}
              onBlur={() => setIsEditing(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
              className="text-gray-800 font-semibold text-sm bg-transparent border-none outline-none w-full"
              autoFocus
            />
          ) : (
            <h3 
              className="text-gray-800 font-semibold text-sm cursor-pointer hover:text-yellow-600 transition-colors"
              onClick={() => setIsEditing(true)}
              title="Clique para editar"
            >
              {nodeName}
            </h3>
          )}
          <p className="text-gray-500 text-xs">Avaliar regra</p>
        </div>
      </div>
      <div className="text-gray-600 text-sm bg-yellow-50 p-2 rounded mb-2">
        <textarea
          value={condition}
          onChange={(e) => handleConditionChange(e.target.value)}
          className="w-full bg-transparent resize-none border-none outline-none text-sm"
          placeholder="Se... então..."
          rows="2"
        />
      </div>
      
      {/* Labels para as saídas */}
      <div className="flex justify-between text-xs text-gray-500 px-2">
        <span className="text-green-600">✓ Sim</span>
        <span className="text-red-600">✗ Não</span>
      </div>
      
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-yellow-500" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-green-500" id="true" style={{ top: '40%' }} />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-red-500" id="false" style={{ top: '70%' }} />
    </div>
  );
}

// StartNode Component
function StartNode({ data, id }) {
  const [isEditing, setIsEditing] = useState(false);
  const [nodeName, setNodeName] = useState(data.name || "Início");

  const handleNameChange = (newName) => {
    setNodeName(newName);
    // TODO: Update node data in the flow
  };

  // Check if node has connections (this would need to be passed from parent or calculated)
  // For now, we'll assume it's not connected to show animation
  const hasConnections = false; // TODO: Get this from flow state

  return (
    <div className="relative">
      {/* Main circular node */}
      <div className={`w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 ${!hasConnections ? 'animate-pulse-green' : ''}`}>
        <Play className={`w-10 h-10 text-white ml-1 ${!hasConnections ? 'animate-bounce-subtle' : ''}`} />
      </div>
      
      {/* Editable name below the circle */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-24">
        {isEditing ? (
          <input
            type="text"
            value={nodeName}
            onChange={(e) => handleNameChange(e.target.value)}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
            className="text-gray-800 font-semibold text-sm bg-transparent border-none outline-none w-full text-center"
            autoFocus
          />
        ) : (
          <h3 
            className="text-gray-800 font-semibold text-sm cursor-pointer hover:text-green-600 transition-colors text-center"
            onClick={() => setIsEditing(true)}
            title="Clique para editar"
          >
            {nodeName}
          </h3>
        )}
      </div>

      {/* Connection handle */}
      <Handle type="source" position={Position.Right} className="w-4 h-4 bg-green-500" />
    </div>
  );
}

// WebhookNode Component
function WebhookNode({ data, id }) {
  const [isEditing, setIsEditing] = useState(false);
  const [nodeName, setNodeName] = useState(data.name || "Webhook");
  const [url, setUrl] = useState(data.url || "https://webhook.exemplo.com");

  const handleNameChange = (newName) => {
    setNodeName(newName);
    // TODO: Update node data in the flow
  };

  const handleUrlChange = (newUrl) => {
    setUrl(newUrl);
    // TODO: Update node data in the flow
  };

  return (
    <div className="bg-white border-2 border-orange-200 rounded-xl shadow-lg px-4 py-3 text-center w-56 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
          <Webhook className="w-4 h-4 text-white" />
        </div>
        <div className="text-left flex-1">
          {isEditing ? (
            <input
              type="text"
              value={nodeName}
              onChange={(e) => handleNameChange(e.target.value)}
              onBlur={() => setIsEditing(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
              className="text-gray-800 font-semibold text-sm bg-transparent border-none outline-none w-full"
              autoFocus
            />
          ) : (
            <h3 
              className="text-gray-800 font-semibold text-sm cursor-pointer hover:text-orange-600 transition-colors"
              onClick={() => setIsEditing(true)}
              title="Clique para editar"
            >
              {nodeName}
            </h3>
          )}
          <p className="text-gray-500 text-xs">Receber dados</p>
        </div>
      </div>
      <div className="text-gray-600 text-sm bg-orange-50 p-2 rounded">
        <input
          type="text"
          value={url}
          onChange={(e) => handleUrlChange(e.target.value)}
          className="w-full bg-transparent border-none outline-none text-sm"
          placeholder="https://webhook.exemplo.com"
        />
      </div>
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-orange-500" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-orange-500" />
    </div>
  );
}

// AudioNode Component
function AudioNode({ data, id }) {
  const [isEditing, setIsEditing] = useState(false);
  const [nodeName, setNodeName] = useState(data.name || "Áudio");
  const [audioUrl, setAudioUrl] = useState(data.audioUrl || "");

  const handleNameChange = (newName) => {
    setNodeName(newName);
    // TODO: Update node data in the flow
  };

  const handleAudioUrlChange = (newUrl) => {
    setAudioUrl(newUrl);
    // TODO: Update node data in the flow
  };

  return (
    <div className="bg-white border-2 border-pink-200 rounded-xl shadow-lg px-4 py-3 text-center w-56 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center">
          <Volume2 className="w-4 h-4 text-white" />
        </div>
        <div className="text-left flex-1">
          {isEditing ? (
            <input
              type="text"
              value={nodeName}
              onChange={(e) => handleNameChange(e.target.value)}
              onBlur={() => setIsEditing(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
              className="text-gray-800 font-semibold text-sm bg-transparent border-none outline-none w-full"
              autoFocus
            />
          ) : (
            <h3 
              className="text-gray-800 font-semibold text-sm cursor-pointer hover:text-pink-600 transition-colors"
              onClick={() => setIsEditing(true)}
              title="Clique para editar"
            >
              {nodeName}
            </h3>
          )}
          <p className="text-gray-500 text-xs">Enviar áudio</p>
        </div>
      </div>
      <div className="text-gray-600 text-sm bg-pink-50 p-2 rounded">
        <input
          type="text"
          value={audioUrl}
          onChange={(e) => handleAudioUrlChange(e.target.value)}
          className="w-full bg-transparent border-none outline-none text-sm"
          placeholder="URL do áudio ou carregar arquivo"
        />
      </div>
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-pink-500" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-pink-500" />
    </div>
  );
}

// VideoNode Component
function VideoNode({ data, id }) {
  const [isEditing, setIsEditing] = useState(false);
  const [nodeName, setNodeName] = useState(data.name || "Vídeo");
  const [videoUrl, setVideoUrl] = useState(data.videoUrl || "");

  const handleNameChange = (newName) => {
    setNodeName(newName);
    // TODO: Update node data in the flow
  };

  const handleVideoUrlChange = (newUrl) => {
    setVideoUrl(newUrl);
    // TODO: Update node data in the flow
  };

  return (
    <div className="bg-white border-2 border-red-200 rounded-xl shadow-lg px-4 py-3 text-center w-56 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
          <Video className="w-4 h-4 text-white" />
        </div>
        <div className="text-left flex-1">
          {isEditing ? (
            <input
              type="text"
              value={nodeName}
              onChange={(e) => handleNameChange(e.target.value)}
              onBlur={() => setIsEditing(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
              className="text-gray-800 font-semibold text-sm bg-transparent border-none outline-none w-full"
              autoFocus
            />
          ) : (
            <h3 
              className="text-gray-800 font-semibold text-sm cursor-pointer hover:text-red-600 transition-colors"
              onClick={() => setIsEditing(true)}
              title="Clique para editar"
            >
              {nodeName}
            </h3>
          )}
          <p className="text-gray-500 text-xs">Enviar vídeo</p>
        </div>
      </div>
      <div className="text-gray-600 text-sm bg-red-50 p-2 rounded">
        <input
          type="text"
          value={videoUrl}
          onChange={(e) => handleVideoUrlChange(e.target.value)}
          className="w-full bg-transparent border-none outline-none text-sm"
          placeholder="URL do vídeo ou carregar arquivo"
        />
      </div>
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-red-500" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-red-500" />
    </div>
  );
}

// ImageNode Component
function ImageNode({ data, id }) {
  const [isEditing, setIsEditing] = useState(false);
  const [nodeName, setNodeName] = useState(data.name || "Imagem");
  const [imageUrl, setImageUrl] = useState(data.imageUrl || "");

  const handleNameChange = (newName) => {
    setNodeName(newName);
    // TODO: Update node data in the flow
  };

  const handleImageUrlChange = (newUrl) => {
    setImageUrl(newUrl);
    // TODO: Update node data in the flow
  };

  return (
    <div className="bg-white border-2 border-indigo-200 rounded-xl shadow-lg px-4 py-3 text-center w-56 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
          <Image className="w-4 h-4 text-white" />
        </div>
        <div className="text-left flex-1">
          {isEditing ? (
            <input
              type="text"
              value={nodeName}
              onChange={(e) => handleNameChange(e.target.value)}
              onBlur={() => setIsEditing(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
              className="text-gray-800 font-semibold text-sm bg-transparent border-none outline-none w-full"
              autoFocus
            />
          ) : (
            <h3 
              className="text-gray-800 font-semibold text-sm cursor-pointer hover:text-indigo-600 transition-colors"
              onClick={() => setIsEditing(true)}
              title="Clique para editar"
            >
              {nodeName}
            </h3>
          )}
          <p className="text-gray-500 text-xs">Enviar imagem</p>
        </div>
      </div>
      <div className="text-gray-600 text-sm bg-indigo-50 p-2 rounded">
        <input
          type="text"
          value={imageUrl}
          onChange={(e) => handleImageUrlChange(e.target.value)}
          className="w-full bg-transparent border-none outline-none text-sm"
          placeholder="URL da imagem ou carregar arquivo"
        />
      </div>
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-indigo-500" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-indigo-500" />
    </div>
  );
}

// DelayNode Component
function DelayNode({ data, id }) {
  const [isEditing, setIsEditing] = useState(false);
  const [nodeName, setNodeName] = useState(data.name || "Delay");
  const [delayType, setDelayType] = useState(data.delayType || "time");
  const [delayAmount, setDelayAmount] = useState(data.delayAmount || "5");
  const [delayUnit, setDelayUnit] = useState(data.delayUnit || "minutes");

  const handleNameChange = (newName) => {
    setNodeName(newName);
    // TODO: Update node data in the flow
  };

  const handleDelayTypeChange = (newType) => {
    setDelayType(newType);
    // TODO: Update node data in the flow
  };

  const handleDelayAmountChange = (newAmount) => {
    setDelayAmount(newAmount);
    // TODO: Update node data in the flow
  };

  const handleDelayUnitChange = (newUnit) => {
    setDelayUnit(newUnit);
    // TODO: Update node data in the flow
  };

  return (
    <div className="bg-white border-2 border-teal-200 rounded-xl shadow-lg px-4 py-3 text-center w-56 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
          <Clock className="w-4 h-4 text-white" />
        </div>
        <div className="text-left flex-1">
          {isEditing ? (
            <input
              type="text"
              value={nodeName}
              onChange={(e) => handleNameChange(e.target.value)}
              onBlur={() => setIsEditing(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
              className="text-gray-800 font-semibold text-sm bg-transparent border-none outline-none w-full"
              autoFocus
            />
          ) : (
            <h3 
              className="text-gray-800 font-semibold text-sm cursor-pointer hover:text-teal-600 transition-colors"
              onClick={() => setIsEditing(true)}
              title="Clique para editar"
            >
              {nodeName}
            </h3>
          )}
          <p className="text-gray-500 text-xs">Aguardar tempo</p>
        </div>
      </div>
      
      <div className="text-gray-600 text-sm bg-teal-50 p-2 rounded space-y-2">
        <div className="flex gap-2">
          <select
            value={delayType}
            onChange={(e) => handleDelayTypeChange(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm"
          >
            <option value="time">Aguardar tempo</option>
            <option value="response">Aguardar resposta</option>
          </select>
        </div>
        
        {delayType === "time" && (
          <div className="flex gap-1">
            <input
              type="number"
              value={delayAmount}
              onChange={(e) => handleDelayAmountChange(e.target.value)}
              className="w-16 bg-transparent border-none outline-none text-sm text-center"
              min="1"
            />
            <select
              value={delayUnit}
              onChange={(e) => handleDelayUnitChange(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm"
            >
              <option value="minutes">minutos</option>
              <option value="hours">horas</option>
              <option value="days">dias</option>
            </select>
          </div>
        )}
      </div>
      
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-teal-500" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-teal-500" />
    </div>
  );
}

// CustomEdge Component
function CustomEdge({ 
  id, 
  sourceX, 
  sourceY, 
  targetX, 
  targetY, 
  sourcePosition, 
  targetPosition, 
  style = {}, 
  markerEnd, 
  data
}) {
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
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: data?.selected ? '#ef4444' : (style?.stroke || '#3b82f6'),
          strokeWidth: data?.selected ? 3 : (style?.strokeWidth || 2)
        }}
      />
      {data?.selected && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 12,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (data?.onDeleteEdge) {
                  data.onDeleteEdge(id);
                }
              }}
              className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 border-2 border-white"
              title="Desconectar"
            >
              <Unlink className="w-4 h-4" />
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

// Node Types
const nodeTypes = { 
  start: StartNode,
  message: MessageNode, 
  question: QuestionNode,
  action: ActionNode,
  condition: ConditionNode,
  webhook: WebhookNode,
  audio: AudioNode,
  video: VideoNode,
  image: ImageNode,
  delay: DelayNode
};

// Edge Types
const edgeTypes = {
  custom: CustomEdge,
};

// Component Definitions for Sidebar
const componentTypes = [
  {
    type: 'message',
    icon: MessageSquare,
    name: 'Mensagem',
    description: 'Enviar mensagem de texto',
    color: 'bg-blue-500',
    borderColor: 'border-blue-200'
  },
  {
    type: 'question',
    icon: HelpCircle,
    name: 'Pergunta',
    description: 'Fazer pergunta ao usuário',
    color: 'bg-purple-500',
    borderColor: 'border-purple-200'
  },
  {
    type: 'action',
    icon: Zap,
    name: 'Ação HTTP',
    description: 'Fazer requisição externa',
    color: 'bg-green-500',
    borderColor: 'border-green-200'
  },
  {
    type: 'condition',
    icon: GitBranch,
    name: 'Condição',
    description: 'Avaliar condições',
    color: 'bg-yellow-500',
    borderColor: 'border-yellow-200'
  },
  {
    type: 'webhook',
    icon: Webhook,
    name: 'Webhook',
    description: 'Receber dados externos',
    color: 'bg-orange-500',
    borderColor: 'border-orange-200'
  },
  {
    type: 'audio',
    icon: Volume2,
    name: 'Áudio',
    description: 'Enviar mensagem de áudio',
    color: 'bg-pink-500',
    borderColor: 'border-pink-200'
  },
  {
    type: 'video',
    icon: Video,
    name: 'Vídeo',
    description: 'Enviar mensagem de vídeo',
    color: 'bg-red-500',
    borderColor: 'border-red-200'
  },
  {
    type: 'image',
    icon: Image,
    name: 'Imagem',
    description: 'Enviar mensagem de imagem',
    color: 'bg-indigo-500',
    borderColor: 'border-indigo-200'
  },
  {
    type: 'delay',
    icon: Clock,
    name: 'Delay',
    description: 'Aguardar tempo ou resposta',
    color: 'bg-teal-500',
    borderColor: 'border-teal-200'
  }
];

// Initial Data
const initialNodes = [
  {
    id: "start-1",
    type: "start",
    data: { 
      name: "Início"
    },
    position: { x: 300, y: 250 },
  },
];

const initialEdges = [];

export default function App() {
  const [draggedType, setDraggedType] = useState(null);

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
    setDraggedType(nodeType);
  };

  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 shadow-xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200" style={{ background: 'linear-gradient(to bottom right, #3b82f6, #1e40af)' }}>
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <Bot className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">O SÓCIO HOTELEIRO</h1>
              <p className="text-blue-100 text-sm">Inteligência Artificial Hoteleira</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-3 gap-2">
            <button className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:shadow-sm transition-all duration-200 text-sm font-medium">
              <Save className="w-4 h-4" />
              Salvar
            </button>
            <button className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:shadow-sm transition-all duration-200 text-sm font-medium">
              <Upload className="w-4 h-4" />
              Carregar
            </button>
            <button className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-red-50 hover:border-red-200 hover:text-red-600 hover:shadow-sm transition-all duration-200 text-sm font-medium">
              <Trash2 className="w-4 h-4" />
              Limpar
            </button>
          </div>
        </div>

        {/* Components */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-3">
            {componentTypes.map((component) => {
              const IconComponent = component.icon;
              return (
                <div
                  key={component.type}
                  className="group cursor-grab active:cursor-grabbing"
                  draggable
                  onDragStart={(event) => onDragStart(event, component.type)}
                >
                  <div className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-300 hover:border-gray-300">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 ${component.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 text-sm">{component.name}</h4>
                        <p className="text-gray-500 text-xs">{component.description}</p>
                      </div>
                      <div className="w-6 h-6 rounded-lg bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors">
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-center text-xs text-gray-500">
            <p className="font-semibold text-gray-700">💡 Dica Profissional</p>
            <p>Clique duplo nos componentes para configurar</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm" style={{ paddingLeft: '4rem', paddingRight: '4rem', paddingTop: '1.25rem', paddingBottom: '1.25rem' }}>
          <div className="flex items-center justify-between max-w-full mx-auto">
            <div>
              <nav className="flex items-center" style={{ gap: '1.5rem' }}>
                <button 
                  className="flex items-center"
                  style={{
                    gap: '0.5rem',
                    padding: '0.75rem 1.25rem',
                    color: '#2563eb',
                    backgroundColor: '#eff6ff',
                    borderRadius: '0.75rem',
                    fontWeight: '500',
                    fontSize: '0.875rem',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    border: 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <BarChart3 className="w-4 h-4" />
                  Dashboard
                </button>
                <button 
                  className="flex items-center"
                  style={{
                    gap: '0.5rem',
                    padding: '0.75rem 1.25rem',
                    color: '#6b7280',
                    backgroundColor: 'transparent',
                    borderRadius: '0.75rem',
                    fontWeight: '500',
                    fontSize: '0.875rem',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    border: 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Bot className="w-4 h-4" />
                  Novo Fluxo
                </button>
                <button 
                  className="flex items-center"
                  style={{
                    gap: '0.5rem',
                    padding: '0.75rem 1.25rem',
                    color: '#6b7280',
                    backgroundColor: 'transparent',
                    borderRadius: '0.75rem',
                    fontWeight: '500',
                    fontSize: '0.875rem',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    border: 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Settings className="w-4 h-4" />
                  Treinar IA
                </button>
                <button 
                  className="flex items-center"
                  style={{
                    gap: '0.5rem',
                    padding: '0.75rem 1.25rem',
                    color: '#6b7280',
                    backgroundColor: 'transparent',
                    borderRadius: '0.75rem',
                    fontWeight: '500',
                    fontSize: '0.875rem',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    border: 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Bell className="w-4 h-4" />
                  Área do Hotel
                </button>
              </nav>
            </div>
            
            <div className="flex items-center" style={{ gap: '1rem' }}>
              <button 
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.75rem',
                  backgroundColor: '#eff6ff',
                  color: '#2563eb',
                  border: 'none',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Bell className="w-5 h-5" />
              </button>
              <button 
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.75rem',
                  backgroundColor: '#ecfdf5',
                  color: '#059669',
                  border: 'none',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <BarChart3 className="w-5 h-5" />
              </button>
              <button 
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.75rem',
                  backgroundColor: '#faf5ff',
                  color: '#9333ea',
                  border: 'none',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Settings className="w-5 h-5" />
              </button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: '1.5rem', paddingLeft: '1.5rem', borderLeft: '1px solid #e5e7eb' }}>
                <button 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(to right, #2563eb, #1d4ed8)',
                    color: 'white',
                    borderRadius: '0.75rem',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.3s ease',
                    fontWeight: '500',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  <Play className="w-5 h-5" />
                  <span>Testar</span>
                </button>
                <button 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(to right, #059669, #047857)',
                    color: 'white',
                    borderRadius: '0.75rem',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.3s ease',
                    fontWeight: '500',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  <Play className="w-5 h-5" />
                  <span>Publicar Bot</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Flow Canvas */}
        <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 relative">
          <ReactFlowProvider>
            <FlowComponent />
          </ReactFlowProvider>
        </div>
      </div>

    </div>
  );
}