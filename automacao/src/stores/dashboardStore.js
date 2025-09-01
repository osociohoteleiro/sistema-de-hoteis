import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { dashboardService } from '../services/dashboardService';

const useDashboardStore = create(
  subscribeWithSelector((set, get) => ({
    // Estado inicial
    stats: {
      totalFlows: 0,
      executionsToday: 0,
      successRate: 0,
      activeFlows: 0,
      totalExecutions: 0,
      avgExecutionTime: 0,
      flowsCreatedThisMonth: 0,
      errorRate: 0
    },
    flows: [],
    activities: [],
    executionMetrics: [],
    performanceMetrics: {},
    
    // Estados de carregamento
    loading: {
      stats: false,
      flows: false,
      activities: false,
      metrics: false,
      performance: false
    },
    
    // Estados de erro
    errors: {
      stats: null,
      flows: null,
      activities: null,
      metrics: null,
      performance: null
    },
    
    // Configurações
    settings: {
      autoRefresh: true,
      refreshInterval: 30000, // 30 segundos
      theme: 'light',
      notifications: true
    },
    
    // Ações para buscar dados
    fetchStats: async () => {
      set((state) => ({ 
        loading: { ...state.loading, stats: true },
        errors: { ...state.errors, stats: null }
      }));
      
      try {
        const stats = await dashboardService.getStats();
        set((state) => ({ 
          stats,
          loading: { ...state.loading, stats: false }
        }));
      } catch (error) {
        set((state) => ({ 
          loading: { ...state.loading, stats: false },
          errors: { ...state.errors, stats: error.message }
        }));
      }
    },
    
    fetchFlows: async () => {
      set((state) => ({ 
        loading: { ...state.loading, flows: true },
        errors: { ...state.errors, flows: null }
      }));
      
      try {
        const flows = await dashboardService.getFlows();
        set((state) => ({ 
          flows,
          loading: { ...state.loading, flows: false }
        }));
      } catch (error) {
        set((state) => ({ 
          loading: { ...state.loading, flows: false },
          errors: { ...state.errors, flows: error.message }
        }));
      }
    },
    
    fetchActivities: async (limit = 10) => {
      set((state) => ({ 
        loading: { ...state.loading, activities: true },
        errors: { ...state.errors, activities: null }
      }));
      
      try {
        const activities = await dashboardService.getActivities(limit);
        set((state) => ({ 
          activities,
          loading: { ...state.loading, activities: false }
        }));
      } catch (error) {
        set((state) => ({ 
          loading: { ...state.loading, activities: false },
          errors: { ...state.errors, activities: error.message }
        }));
      }
    },
    
    fetchExecutionMetrics: async (timeRange = '24h') => {
      set((state) => ({ 
        loading: { ...state.loading, metrics: true },
        errors: { ...state.errors, metrics: null }
      }));
      
      try {
        const metrics = await dashboardService.getExecutionMetrics(timeRange);
        set((state) => ({ 
          executionMetrics: metrics,
          loading: { ...state.loading, metrics: false }
        }));
      } catch (error) {
        set((state) => ({ 
          loading: { ...state.loading, metrics: false },
          errors: { ...state.errors, metrics: error.message }
        }));
      }
    },
    
    fetchPerformanceMetrics: async () => {
      set((state) => ({ 
        loading: { ...state.loading, performance: true },
        errors: { ...state.errors, performance: null }
      }));
      
      try {
        const performance = await dashboardService.getPerformanceMetrics();
        set((state) => ({ 
          performanceMetrics: performance,
          loading: { ...state.loading, performance: false }
        }));
      } catch (error) {
        set((state) => ({ 
          loading: { ...state.loading, performance: false },
          errors: { ...state.errors, performance: error.message }
        }));
      }
    },
    
    // Ações para manipular fluxos
    toggleFlowStatus: async (flowId) => {
      try {
        await dashboardService.toggleFlowStatus(flowId);
        
        // Atualizar o estado local
        set((state) => ({
          flows: state.flows.map(flow =>
            flow.id === flowId
              ? { ...flow, status: flow.status === 'active' ? 'paused' : 'active' }
              : flow
          )
        }));
        
        // Recarregar estatísticas
        get().fetchStats();
      } catch (error) {
        console.error('Erro ao alterar status do fluxo:', error);
        throw error;
      }
    },
    
    executeFlow: async (flowId, inputData = {}) => {
      try {
        const result = await dashboardService.executeFlow(flowId, inputData);
        
        // Atualizar atividades
        const newActivity = {
          id: Date.now(),
          type: 'execution',
          message: `Fluxo executado manualmente`,
          time: 'agora',
          status: result.success ? 'success' : 'error',
          flowId: flowId,
          timestamp: new Date().toISOString()
        };
        
        set((state) => ({
          activities: [newActivity, ...state.activities.slice(0, 9)]
        }));
        
        return result;
      } catch (error) {
        console.error('Erro ao executar fluxo:', error);
        throw error;
      }
    },
    
    // Ações de utilidade
    refreshAllData: async () => {
      const { fetchStats, fetchFlows, fetchActivities, fetchExecutionMetrics, fetchPerformanceMetrics } = get();
      
      await Promise.all([
        fetchStats(),
        fetchFlows(),
        fetchActivities(),
        fetchExecutionMetrics(),
        fetchPerformanceMetrics()
      ]);
    },
    
    addActivity: (activity) => {
      set((state) => ({
        activities: [activity, ...state.activities.slice(0, 9)]
      }));
    },
    
    updateSettings: (newSettings) => {
      set((state) => ({
        settings: { ...state.settings, ...newSettings }
      }));
      
      // Salvar no localStorage
      localStorage.setItem('dashboardSettings', JSON.stringify(get().settings));
    },
    
    // Limpar erros
    clearError: (type) => {
      set((state) => ({
        errors: { ...state.errors, [type]: null }
      }));
    },
    
    clearAllErrors: () => {
      set(() => ({
        errors: {
          stats: null,
          flows: null,
          activities: null,
          metrics: null,
          performance: null
        }
      }));
    },
    
    // Seletores computados
    getActiveFlowsCount: () => {
      const { flows } = get();
      return flows.filter(flow => flow.status === 'active').length;
    },
    
    getPausedFlowsCount: () => {
      const { flows } = get();
      return flows.filter(flow => flow.status === 'paused').length;
    },
    
    getRecentActivities: (count = 5) => {
      const { activities } = get();
      return activities.slice(0, count);
    },
    
    getTopPerformingFlows: (count = 3) => {
      const { flows } = get();
      return flows
        .filter(flow => flow.status === 'active')
        .sort((a, b) => b.successRate - a.successRate)
        .slice(0, count);
    },
    
    // Resetar store
    reset: () => {
      set({
        stats: {
          totalFlows: 0,
          executionsToday: 0,
          successRate: 0,
          activeFlows: 0,
          totalExecutions: 0,
          avgExecutionTime: 0,
          flowsCreatedThisMonth: 0,
          errorRate: 0
        },
        flows: [],
        activities: [],
        executionMetrics: [],
        performanceMetrics: {},
        loading: {
          stats: false,
          flows: false,
          activities: false,
          metrics: false,
          performance: false
        },
        errors: {
          stats: null,
          flows: null,
          activities: null,
          metrics: null,
          performance: null
        }
      });
    }
  }))
);

// Carregar configurações salvas
const savedSettings = localStorage.getItem('dashboardSettings');
if (savedSettings) {
  const settings = JSON.parse(savedSettings);
  useDashboardStore.getState().updateSettings(settings);
}

// Auto-refresh configurável
let refreshInterval;

useDashboardStore.subscribe(
  (state) => state.settings.autoRefresh,
  (autoRefresh) => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
    
    if (autoRefresh) {
      const { refreshInterval: interval } = useDashboardStore.getState().settings;
      refreshInterval = setInterval(() => {
        useDashboardStore.getState().refreshAllData();
      }, interval);
    }
  }
);

export default useDashboardStore;