import React, { useCallback, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  Panel
} from 'reactflow';
import { nodeTypes } from '../Nodes';
import { generateNodeId } from '../../utils/nodeTypes';
import { ZoomIn, ZoomOut, Maximize, RotateCcw, MapPin, Grid, Eye } from 'lucide-react';

const FlowCanvas = ({ 
  nodes, 
  edges, 
  onNodesChange, 
  onEdgesChange, 
  onConnect,
  onNodeClick,
  onPaneClick,
  addNode,
  reactFlowInstance
}) => {
  const { screenToFlowPosition, zoomIn, zoomOut, fitView, getZoom } = useReactFlow();
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [showGrid, setShowGrid] = useState(true);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event) => {
    event.preventDefault();

    const type = event.dataTransfer.getData('application/reactflow');
    if (typeof type === 'undefined' || !type) {
      return;
    }

    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    addNode(type, position);
  }, [screenToFlowPosition, addNode]);

  const onInit = useCallback((instance) => {
    if (reactFlowInstance) {
      reactFlowInstance.current = instance;
    }
  }, [reactFlowInstance]);

  const handleFitView = () => {
    fitView({ duration: 800, padding: 0.2 });
  };

  const handleZoomIn = () => {
    zoomIn({ duration: 300 });
  };

  const handleZoomOut = () => {
    zoomOut({ duration: 300 });
  };

  const handleReset = () => {
    fitView({ duration: 800, padding: 0.3 });
  };

  return (
    <div className="ml-64 flex-1 relative bg-gray-50 min-h-screen">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onInit={onInit}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.2,
          duration: 800,
        }}
        defaultEdgeOptions={{
          animated: true,
          type: 'smoothstep',
          style: {
            strokeWidth: 3,
            stroke: '#1348c9',
          },
        }}
        connectionLineStyle={{
          strokeWidth: 3,
          stroke: '#1348c9',
        }}
        className="bg-transparent"
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          color={showGrid ? "#334155" : "transparent"} 
          gap={showGrid ? 20 : 0} 
          size={showGrid ? 1 : 0}
          variant="dots"
          className="opacity-30"
        />
        
        {/* Custom Controls */}
        <Panel position="bottom-right" className="m-4">
          <div className="flex flex-col gap-2 bg-white/10 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-2">
            <button
              onClick={handleZoomIn}
              className="flex items-center justify-center w-10 h-10 text-white hover:text-primary-300 hover:bg-white/10 rounded-lg transition-all duration-200"
              title="Zoom In"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button
              onClick={handleZoomOut}
              className="flex items-center justify-center w-10 h-10 text-white hover:text-primary-300 hover:bg-white/10 rounded-lg transition-all duration-200"
              title="Zoom Out"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <button
              onClick={handleFitView}
              className="flex items-center justify-center w-10 h-10 text-white hover:text-primary-300 hover:bg-white/10 rounded-lg transition-all duration-200"
              title="Fit View"
            >
              <Maximize className="w-5 h-5" />
            </button>
            <button
              onClick={handleReset}
              className="flex items-center justify-center w-10 h-10 text-white hover:text-primary-300 hover:bg-white/10 rounded-lg transition-all duration-200"
              title="Reset View"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <div className="w-full h-px bg-white/20 my-1"></div>
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 ${
                showGrid 
                  ? 'text-primary-300 bg-white/10' 
                  : 'text-white hover:text-primary-300 hover:bg-white/10'
              }`}
              title="Toggle Grid"
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowMiniMap(!showMiniMap)}
              className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 ${
                showMiniMap 
                  ? 'text-primary-300 bg-white/10' 
                  : 'text-white hover:text-primary-300 hover:bg-white/10'
              }`}
              title="Toggle MiniMap"
            >
              <Eye className="w-5 h-5" />
            </button>
          </div>
        </Panel>

        {showMiniMap && (
          <MiniMap 
            position="top-right"
            className="!bg-white/10 !backdrop-blur-sm !border-2 !border-white/20 !shadow-lg !rounded-xl !m-4"
            nodeColor={(node) => {
              const colors = {
                message: '#1348c9',
                question: '#8b5cf6',
                action: '#10b981',
                condition: '#f59e0b',
                goto: '#ef4444'
              };
              return colors[node.type] || '#94a3b8';
            }}
            nodeStrokeColor={(node) => {
              const colors = {
                message: '#0d3786',
                question: '#7c3aed',
                action: '#059669',
                condition: '#d97706',
                goto: '#dc2626'
              };
              return colors[node.type] || '#64748b';
            }}
            nodeStrokeWidth={2}
            maskColor="rgba(15, 23, 42, 0.8)"
            pannable
            zoomable
          />
        )}
        
        {/* Empty State */}
        {nodes.length === 0 && (
          <Panel position="center">
            <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="w-20 h-20 bg-primary-500 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                <div className="text-4xl">🤖</div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                Crie seu Primeiro Bot
              </h3>
              <p className="text-sidebar-300 mb-6 leading-relaxed">
                Arraste componentes da barra lateral para começar a construir seu fluxo de automação WhatsApp
              </p>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 max-w-sm">
                <div className="flex items-center gap-2 text-primary-300 text-sm font-medium mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>💡 Dica Profissional</span>
                </div>
                <p className="text-sidebar-300 text-sm">
                  Comece com um nó de "Mensagem" para dar boas-vindas aos seus clientes
                </p>
              </div>
            </div>
          </Panel>
        )}

        {/* Statistics Overlay - Removed as it's now in header */}
      </ReactFlow>
    </div>
  );
};

export default FlowCanvas;