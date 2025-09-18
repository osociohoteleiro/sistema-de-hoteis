import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import WorkspaceSidebar from './WorkspaceSidebar';
import Header from './Header';
import Breadcrumbs from './Breadcrumbs';
import { useSidebar } from '../contexts/SidebarContext';

const Layout = () => {
  const { isWorkspaceVisible, getMainContentMargin } = useSidebar();

  // Calcular margem dinâmica baseada nos estados das sidebars
  const mainContentMargin = `ml-${getMainContentMargin()}`;

  return (
    <div className="min-h-screen bg-gradient-blue-depth">

      {/* Primary Sidebar */}
      <Sidebar />

      {/* Workspace Sidebar (conditional) */}
      {isWorkspaceVisible && <WorkspaceSidebar />}

      {/* Main Content Area */}
      <div
        className="relative transition-margin"
        style={{ marginLeft: `${getMainContentMargin() * 4}px` }}
      >
        {/* Header */}
        <Header />

        {/* Breadcrumbs */}
        <Breadcrumbs />

        {/* Page Content */}
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;