import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredPermissions = [], requireAll = false, requireAuthOnly = false, fallback = null }) => {
  const { isAuthenticated, loading, hasPermission, hasAnyPermission, hasAllPermissions, isSuperAdmin } = useAuth();
  const location = useLocation();

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-main flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p>Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Redirecionar para login se não estiver autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se só requer autenticação, permitir acesso
  if (requireAuthOnly) {
    return children;
  }

  // Super Admin tem acesso a tudo
  if (isSuperAdmin()) {
    return children;
  }

  // Verificar permissões se fornecidas
  if (requiredPermissions.length > 0) {
    console.log('🔍 ProtectedRoute - requiredPermissions:', requiredPermissions);
    console.log('🔍 ProtectedRoute - requireAll:', requireAll);
    
    let hasAccess = false;

    if (requireAll) {
      // Usuário deve ter TODAS as permissões
      hasAccess = hasAllPermissions(requiredPermissions);
      console.log('🔍 ProtectedRoute - hasAllPermissions result:', hasAccess);
    } else {
      // Usuário deve ter PELO MENOS UMA das permissões
      hasAccess = hasAnyPermission(requiredPermissions);
      console.log('🔍 ProtectedRoute - hasAnyPermission result:', hasAccess);
    }

    console.log('🔍 ProtectedRoute - final hasAccess:', hasAccess);

    if (!hasAccess) {
      // Se foi fornecido um componente de fallback, mostrar ele
      if (fallback) {
        return fallback;
      }

      // Caso contrário, mostrar página de acesso negado
      return (
        <div className="min-h-screen bg-gradient-main flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="bg-sidebar-800/50 backdrop-blur-sm rounded-lg border border-white/10 p-8">
              <div className="mb-6">
                <svg className="h-16 w-16 mx-auto text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-4">
                Acesso Negado
              </h2>
              
              <p className="text-sidebar-400 mb-6">
                Você não tem permissão para acessar esta página. Entre em contato com o administrador se precisar de acesso.
              </p>
              
              <button
                onClick={() => window.history.back()}
                className="bg-primary-600 hover:bg-primary-500 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  // Se chegou até aqui, usuário tem acesso
  return children;
};

export default ProtectedRoute;