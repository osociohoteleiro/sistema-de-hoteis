import { useAuth } from '../context/AuthContext';
import { AlertCircle, Lock } from 'lucide-react';

const PermissionWrapper = ({ children, requiredPermissions = [], requireAll = false }) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isSuperAdmin } = useAuth();

  // Super Admin tem acesso a tudo
  if (isSuperAdmin()) {
    return children;
  }

  // Verificar se tem permissões necessárias
  let hasAccess = true;
  
  if (requiredPermissions.length > 0) {
    if (requireAll) {
      hasAccess = hasAllPermissions(requiredPermissions);
    } else {
      hasAccess = hasAnyPermission(requiredPermissions);
    }
  }

  // Se não tem acesso, mostrar mensagem
  if (!hasAccess) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-elegant border border-slate-200/60 p-8">
            <div className="mb-6">
              <div className="relative">
                <Lock className="h-16 w-16 mx-auto text-amber-500 mb-2" />
                <AlertCircle className="h-6 w-6 absolute -bottom-1 -right-1 text-red-400 bg-white rounded-full p-0.5" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              Permissão Necessária
            </h2>
            
            <p className="text-slate-600 mb-6">
              Você não tem permissão para acessar esta funcionalidade do PMS. Entre em contato com o administrador para solicitar acesso.
            </p>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-amber-800">
                <span className="font-semibold">Funcionalidade:</span> {children.type?.displayName || 'Página PMS'}
              </p>
            </div>
            
            <button
              onClick={() => window.history.back()}
              className="bg-primary-600 hover:bg-primary-500 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Se tem acesso, mostrar o conteúdo
  return children;
};

export default PermissionWrapper;