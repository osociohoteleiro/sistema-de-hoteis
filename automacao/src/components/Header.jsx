import { useLocation, useParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import WorkspaceSelector from './WorkspaceSelector';

const Header = () => {
  const location = useLocation();
  const params = useParams();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
      case '/dashboard':
        return 'Dashboard';
      case '/workspaces':
        return 'Workspaces';
      case '/settings':
        return 'Configurações';
      default:
        return 'Sistema de Automação';
    }
  };

  const getPageDescription = () => {
    switch (location.pathname) {
      case '/':
      case '/dashboard':
        return 'Visão geral do sistema de automação';
      case '/workspaces':
        return 'Gerencie seus espaços de trabalho';
      case '/settings':
        return 'Configurações do sistema';
      default:
        return 'Sistema profissional de automação';
    }
  };

  return (
    <header className="bg-gradient-card-blue backdrop-blur-md border-b border-sapphire-200/30 px-8 py-6 relative z-40 shadow-blue-soft">
      <div className="flex items-center justify-between">
        {/* Se estamos em uma workspace, mostrar seletor, senão mostrar título normal */}
        {params.workspaceUuid ? (
          <WorkspaceSelector />
        ) : (
          <div>
            <h1 className="text-2xl font-semibold text-midnight-950 mb-1">
              {getPageTitle()}
            </h1>
            <p className="text-steel-600 text-sm">
              {getPageDescription()}
            </p>
          </div>
        )}
        
        <div className="flex items-center space-x-4">
          {/* Notification Bell */}
          <button className="p-3 rounded-lg border border-sapphire-200/40 hover:bg-sapphire-50/50 hover:border-sapphire-300/60 transition-minimal group">
            <svg className="w-5 h-5 text-steel-600 group-hover:text-sapphire-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          </button>

          {/* User Profile */}
          <div className="relative z-50" ref={userMenuRef}>
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg border border-sapphire-200/40 hover:bg-sapphire-50/50 hover:border-sapphire-300/60 transition-minimal group"
            >
              <div className="w-8 h-8 bg-gradient-sapphire rounded-full flex items-center justify-center shadow-blue-subtle">
                <span className="text-white text-sm font-semibold">
                  A
                </span>
              </div>
              <div className="text-left">
                <p className="text-midnight-950 text-sm font-medium">
                  Admin
                </p>
                <p className="text-sapphire-600 text-xs">
                  Administrador
                </p>
              </div>
              <svg className="w-4 h-4 text-steel-500 group-hover:text-sapphire-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* User Menu Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-3 w-56 bg-gradient-card-blue backdrop-blur-md rounded-xl border border-sapphire-200/40 shadow-blue-elegant z-[99999]">
                <div className="py-3">
                  <div className="px-5 py-4 border-b border-sapphire-200/30">
                    <p className="text-sm font-semibold text-midnight-950">
                      Administrador
                    </p>
                    <p className="text-xs text-steel-600 mt-1">
                      admin@automacao.com
                    </p>
                    <p className="text-xs text-sapphire-600 font-medium mt-1">
                      Sistema de Automação Professional
                    </p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-5 py-3 text-sm text-steel-700 hover:bg-sapphire-50/50 transition-minimal flex items-center space-x-3 group"
                  >
                    <svg className="w-4 h-4 text-steel-600 group-hover:text-sapphire-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="font-medium">Perfil</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-5 py-3 text-sm text-steel-700 hover:bg-red-50/50 hover:text-red-700 transition-minimal flex items-center space-x-3 group"
                  >
                    <svg className="w-4 h-4 text-steel-600 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1" />
                    </svg>
                    <span className="font-medium">Sair</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;