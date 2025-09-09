import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import apiService from '../services/api';
import toast from 'react-hot-toast';

const HotelHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { selectedHotelUuid, selectHotel } = useApp();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showHotelMenu, setShowHotelMenu] = useState(false);
  const [hotels, setHotels] = useState([]);
  const [loadingHotels, setLoadingHotels] = useState(false);
  const userMenuRef = useRef(null);
  const hotelMenuRef = useRef(null);

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

  useEffect(() => {
    fetchUserHotels();
  }, [user]);

  const fetchUserHotels = async () => {
    if (!user) return;
    
    setLoadingHotels(true);
    try {
      const response = await apiService.getHotels();
      const hotelsList = response.hotels || response || [];
      setHotels(hotelsList);
    } catch (error) {
      console.error('Erro ao buscar hotéis:', error);
      toast.error('Erro ao carregar hotéis');
      setHotels([]);
    } finally {
      setLoadingHotels(false);
    }
  };

  const handleHotelSelect = (hotel) => {
    selectHotel(hotel.hotel_uuid || hotel.uuid || hotel.id);
    setShowHotelMenu(false);
    const hotelName = hotel.hotel_nome || hotel.nome || hotel.name || hotel.hotel_name || 'Hotel';
    toast.success(`Hotel "${hotelName}" selecionado`);
  };

  const getSelectedHotelName = () => {
    if (!selectedHotelUuid) return 'Selecione um Hotel';
    const selectedHotel = hotels.find(h => 
      (h.hotel_uuid && h.hotel_uuid === selectedHotelUuid) ||
      (h.uuid && h.uuid === selectedHotelUuid) ||
      (h.id && h.id === selectedHotelUuid)
    );
    return selectedHotel ? (selectedHotel.hotel_nome || selectedHotel.nome || selectedHotel.name || selectedHotel.hotel_name || 'Hotel') : 'Selecione um Hotel';
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
    toast.success('Logout realizado com sucesso');
    navigate('/login');
  };


  return (
    <header className="bg-white/10 backdrop-blur-sm border-b border-white/10 px-6 py-4 relative overflow-visible z-50">
      <div className="flex items-center justify-between">
        {/* Seleção de Hotel */}
        <div className="flex items-center space-x-3">
          <div className="relative z-50" ref={hotelMenuRef}>
            <button 
              onClick={() => setShowHotelMenu(!showHotelMenu)}
              className="flex items-center space-x-3 bg-white/5 hover:bg-white/10 text-white hover:text-white px-4 py-2.5 rounded-lg transition-colors border border-white/10 min-w-[280px] justify-between"
              disabled={loadingHotels}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <div className="flex items-center space-x-3 flex-1">
                <span className="text-sm font-medium truncate">
                  {loadingHotels ? 'Carregando...' : getSelectedHotelName()}
                </span>
              </div>
              <svg className={`w-4 h-4 transition-transform flex-shrink-0 ${showHotelMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Hotel Menu Dropdown */}
            {showHotelMenu && (
              <div className="absolute left-0 mt-2 w-80 bg-sidebar-800/95 backdrop-blur-sm rounded-lg shadow-lg border border-white/10 z-[99999] shadow-2xl">
                <div className="py-2">
                  <div className="px-4 py-2 border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">Selecionar Hotel</p>
                        <p className="text-xs text-sidebar-400">Escolha o hotel para gerenciar</p>
                      </div>
                      <button
                        onClick={() => {
                          setShowHotelMenu(false);
                          navigate('/hotel/meus-hoteis');
                        }}
                        className="text-xs text-primary-400 hover:text-primary-300 bg-primary-500/10 hover:bg-primary-500/20 px-2 py-1 rounded transition-colors"
                      >
                        Ver todos
                      </button>
                    </div>
                  </div>
                  
                  {loadingHotels ? (
                    <div className="px-4 py-3 text-center">
                      <div className="inline-flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                        <span className="text-sm text-sidebar-300">Carregando hotéis...</span>
                      </div>
                    </div>
                  ) : hotels.length === 0 ? (
                    <div className="px-4 py-3 text-center">
                      <span className="text-sm text-sidebar-400">Nenhum hotel encontrado</span>
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto">
                      {hotels.map((hotel) => {
                        const hotelId = hotel.hotel_uuid || hotel.uuid || hotel.id;
                        const hotelName = hotel.hotel_nome || hotel.nome || hotel.name || hotel.hotel_name;
                        const isSelected = selectedHotelUuid === hotelId;
                        
                        return (
                          <button
                            key={hotelId}
                            onClick={() => handleHotelSelect(hotel)}
                            className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-white/5 flex items-center space-x-3 ${
                              isSelected ? 'bg-white/5 text-white border-l-2 border-white/30' : 'text-sidebar-200'
                            }`}
                          >
                            <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white/60' : 'bg-sidebar-600'}`}></div>
                            <div className="flex-1">
                              <p className="font-medium truncate">{hotelName || 'Hotel sem nome'}</p>
                            </div>
                            {isSelected && (
                              <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        
        <div className="flex items-center space-x-4">
          {/* Notification Bell */}
          <button 
            onClick={() => toast.info('Notificações em desenvolvimento')}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            title="Notificações"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.97 4.97a7.5 7.5 0 010 10.6" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.737 17.016a4.5 4.5 0 01-6.474 0" />
            </svg>
          </button>

          {/* User Profile */}
          <div className="relative z-50" ref={userMenuRef}>
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 bg-white/10 rounded-lg px-3 py-2 hover:bg-white/20 transition-colors"
            >
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {user?.name?.charAt(0) || 'H'}
                </span>
              </div>
              <div className="text-sm">
                <p className="text-white font-medium">
                  {user?.name || 'Hoteleiro'}
                </p>
                <p className="text-sidebar-300">
                  Área do Hotel
                </p>
              </div>
              <svg className="w-4 h-4 text-sidebar-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* User Menu Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-sidebar-800 rounded-lg shadow-lg border border-white/10 z-[99999] shadow-2xl">
                <div className="py-2">
                  <div className="px-4 py-2 border-b border-white/10">
                    <p className="text-sm font-medium text-white">
                      {user?.name || 'Hoteleiro'}
                    </p>
                    <p className="text-xs text-sidebar-400">
                      {user?.email || 'hotel@exemplo.com'}
                    </p>
                    <p className="text-xs text-primary-400">
                      Usuário Hotel
                    </p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      toast.info('Configurações em desenvolvimento');
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-sidebar-200 hover:bg-white/5 transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Configurações</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      toast.info('Ajuda em desenvolvimento');
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-sidebar-200 hover:bg-white/5 transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Ajuda</span>
                  </button>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
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
  );
};

export default HotelHeader;