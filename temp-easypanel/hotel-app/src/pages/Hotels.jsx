import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import HotelDrawer from '../components/HotelDrawer';
import HotelForm from '../components/HotelForm';

const Hotels = () => {
  const { config, loading, setLoading, selectedHotelUuid, selectHotel } = useApp();
  const [hotels, setHotels] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  const fetchHotels = async () => {
    setLoading(true);
    
    try {
      // Se não há endpoint configurado, usar dados de exemplo para desenvolvimento
      if (!config.apiEndpoints.listHotels) {
        console.log('📝 Nenhum endpoint de listagem configurado, usando dados de exemplo...');
        
        // Dados de exemplo para desenvolvimento
        const exampleHotels = [
          {
            hotel_uuid: 'hotel-exemplo-1',
            hotel_nome: 'Hotel Exemplo 1',
            hora_checkin: '14:00:00',
            hora_checkout: '12:00:00',
            hotel_capa: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&crop=center'
          },
          {
            hotel_uuid: 'hotel-exemplo-2', 
            hotel_nome: 'Hotel Exemplo 2',
            hora_checkin: '15:00:00',
            hora_checkout: '11:00:00',
            hotel_capa: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop&crop=center'
          },
          {
            hotel_uuid: 'hotel-exemplo-3',
            hotel_nome: 'Hotel Teste S3',
            hora_checkin: '16:00:00', 
            hora_checkout: '10:00:00',
            hotel_capa: null // Para testar upload
          }
        ];
        
        setTimeout(() => {
          setHotels(exampleHotels);
          setLoading(false);
        }, 500);
        return;
      }

      // Usar endpoint configurado se disponível
      const response = await fetch(config.apiEndpoints.listHotels);
      if (response.ok) {
        const data = await response.json();
        setHotels(Array.isArray(data) ? data : []);
      } else {
        throw new Error('Erro ao carregar hotéis');
      }
    } catch (error) {
      console.error('Erro ao carregar hotéis da API:', error);
      setHotels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, [config.apiEndpoints.listHotels]);

  const handleDeleteHotel = async (hotelId) => {
    if (!config.apiEndpoints.deleteHotel) {
      console.error('Endpoint de exclusão não configurado');
      return;
    }

    if (!confirm('Tem certeza que deseja excluir este hotel?')) return;

    try {
      const response = await fetch(`${config.apiEndpoints.deleteHotel}/${hotelId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        console.log('Hotel excluído com sucesso!');
        setHotels(hotels.filter(hotel => hotel.hotel_uuid !== hotelId));
      } else {
        throw new Error('Erro ao excluir hotel');
      }
    } catch (error) {
      console.error('Erro ao excluir hotel:', error);
    }
  };

  const HotelCard = ({ hotel }) => {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
          setShowMenu(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    const handleCardClick = () => {
      if (selectedHotelUuid !== hotel.hotel_uuid) {
        selectHotel(hotel.hotel_uuid);
      }
    };

    const handleMenuClick = (e) => {
      e.stopPropagation();
      setShowMenu(!showMenu);
    };

    return (
      <div 
        onClick={handleCardClick}
        className={`bg-white/10 backdrop-blur-sm rounded-xl border transition-all duration-200 cursor-pointer relative ${
          selectedHotelUuid === hotel.hotel_uuid 
            ? 'border-blue-400/50 bg-blue-500/10' 
            : 'border-white/20 hover:bg-white/15'
        }`}
      >
        <div className="flex items-center p-4">
          {/* Hotel Image */}
          <div className="w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-sidebar-600">
            {hotel.hotel_capa ? (
              <img 
                src={hotel.hotel_capa} 
                alt={hotel.hotel_nome || 'Hotel'} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-8 h-8 text-sidebar-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            )}
          </div>
          
          {/* Hotel Info */}
          <div className="flex-1 ml-4">
            <h3 className="text-lg font-bold text-white mb-1">
              {hotel.hotel_nome || 'Hotel sem nome'}
            </h3>
            <div className="flex items-center space-x-6 text-sm text-sidebar-300">
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Check-in: {hotel.hora_checkin || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Check-out: {hotel.hora_checkout || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Status and Menu */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-xs">
                Ativo
              </div>
              {selectedHotelUuid === hotel.hotel_uuid && (
                <div className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs flex items-center space-x-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Selecionado</span>
                </div>
              )}
            </div>
            
            {/* Three dots menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={handleMenuClick}
                className="p-2 text-sidebar-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Mais opções"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute right-0 mt-2 w-32 bg-sidebar-800 rounded-lg shadow-lg border border-white/10 z-50">
                  <div className="py-1">
                    <Link
                      to={`/hoteis/editar/${hotel.hotel_uuid}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-sidebar-200 hover:bg-white/5 transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Gerenciar</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Hotéis Cadastrados</h2>
          <p className="text-sidebar-300 mt-1">
            {hotels.length > 0 
              ? `${hotels.length} hotel${hotels.length > 1 ? 'éis' : ''} encontrado${hotels.length > 1 ? 's' : ''}`
              : 'Nenhum hotel encontrado'
            }
          </p>
        </div>
        
        <button
          onClick={openDrawer}
          className="flex items-center space-x-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Cadastrar Hotel</span>
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          <span className="ml-3 text-sidebar-300">Carregando hotéis...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && hotels.length === 0 && (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-12 text-center">
          <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Nenhum hotel cadastrado</h3>
          <p className="text-sidebar-300 mb-6">
            Comece cadastrando seu primeiro hotel ou configure o endpoint de listagem nas configurações.
          </p>
          <button
            onClick={openDrawer}
            className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Cadastrar Primeiro Hotel
          </button>
        </div>
      )}

      {/* Hotels List */}
      {!loading && hotels.length > 0 && (
        <div className="space-y-4">
          {hotels.map((hotel, index) => (
            <HotelCard key={hotel.hotel_uuid || index} hotel={hotel} />
          ))}
        </div>
      )}

      {/* Hotel Form Drawer */}
      <HotelDrawer isOpen={isDrawerOpen} onClose={closeDrawer}>
        <HotelForm 
          onClose={closeDrawer} 
          onSuccess={() => {
            closeDrawer();
            fetchHotels();
          }}
        />
      </HotelDrawer>
    </div>
  );
};

export default Hotels;