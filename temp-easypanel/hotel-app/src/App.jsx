import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { PERMISSIONS } from './context/AuthContext';
import Layout from './components/Layout';
import HotelLayout from './components/HotelLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Hotels from './pages/Hotels';
import EditHotel from './pages/EditHotel';
import Settings from './pages/Settings';
import AI from './pages/AI';
import AIConfiguracoes from './pages/AIConfiguracoes';
import Permissions from './pages/Permissions';
import TestUpload from './components/TestUpload';
import HotelDashboard from './pages/hotel/HotelDashboard';
import HotelIA from './pages/hotel/HotelIA';
import MyHotels from './pages/hotel/MyHotels';
import Reports from './pages/hotel/Reports';
import Reservations from './pages/hotel/Reservations';
import CustomerService from './pages/hotel/CustomerService';
import Marketing from './pages/hotel/Marketing';

function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Rota de Login - Pública */}
            <Route path="/login" element={<Login />} />

            {/* Rotas Protegidas - Dentro do Layout */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              {/* Redirecionar root para dashboard */}
              <Route index element={<Navigate to="/dashboard" replace />} />
              
              {/* Dashboard - Requer permissão VIEW_DASHBOARD */}
              <Route path="dashboard" element={
                <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_DASHBOARD]}>
                  <Dashboard />
                </ProtectedRoute>
              } />

              {/* Hotéis - Requer permissão VIEW_HOTELS */}
              <Route path="hoteis" element={
                <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_HOTELS]}>
                  <Hotels />
                </ProtectedRoute>
              } />

              {/* Editar Hotel - Requer permissão EDIT_HOTEL */}
              <Route path="hoteis/editar/:hotelUuid" element={
                <ProtectedRoute requiredPermissions={[PERMISSIONS.EDIT_HOTEL]}>
                  <EditHotel />
                </ProtectedRoute>
              } />

              {/* IA - Requer permissão VIEW_AI */}
              <Route path="ia" element={
                <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_AI]}>
                  <AI />
                </ProtectedRoute>
              } />

              {/* Configurações de IA - Requer permissão VIEW_AI_CONFIGURATIONS */}
              <Route path="ia/configuracoes" element={
                <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_AI_CONFIGURATIONS]}>
                  <AIConfiguracoes />
                </ProtectedRoute>
              } />

              {/* Configurações - Requer permissão VIEW_SETTINGS */}
              <Route path="configuracoes" element={
                <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_SETTINGS]}>
                  <Settings />
                </ProtectedRoute>
              } />

              {/* Gerenciar Permissões - Apenas Super Admin */}
              <Route path="admin/permissoes" element={
                <ProtectedRoute requiredPermissions={[PERMISSIONS.MANAGE_PERMISSIONS]}>
                  <Permissions />
                </ProtectedRoute>
              } />

              {/* Teste de Upload - Para desenvolvimento */}
              <Route path="teste-upload" element={
                <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_SETTINGS]}>
                  <TestUpload />
                </ProtectedRoute>
              } />

            </Route>

            {/* Área do Hotel - Layout separado */}
            <Route path="/hotel" element={
              <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_HOTEL_AREA]}>
                <HotelLayout />
              </ProtectedRoute>
            }>
              {/* Redirecionar /hotel para /hotel/dashboard */}
              <Route index element={<Navigate to="/hotel/dashboard" replace />} />
              
              {/* Dashboard do Hotel */}
              <Route path="dashboard" element={<HotelDashboard />} />

              {/* IA do Hotel */}
              <Route path="ia" element={<HotelIA />} />

              {/* Meus Hotéis */}
              <Route path="meus-hoteis" element={<MyHotels />} />

              {/* Marketing */}
              <Route path="marketing" element={<Marketing />} />

              {/* Relatórios - Rotas aninhadas */}
              <Route path="relatorios/financeiro" element={<Reports reportType="financeiro" />} />
              <Route path="relatorios/operacional" element={<Reports reportType="operacional" />} />
              <Route path="relatorios/satisfacao" element={<Reports reportType="satisfacao" />} />
              {/* Redirecionar /hotel/relatorios para /hotel/relatorios/financeiro */}
              <Route path="relatorios" element={<Navigate to="/hotel/relatorios/financeiro" replace />} />

              {/* Reservas */}
              <Route path="reservas" element={<Reservations />} />

              {/* Atendimento ao Cliente */}
              <Route path="atendimento" element={<CustomerService />} />
            </Route>

            {/* Rota 404 para páginas não encontradas */}
            <Route path="*" element={
              <div className="min-h-screen bg-gradient-main flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">🔍</div>
                  <h2 className="text-2xl font-bold text-white mb-4">Página não encontrada</h2>
                  <p className="text-sidebar-400 mb-6">A página que você está procurando não existe.</p>
                  <button 
                    onClick={() => window.history.back()} 
                    className="bg-primary-600 hover:bg-primary-500 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    Voltar
                  </button>
                </div>
              </div>
            } />
          </Routes>
        </Router>
        
        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#fff',
              border: '1px solid #374151'
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff'
              }
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff'
              }
            }
          }}
        />
      </AuthProvider>
    </AppProvider>
  );
}

export default App
