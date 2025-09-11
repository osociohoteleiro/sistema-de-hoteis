import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api'; // ✅ CORREÇÃO: Usar apiService

const Dashboard = () => {
  const { config } = useApp();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalHotels: 0,
    totalUsers: 0,
    activeEndpoints: 0,
    systemStatus: 'checking',
    apiHealth: 'checking'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ CORREÇÃO: Carregar dados reais da API
  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Carregar dados da API
      const [hotelsData, usersData, healthData] = await Promise.all([
        apiService.getHotels(),
        apiService.getUsers(),
        apiService.healthCheck()
      ]);

      // Calcular estatísticas reais
      const activeEndpoints = Object.values(config.apiEndpoints).filter(endpoint => endpoint?.trim()).length;
      
      setStats({
        totalHotels: hotelsData.hotels?.length || 0,
        totalUsers: usersData.users?.length || 0,
        activeEndpoints: activeEndpoints,
        systemStatus: healthData.status === 'OK' ? 'online' : 'offline',
        apiHealth: healthData.status === 'OK' ? 'connected' : 'disconnected'
      });

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      setError(`Erro ao conectar com a API: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    
    // Atualizar dados a cada 30 segundos
    const interval = setInterval(loadDashboardData, 30000);
    
    return () => clearInterval(interval);
  }, [config.apiEndpoints]);

  // ✅ CORREÇÃO: Cards dinâmicos com dados reais
  const getStatsCards = () => [
    {
      title: 'Total de Hotéis',
      value: loading ? '...' : stats.totalHotels,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      color: 'bg-primary-500',
      change: `${stats.totalHotels > 0 ? 'Ativos' : 'Nenhum cadastrado'}`,
      status: stats.totalHotels > 0 ? 'success' : 'warning'
    },
    {
      title: 'Usuários do Sistema',
      value: loading ? '...' : stats.totalUsers,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      color: 'bg-emerald-500',
      change: `Tipo: ${user?.user_type || 'N/A'}`,
      status: 'info'
    },
    {
      title: 'Status da API',
      value: loading ? 'Verificando...' : (stats.systemStatus === 'online' ? 'Online' : 'Offline'),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: stats.systemStatus === 'online' ? 'bg-green-500' : 'bg-red-500',
      change: stats.apiHealth === 'connected' ? 'Conectada' : 'Desconectada',
      status: stats.systemStatus === 'online' ? 'success' : 'error'
    },
    {
      title: 'Endpoints',
      value: loading ? '...' : stats.activeEndpoints,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: 'bg-blue-500',
      change: `${stats.activeEndpoints}/6 configurados`,
      status: 'info'
    }
  ];

  const quickActions = [
    {
      title: 'Cadastrar Novo Hotel',
      description: 'Adicione um novo hotel ao sistema',
      link: '/hoteis',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      color: 'bg-primary-500 hover:bg-primary-600'
    },
    {
      title: 'Ver Todos os Hotéis',
      description: 'Visualize e gerencie hotéis existentes',
      link: '/hoteis',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      color: 'bg-emerald-500 hover:bg-emerald-600'
    },
    {
      title: 'Configurar Sistema',
      description: 'Configure endpoints e preferências',
      link: '/configuracoes',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Bem-vindo, {user?.name || 'Usuário'}!
            </h2>
            <p className="text-sidebar-300">
              Dashboard do sistema {config.companyName}. Aqui você tem uma visão geral em tempo real.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {loading && (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-400"></div>
            )}
            <button 
              onClick={loadDashboardData}
              disabled={loading}
              className="px-3 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
            >
              ↻ Atualizar
            </button>
          </div>
        </div>
        
        {/* ✅ CORREÇÃO: Mostrar erros se houver */}
        {error && (
          <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-300 text-sm">⚠️ {error}</p>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getStatsCards().map((stat, index) => (
          <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 hover:bg-white/15 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sidebar-300 text-sm font-medium">{stat.title}</p>
                <p className="text-2xl font-bold text-white mt-2">{stat.value}</p>
                <p className={`text-xs mt-1 ${
                  stat.status === 'success' ? 'text-green-400' :
                  stat.status === 'error' ? 'text-red-400' :
                  stat.status === 'warning' ? 'text-yellow-400' :
                  'text-sidebar-400'
                }`}>
                  {stat.change}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color} text-white transition-transform hover:scale-110`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.link}
              className="block p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200 group"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className={`p-2 rounded-lg ${action.color} text-white transition-colors`}>
                  {action.icon}
                </div>
                <h4 className="font-semibold text-white group-hover:text-primary-200">
                  {action.title}
                </h4>
              </div>
              <p className="text-sidebar-300 text-sm">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* System Info */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Informações do Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-white mb-2">Endpoints Configurados</h4>
            <div className="space-y-2">
              {Object.entries(config.apiEndpoints).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="text-sidebar-300 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    value ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                  }`}>
                    {value ? 'Configurado' : 'Pendente'}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">Status Geral</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-sidebar-300">Sistema:</span>
                <span className={`${stats.systemStatus === 'online' ? 'text-green-300' : 'text-red-300'}`}>
                  {loading ? 'Verificando...' : (stats.systemStatus === 'online' ? 'Operacional' : 'Offline')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sidebar-300">API:</span>
                <span className={`${stats.apiHealth === 'connected' ? 'text-green-300' : 'text-red-300'}`}>
                  {loading ? 'Verificando...' : (stats.apiHealth === 'connected' ? 'Conectada' : 'Desconectada')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sidebar-300">Usuário:</span>
                <span className="text-blue-300">{user?.user_type || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sidebar-300">Última Atualização:</span>
                <span className="text-sidebar-400">
                  {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;