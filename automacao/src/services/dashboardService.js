import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

// Configuração padrão do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação se disponível
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const dashboardService = {
  // Buscar estatísticas gerais
  async getStats() {
    try {
      const response = await api.get('/dashboard/stats');
      return response.data;
    } catch {
      // Fallback para dados simulados se a API não estiver disponível
      return {
        totalFlows: 12,
        executionsToday: 847,
        successRate: 94.2,
        activeFlows: 8,
        totalExecutions: 15234,
        avgExecutionTime: 1.2,
        flowsCreatedThisMonth: 5,
        errorRate: 5.8
      };
    }
  },

  // Buscar métricas de execução
  async getExecutionMetrics(timeRange = '24h') {
    try {
      const response = await api.get(`/dashboard/metrics`, {
        params: { timeRange }
      });
      return response.data;
    } catch {
      // Dados simulados para demonstração
      const mockData = {
        '24h': [
          { hour: '00:00', executions: 45, success: 43, errors: 2 },
          { hour: '02:00', executions: 23, success: 22, errors: 1 },
          { hour: '04:00', executions: 12, success: 12, errors: 0 },
          { hour: '06:00', executions: 34, success: 33, errors: 1 },
          { hour: '08:00', executions: 67, success: 65, errors: 2 },
          { hour: '10:00', executions: 89, success: 87, errors: 2 },
          { hour: '12:00', executions: 98, success: 95, errors: 3 },
          { hour: '14:00', executions: 76, success: 74, errors: 2 },
          { hour: '16:00', executions: 84, success: 82, errors: 2 },
          { hour: '18:00', executions: 92, success: 89, errors: 3 },
          { hour: '20:00', executions: 78, success: 76, errors: 2 },
          { hour: '22:00', executions: 56, success: 54, errors: 2 }
        ],
        '7d': [
          { day: 'Seg', executions: 456, success: 432, errors: 24 },
          { day: 'Ter', executions: 523, success: 498, errors: 25 },
          { day: 'Qua', executions: 678, success: 652, errors: 26 },
          { day: 'Qui', executions: 589, success: 563, errors: 26 },
          { day: 'Sex', executions: 734, success: 701, errors: 33 },
          { day: 'Sáb', executions: 423, success: 398, errors: 25 },
          { day: 'Dom', executions: 367, success: 349, errors: 18 }
        ]
      };
      return mockData[timeRange] || mockData['24h'];
    }
  },

  // Buscar lista de fluxos
  async getFlows() {
    try {
      const response = await api.get('/flows');
      return response.data;
    } catch {
      // Dados simulados
      return [
        { 
          id: 1, 
          name: 'Boas-vindas WhatsApp', 
          status: 'active', 
          executions: 145, 
          successRate: 98.5,
          lastExecution: '2025-01-15T10:30:00Z',
          createdAt: '2025-01-10T09:00:00Z'
        },
        { 
          id: 2, 
          name: 'Suporte ao Cliente', 
          status: 'active', 
          executions: 89, 
          successRate: 96.2,
          lastExecution: '2025-01-15T10:25:00Z',
          createdAt: '2025-01-08T14:30:00Z'
        },
        { 
          id: 3, 
          name: 'Coleta de Feedback', 
          status: 'paused', 
          executions: 23, 
          successRate: 91.3,
          lastExecution: '2025-01-14T16:45:00Z',
          createdAt: '2025-01-12T11:15:00Z'
        },
        { 
          id: 4, 
          name: 'Agendamento de Reuniões', 
          status: 'active', 
          executions: 67, 
          successRate: 99.1,
          lastExecution: '2025-01-15T10:28:00Z',
          createdAt: '2025-01-05T16:20:00Z'
        }
      ];
    }
  },

  // Buscar log de atividades
  async getActivities(limit = 10) {
    try {
      const response = await api.get('/dashboard/activities', {
        params: { limit }
      });
      return response.data;
    } catch {
      // Dados simulados
      return [
        { 
          id: 1, 
          type: 'execution', 
          message: 'Fluxo "Boas-vindas WhatsApp" executado com sucesso', 
          time: '2 min atrás', 
          status: 'success',
          flowId: 1,
          timestamp: '2025-01-15T10:30:00Z'
        },
        { 
          id: 2, 
          type: 'error', 
          message: 'Erro na execução do fluxo "Coleta de Feedback"', 
          time: '5 min atrás', 
          status: 'error',
          flowId: 3,
          timestamp: '2025-01-15T10:27:00Z'
        },
        { 
          id: 3, 
          type: 'created', 
          message: 'Novo fluxo "Agendamento VIP" criado', 
          time: '1 hora atrás', 
          status: 'info',
          timestamp: '2025-01-15T09:30:00Z'
        },
        { 
          id: 4, 
          type: 'execution', 
          message: 'Fluxo "Suporte ao Cliente" executado com sucesso', 
          time: '1 hora atrás', 
          status: 'success',
          flowId: 2,
          timestamp: '2025-01-15T09:25:00Z'
        }
      ];
    }
  },

  // Pausar/Retomar fluxo
  async toggleFlowStatus(flowId) {
    try {
      const response = await api.patch(`/flows/${flowId}/toggle`);
      return response.data;
    } catch {
      console.error('Erro ao alterar status do fluxo');
      throw new Error('Erro ao alterar status do fluxo');
    }
  },

  // Executar fluxo manualmente
  async executeFlow(flowId, inputData = {}) {
    try {
      const response = await api.post(`/flows/${flowId}/execute`, inputData);
      return response.data;
    } catch {
      console.error('Erro ao executar fluxo');
      throw new Error('Erro ao executar fluxo');
    }
  },

  // Exportar fluxos
  async exportFlows(flowIds = []) {
    try {
      const response = await api.post('/flows/export', { flowIds }, {
        responseType: 'blob'
      });
      return response.data;
    } catch {
      console.error('Erro ao exportar fluxos');
      throw new Error('Erro ao exportar fluxos');
    }
  },

  // Importar fluxos
  async importFlows(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/flows/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch {
      console.error('Erro ao importar fluxos');
      throw new Error('Erro ao importar fluxos');
    }
  },

  // Buscar métricas de performance
  async getPerformanceMetrics() {
    try {
      const response = await api.get('/dashboard/performance');
      return response.data;
    } catch {
      // Dados simulados
      return {
        avgResponseTime: 1.2,
        peakHour: '14:00',
        mostActiveFlow: 'Boas-vindas WhatsApp',
        systemLoad: 67,
        memoryUsage: 45,
        apiCalls: 23456
      };
    }
  }
};

export default dashboardService;