import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import PermissionWrapper from './components/PermissionWrapper';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Reservas from './pages/Reservas';
import Calendario from './pages/Calendario';
import CalendarioFullCalendar from './pages/CalendarioFullCalendar';
import CheckIn from './pages/CheckIn';
import CheckOut from './pages/CheckOut';
import CalendarioEstilos from './pages/CalendarioEstilos';
import CalendarioGantt from './pages/CalendarioGantt';
import Hospedes from './pages/Hospedes';
import Quartos from './pages/Quartos';
import Tarifario from './pages/Tarifario';
import Financeiro from './pages/Financeiro';
import Relatorios from './pages/Relatorios';
import Configuracoes from './pages/Configuracoes';
import RateShopperDashboard from './pages/RateShopper/RateShopperDashboard';
import PropertyManager from './pages/RateShopper/PropertyManager';
import { PERMISSIONS } from './context/AuthContext';

const router = createBrowserRouter([
  // Rota pública de login
  {
    path: '/login',
    element: <Login />,
  },
  
  // Rotas protegidas dentro do Layout
  {
    path: '/',
    element: (
      <ProtectedRoute requireAuthOnly={true}>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      // Redirecionar root para dashboard
      { index: true, element: <Navigate to="/dashboard" replace /> },
      
      // Dashboard
      { 
        path: 'dashboard', 
        element: (
          <PermissionWrapper requiredPermissions={[PERMISSIONS.VIEW_DASHBOARD]}>
            <Dashboard />
          </PermissionWrapper>
        )
      },
      
      // Reservas
      { 
        path: 'reservas', 
        element: (
          <PermissionWrapper requiredPermissions={[PERMISSIONS.MANAGE_PMS_RESERVATIONS]}>
            <Reservas />
          </PermissionWrapper>
        )
      },
      
      // Calendários
      { 
        path: 'calendario', 
        element: (
          <PermissionWrapper requiredPermissions={[PERMISSIONS.VIEW_PMS_CALENDAR]}>
            <CalendarioFullCalendar />
          </PermissionWrapper>
        )
      },
      { 
        path: 'calendario-antigo', 
        element: (
          <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_PMS_CALENDAR]}>
            <Calendario />
          </ProtectedRoute>
        )
      },
      { 
        path: 'calendario-estilos', 
        element: (
          <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_PMS_CALENDAR]}>
            <CalendarioEstilos />
          </ProtectedRoute>
        )
      },
      { 
        path: 'calendario-gantt', 
        element: (
          <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_PMS_CALENDAR]}>
            <CalendarioGantt />
          </ProtectedRoute>
        )
      },
      
      // Check-in/Check-out
      { 
        path: 'checkin', 
        element: (
          <ProtectedRoute requiredPermissions={[PERMISSIONS.MANAGE_PMS_CHECKIN]}>
            <CheckIn />
          </ProtectedRoute>
        )
      },
      { 
        path: 'checkout', 
        element: (
          <ProtectedRoute requiredPermissions={[PERMISSIONS.MANAGE_PMS_CHECKOUT]}>
            <CheckOut />
          </ProtectedRoute>
        )
      },
      
      // Hóspedes
      { 
        path: 'hospedes', 
        element: (
          <ProtectedRoute requiredPermissions={[PERMISSIONS.MANAGE_PMS_GUESTS]}>
            <Hospedes />
          </ProtectedRoute>
        )
      },
      
      // Quartos
      { 
        path: 'quartos', 
        element: (
          <ProtectedRoute requiredPermissions={[PERMISSIONS.MANAGE_PMS_ROOMS]}>
            <Quartos />
          </ProtectedRoute>
        )
      },
      
      // Tarifário
      { 
        path: 'tarifario', 
        element: (
          <ProtectedRoute requiredPermissions={[PERMISSIONS.MANAGE_PMS_RATES]}>
            <Tarifario />
          </ProtectedRoute>
        )
      },
      
      // Rate Shopper
      { 
        path: 'rate-shopper', 
        element: (
          <PermissionWrapper requiredPermissions={[PERMISSIONS.VIEW_PMS_RATE_SHOPPER]}>
            <RateShopperDashboard />
          </PermissionWrapper>
        )
      },
      { 
        path: 'rate-shopper/properties', 
        element: (
          <ProtectedRoute requiredPermissions={[PERMISSIONS.MANAGE_PMS_RATE_SHOPPER]}>
            <PropertyManager />
          </ProtectedRoute>
        )
      },
      
      // Financeiro
      { 
        path: 'financeiro', 
        element: (
          <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_PMS_FINANCIALS]}>
            <Financeiro />
          </ProtectedRoute>
        )
      },
      
      // Relatórios
      { 
        path: 'relatorios', 
        element: (
          <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_PMS_REPORTS]}>
            <Relatorios />
          </ProtectedRoute>
        )
      },
      
      // Configurações
      { 
        path: 'configuracoes', 
        element: (
          <PermissionWrapper requiredPermissions={[PERMISSIONS.VIEW_SETTINGS]}>
            <Configuracoes />
          </PermissionWrapper>
        )
      },
    ],
  },
  
  // Rota 404 para páginas não encontradas
  {
    path: '*',
    element: (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Página não encontrada</h2>
          <p className="text-slate-600 mb-6">A página que você está procurando não existe no PMS.</p>
          <button 
            onClick={() => window.history.back()} 
            className="bg-primary-600 hover:bg-primary-500 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            Voltar
          </button>
        </div>
      </div>
    )
  }
]);

export default router;