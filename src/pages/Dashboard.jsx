import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const Dashboard = () => {
  const { config } = useApp();
  const [stats, setStats] = useState({
    totalHotels: 0,
    activeEndpoints: 0,
    systemStatus: 'online'
  });

  useEffect(() => {
    const activeEndpoints = Object.values(config.apiEndpoints).filter(endpoint => endpoint.trim()).length;
    setStats(prev => ({ ...prev, activeEndpoints }));
  }, [config.apiEndpoints]);

  const statsCards = [
    {
      title: 'Total de Hotéis',
      value: stats.totalHotels,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      color: 'bg-primary-500',
      change: '+0'
    },
    {
      title: 'Endpoints Configurados',
      value: stats.activeEndpoints,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: 'bg-emerald-500',
      change: `${stats.activeEndpoints}/4`
    },
    {
      title: 'Status do Sistema',
      value: stats.systemStatus === 'online' ? 'Online' : 'Offline',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-green-500',
      change: '100% uptime'
    },
    {
      title: 'Última Atualização',
      value: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-blue-500',
      change: 'agora'
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
        <h2 className="text-2xl font-bold text-white mb-2">
          Bem-vindo ao {config.companyName}
        </h2>
        <p className="text-sidebar-300">
          Gerencie seus hotéis e configure o sistema de forma eficiente. 
          Aqui você tem uma visão geral de todas as operações.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sidebar-300 text-sm font-medium">{stat.title}</p>
                <p className="text-2xl font-bold text-white mt-2">{stat.value}</p>
                <p className="text-xs text-sidebar-400 mt-1">{stat.change}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color} text-white`}>
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
                <span className="text-green-300">Operacional</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sidebar-300">API:</span>
                <span className="text-green-300">Conectada</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sidebar-300">Configurações:</span>
                <span className="text-blue-300">Carregadas</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;