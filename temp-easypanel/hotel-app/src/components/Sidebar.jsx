import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth, PERMISSIONS } from '../context/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { config } = useApp();
  const { hasPermission, isSuperAdmin } = useAuth();
  const [iaMenuOpen, setIaMenuOpen] = useState(location.pathname.startsWith('/ia'));
  
  console.log('🔍 Sidebar: config.logo atual:', config.logo);
  console.log('🔍 Sidebar: tipo do logo:', typeof config.logo);
  console.log('🔍 Sidebar: config completo:', config);

  const menuItems = [
    {
      path: '/',
      name: 'Dashboard',
      permission: PERMISSIONS.VIEW_DASHBOARD,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
        </svg>
      )
    },
    {
      path: '/hoteis',
      name: 'Hotéis',
      permission: PERMISSIONS.VIEW_HOTELS,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      path: '/ia',
      name: 'IA',
      permission: PERMISSIONS.VIEW_AI,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      hasSubmenu: true,
      submenu: [
        {
          path: '/ia',
          name: 'Painel',
          permission: PERMISSIONS.VIEW_AI
        },
        {
          path: '/ia/configuracoes',
          name: 'Configurações',
          permission: PERMISSIONS.VIEW_AI_CONFIGURATIONS
        }
      ]
    },
    {
      path: '/configuracoes',
      name: 'Configurações',
      permission: PERMISSIONS.VIEW_SETTINGS,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    // Área do Hoteleiro
    {
      path: '/hotel',
      name: 'Área do Hotel',
      permission: PERMISSIONS.VIEW_HOTEL_AREA,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    // Gerenciar Permissões - Apenas para Super Admin
    {
      path: '/admin/permissoes',
      name: 'Permissões',
      permission: PERMISSIONS.MANAGE_PERMISSIONS,
      superAdminOnly: true,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    }
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Filtrar itens do menu baseado nas permissões do usuário
  const filteredMenuItems = menuItems.filter(item => {
    // Se o item requer ser Super Admin, verificar se o usuário é Super Admin
    if (item.superAdminOnly && !isSuperAdmin()) {
      return false;
    }
    
    // Se o item tem uma permissão específica, verificar se o usuário tem essa permissão
    if (item.permission && !hasPermission(item.permission)) {
      return false;
    }
    
    return true;
  });

  // Filtrar subitens baseado nas permissões
  const filterSubmenuItems = (submenu) => {
    if (!submenu) return [];
    
    return submenu.filter(subitem => {
      // Se o subitem tem uma permissão específica, verificar se o usuário tem essa permissão
      if (subitem.permission && !hasPermission(subitem.permission)) {
        return false;
      }
      
      return true;
    });
  };

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
            <p className="text-sidebar-400 text-sm">Painel Administrativo</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-6">
        <div className="px-4 space-y-2">
          {filteredMenuItems.map((item) => {
            const filteredSubmenu = item.hasSubmenu ? filterSubmenuItems(item.submenu) : [];
            
            // Se o item tem submenu mas nenhum subitem é visível, não mostrar o item principal
            if (item.hasSubmenu && filteredSubmenu.length === 0) {
              return null;
            }
            
            return (
              <div key={item.path}>
                {item.hasSubmenu ? (
                  <div>
                    <button
                      onClick={() => setIaMenuOpen(!iaMenuOpen)}
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
                        className={`w-4 h-4 transform transition-transform ${iaMenuOpen ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {iaMenuOpen && (
                      <div className="mt-2 ml-6 space-y-1">
                        {filteredSubmenu.map((subitem) => (
                          <Link
                            key={subitem.path}
                            to={subitem.path}
                            className={`block px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
                              location.pathname === subitem.path
                                ? 'bg-primary-500 text-white'
                                : 'text-sidebar-400 hover:bg-sidebar-800 hover:text-white'
                            }`}
                          >
                            {subitem.name}
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
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-700">
        <div className="text-center text-sidebar-400 text-xs">
          <p>© 2024 {config.companyName}</p>
          <p>Versão 1.0.0</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;