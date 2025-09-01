import React, { useEffect } from 'react';
import { 
  BarChart3, 
  Play, 
  CheckCircle, 
  AlertCircle, 
  Activity, 
  TrendingUp,
  Plus,
  Download,
  Upload,
  Settings,
  RefreshCw,
  Loader2
} from 'lucide-react';
import StatsCard from './StatsCard';
import FlowMetrics from './FlowMetrics';
import ActivityLog from './ActivityLog';
import QuickActions from './QuickActions';
import useDashboardStore from '../../stores/dashboardStore';

const Dashboard = () => {
  const {
    stats,
    flows,
    activities,
    loading,
    errors,
    fetchStats,
    fetchFlows,
    fetchActivities,
    fetchExecutionMetrics,
    refreshAllData,
    toggleFlowStatus
  } = useDashboardStore();

  useEffect(() => {
    // Carregar dados iniciais
    const loadInitialData = async () => {
      await Promise.all([
        fetchStats(),
        fetchFlows(),
        fetchActivities(),
        fetchExecutionMetrics()
      ]);
    };

    loadInitialData();
  }, [fetchStats, fetchFlows, fetchActivities, fetchExecutionMetrics]);

  const handleRefresh = async () => {
    await refreshAllData();
  };

  const handleToggleFlowStatus = async (flowId) => {
    try {
      await toggleFlowStatus(flowId);
    } catch (error) {
      console.error('Erro ao alterar status do fluxo:', error);
    }
  };

  return (
    <div className="dashboard-container bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard de Automação</h1>
              <p className="text-gray-600 mt-1">Visão geral dos seus fluxos de automação</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading.stats || loading.flows}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {(loading.stats || loading.flows) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {(loading.stats || loading.flows) ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total de Fluxos"
            value={stats.totalFlows}
            icon={BarChart3}
            color="blue"
            change="+2"
            changeLabel="este mês"
          />
          <StatsCard
            title="Execuções Hoje"
            value={stats.executionsToday.toLocaleString()}
            icon={Play}
            color="green"
            change="+12%"
            changeLabel="vs ontem"
          />
          <StatsCard
            title="Taxa de Sucesso"
            value={`${stats.successRate}%`}
            icon={CheckCircle}
            color="emerald"
            change="+0.3%"
            changeLabel="vs semana passada"
          />
          <StatsCard
            title="Fluxos Ativos"
            value={stats.activeFlows}
            icon={Activity}
            color="purple"
            change="+1"
            changeLabel="desde ontem"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Flow Metrics */}
          <div className="lg:col-span-2">
            <FlowMetrics />
          </div>

          {/* Quick Actions */}
          <div>
            <QuickActions />
          </div>
        </div>

        {/* Recent Flows and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Flows */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Fluxos Recentes</h3>
              <p className="text-sm text-gray-600 mt-1">Status e performance dos seus fluxos</p>
            </div>
            <div className="p-6">
              {loading.flows ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Carregando fluxos...</span>
                </div>
              ) : errors.flows ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
                  <p className="text-red-600">Erro ao carregar fluxos</p>
                </div>
              ) : flows.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Nenhum fluxo encontrado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {flows.slice(0, 4).map((flow) => (
                    <div key={flow.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          flow.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                        }`}></div>
                        <div>
                          <h4 className="font-medium text-gray-900">{flow.name}</h4>
                          <p className="text-sm text-gray-600">
                            {flow.executions} execuções • {flow.successRate}% sucesso
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          flow.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {flow.status === 'active' ? 'Ativo' : 'Pausado'}
                        </span>
                        <button 
                          onClick={() => handleToggleFlowStatus(flow.id)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title={flow.status === 'active' ? 'Pausar fluxo' : 'Ativar fluxo'}
                        >
                          {flow.status === 'active' ? (
                            <Activity className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <Settings className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Activity Log */}
          <div>
            <ActivityLog activities={activities} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;