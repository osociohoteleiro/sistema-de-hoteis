import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth, PERMISSIONS } from '../context/AuthContext';

const HotelSidebar = () => {
  const location = useLocation();
  const { config } = useApp();
  const { hasPermission } = useAuth();
  const [expandedMenus, setExpandedMenus] = useState({});

  const hotelMenuItems = [
    {
      path: '/hotel/dashboard',
      name: 'Dashboard',
      permission: PERMISSIONS.VIEW_HOTEL_AREA,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
        </svg>
      )
    },
    {
      path: '/hotel/ia',
      name: 'IA',
      permission: PERMISSIONS.VIEW_HOTEL_IA,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      path: '/hotel/marketing',
      name: 'Marketing',
      permission: PERMISSIONS.VIEW_HOTEL_MARKETING,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      )
    },
    {
      path: '/hotel/relatorios',
      name: 'Relatórios',
      permission: PERMISSIONS.VIEW_HOTEL_REPORTS,
      hasSubMenu: true,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      subMenus: [
        {
          path: '/hotel/relatorios/financeiro',
          name: 'Financeiro',
          icon: '💰'
        },
        {
          path: '/hotel/relatorios/operacional',
          name: 'Operacional',
          icon: '📋'
        },
        {
          path: '/hotel/relatorios/satisfacao',
          name: 'Satisfação',
          icon: '⭐'
        }
      ]
    },
    {
      path: '/hotel/reservas',
      name: 'Reservas',
      permission: PERMISSIONS.MANAGE_RESERVATIONS,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4M6 15l2 2 4-4M5 9h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V11a2 2 0 012-2z" />
        </svg>
      )
    },
    {
      path: '/hotel/atendimento',
      name: 'Atendimento',
      permission: PERMISSIONS.MANAGE_CUSTOMER_SERVICE,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    }
  ];

  const isActive = (path) => {
    if (path === '/hotel/dashboard') {
      return location.pathname === '/hotel/dashboard' || location.pathname === '/hotel';
    }
    return location.pathname.startsWith(path);
  };

  const toggleSubMenu = (menuPath) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuPath]: !prev[menuPath]
    }));
  };

  const isSubMenuExpanded = (menuPath) => {
    return expandedMenus[menuPath] || location.pathname.startsWith(menuPath);
  };

  // Filtrar itens do menu baseado nas permissões do usuário
  const filteredMenuItems = hotelMenuItems.filter(item => {
    if (item.permission && !hasPermission(item.permission)) {
      return false;
    }
    return true;
  });

  return (
    <div className="w-64 bg-gradient-sidebar min-h-screen fixed left-0 top-0 z-40">
      {/* Logo Section */}
      <div className="p-6 border-b border-sidebar-700">
        <div className="text-center space-y-4">
          {config.logo ? (
            <div className="w-full">
              <img src={config.logo} alt="Logo" className="w-full h-16 object-contain rounded-lg" />
            </div>
          ) : (
            <div className="w-20 h-20 mx-auto bg-primary-500 rounded-lg flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          )}
          <div>
            <h1 className="text-white font-semibold text-lg">
              {config.companyName}
            </h1>
            <p className="text-sidebar-400 text-sm">Área do Hoteleiro</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-6">
        <div className="px-4 space-y-2">
          {filteredMenuItems.map((item) => (
            <div key={item.path}>
              {/* Menu Principal */}
              {item.hasSubMenu ? (
                <div>
                  <button
                    onClick={() => toggleSubMenu(item.path)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive(item.path)
                        ? 'bg-primary-600 text-white shadow-lg'
                        : 'text-sidebar-300 hover:bg-sidebar-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {item.icon}
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <svg 
                      className={`w-4 h-4 transform transition-transform duration-200 ${
                        isSubMenuExpanded(item.path) ? 'rotate-180' : ''
                      }`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Submenu */}
                  {isSubMenuExpanded(item.path) && item.subMenus && (
                    <div className="mt-2 ml-4 space-y-1">
                      {item.subMenus.map((subItem) => (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 ${
                            location.pathname === subItem.path
                              ? 'bg-primary-500 text-white shadow-md'
                              : 'text-sidebar-400 hover:bg-sidebar-800 hover:text-white'
                          }`}
                        >
                          <span className="text-lg">{subItem.icon}</span>
                          <span className="font-medium text-sm">{subItem.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-primary-600 text-white shadow-lg'
                      : 'text-sidebar-300 hover:bg-sidebar-800 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span className="font-medium">{item.name}</span>
                </Link>
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-700">
        <div className="text-center text-sidebar-400 text-xs">
          <p>© 2024 {config.companyName}</p>
          <p>Área do Hoteleiro v1.0.0</p>
        </div>
      </div>
    </div>
  );
};

export default HotelSidebar;