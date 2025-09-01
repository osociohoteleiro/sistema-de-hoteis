export const NODE_TYPES = {
  MESSAGE: 'message',
  QUESTION: 'question', 
  ACTION: 'action',
  CONDITION: 'condition',
  GOTO: 'goto'
};

export const NODE_CONFIGS = {
  [NODE_TYPES.MESSAGE]: {
    type: NODE_TYPES.MESSAGE,
    label: 'Mensagem de Texto',
    icon: '💬',
    color: '#3b82f6',
    defaultData: {
      message: '',
      delay: 1000
    },
    inputs: 1,
    outputs: 1
  },
  [NODE_TYPES.QUESTION]: {
    type: NODE_TYPES.QUESTION,
    label: 'Pergunta',
    icon: '❓',
    color: '#8b5cf6',
    defaultData: {
      question: '',
      waitForResponse: true,
      timeout: 300000, // 5 minutos
      timeoutMessage: 'Tempo esgotado. Tente novamente.'
    },
    inputs: 1,
    outputs: 1
  },
  [NODE_TYPES.ACTION]: {
    type: NODE_TYPES.ACTION,
    label: 'Ação',
    icon: '⚡',
    color: '#10b981',
    defaultData: {
      actionType: 'http',
      url: '',
      method: 'GET',
      headers: {},
      body: {},
      variable: 'response'
    },
    inputs: 1,
    outputs: 2 // success, error
  },
  [NODE_TYPES.CONDITION]: {
    type: NODE_TYPES.CONDITION,
    label: 'Condição',
    icon: '🔀',
    color: '#f59e0b',
    defaultData: {
      variable: '',
      operator: 'equals',
      value: '',
      caseSensitive: false
    },
    inputs: 1,
    outputs: 2 // true, false
  },
  [NODE_TYPES.GOTO]: {
    type: NODE_TYPES.GOTO,
    label: 'Ir Para',
    icon: '➡️',
    color: '#ef4444',
    defaultData: {
      targetNodeId: '',
      targetFlowId: null
    },
    inputs: 1,
    outputs: 0
  }
};

export const OPERATORS = {
  equals: 'Igual a',
  notEquals: 'Diferente de',
  contains: 'Contém',
  notContains: 'Não contém',
  startsWith: 'Começa com',
  endsWith: 'Termina com',
  greaterThan: 'Maior que',
  lessThan: 'Menor que',
  isEmpty: 'Está vazio',
  isNotEmpty: 'Não está vazio'
};

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

export const generateNodeId = () => {
  return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};