/**
 * Serviço para converter fluxos entre ReactFlow e formato Flowise
 */

class FlowConverter {
  
  /**
   * Converter fluxo ReactFlow para formato Flowise Chatflow
   */
  static reactFlowToFlowise(reactFlowData, metadata = {}) {
    try {
      const { nodes = [], edges = [] } = reactFlowData;
      
      // Estrutura base do chatflow Flowise
      const chatflowData = {
        name: metadata.name || 'Novo Chatflow',
        flowData: JSON.stringify({
          nodes: this.convertNodesToFlowise(nodes),
          edges: this.convertEdgesToFlowise(edges),
          viewport: reactFlowData.viewport || { x: 0, y: 0, zoom: 1 }
        }),
        deployed: false,
        isPublic: false,
        apikeyid: null,
        chatbotConfig: JSON.stringify(this.generateChatbotConfig(metadata)),
        type: 'CHATFLOW',
        category: metadata.category || 'New Category'
      };

      return {
        success: true,
        data: chatflowData,
        message: 'Fluxo convertido para formato Flowise'
      };
    } catch (error) {
      console.error('Erro na conversão ReactFlow -> Flowise:', error);
      return {
        success: false,
        error: error.message,
        message: 'Falha ao converter fluxo'
      };
    }
  }

  /**
   * Converter chatflow Flowise para formato ReactFlow
   */
  static flowiseToReactFlow(chatflowData) {
    try {
      if (!chatflowData.flowData) {
        throw new Error('Dados do fluxo não encontrados');
      }

      const flowData = JSON.parse(chatflowData.flowData);
      
      const reactFlowData = {
        nodes: this.convertNodesToReactFlow(flowData.nodes || []),
        edges: this.convertEdgesToReactFlow(flowData.edges || []),
        viewport: flowData.viewport || { x: 0, y: 0, zoom: 1 }
      };

      return {
        success: true,
        data: reactFlowData,
        metadata: {
          name: chatflowData.name,
          category: chatflowData.category,
          deployed: chatflowData.deployed,
          isPublic: chatflowData.isPublic
        },
        message: 'Chatflow convertido para ReactFlow'
      };
    } catch (error) {
      console.error('Erro na conversão Flowise -> ReactFlow:', error);
      return {
        success: false,
        error: error.message,
        message: 'Falha ao converter chatflow'
      };
    }
  }

  /**
   * Converter nodes ReactFlow para formato Flowise
   */
  static convertNodesToFlowise(reactFlowNodes) {
    return reactFlowNodes.map(node => {
      const flowiseNode = {
        id: node.id,
        position: node.position,
        type: this.mapNodeTypeToFlowise(node.type),
        data: {
          ...node.data,
          // Mapear campos específicos do ReactFlow para Flowise
          label: node.data.label || node.data.name || 'Node',
          name: this.getFlowiseNodeName(node.type),
          version: 1,
          category: this.getNodeCategory(node.type),
          inputParams: this.convertInputParams(node.data),
          inputAnchors: this.generateInputAnchors(node.type),
          outputAnchors: this.generateOutputAnchors(node.type),
          selected: false
        },
        width: node.width || 300,
        height: node.height || 200,
        selected: false,
        dragging: false,
        positionAbsolute: node.position
      };

      return flowiseNode;
    });
  }

  /**
   * Converter edges ReactFlow para formato Flowise
   */
  static convertEdgesToFlowise(reactFlowEdges) {
    return reactFlowEdges.map(edge => ({
      source: edge.source,
      sourceHandle: edge.sourceHandle || 'output',
      target: edge.target,
      targetHandle: edge.targetHandle || 'input',
      type: 'buttonedge',
      id: edge.id,
      data: {
        label: edge.label || ''
      }
    }));
  }

  /**
   * Converter nodes Flowise para ReactFlow
   */
  static convertNodesToReactFlow(flowiseNodes) {
    return flowiseNodes.map(node => ({
      id: node.id,
      type: this.mapNodeTypeToReactFlow(node.data?.name || node.type),
      position: node.position,
      data: {
        label: node.data?.label || 'Node',
        ...this.extractReactFlowData(node.data)
      },
      width: node.width,
      height: node.height
    }));
  }

  /**
   * Converter edges Flowise para ReactFlow
   */
  static convertEdgesToReactFlow(flowiseEdges) {
    return flowiseEdges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      type: 'custom-edge',
      data: edge.data || {}
    }));
  }

  /**
   * Mapear tipos de node do ReactFlow para Flowise
   */
  static mapNodeTypeToFlowise(reactFlowType) {
    const typeMap = {
      'startNode': 'chatTrigger',
      'messageNode': 'conversationalAgent',
      'questionNode': 'questionClassifier',
      'actionNode': 'httpRequest',
      'conditionNode': 'ifElse',
      'emailNode': 'sendEmail',
      'goToNode': 'setVariable'
    };
    
    return typeMap[reactFlowType] || 'conversationalAgent';
  }

  /**
   * Mapear tipos de node do Flowise para ReactFlow
   */
  static mapNodeTypeToReactFlow(flowiseType) {
    const typeMap = {
      'chatTrigger': 'startNode',
      'conversationalAgent': 'messageNode',
      'questionClassifier': 'questionNode',
      'httpRequest': 'actionNode',
      'ifElse': 'conditionNode',
      'sendEmail': 'emailNode',
      'setVariable': 'goToNode'
    };
    
    return typeMap[flowiseType] || 'messageNode';
  }

  /**
   * Obter nome do node no Flowise
   */
  static getFlowiseNodeName(reactFlowType) {
    const nameMap = {
      'startNode': 'Chat Trigger',
      'messageNode': 'Conversational Agent',
      'questionNode': 'Question Classifier',
      'actionNode': 'HTTP Request',
      'conditionNode': 'If Else Function',
      'emailNode': 'Send Email',
      'goToNode': 'Set Variable'
    };
    
    return nameMap[reactFlowType] || 'Conversational Agent';
  }

  /**
   * Obter categoria do node
   */
  static getNodeCategory(nodeType) {
    const categoryMap = {
      'startNode': 'Chat Models',
      'messageNode': 'Chat Models',
      'questionNode': 'Agents',
      'actionNode': 'Utilities',
      'conditionNode': 'Utilities',
      'emailNode': 'Utilities',
      'goToNode': 'Memory'
    };
    
    return categoryMap[nodeType] || 'Chat Models';
  }

  /**
   * Converter parâmetros de input
   */
  static convertInputParams(nodeData) {
    const baseParams = [];
    
    if (nodeData.message) {
      baseParams.push({
        label: 'Message',
        name: 'message',
        type: 'string',
        default: nodeData.message,
        description: 'Message content'
      });
    }

    if (nodeData.conditions) {
      baseParams.push({
        label: 'Conditions',
        name: 'conditions',
        type: 'json',
        default: JSON.stringify(nodeData.conditions),
        description: 'Condition logic'
      });
    }

    return baseParams;
  }

  /**
   * Gerar input anchors
   */
  static generateInputAnchors(nodeType) {
    if (nodeType === 'startNode') return [];
    
    return [{
      label: 'Input',
      name: 'input',
      type: 'BaseLanguageModel'
    }];
  }

  /**
   * Gerar output anchors
   */
  static generateOutputAnchors(nodeType) {
    return [{
      label: 'Output',
      name: 'output',
      type: 'BaseLanguageModel'
    }];
  }

  /**
   * Gerar configuração do chatbot
   */
  static generateChatbotConfig(metadata) {
    return {
      welcomeMessage: metadata.welcomeMessage || 'Olá! Como posso ajudá-lo?',
      backgroundColor: '#ffffff',
      fontSize: 16,
      botMessage: {
        backgroundColor: '#f7f8ff',
        textColor: '#303235',
        showAvatar: true,
        avatarSrc: ''
      },
      userMessage: {
        backgroundColor: '#3B81F6',
        textColor: '#ffffff',
        showAvatar: true,
        avatarSrc: ''
      },
      textInput: {
        backgroundColor: '#ffffff',
        textColor: '#303235',
        placeholder: 'Digite sua mensagem...',
        sendButtonColor: '#3B81F6'
      }
    };
  }

  /**
   * Extrair dados para ReactFlow
   */
  static extractReactFlowData(flowiseNodeData) {
    const data = {};
    
    if (flowiseNodeData.inputParams) {
      flowiseNodeData.inputParams.forEach(param => {
        if (param.name === 'message') data.message = param.default;
        if (param.name === 'conditions') {
          try {
            data.conditions = JSON.parse(param.default);
          } catch {
            data.conditions = [];
          }
        }
      });
    }

    return data;
  }

  /**
   * Validar fluxo antes da conversão
   */
  static validateFlow(flowData) {
    const errors = [];
    const warnings = [];

    if (!flowData.nodes || flowData.nodes.length === 0) {
      errors.push('Fluxo deve conter pelo menos um node');
    }

    // Verificar se existe node inicial
    const startNodes = flowData.nodes.filter(node => 
      node.type === 'startNode' || node.data?.name === 'Chat Trigger'
    );
    
    if (startNodes.length === 0) {
      warnings.push('Recomendado ter um node inicial (Start Node)');
    }

    if (startNodes.length > 1) {
      warnings.push('Múltiplos nodes iniciais detectados');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export default FlowConverter;