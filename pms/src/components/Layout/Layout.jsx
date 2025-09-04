import { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const isCalendarPage = location.pathname === '/calendario';
  const isRateShopperPage = location.pathname.startsWith('/rate-shopper');
  const needsScroll = isCalendarPage || isRateShopperPage;

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className={`flex-1 ${needsScroll ? 'overflow-auto' : 'overflow-hidden'} bg-slate-50 ${!needsScroll ? 'p-6' : ''}`}>
          <div className={needsScroll && !isCalendarPage ? 'p-6' : ''}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;