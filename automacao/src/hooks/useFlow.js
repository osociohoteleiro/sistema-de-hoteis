import { useState, useCallback, useRef } from 'react';
import { 
  addEdge, 
  useNodesState, 
  useEdgesState, 
  applyNodeChanges,
  applyEdgeChanges
} from 'reactflow';
import { NODE_CONFIGS, generateNodeId } from '../utils/nodeTypes';

export const useFlow = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const reactFlowInstance = useRef(null);

  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge({
      ...params,
      type: 'default',
      animated: true,
    }, eds));
  }, [setEdges]);

  const addNode = useCallback((type, position) => {
    const config = NODE_CONFIGS[type];
    const newNode = {
      id: generateNodeId(),
      type: type,
      position: position || { x: 250, y: 250 },
      data: {
        ...config.defaultData,
        label: config.label,
        config: config
      }
    };

    setNodes((nds) => nds.concat(newNode));
    return newNode;
  }, [setNodes]);

  const updateNodeData = useCallback((nodeId, newData) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...newData } }
          : node
      )
    );
  }, [setNodes]);

  const deleteNode = useCallback((nodeId) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => 
      edge.source !== nodeId && edge.target !== nodeId
    ));
  }, [setNodes, setEdges]);

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    setIsConfigModalOpen(true);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const saveFlow = useCallback(() => {
    const flowData = {
      nodes,
      edges,
      viewport: reactFlowInstance.current?.getViewport()
    };
    return flowData;
  }, [nodes, edges]);

  const loadFlow = useCallback((flowData) => {
    if (flowData.nodes) {
      setNodes(flowData.nodes);
    }
    if (flowData.edges) {
      setEdges(flowData.edges);
    }
    if (flowData.viewport && reactFlowInstance.current) {
      reactFlowInstance.current.setViewport(flowData.viewport);
    }
  }, [setNodes, setEdges]);

  const clearFlow = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
  }, [setNodes, setEdges]);

  const getNodeById = useCallback((nodeId) => {
    return nodes.find(node => node.id === nodeId);
  }, [nodes]);

  const validateFlow = useCallback(() => {
    const errors = [];
    
    // Verificar se há pelo menos um nó
    if (nodes.length === 0) {
      errors.push('O fluxo deve ter pelo menos um nó');
    }

    // Verificar se todos os nós têm dados válidos
    nodes.forEach(node => {
      if (!node.data.label || node.data.label.trim() === '') {
        errors.push(`Nó ${node.id} está sem configuração`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }, [nodes]);

  return {
    // Estado
    nodes,
    edges,
    selectedNode,
    isConfigModalOpen,
    reactFlowInstance,
    
    // Handlers do React Flow
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeClick,
    onPaneClick,
    
    // Funções de manipulação
    addNode,
    updateNodeData,
    deleteNode,
    saveFlow,
    loadFlow,
    clearFlow,
    getNodeById,
    validateFlow,
    
    // Setters
    setSelectedNode,
    setIsConfigModalOpen
  };
};