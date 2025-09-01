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
import DelayNode from '../Nodes/DelayNode';
import ImageNode from '../Nodes/ImageNode';
import VideoNode from '../Nodes/VideoNode';
import AudioNode from '../Nodes/AudioNode';
import WebhookNode from '../Nodes/WebhookNode';
import CustomEdge from '../Edges/CustomEdge';

const nodeTypes = {
  startNode: StartNode,
  delayNode: DelayNode,
  imageNode: ImageNode,
  videoNode: VideoNode,
  audioNode: AudioNode,
  webhookNode: WebhookNode,
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
        setNodes(parsedData.nodes);
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
          config: getDefaultConfig(type)
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes, readOnly]
  );

  const getDefaultLabel = (nodeType) => {
    const labels = {
      startNode: 'Início',
      delayNode: 'Atraso',
      imageNode: 'Imagem',
      videoNode: 'Vídeo',
      audioNode: 'Áudio',
      webhookNode: 'Webhook',
    };
    return labels[nodeType] || 'Nó';
  };

  const getDefaultConfig = (nodeType) => {
    const configs = {
      startNode: { message: 'Bem-vindo!' },
      delayNode: { delay: 1000 },
      imageNode: { url: '', alt: 'Imagem' },
      videoNode: { url: '', title: 'Vídeo' },
      audioNode: { url: '', title: 'Áudio' },
      webhookNode: { url: '', method: 'POST' },
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
          height: 600px;
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
          border: 2px solid white !important;
          width: 8px !important;
          height: 8px !important;
        }
        
        .flow-editor-container .react-flow__handle:hover {
          background: #2d47d3 !important;
          transform: scale(1.2) !important;
        }
        
        .flow-editor-toolbar {
          display: flex;
          gap: 8px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.9);
          border-bottom: 1px solid rgba(84, 122, 241, 0.2);
          backdrop-filter: blur(8px);
        }
        
        .flow-editor-node-palette {
          display: flex;
          gap: 8px;
        }
        
        .node-palette-item {
          padding: 8px 12px;
          background: rgba(84, 122, 241, 0.1);
          border: 1px solid rgba(84, 122, 241, 0.3);
          border-radius: 6px;
          cursor: grab;
          font-size: 12px;
          font-weight: 500;
          color: #2d47d3;
          transition: all 0.2s ease;
          user-select: none;
        }
        
        .node-palette-item:hover {
          background: rgba(84, 122, 241, 0.2);
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(45, 71, 211, 0.15);
        }
        
        .node-palette-item:active {
          cursor: grabbing;
        }
        
        .flow-editor-save-btn {
          padding: 8px 16px;
          background: linear-gradient(145deg, #547af1 0%, #2d47d3 100%);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-left: auto;
        }
        
        .flow-editor-save-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(45, 71, 211, 0.3);
        }
        
        .flow-editor-save-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
        
        .flow-editor-loading {
          padding: 20px;
        }
      `}</style>
      
      {!readOnly && (
        <div className="flow-editor-toolbar">
          <div className="flow-editor-node-palette">
            <div 
              className="node-palette-item"
              draggable
              onDragStart={(e) => e.dataTransfer.setData('application/reactflow', 'delayNode')}
            >
              ⏱️ Atraso
            </div>
            <div 
              className="node-palette-item"
              draggable
              onDragStart={(e) => e.dataTransfer.setData('application/reactflow', 'imageNode')}
            >
              🖼️ Imagem
            </div>
            <div 
              className="node-palette-item"
              draggable
              onDragStart={(e) => e.dataTransfer.setData('application/reactflow', 'videoNode')}
            >
              🎥 Vídeo
            </div>
            <div 
              className="node-palette-item"
              draggable
              onDragStart={(e) => e.dataTransfer.setData('application/reactflow', 'audioNode')}
            >
              🎵 Áudio
            </div>
            <div 
              className="node-palette-item"
              draggable
              onDragStart={(e) => e.dataTransfer.setData('application/reactflow', 'webhookNode')}
            >
              🔗 Webhook
            </div>
          </div>
          
          <button 
            className="flow-editor-save-btn"
            onClick={handleSave}
            disabled={!onSave}
          >
            💾 Salvar Fluxo
          </button>
        </div>
      )}
      
      <div 
        className="reactflow-wrapper" 
        ref={reactFlowWrapper}
        style={{ width: '100%', height: readOnly ? '100%' : 'calc(100% - 60px)' }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={readOnly ? undefined : onNodesChange}
          onEdgesChange={readOnly ? undefined : onEdgesChange}
          onConnect={readOnly ? undefined : onConnect}
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
    </div>
  );
};

export default FlowEditor;