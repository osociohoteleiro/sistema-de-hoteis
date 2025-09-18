import { Link, useLocation } from 'react-router-dom';
import { useSidebar } from '../contexts/SidebarContext';

const Sidebar = () => {
  const location = useLocation();
  const { isMainCollapsed, toggleMainSidebar, getMainSidebarWidth } = useSidebar();

  const menuItems = [
    {
      path: '/',
      name: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
        </svg>
      )
    },
    {
      path: '/workspaces',
      name: 'Workspaces',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    {
      path: '/flowise',
      name: 'Flowise AI',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      path: '/settings',
      name: 'Configurações',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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

  return (
    <div className={`${isMainCollapsed ? 'w-16' : 'w-64'} bg-gradient-card-blue backdrop-blur-sm min-h-screen fixed left-0 top-0 z-[60] border-r border-sapphire-200/30 shadow-blue-elegant transition-width group`} style={{ overflow: 'visible' }}>
      {/* Toggle Button */}
      <button
        onClick={toggleMainSidebar}
        className="sidebar-toggle-btn bg-gradient-sapphire hover:bg-midnight-700 text-white rounded-full flex items-center justify-center shadow-sapphire-glow transition-minimal opacity-0 group-hover:opacity-100"
        title={isMainCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
      >
        <svg
          className={`w-3 h-3 transition-transform-fast ${isMainCollapsed ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Logo Section */}
      <div className={`${isMainCollapsed ? 'p-4' : 'p-8'} border-b border-sapphire-200/20 transition-sidebar`}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-sapphire rounded-lg flex items-center justify-center shadow-sapphire-glow flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          {!isMainCollapsed && (
            <div className="transition-sidebar overflow-hidden">
              <h1 className="text-midnight-950 font-semibold text-lg whitespace-nowrap">
                Automação
              </h1>
              <p className="text-sapphire-600 text-xs font-medium whitespace-nowrap">Professional</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-2">
        <div className={`${isMainCollapsed ? 'px-2' : 'px-4'} space-y-1 transition-sidebar`}>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 ${isMainCollapsed ? 'px-2 justify-center' : 'px-4'} py-3 rounded-lg transition-minimal group ${
                isActive(item.path)
                  ? 'bg-gradient-sapphire text-white shadow-blue-soft'
                  : 'text-steel-700 hover:bg-sapphire-50/50 hover:text-sapphire-800'
              }`}
              title={isMainCollapsed ? item.name : ''}
            >
              <div className="w-5 h-5 flex-shrink-0">{item.icon}</div>
              {!isMainCollapsed && (
                <span className="text-sm font-medium tracking-wide whitespace-nowrap overflow-hidden">{item.name}</span>
              )}
            </Link>
          ))}
        </div>
      </nav>

      {/* Footer */}
      {!isMainCollapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-sapphire-200/20 transition-sidebar">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gradient-sapphire rounded-full shadow-sapphire-glow"></div>
              <span className="text-steel-600 text-xs font-medium whitespace-nowrap">Sistema Online</span>
            </div>
            <span className="text-sapphire-500 text-xs font-medium whitespace-nowrap">v1.0.0</span>
          </div>
        </div>
      )}

      {/* Status indicator when collapsed */}
      {isMainCollapsed && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="w-2 h-2 bg-gradient-sapphire rounded-full shadow-sapphire-glow"></div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;