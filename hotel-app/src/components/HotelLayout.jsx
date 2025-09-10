import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import HotelSidebar from './HotelSidebar';
import HotelHeader from './HotelHeader';

const HotelLayout = () => {
  const { user, isHotel, isSuperAdmin, isAdmin, hasPermission, PERMISSIONS } = useAuth();

  console.log('🏨 HotelLayout - Verificando acesso:', {
    user: user?.email,
    userType: user?.type,
    isHotel: isHotel(),
    isSuperAdmin: isSuperAdmin(),
    isAdmin: isAdmin(),
    hasHotelAreaPermission: hasPermission(PERMISSIONS.VIEW_HOTEL_AREA)
  });

  // Verificar se tem permissão para acessar área do hotel
  // Super Admin sempre tem acesso, ou se tem a permissão específica
  const hasAccess = isSuperAdmin() || hasPermission(PERMISSIONS.VIEW_HOTEL_AREA);
  
  console.log('🏨 HotelLayout - Resultado final hasAccess:', hasAccess);

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-main flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏨</div>
          <h2 className="text-2xl font-bold text-white mb-4">Área Restrita</h2>
          <p className="text-sidebar-400">Você não tem permissão para acessar a área do hoteleiro.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-main">
      
      {/* Sidebar do Hotel */}
      <HotelSidebar />
      
      {/* Main Content Area */}
      <div className="ml-64 relative">
        {/* Header do Hotel */}
        <HotelHeader />
        
        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default HotelLayout;