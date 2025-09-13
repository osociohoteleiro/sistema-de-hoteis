import { Navigate } from 'react-router-dom';
import { useAuth, PERMISSIONS } from '../context/AuthContext';

const SmartRedirect = () => {
  const { hasPermission, isSuperAdmin, user } = useAuth();

  // Super Admin sempre vai para dashboard
  if (isSuperAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  // Definir ordem de prioridade das rotas baseada nas permissões
  const routePriority = [
    { path: '/dashboard', permission: PERMISSIONS.VIEW_DASHBOARD },
    { path: '/calendario', permission: PERMISSIONS.VIEW_PMS_CALENDAR },
    { path: '/rate-shopper', permission: PERMISSIONS.VIEW_PMS_RATE_SHOPPER },
    { path: '/reservas', permission: PERMISSIONS.MANAGE_PMS_RESERVATIONS },
    { path: '/quartos', permission: PERMISSIONS.MANAGE_PMS_ROOMS },
    { path: '/hospedes', permission: PERMISSIONS.MANAGE_PMS_GUESTS },
    { path: '/tarifario', permission: PERMISSIONS.MANAGE_PMS_RATES },
    { path: '/financeiro', permission: PERMISSIONS.VIEW_PMS_FINANCIALS },
    { path: '/relatorios', permission: PERMISSIONS.VIEW_PMS_REPORTS },
  ];


  // Encontrar a primeira rota que o usuário tem permissão
  for (const route of routePriority) {
    if (hasPermission(route.permission)) {
      return <Navigate to={route.path} replace />;
    }
  }

  // Se não tem permissão para nada específico, mostrar erro
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-elegant border border-slate-200/60 p-8">
          <div className="mb-6">
            <svg className="h-16 w-16 mx-auto text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            Sem Acesso ao PMS
          </h2>
          
          <p className="text-slate-600 mb-6">
            Você não tem permissões suficientes para acessar nenhuma funcionalidade do PMS. Entre em contato com o administrador para solicitar as permissões adequadas.
          </p>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-amber-800">
              <span className="font-semibold">Usuário:</span> {user?.name || 'Não identificado'}<br/>
              <span className="font-semibold">Tipo:</span> {user?.user_type || 'Não definido'}<br/>
              <span className="font-semibold">Permissões:</span> {user?.permissions?.length || 0}
            </p>
          </div>
          
          <button
            onClick={() => window.location.href = '/login'}
            className="bg-primary-600 hover:bg-primary-500 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            Voltar ao Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartRedirect;