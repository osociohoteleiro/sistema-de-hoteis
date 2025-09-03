import { useState } from 'react';
import { Search, Bell, User, ChevronDown, Calendar, MessageCircle } from 'lucide-react';

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    // Implementar busca de reservas/hóspedes
    console.log('Buscando:', searchQuery);
  };

  return (
    <header className="bg-white/80 backdrop-blur-lg shadow-elegant border-b border-slate-200/60 sticky top-0 z-40">
      <div className="flex items-center justify-between px-8 py-3">
        {/* Search */}
        <div className="flex-1 max-w-2xl">
          <form onSubmit={handleSearch} className="relative group">
            <div className={`transition-all duration-300 ${searchExpanded ? 'w-full' : 'w-10'}`}>
              {searchExpanded ? (
                <>
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400 group-focus-within:text-primary-500 transition-colors duration-200" />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar reservas, hóspedes, quartos..."
                    className="search-input placeholder:text-slate-400 h-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onBlur={() => !searchQuery && setSearchExpanded(false)}
                    autoFocus
                  />
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setSearchExpanded(true)}
                  onMouseEnter={() => setSearchExpanded(true)}
                  className="p-3 rounded-xl bg-gradient-to-r from-primary-500/10 to-primary-600/10 hover:from-primary-500/20 hover:to-primary-600/20 border border-primary-200 hover:border-primary-300 text-primary-600 hover:text-primary-700 transition-all duration-300 shadow-sm hover:shadow-md group"
                >
                  <Search className="h-5 w-5" />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-6">

          {/* Messages */}
          <div className="relative">
            <button className="relative btn-icon hover:bg-slate-100 hover:text-primary-600 group">
              <MessageCircle className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-r from-success-500 to-success-600 rounded-full flex items-center justify-center shadow-elegant animate-bounce-subtle">
                <span className="text-xs text-white font-bold">2</span>
              </span>
            </button>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative btn-icon hover:bg-slate-100 hover:text-primary-600 group"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-r from-error-500 to-error-600 rounded-full flex items-center justify-center shadow-elegant animate-bounce-subtle">
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

        </div>
      </div>
    </header>
  );
};

export default Header;