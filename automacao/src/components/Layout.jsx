import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gradient-blue-depth">
      
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="ml-64 relative">
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