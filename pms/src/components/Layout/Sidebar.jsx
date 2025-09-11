import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  CalendarDays,
  LogIn, 
  LogOut, 
  Users, 
  Bed, 
  DollarSign, 
  BarChart3, 
  Settings,
  Menu,
  X,
  Hotel,
  TrendingUp,
  Lock
} from 'lucide-react';
import { useAuth, PERMISSIONS } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { toast } from 'react-hot-toast';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/', permission: PERMISSIONS.VIEW_DASHBOARD },
  { icon: Calendar, label: 'Reservas', path: '/reservas', permission: PERMISSIONS.MANAGE_PMS_RESERVATIONS },
  { icon: CalendarDays, label: 'Calendário', path: '/calendario', permission: PERMISSIONS.VIEW_PMS_CALENDAR },
  { icon: LogIn, label: 'Check-in', path: '/checkin', permission: PERMISSIONS.MANAGE_PMS_CHECKIN },
  { icon: LogOut, label: 'Check-out', path: '/checkout', permission: PERMISSIONS.MANAGE_PMS_CHECKOUT },
  { icon: Users, label: 'Hóspedes', path: '/hospedes', permission: PERMISSIONS.MANAGE_PMS_GUESTS },
  { icon: Bed, label: 'Quartos', path: '/quartos', permission: PERMISSIONS.MANAGE_PMS_ROOMS },
  { icon: DollarSign, label: 'Tarifário', path: '/tarifario', permission: PERMISSIONS.MANAGE_PMS_RATES },
  { icon: TrendingUp, label: 'Rate Shopper', path: '/rate-shopper', permission: PERMISSIONS.VIEW_PMS_RATE_SHOPPER },
  { icon: BarChart3, label: 'Financeiro', path: '/financeiro', permission: PERMISSIONS.VIEW_PMS_FINANCIALS },
  { icon: BarChart3, label: 'Relatórios', path: '/relatorios', permission: PERMISSIONS.VIEW_PMS_REPORTS },
  { icon: Settings, label: 'Configurações', path: '/configuracoes', permission: PERMISSIONS.VIEW_SETTINGS },
];

const Sidebar = ({ collapsed, onToggle }) => {
  const location = useLocation();
  const { hasPermission, isSuperAdmin } = useAuth();
  const { config, selectedHotelUuid } = useApp();
  const [appConfig, setAppConfig] = useState({
    app_title: 'Sistema de Gerenciamento de Propriedades',
    logo_url: null
  });

  // Buscar configurações da aplicação PMS (rota pública)
  useEffect(() => {
    const fetchAppConfig = async () => {
      try {
        // Incluir hotel_id se disponível para buscar configuração específica do hotel
        const url = selectedHotelUuid 
          ? `${config.apiBaseUrl}/app-configurations/public/pms?hotel_id=${selectedHotelUuid}`
          : `${config.apiBaseUrl}/app-configurations/public/pms`;
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setAppConfig(data);
        }
      } catch (error) {
        console.error('Erro ao buscar configurações da aplicação:', error);
      }
    };

    if (config.apiBaseUrl) {
      fetchAppConfig();
    }
  }, [config.apiBaseUrl, selectedHotelUuid]);

  // Função para verificar se o usuário pode acessar um item
  const canAccessItem = (item) => {
    // Super Admin tem acesso a tudo
    if (isSuperAdmin()) {
      return true;
    }
    
    // Se o item tem uma permissão específica, verificar se o usuário tem essa permissão
    if (item.permission && !hasPermission(item.permission)) {
      return false;
    }
    
    return true;
  };

  // Função para lidar com cliques em itens sem permissão
  const handleItemClick = (item, e) => {
    if (!canAccessItem(item)) {
      e.preventDefault();
      toast.error('Você não tem permissão para acessar esta funcionalidade');
    }
  };

  return (
    <div className={`bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 shadow-2xl border-r border-slate-700/50 transition-all duration-500 ease-in-out ${collapsed ? 'w-20' : 'w-72'}`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/60 bg-slate-800/30 backdrop-blur-sm">
          <div className={`w-full flex items-center justify-center transition-all duration-300`}>
            {appConfig.logo_url ? (
              <div className={`${collapsed ? 'w-10 h-10' : 'w-full h-16'} flex items-center justify-center overflow-hidden`}>
                <img 
                  src={appConfig.logo_url} 
                  alt="Logo do Hotel"
                  className={`${collapsed ? 'w-10 h-10' : 'max-w-full h-16'} object-contain`}
                />
              </div>
            ) : (
              <div className={`${collapsed ? 'w-10 h-10' : 'w-16 h-16'} bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 rounded-xl shadow-lg flex items-center justify-center relative`}>
                <svg 
                  width={collapsed ? "24" : "32"} 
                  height={collapsed ? "24" : "32"} 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  className="text-white"
                >
                  {/* Hotel building silhouette */}
                  <path
                    d="M3 21V11L12 3L21 11V21H16V16C16 15.4477 15.5523 15 15 15H9C8.44772 15 8 15.4477 8 16V21H3Z"
                    fill="currentColor"
                    stroke="currentColor"
                    strokeWidth="0.5"
                  />
                  {/* Windows */}
                  <circle cx="8" cy="9" r="0.8" fill="rgba(255,255,255,0.8)" />
                  <circle cx="12" cy="9" r="0.8" fill="rgba(255,255,255,0.8)" />
                  <circle cx="16" cy="9" r="0.8" fill="rgba(255,255,255,0.8)" />
                  <circle cx="8" cy="12" r="0.8" fill="rgba(255,255,255,0.8)" />
                  <circle cx="12" cy="12" r="0.8" fill="rgba(255,255,255,0.8)" />
                  <circle cx="16" cy="12" r="0.8" fill="rgba(255,255,255,0.8)" />
                  {/* Door */}
                  <rect x="10.5" y="17" width="3" height="4" fill="rgba(255,255,255,0.9)" rx="1" />
                </svg>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-primary-400 to-primary-500 rounded-full animate-bounce-subtle"></div>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={onToggle}
              className="btn-icon hover:bg-slate-700 hover:text-primary-400 text-slate-300 transition-all duration-200"
            >
              <Menu size={18} />
            </button>
          )}
          {collapsed && (
            <button
              onClick={onToggle}
              className="absolute top-6 right-2 btn-icon hover:bg-slate-700 hover:text-primary-400 text-slate-300"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const hasAccess = canAccessItem(item);
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={(e) => handleItemClick(item, e)}
                className={`sidebar-item group ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2 mx-3' : 'mx-3'} ${!hasAccess ? 'opacity-75' : ''}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="relative">
                  <Icon size={20} className="flex-shrink-0 transition-all duration-200" />
                  {!hasAccess && (
                    <Lock size={12} className="absolute -top-1 -right-1 text-yellow-400 bg-slate-800 rounded-full p-0.5" />
                  )}
                  {isActive && hasAccess && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary-500 rounded-full animate-bounce-subtle"></div>
                  )}
                </div>
                {!collapsed && (
                  <div className="flex items-center justify-between flex-1">
                    <span className="ml-3 font-medium transition-all duration-200 group-hover:translate-x-1">
                      {item.label}
                    </span>
                    {!hasAccess && (
                      <Lock size={16} className="text-yellow-400 ml-2" />
                    )}
                  </div>
                )}
                {collapsed && (
                  <div className="absolute left-full ml-6 px-3 py-2 bg-slate-700 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap shadow-2xl border border-slate-600 flex items-center">
                    <span>{item.label}</span>
                    {!hasAccess && (
                      <Lock size={12} className="text-yellow-400 ml-2" />
                    )}
                    <div className="absolute top-1/2 left-0 transform -translate-x-1 -translate-y-1/2 w-2 h-2 bg-slate-700 rotate-45"></div>
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700/60 bg-slate-800/50 backdrop-blur-sm">
          <div className={`flex items-center transition-all duration-300 ${collapsed ? 'justify-center' : ''}`}>
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-2xl ring-2 ring-primary-400/20">
                <span className="text-white text-sm font-bold">AD</span>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-success-400 border-2 border-slate-800 rounded-full"></div>
            </div>
            {!collapsed && (
              <div className="ml-4 animate-fade-in">
                <p className="text-sm font-semibold text-white">Admin User</p>
                <p className="text-xs text-slate-300 font-medium">Administrador do Sistema</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;