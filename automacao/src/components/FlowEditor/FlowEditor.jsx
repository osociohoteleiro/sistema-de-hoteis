import { useCallback, useRef, useState, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  ConnectionLineType,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

import StartNode from '../Nodes/StartNode';
import MessageNode from '../Nodes/MessageNode';
import QuestionNode from '../Nodes/QuestionNode';
import ActionNode from '../Nodes/ActionNode';
import ConditionNode from '../Nodes/ConditionNode';
import EmailNode from '../Nodes/EmailNode';
import GoToNode from '../Nodes/GoToNode';
import CustomEdge from '../Edges/CustomEdge';
import NodeSelectorModal from './NodeSelectorModal';
import NodeConfigSidebar from './NodeConfigSidebar';

const nodeTypes = {
  startNode: StartNode,
  messageNode: MessageNode,
  questionNode: QuestionNode,
  actionNode: ActionNode,
  conditionNode: ConditionNode,
  emailNode: EmailNode,
  goToNode: GoToNode,
};

const edgeTypes = {
  'custom-edge': CustomEdge,
};

const FlowEditor = ({ flowData, onSave, readOnly = false }) => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 100, y: 100 });
  const [pendingConnection, setPendingConnection] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedNodeType, setSelectedNodeType] = useState(null);
  const [selectedNodeData, setSelectedNodeData] = useState(null);

  useEffect(() => {
    if (flowData && flowData.data) {
      const parsedData = typeof flowData.data === 'string' ? JSON.parse(flowData.data) : flowData.data;
      
      // Se não há nós, adicionar automaticamente um nó de início
      if (!parsedData.nodes || parsedData.nodes.length === 0) {
        const startNode = {
          id: 'start_node_1',
          type: 'startNode',
          position: { x: 100, y: 250 },
          data: { 
            label: 'Início',
            config: { message: 'Bem-vindo!' }
          },
        };
        setNodes([startNode]);
      } else {
        // Adicionar funções aos nós existentes
        const nodesWithHandlers = parsedData.nodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            // Não adicionar onDelete para nós de início
            ...(node.type !== 'startNode' && { onDelete: handleNodeDelete }),
            // Adicionar função de clique para todos os nós (exceto startNode)
            ...(node.type !== 'startNode' && { onNodeClick: handleNodeClick })
          }
        }));
        setNodes(nodesWithHandlers);
      }
      
      if (parsedData.edges) setEdges(parsedData.edges);
    } else {
      // Se não há dados de fluxo, criar um nó de início padrão
      const startNode = {
        id: 'start_node_1',
        type: 'startNode',
        position: { x: 100, y: 250 },
        data: { 
          label: 'Início',
          config: { message: 'Bem-vindo!' }
        },
      };
      setNodes([startNode]);
    }
    setIsLoading(false);
  }, [flowData, setNodes, setEdges]);

  const onConnect = useCallback(
    (params) => {
      if (!readOnly) {
        setEdges((eds) => addEdge({ 
          ...params, 
          type: 'custom-edge',
          data: { onEdgeDelete: handleEdgeDelete }
        }, eds));
      }
    },
    [setEdges, readOnly]
  );

  const onConnectStart = useCallback((_, { nodeId, handleId, handleType }) => {
    setPendingConnection({ nodeId, handleId, handleType });
  }, []);

  const onConnectEnd = useCallback((event) => {
    if (!readOnly && pendingConnection && reactFlowInstance) {
      const targetIsPane = event.target.classList.contains('react-flow__pane');
      
      if (targetIsPane) {
        // Conexão foi solta em área vazia - mostrar modal
        // Posicionar para que o centro do header fique exatamente no cursor
        
        // Converter coordenadas da tela para coordenadas do flow
        const flowPosition = reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY
        });
        
        // Ajustar para que o centro do header (largura 320px, altura header ~56px) 
        // fique no ponto do cursor
        const adjustedPosition = {
          x: flowPosition.x - 160,  // 320px / 2 = 160px para centralizar horizontalmente
          y: flowPosition.y - 28    // ~56px / 2 = 28px para centralizar no meio do header
        };
        
        console.log('📍 Cursor em tela:', { x: event.clientX, y: event.clientY });
        console.log('📍 Posição no flow:', flowPosition);
        console.log('📍 Posição ajustada modal:', adjustedPosition);
        console.log('🎯 ReactFlow instance:', reactFlowInstance);
        
        setModalPosition(adjustedPosition);
        setShowModal(true);
      }
    }
    setPendingConnection(null);
  }, [readOnly, pendingConnection, reactFlowInstance]);

  const handleEdgeDelete = useCallback(
    (edgeId) => {
      setEdges((edges) => edges.filter((edge) => edge.id !== edgeId));
    },
    [setEdges]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      if (readOnly) return;

      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: `${type}_${Date.now()}`,
        type,
        position,
        data: { 
          label: getDefaultLabel(type),
          config: getDefaultConfig(type),
          onDelete: handleNodeDelete,
          onNodeClick: handleNodeClick
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes, readOnly]
  );

  const getDefaultLabel = (nodeType) => {
    const labels = {
      startNode: 'Início',
      messageNode: 'Mensagem',
      questionNode: 'Pergunta',
      actionNode: 'Ação',
      conditionNode: 'Condição',
      emailNode: 'Email',
      goToNode: 'Ir Para',
    };
    return labels[nodeType] || 'Nó';
  };

  const getDefaultConfig = (nodeType) => {
    const configs = {
      startNode: { message: 'Bem-vindo!' },
      messageNode: { messages: [''] },
      questionNode: { question: '', variable: '', validation: 'none' },
      actionNode: { actionType: 'set_variable', variable: '', value: '' },
      conditionNode: { condition: '', variable: '', operator: 'equals', value: '' },
      emailNode: { to: '', subject: '', body: '' },
      goToNode: { targetFlow: '', targetNode: '' },
    };
    return configs[nodeType] || {};
  };

  const handleSave = () => {
    if (onSave && !readOnly) {
      const flowData = {
        nodes: nodes,
        edges: edges,
        viewport: reactFlowInstance?.getViewport() || { x: 0, y: 0, zoom: 1 }
      };
      onSave(flowData);
    }
  };

  const handleModalNodeSelect = (nodeType, nodeLabel) => {
    console.log('🎯 Componente selecionado no modal:', nodeType, nodeLabel);
    
    // Fechar o modal
    setShowModal(false);
    setPendingConnection(null);
    
    // Abrir a sidebar com as informações do componente selecionado
    setSelectedNodeId(null); // Não há nó criado ainda
    setSelectedNodeType(nodeLabel); // Usar o label legível
    setSelectedNodeData({ 
      label: nodeLabel,
      config: getDefaultConfig(nodeType) 
    });
    setShowSidebar(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setPendingConnection(null);
  };

  const handleNodeDelete = useCallback((nodeId) => {
    console.log('🗑️ Excluindo nó:', nodeId);
    
    // Remover todas as conexões relacionadas ao nó
    setEdges((edges) => edges.filter((edge) => 
      edge.source !== nodeId && edge.target !== nodeId
    ));
    
    // Remover o nó
    setNodes((nodes) => nodes.filter((node) => node.id !== nodeId));
  }, [setEdges, setNodes]);

  const handleNodeClick = useCallback((nodeId, nodeType, nodeData) => {
    console.log('🎯 Clique no nó:', { nodeId, nodeType, nodeData });
    
    setSelectedNodeId(nodeId);
    setSelectedNodeType(nodeType);
    setSelectedNodeData(nodeData);
    setShowSidebar(true);
  }, []);

  const handleSidebarClose = useCallback(() => {
    setShowSidebar(false);
    setSelectedNodeId(null);
    setSelectedNodeType(null);
    setSelectedNodeData(null);
  }, []);

  const onNodeDragStart = (event, node) => {
    event.dataTransfer.setData('application/reactflow', node.type);
  };

  if (isLoading) {
    return (
      <div className="flow-editor-container">
        <div className="flow-editor-loading">
          <div className="animate-pulse bg-sapphire-200/40 rounded-lg h-96 flex items-center justify-center">
            <span className="text-steel-600">Carregando editor de fluxo...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flow-editor-container">
      <style>{`
        .flow-editor-container {
          width: 100%;
          height: 100%;
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          background: linear-gradient(145deg, rgba(240, 244, 255, 0.95) 0%, rgba(225, 234, 254, 0.85) 100%);
          border: 1px solid rgba(84, 122, 241, 0.3);
        }
        
        .flow-editor-container .react-flow {
          background: transparent !important;
        }
        
        .flow-editor-container .react-flow__background {
          background-color: rgba(255, 255, 255, 0.1) !important;
        }
        
        .flow-editor-container .react-flow__controls {
          background: rgba(255, 255, 255, 0.9) !important;
          border: 1px solid rgba(84, 122, 241, 0.2) !important;
          border-radius: 8px !important;
          backdrop-filter: blur(8px) !important;
        }
        
        .flow-editor-container .react-flow__controls button {
          background: rgba(255, 255, 255, 0.8) !important;
          border: none !important;
          color: #2d47d3 !important;
          transition: all 0.2s ease !important;
        }
        
        .flow-editor-container .react-flow__controls button:hover {
          background: rgba(84, 122, 241, 0.1) !important;
          transform: scale(1.05) !important;
        }
        
        .flow-editor-container .react-flow__node {
          border-radius: 8px !important;
          border: 2px solid rgba(84, 122, 241, 0.3) !important;
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 244, 255, 0.85) 100%) !important;
          box-shadow: 0 4px 16px rgba(45, 71, 211, 0.1) !important;
          backdrop-filter: blur(8px) !important;
        }
        
        .flow-editor-container .react-flow__node.selected {
          border-color: rgba(84, 122, 241, 0.6) !important;
          box-shadow: 0 8px 24px rgba(45, 71, 211, 0.2) !important;
        }
        
        .flow-editor-container .react-flow__edge-path {
          stroke: #3b82f6 !important;
          stroke-width: 1.5px !important;
        }
        
        .flow-editor-container .react-flow__edge.selected .react-flow__edge-path {
          stroke: #2563eb !important;
          stroke-width: 2px !important;
        }
        
        .flow-editor-container .react-flow__handle {
          background: #547af1 !important;
          border: 3px solid white !important;
          width: 16px !important;
          height: 16px !important;
          border-radius: 50% !important;
        }
        
        .flow-editor-container .react-flow__handle:hover {
          background: #2d47d3 !important;
          transform: scale(1.3) !important;
          box-shadow: 0 4px 12px rgba(84, 122, 241, 0.4) !important;
        }
        
        
        .flow-editor-loading {
          padding: 20px;
        }
      `}</style>
      
      
      <div 
        className="reactflow-wrapper" 
        ref={reactFlowWrapper}
        style={{ width: '100%', height: '100%' }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={readOnly ? undefined : onNodesChange}
          onEdgesChange={readOnly ? undefined : onEdgesChange}
          onConnect={readOnly ? undefined : onConnect}
          onConnectStart={readOnly ? undefined : onConnectStart}
          onConnectEnd={readOnly ? undefined : onConnectEnd}
          onInit={setReactFlowInstance}
          onDrop={readOnly ? undefined : onDrop}
          onDragOver={readOnly ? undefined : onDragOver}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionLineType={ConnectionLineType.SmoothStep}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          minZoom={0.2}
          maxZoom={2}
          attributionPosition="bottom-left"
          proOptions={{ hideAttribution: true }}
        >
          <Controls position="top-right" />
          <Background color="#547af1" gap={20} size={1} />
        </ReactFlow>
      </div>

      <NodeSelectorModal
        isVisible={showModal}
        onClose={handleModalClose}
        onNodeSelect={handleModalNodeSelect}
        position={modalPosition}
      />

      <NodeConfigSidebar
        isVisible={showSidebar}
        nodeId={selectedNodeId}
        nodeType={selectedNodeType}
        nodeData={selectedNodeData}
        onClose={handleSidebarClose}
        onSave={(nodeId, newData) => {
          // TODO: Implementar salvamento das configurações do nó
          console.log('💾 Salvando configurações:', { nodeId, newData });
          handleSidebarClose();
        }}
      />
    </div>
  );
};

export default FlowEditor;