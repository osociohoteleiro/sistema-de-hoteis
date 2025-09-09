import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const HotelDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalReservations: 0,
    activeReservations: 0,
    occupancyRate: 0,
    revenue: 0
  });

  // Mock data para desenvolvimento
  useEffect(() => {
    // Simular carregamento de dados
    setTimeout(() => {
      setStats({
        totalReservations: 147,
        activeReservations: 23,
        occupancyRate: 78.5,
        revenue: 28450.00
      });
    }, 1000);
  }, []);

  const quickActionItems = [
    {
      title: 'Nova Reserva',
      description: 'Criar uma nova reserva rapidamente',
      icon: (
        <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      color: 'primary',
      action: () => toast.info('Redirecionando para nova reserva...')
    },
    {
      title: 'Check-in Express',
      description: 'Realizar check-in de hóspedes',
      icon: (
        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      color: 'green',
      action: () => toast.info('Abrindo check-in express...')
    },
    {
      title: 'Atendimento IA',
      description: 'Verificar interações com a IA',
      icon: (
        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      color: 'purple',
      action: () => window.location.href = '/hotel/ia'
    },
    {
      title: 'Relatório Rápido',
      description: 'Visualizar métricas principais',
      icon: (
        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'blue',
      action: () => window.location.href = '/hotel/relatorios'
    }
  ];

  const StatCard = ({ title, value, icon, color = 'primary', suffix = '', isLoading = false }) => (
    <div className="bg-sidebar-800/50 backdrop-blur-sm rounded-lg border border-white/10 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sidebar-400 text-sm font-medium">{title}</p>
          {isLoading ? (
            <div className="h-8 bg-white/10 rounded animate-pulse mt-2"></div>
          ) : (
            <p className={`text-2xl font-bold text-${color}-400 mt-2`}>
              {value}{suffix}
            </p>
          )}
        </div>
        <div className={`p-3 bg-${color}-500/10 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-sidebar-800/50 backdrop-blur-sm rounded-lg border border-white/10 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Bem-vindo, {user?.name || 'Hoteleiro'}! 👋
            </h1>
            <p className="text-sidebar-400">
              Aqui está um resumo das operações do seu hotel hoje.
            </p>
          </div>
          <div className="text-right">
            <p className="text-sidebar-400 text-sm">Última atualização</p>
            <p className="text-white font-medium">
              {new Date().toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total de Reservas"
          value={stats.totalReservations}
          color="blue"
          icon={
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4M6 15l2 2 4-4M5 9h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V11a2 2 0 012-2z" />
            </svg>
          }
        />

        <StatCard
          title="Reservas Ativas"
          value={stats.activeReservations}
          color="green"
          icon={
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          }
        />

        <StatCard
          title="Taxa de Ocupação"
          value={stats.occupancyRate}
          suffix="%"
          color="purple"
          icon={
            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />

        <StatCard
          title="Receita do Mês"
          value={`R$ ${stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          color="yellow"
          icon={
            <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          }
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ações Rápidas */}
        <div className="bg-sidebar-800/50 backdrop-blur-sm rounded-lg border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Ações Rápidas</h3>
          <div className="grid grid-cols-1 gap-3">
            {quickActionItems.map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 bg-${item.color}-500/10 rounded-lg group-hover:bg-${item.color}-500/20 transition-colors`}>
                    {item.icon}
                  </div>
                  <div className="text-left">
                    <span className="text-white font-medium block">{item.title}</span>
                    <span className="text-sidebar-400 text-sm">{item.description}</span>
                  </div>
                </div>
                <svg className="w-5 h-5 text-sidebar-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* Status do Sistema */}
        <div className="bg-sidebar-800/50 backdrop-blur-sm rounded-lg border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Status do Sistema</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sidebar-300">Sistema de Reservas</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-sm">Online</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sidebar-300">Integração IA</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-sm">Ativa</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sidebar-300">API de Pagamentos</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <span className="text-yellow-400 text-sm">Manutenção</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sidebar-300">Backup Automático</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-sm">Executado hoje</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Atividades Recentes */}
      <div className="bg-sidebar-800/50 backdrop-blur-sm rounded-lg border border-white/10 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Atividades Recentes</h3>
        <div className="space-y-4">
          {[
            {
              type: 'checkin',
              message: 'Check-in realizado: João Silva - Quarto 205',
              time: '14:30',
              icon: '✅',
              color: 'green'
            },
            {
              type: 'reservation',
              message: 'Nova reserva: Maria Santos - 3 noites',
              time: '13:45',
              icon: '📅',
              color: 'blue'
            },
            {
              type: 'ai',
              message: 'IA respondeu 12 perguntas de hóspedes',
              time: '12:20',
              icon: '🤖',
              color: 'purple'
            },
            {
              type: 'marketing',
              message: 'Campanha "Verão 2024" atingiu 1000 cliques',
              time: '11:15',
              icon: '📢',
              color: 'yellow'
            },
            {
              type: 'revenue',
              message: 'Receita diária: R$ 3.450,00',
              time: '09:00',
              icon: '💰',
              color: 'green'
            }
          ].map((activity, index) => (
            <div key={index} className="flex items-center space-x-4 p-3 bg-white/5 rounded-lg">
              <div className="text-2xl">{activity.icon}</div>
              <div className="flex-1">
                <p className="text-white text-sm">{activity.message}</p>
                <p className="text-sidebar-400 text-xs">{activity.time}</p>
              </div>
              <div className={`w-2 h-2 bg-${activity.color}-400 rounded-full`}></div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 text-center">
          <button className="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors">
            Ver todas as atividades →
          </button>
        </div>
      </div>

      {/* Development Notice */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-blue-400 font-semibold">Área em Desenvolvimento</h4>
            <p className="text-blue-300 text-sm mt-1">
              Esta é a área do hoteleiro. As funcionalidades de reservas, atendimento e relatórios estão sendo desenvolvidas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelDashboard;