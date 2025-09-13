import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, User, ChevronDown, Calendar, MessageCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import apiService from '../../services/api';
import toast from 'react-hot-toast';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isCalendarPage = location.pathname === '/calendario';
  const headerRef = useRef(null);
  const { user, logout } = useAuth();
  const { selectedHotelUuid, selectHotel } = useApp();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showHotelMenu, setShowHotelMenu] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [hotels, setHotels] = useState([]);
  const [loadingHotels, setLoadingHotels] = useState(false);
  const userMenuRef = useRef(null);
  const hotelMenuRef = useRef(null);

  // Gerenciar cliques fora dos menus
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (hotelMenuRef.current && !hotelMenuRef.current.contains(event.target)) {
        setShowHotelMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Carregar hotéis do usuário
  useEffect(() => {
    if (user) {
      fetchUserHotels();
    }
  }, [user]);


  // Força o header a ser static na página do calendário
  useEffect(() => {
    if (headerRef.current) {
      if (isCalendarPage) {
        headerRef.current.style.setProperty('position', 'absolute', 'important');
        headerRef.current.style.setProperty('top', 'auto', 'important');
        headerRef.current.style.setProperty('z-index', '9999', 'important');
        headerRef.current.style.setProperty('transform', 'none', 'important');
        headerRef.current.style.setProperty('left', '18rem', 'important'); // Largura da sidebar expandida
        headerRef.current.style.setProperty('right', '0px', 'important');  
        headerRef.current.style.setProperty('width', 'calc(100vw - 18rem)', 'important');
        headerRef.current.style.setProperty('height', '63px', 'important');
      } else {
        headerRef.current.style.removeProperty('position');
        headerRef.current.style.removeProperty('top');
        headerRef.current.style.removeProperty('z-index');
        headerRef.current.style.removeProperty('transform');
        headerRef.current.style.removeProperty('left');
        headerRef.current.style.removeProperty('right');
        headerRef.current.style.removeProperty('width');
        headerRef.current.style.removeProperty('height');
      }
    }
  }, [isCalendarPage]);

  // Buscar hotéis do usuário
  const fetchUserHotels = async () => {
    if (!user || loadingHotels) return;
    
    setLoadingHotels(true);
    try {
      const response = await apiService.getHotels();
      const hotelsList = response.hotels || [];
      setHotels(hotelsList);
    } catch (error) {
      console.error('Erro ao buscar hotéis:', error);
      // Não mostrar toast de erro se for erro de rede (API offline)
      if (!error.message?.includes('Failed to fetch') && !error.message?.includes('Network Error')) {
        toast.error('Erro ao carregar hotéis');
      }
      setHotels([]);
    } finally {
      setLoadingHotels(false);
    }
  };

  // Selecionar um hotel
  const handleHotelSelect = (hotel) => {
    selectHotel(hotel.hotel_uuid || hotel.id);
    setShowHotelMenu(false);
    const hotelName = hotel.hotel_nome || hotel.name || 'Hotel';
    toast.success(`Hotel "${hotelName}" selecionado`);
  };

  // Obter nome do hotel selecionado
  const getSelectedHotelName = () => {
    if (!selectedHotelUuid) return 'Selecione um Hotel';
    const selectedHotel = hotels.find(h => 
      (h.hotel_uuid && h.hotel_uuid === selectedHotelUuid) ||
      (h.id && h.id.toString() === selectedHotelUuid)
    );
    return selectedHotel ? (selectedHotel.hotel_nome || selectedHotel.name || 'Hotel') : 'Selecione um Hotel';
  };

  // Fazer logout
  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
    toast.success('Logout realizado com sucesso');
    navigate('/login');
  };

  // Obter tipo de usuário
  const getUserTypeLabel = (userType) => {
    switch (userType) {
      case 'SUPER_ADMIN':
        return 'Super Admin';
      case 'ADMIN':
        return 'Administrador';
      case 'HOTEL':
        return 'Hoteleiro';
      default:
        return userType || 'Usuário';
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Implementar busca de reservas/hóspedes
  };

  return (
    <>
      <header 
        ref={headerRef}
        className={`bg-white/80 backdrop-blur-lg shadow-elegant border-b border-slate-200/60 ${isCalendarPage ? 'calendar-page-header' : ''}`}
        style={{
          ...(isCalendarPage ? {} : {
            position: 'sticky',
            top: '0',
            zIndex: '9999999'
          })
        }}
      >
      <div className="flex items-center justify-between px-8 py-3">
        {/* Seleção de Hotel */}
        <div className="flex items-center space-x-6">
          <div className="relative z-50" ref={hotelMenuRef}>
            <button 
              onClick={() => setShowHotelMenu(!showHotelMenu)}
              className="flex items-center space-x-3 bg-white/60 hover:bg-white/80 text-slate-700 hover:text-slate-800 px-4 py-2.5 rounded-xl transition-colors border border-slate-300/60 hover:border-slate-400/60 min-w-[280px] justify-between shadow-sm hover:shadow-md"
              disabled={loadingHotels}
            >
              <svg className="w-4 h-4 flex-shrink-0 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <div className="flex items-center space-x-3 flex-1">
                <span className="text-sm font-medium truncate">
                  {loadingHotels ? 'Carregando...' : getSelectedHotelName()}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform flex-shrink-0 ${showHotelMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Hotel Menu Dropdown */}
            {showHotelMenu && (
              <div className="absolute left-0 mt-2 w-80 bg-white/95 backdrop-blur-sm rounded-xl shadow-elegant border border-slate-200/60 z-[99999]">
                <div className="py-2">
                  <div className="px-4 py-2 border-b border-slate-200/60">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-800">Selecionar Hotel</p>
                        <p className="text-xs text-slate-500">Escolha o hotel para gerenciar no PMS</p>
                      </div>
                    </div>
                  </div>
                  
                  {loadingHotels ? (
                    <div className="px-4 py-3 text-center">
                      <div className="inline-flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
                        <span className="text-sm text-slate-600">Carregando hotéis...</span>
                      </div>
                    </div>
                  ) : hotels.length === 0 ? (
                    <div className="px-4 py-3 text-center">
                      <span className="text-sm text-slate-500">Nenhum hotel encontrado</span>
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto">
                      {hotels.map((hotel) => {
                        const hotelId = hotel.hotel_uuid || hotel.id;
                        const hotelName = hotel.hotel_nome || hotel.name;
                        const isSelected = selectedHotelUuid === hotelId;
                        
                        return (
                          <button
                            key={hotelId}
                            onClick={() => handleHotelSelect(hotel)}
                            className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-slate-100 flex items-center space-x-3 ${
                              isSelected ? 'bg-primary-50 text-primary-700 border-l-2 border-primary-500' : 'text-slate-700'
                            }`}
                          >
                            <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-primary-500' : 'bg-slate-300'}`}></div>
                            <div className="flex-1">
                              <p className="font-medium truncate">{hotelName || 'Hotel sem nome'}</p>
                            </div>
                            {isSelected && (
                              <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-xl mx-6">
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

          {/* User Profile */}
          <div className="relative" ref={userMenuRef} style={{zIndex: 999999}}>
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 bg-white/60 hover:bg-white/80 rounded-xl px-3 py-2 transition-colors border border-slate-300/60 hover:border-slate-400/60 shadow-sm hover:shadow-md"
            >
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="text-sm">
                <p className="text-slate-800 font-medium">
                  {user?.name || 'Usuário'}
                </p>
                <p className="text-slate-500 text-xs">
                  {getUserTypeLabel(user?.type)}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </button>

            {/* User Menu Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-sm rounded-xl shadow-elegant border border-slate-200/60" style={{zIndex: 999999}}>
                <div className="py-2">
                  <div className="px-4 py-2 border-b border-slate-200/60">
                    <p className="text-sm font-medium text-slate-800">
                      {user?.name || 'Usuário'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {user?.email || 'email@exemplo.com'}
                    </p>
                    <p className="text-xs text-primary-500">
                      {getUserTypeLabel(user?.type)}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      toast.info('Perfil em desenvolvimento');
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors flex items-center space-x-2"
                  >
                    <User className="w-4 h-4" />
                    <span>Perfil</span>
                  </button>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3V6a3 3 0 013 3v1" />
                    </svg>
                    <span>Sair</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
    </>
  );
};

export default Header;