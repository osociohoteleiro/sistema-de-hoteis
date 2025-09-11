import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isSuperAdmin, USER_TYPES } = useAuth();
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


  const getUserTypeLabel = (userType) => {
    switch (userType) {
      case USER_TYPES.SUPER_ADMIN:
        return 'Super Admin';
      case USER_TYPES.ADMIN:
        return 'Administrador';
      case USER_TYPES.HOTEL:
        return 'Hoteleiro';
      default:
        return userType || 'Usuário';
    }
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
    toast.success('Logout realizado com sucesso');
    navigate('/login');
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
      case '/dashboard':
        return 'Dashboard';
      case '/hoteis':
        return 'Gerenciamento de Hotéis';
      case '/configuracoes':
        return 'Configurações do Sistema';
      case '/ia':
        return 'Inteligência Artificial';
      case '/ia/configuracoes':
        return 'Configurações IA';
      case '/admin/permissoes':
        return 'Gerenciar Permissões';
      default:
        return 'Painel Profissional';
    }
  };

  const getPageDescription = () => {
    switch (location.pathname) {
      case '/':
      case '/dashboard':
        return 'Visão geral do sistema e estatísticas';
      case '/hoteis':
        return 'Visualize e gerencie todos os hotéis cadastrados';
      case '/configuracoes':
        return 'Configure o sistema e endpoints da API';
      case '/ia':
        return 'Configurações e gerenciamento de IA';
      case '/ia/configuracoes':
        return 'Configurações avançadas da IA';
      case '/admin/permissoes':
        return 'Configure permissões de usuários Admin';
      default:
        return 'Sistema de gerenciamento profissional';
    }
  };

  return (
    <header className="bg-white/10 backdrop-blur-sm border-b border-white/10 px-6 py-4 relative overflow-visible z-50">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {getPageTitle()}
          </h1>
          <p className="text-sidebar-300 mt-1">
            {getPageDescription()}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Notification Bell */}
          <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.97 4.97a7.5 7.5 0 010 10.6" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.737 17.016a4.5 4.5 0 01-6.474 0" />
            </svg>
          </button>

          {/* User Profile */}
          <div className="relative z-50" ref={userMenuRef}>
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 bg-white/10 rounded-lg px-3 py-2 hover:bg-white/20 transition-colors"
            >
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="text-sm">
                <p className="text-white font-medium">
                  {user?.name || 'Usuário'}
                </p>
                <p className="text-sidebar-300">
                  {getUserTypeLabel(user?.user_type)}
                </p>
              </div>
              <svg className="w-4 h-4 text-sidebar-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* User Menu Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-sidebar-800 rounded-lg shadow-lg border border-white/10 z-[99999] shadow-2xl">
                <div className="py-2">
                  <div className="px-4 py-2 border-b border-white/10">
                    <p className="text-sm font-medium text-white">
                      {user?.name || 'Usuário'}
                    </p>
                    <p className="text-xs text-sidebar-400">
                      {user?.email || 'email@exemplo.com'}
                    </p>
                    <p className="text-xs text-primary-400">
                      {getUserTypeLabel(user?.user_type)}
                    </p>
                  </div>
                  
                  {/* Área do Hoteleiro */}
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/hotel');
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-sidebar-200 hover:bg-white/5 transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span>Área do Hoteleiro</span>
                  </button>

                  {/* Gerenciar Permissões - Apenas para Super Admin */}
                  {isSuperAdmin() && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/admin/permissoes');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-sidebar-200 hover:bg-white/5 transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>Gerenciar Permissões</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      // Navigate to profile page if it exists
                      toast.info('Página de perfil em desenvolvimento');
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-sidebar-200 hover:bg-white/5 transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Perfil</span>
                  </button>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1" />
                    </svg>
                    <span>Sair</span>
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