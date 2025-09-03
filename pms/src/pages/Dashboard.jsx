import { 
  Users, 
  Bed, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

const Dashboard = () => {
  const stats = [
    { 
      title: 'Ocupação Atual', 
      value: '87%', 
      change: '+5%', 
      trend: 'up', 
      icon: Bed,
      color: 'primary',
      gradient: 'from-primary-500 to-primary-700'
    },
    { 
      title: 'Reservas Hoje', 
      value: '23', 
      change: '+12', 
      trend: 'up', 
      icon: Calendar,
      color: 'success',
      gradient: 'from-success-500 to-success-600'
    },
    { 
      title: 'Check-ins Pendentes', 
      value: '8', 
      change: '-3', 
      trend: 'down', 
      icon: Users,
      color: 'warning',
      gradient: 'from-warning-500 to-warning-600'
    },
    { 
      title: 'Receita do Dia', 
      value: 'R$ 15.430', 
      change: '+8%', 
      trend: 'up', 
      icon: DollarSign,
      color: 'primary',
      gradient: 'from-primary-600 to-primary-800'
    },
  ];

  const recentActivities = [
    { id: 1, type: 'check-in', guest: 'João Silva', room: '205', time: '10:30', status: 'completed' },
    { id: 2, type: 'reservation', guest: 'Maria Santos', room: '301', time: '09:15', status: 'pending' },
    { id: 3, type: 'check-out', guest: 'Pedro Costa', room: '102', time: '08:45', status: 'completed' },
    { id: 4, type: 'payment', guest: 'Ana Oliveira', room: '410', time: '07:20', status: 'completed' },
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-success-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-warning-600" />;
      case 'alert': return <AlertCircle className="h-4 w-4 text-error-600" />;
      default: return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  const getActivityLabel = (type) => {
    switch (type) {
      case 'check-in': return 'Check-in';
      case 'check-out': return 'Check-out';
      case 'reservation': return 'Nova Reserva';
      case 'payment': return 'Pagamento';
      default: return 'Atividade';
    }
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="animate-fade-in">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Visão geral completa das operações hoteleiras
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="glass-card px-4 py-2">
            <span className="text-sm font-semibold text-slate-800">Status: </span>
            <span className="status-badge status-success">Sistema Online</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={index} 
              className="stat-card group animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.gradient} shadow-elegant`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className={`flex items-center text-sm font-semibold ${stat.trend === 'up' ? 'text-success-600' : 'text-error-600'}`}>
                  {stat.trend === 'up' ? 
                    <TrendingUp className="h-4 w-4 mr-2" /> : 
                    <TrendingDown className="h-4 w-4 mr-2" />
                  }
                  <span className="px-2 py-1 rounded-full bg-current bg-opacity-10">
                    {stat.change}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-bold text-gradient group-hover:scale-105 transition-transform duration-200">
                  {stat.value}
                </h3>
                <p className="text-sm font-medium text-slate-600 group-hover:text-slate-800 transition-colors duration-200">
                  {stat.title}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
        {/* Recent Activities */}
        <div className="card card-hover">
          <div className="px-6 py-4 border-b border-slate-200/60 bg-slate-50/30">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Atividades Recentes</h3>
              <div className="w-2 h-2 bg-success-500 rounded-full animate-bounce-subtle"></div>
            </div>
            <p className="text-sm text-slate-500 mt-1">Últimas movimentações do sistema</p>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {recentActivities.map((activity, index) => (
                <div 
                  key={activity.id} 
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-50/60 hover:bg-slate-100/60 transition-all duration-200 group border border-slate-200/40"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      {getStatusIcon(activity.status)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 group-hover:text-primary-700 transition-colors duration-200">
                        {getActivityLabel(activity.type)} - {activity.guest}
                      </p>
                      <p className="text-xs text-slate-500 font-medium">Quarto {activity.room}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-600 bg-slate-200/60 px-2 py-1 rounded-full">
                      {activity.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card card-hover">
          <div className="px-6 py-4 border-b border-slate-200/60 bg-slate-50/30">
            <h3 className="text-lg font-bold text-slate-800">Ações Rápidas</h3>
            <p className="text-sm text-slate-500 mt-1">Acesso direto às principais funcionalidades</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <button className="group p-4 text-left rounded-2xl border border-slate-200 hover:border-primary-300 hover:shadow-elegant transition-all duration-300 bg-gradient-to-br from-white to-slate-50/50 hover:from-primary-50 hover:to-primary-100/50">
                <div className="flex items-center justify-between mb-3">
                  <Users className="h-7 w-7 text-primary-600 group-hover:text-primary-700 transition-colors duration-200" />
                  <div className="w-2 h-2 bg-primary-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                </div>
                <h4 className="font-bold text-slate-800 group-hover:text-primary-800">Nova Reserva</h4>
                <p className="text-xs text-slate-600 mt-1">Criar nova reserva</p>
              </button>
              
              <button className="group p-4 text-left rounded-2xl border border-slate-200 hover:border-success-300 hover:shadow-elegant transition-all duration-300 bg-gradient-to-br from-white to-slate-50/50 hover:from-success-50 hover:to-success-100/50">
                <div className="flex items-center justify-between mb-3">
                  <CheckCircle className="h-7 w-7 text-success-600 group-hover:text-success-700 transition-colors duration-200" />
                  <div className="w-2 h-2 bg-success-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                </div>
                <h4 className="font-bold text-slate-800 group-hover:text-success-800">Check-in</h4>
                <p className="text-xs text-slate-600 mt-1">Realizar check-in</p>
              </button>
              
              <button className="group p-4 text-left rounded-2xl border border-slate-200 hover:border-primary-300 hover:shadow-elegant transition-all duration-300 bg-gradient-to-br from-white to-slate-50/50 hover:from-primary-50 hover:to-primary-100/50">
                <div className="flex items-center justify-between mb-3">
                  <Bed className="h-7 w-7 text-primary-600 group-hover:text-primary-700 transition-colors duration-200" />
                  <div className="w-2 h-2 bg-primary-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                </div>
                <h4 className="font-bold text-slate-800 group-hover:text-primary-800">Status Quartos</h4>
                <p className="text-xs text-slate-600 mt-1">Ver disponibilidade</p>
              </button>
              
              <button className="group p-4 text-left rounded-2xl border border-slate-200 hover:border-warning-300 hover:shadow-elegant transition-all duration-300 bg-gradient-to-br from-white to-slate-50/50 hover:from-warning-50 hover:to-warning-100/50">
                <div className="flex items-center justify-between mb-3">
                  <DollarSign className="h-7 w-7 text-warning-600 group-hover:text-warning-700 transition-colors duration-200" />
                  <div className="w-2 h-2 bg-warning-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                </div>
                <h4 className="font-bold text-slate-800 group-hover:text-warning-800">Relatórios</h4>
                <p className="text-xs text-slate-600 mt-1">Visualizar relatórios</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;