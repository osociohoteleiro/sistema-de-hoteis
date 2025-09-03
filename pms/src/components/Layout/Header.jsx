import { useState } from 'react';
import { Search, Bell, User, ChevronDown, Calendar } from 'lucide-react';

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    // Implementar busca de reservas/hóspedes
    console.log('Buscando:', searchQuery);
  };

  return (
    <header className="bg-white/80 backdrop-blur-lg shadow-elegant border-b border-slate-200/60 sticky top-0 z-40">
      <div className="flex items-center justify-between px-8 py-5">
        {/* Search */}
        <div className="flex-1 max-w-2xl">
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400 group-focus-within:text-primary-500 transition-colors duration-200" />
            </div>
            <input
              type="text"
              placeholder="Buscar reservas, hóspedes, quartos..."
              className="search-input placeholder:text-slate-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-6">
          {/* Date display */}
          <div className="hidden lg:flex items-center glass-card px-4 py-2.5">
            <Calendar className="h-4 w-4 mr-3 text-primary-600" />
            <div>
              <span className="text-sm font-semibold text-slate-800 block">
                {new Date().toLocaleDateString('pt-BR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'short'
                })}
              </span>
              <span className="text-xs text-slate-500">
                {new Date().getFullYear()}
              </span>
            </div>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative btn-icon hover:bg-slate-100 hover:text-primary-600 group"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-error-500 to-error-600 rounded-full flex items-center justify-center shadow-elegant animate-bounce-subtle">
                <span className="text-xs text-white font-bold">3</span>
              </span>
            </button>

            {/* Notifications dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-96 glass-card shadow-elegant-lg border border-white/20 z-50 animate-slide-up">
                <div className="px-6 py-4 border-b border-slate-200/60">
                  <h3 className="text-base font-bold text-slate-800">Notificações</h3>
                  <p className="text-xs text-slate-500 mt-1">3 novas notificações</p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  <div className="px-6 py-4 hover:bg-slate-50/50 transition-colors duration-200 border-l-4 border-transparent hover:border-primary-500">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-success-500 rounded-full mt-2 animate-bounce-subtle"></div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Nova reserva recebida</p>
                        <p className="text-xs text-slate-500 mt-1">João Silva - Quarto 205</p>
                        <p className="text-xs text-slate-400">Há 2 minutos</p>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-4 hover:bg-slate-50/50 transition-colors duration-200 border-l-4 border-transparent hover:border-warning-500">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-warning-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Check-out pendente</p>
                        <p className="text-xs text-slate-500 mt-1">Quarto 205 - Vencimento em 30min</p>
                        <p className="text-xs text-slate-400">Há 15 minutos</p>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-4 hover:bg-slate-50/50 transition-colors duration-200 border-l-4 border-transparent hover:border-primary-500">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Pagamento confirmado</p>
                        <p className="text-xs text-slate-500 mt-1">R$ 1.200,00 - Reserva #R001</p>
                        <p className="text-xs text-slate-400">Há 1 hora</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-slate-200/60 bg-slate-50/30">
                  <button className="text-sm text-primary-600 hover:text-primary-700 font-semibold transition-colors duration-200">
                    Ver todas as notificações →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center glass-card px-4 py-2.5 hover:shadow-elegant transition-all duration-200 group"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center mr-3 shadow-elegant">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="hidden md:block text-left">
                <span className="text-sm font-semibold text-slate-800 block">Admin User</span>
                <span className="text-xs text-slate-500">Administrador</span>
              </div>
              <ChevronDown className="h-4 w-4 ml-3 text-slate-500 group-hover:text-primary-600 transition-colors duration-200" />
            </button>

            {/* User dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-3 w-56 glass-card shadow-elegant-lg border border-white/20 z-50 animate-slide-up">
                <div className="px-4 py-3 border-b border-slate-200/60">
                  <p className="text-sm font-semibold text-slate-800">Admin User</p>
                  <p className="text-xs text-slate-500">admin@osh.com</p>
                </div>
                <div className="py-2">
                  <a href="#" className="flex items-center px-4 py-3 text-sm text-slate-700 hover:bg-slate-50/50 transition-colors duration-200">
                    <User className="h-4 w-4 mr-3 text-slate-500" />
                    Meu Perfil
                  </a>
                  <a href="#" className="flex items-center px-4 py-3 text-sm text-slate-700 hover:bg-slate-50/50 transition-colors duration-200">
                    <Bell className="h-4 w-4 mr-3 text-slate-500" />
                    Configurações
                  </a>
                </div>
                <div className="border-t border-slate-200/60 py-2">
                  <a href="#" className="flex items-center px-4 py-3 text-sm text-error-600 hover:bg-error-50/50 transition-colors duration-200 font-medium">
                    <span className="mr-3">🚪</span>
                    Sair do Sistema
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;