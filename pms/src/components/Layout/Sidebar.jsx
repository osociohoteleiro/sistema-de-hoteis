import { useState } from 'react';
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
  Hotel
} from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Calendar, label: 'Reservas', path: '/reservas' },
  { icon: CalendarDays, label: 'Calendário', path: '/calendario' },
  { icon: LogIn, label: 'Check-in', path: '/checkin' },
  { icon: LogOut, label: 'Check-out', path: '/checkout' },
  { icon: Users, label: 'Hóspedes', path: '/hospedes' },
  { icon: Bed, label: 'Quartos', path: '/quartos' },
  { icon: DollarSign, label: 'Tarifário', path: '/tarifario' },
  { icon: BarChart3, label: 'Financeiro', path: '/financeiro' },
  { icon: BarChart3, label: 'Relatórios', path: '/relatorios' },
  { icon: Settings, label: 'Configurações', path: '/configuracoes' },
];

const Sidebar = ({ collapsed, onToggle }) => {
  const location = useLocation();

  return (
    <div className={`bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 shadow-2xl border-r border-slate-700/50 transition-all duration-500 ease-in-out ${collapsed ? 'w-20' : 'w-72'}`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/60 bg-slate-800/30 backdrop-blur-sm">
          <div className={`flex items-center transition-all duration-300 ${collapsed ? 'justify-center w-full' : ''}`}>
            <div className="relative">
              <Hotel className="h-10 w-10 text-primary-400" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-primary-400 to-primary-500 rounded-full animate-bounce-subtle"></div>
            </div>
            {!collapsed && (
              <div className="ml-4 animate-fade-in">
                <h1 className="text-xl font-bold text-white">OSH PMS</h1>
                <p className="text-xs text-slate-300 font-medium tracking-wide">Hotel Management System</p>
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
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`sidebar-item group ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2 mx-3' : 'mx-3'}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="relative">
                  <Icon size={20} className="flex-shrink-0 transition-all duration-200" />
                  {isActive && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary-500 rounded-full animate-bounce-subtle"></div>
                  )}
                </div>
                {!collapsed && (
                  <span className="ml-3 font-medium transition-all duration-200 group-hover:translate-x-1">
                    {item.label}
                  </span>
                )}
                {collapsed && (
                  <div className="absolute left-full ml-6 px-3 py-2 bg-slate-700 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap shadow-2xl border border-slate-600">
                    {item.label}
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