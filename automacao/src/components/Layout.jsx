import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import WorkspaceSidebar from './WorkspaceSidebar';
import Header from './Header';

const Layout = () => {
  const location = useLocation();
  
  // Verificar se estamos numa rota de workspace que deve mostrar a segunda sidebar
  const isWorkspaceRoute = () => {
    const workspaceRoutes = [
      '/workspace/',
      '/bot/'
    ];
    return workspaceRoutes.some(route => location.pathname.includes(route));
  };

  const shouldShowWorkspaceSidebar = isWorkspaceRoute();
  const mainContentMargin = shouldShowWorkspaceSidebar ? 'ml-128' : 'ml-64';

  return (
    <div className="min-h-screen bg-gradient-blue-depth">
      
      {/* Primary Sidebar */}
      <Sidebar />
      
      {/* Workspace Sidebar (conditional) */}
      {shouldShowWorkspaceSidebar && <WorkspaceSidebar />}
      
      {/* Main Content Area */}
      <div className={`${mainContentMargin} relative`}>
        {/* Header */}
        <Header />
        
        {/* Page Content */}
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;