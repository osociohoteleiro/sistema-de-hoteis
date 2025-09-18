import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import RelationshipDashboard from '../components/RelationshipDashboard';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalFlows: 0,
    activeFlows: 0,
    systemStatus: 'online'
  });

  useEffect(() => {
    setStats({
      totalFlows: 0,
      activeFlows: 0,
      systemStatus: 'online'
    });
  }, []);

  const statsCards = [
    {
      title: 'Total de Fluxos',
      value: stats.totalFlows,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'bg-gradient-sapphire',
      change: '+0'
    },
    {
      title: 'Fluxos Ativos',
      value: stats.activeFlows,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: 'bg-gradient-steel',
      change: `${stats.activeFlows} ativos`
    },
    {
      title: 'Status do Sistema',
      value: stats.systemStatus === 'online' ? 'Online' : 'Offline',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-midnight-700',
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
      color: 'bg-prussian-600',
      change: 'agora'
    }
  ];

  const quickActions = [
    {
      title: 'Gerenciar Workspaces',
      description: 'Organize e gerencie seus espaços de trabalho',
      link: '/workspaces',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      color: 'bg-gradient-sapphire text-white hover:bg-midnight-700 transition-minimal shadow-sapphire-glow'
    },
    {
      title: 'Configurações',
      description: 'Configure o sistema de automação',
      link: '/settings',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: 'bg-gradient-steel text-white hover:bg-steel-700 transition-minimal shadow-blue-soft'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Relationship Dashboard */}
      <RelationshipDashboard compactMode={true} />

      {/* Welcome Section */}
      <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 p-8 shadow-blue-elegant">
        <div>
          <h1 className="text-3xl font-bold text-midnight-950 mb-4">
            Sistema de Automação Professional
          </h1>
          <p className="text-steel-700 text-lg leading-relaxed">
            Plataforma avançada para gerenciamento de fluxos de trabalho automatizados.
            Monitore, configure e otimize seus processos com máxima eficiência e sofisticação.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <div key={index} className="bg-gradient-card-blue backdrop-blur-sm rounded-xl border border-sapphire-200/40 p-6 hover:shadow-blue-soft hover:border-sapphire-300/60 transition-minimal group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-steel-600 text-xs font-semibold uppercase tracking-wider">{stat.title}</p>
                <p className="text-3xl font-bold text-midnight-950 mt-3">{stat.value}</p>
                <p className="text-xs text-sapphire-600 mt-2 font-medium">{stat.change}</p>
              </div>
              <div className={`p-4 rounded-xl ${stat.color} text-white shadow-blue-subtle group-hover:shadow-sapphire-glow transition-all duration-300`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 p-8 shadow-blue-elegant">
        <h3 className="text-2xl font-bold text-midnight-950 mb-8">
          Ações Rápidas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.link}
              className="block p-6 rounded-xl border border-sapphire-200/30 hover:bg-sapphire-50/30 hover:border-sapphire-300/50 hover:shadow-blue-soft transition-minimal group"
            >
              <div className="flex items-start space-x-4">
                <div className={`p-4 rounded-xl ${action.color} group-hover:scale-105 transition-transform duration-300`}>
                  {action.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-midnight-950 text-lg mb-2 group-hover:text-sapphire-800 transition-colors">
                    {action.title}
                  </h4>
                  <p className="text-steel-700 text-sm leading-relaxed">{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* System Info */}
      <div className="bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 p-8 shadow-blue-elegant">
        <h3 className="text-2xl font-bold text-midnight-950 mb-8">
          Status do Sistema
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="font-semibold text-midnight-950 mb-6 text-lg">Status dos Serviços</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-sapphire-50/30 border border-sapphire-200/40">
                <span className="text-steel-700 text-sm font-medium">API de Automação:</span>
                <span className="px-3 py-1 rounded-full text-xs bg-gradient-sapphire text-white font-semibold shadow-blue-subtle">
                  ATIVO
                </span>
              </div>
              <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-sapphire-50/30 border border-sapphire-200/40">
                <span className="text-steel-700 text-sm font-medium">Flow Builder:</span>
                <span className="px-3 py-1 rounded-full text-xs bg-gradient-steel text-white font-semibold shadow-blue-subtle">
                  DISPONÍVEL
                </span>
              </div>
              <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-sapphire-50/30 border border-sapphire-200/40">
                <span className="text-steel-700 text-sm font-medium">Webhooks:</span>
                <span className="px-3 py-1 rounded-full text-xs bg-midnight-700 text-white font-semibold shadow-blue-subtle">
                  FUNCIONANDO
                </span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-midnight-950 mb-6 text-lg">Status Geral</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-sapphire-50/30 border border-sapphire-200/40">
                <span className="text-steel-700 text-sm font-medium">Sistema:</span>
                <span className="text-midnight-950 font-bold text-sm">OPERACIONAL</span>
              </div>
              <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-sapphire-50/30 border border-sapphire-200/40">
                <span className="text-steel-700 text-sm font-medium">API:</span>
                <span className="text-sapphire-700 font-bold text-sm">CONECTADA</span>
              </div>
              <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-sapphire-50/30 border border-sapphire-200/40">
                <span className="text-steel-700 text-sm font-medium">Configurações:</span>
                <span className="text-steel-700 font-bold text-sm">CARREGADAS</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;