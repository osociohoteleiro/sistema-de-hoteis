import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import HotelDrawer from '../components/HotelDrawer';
import HotelForm from '../components/HotelForm';

const Hotels = () => {
  const { config, loading, setLoading, selectedHotelUuid, selectHotel } = useApp();
  const [hotels, setHotels] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [error, setError] = useState(null);
  const [initialLoad, setInitialLoad] = useState(true);

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  const fetchHotels = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Se não há endpoint configurado, usar dados de exemplo para desenvolvimento
      if (!config.apiEndpoints.listHotels) {
        console.log('📝 Nenhum endpoint de listagem configurado, usando dados de exemplo...');
        
        // Dados de exemplo para desenvolvimento
        const exampleHotels = [
          {
            hotel_uuid: 'hotel-exemplo-1',
            name: 'Hotel Exemplo 1',
            checkin_time: '14:00:00',
            checkout_time: '12:00:00',
            cover_image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&crop=center'
          },
          {
            hotel_uuid: 'hotel-exemplo-2', 
            name: 'Hotel Exemplo 2',
            checkin_time: '15:00:00',
            checkout_time: '11:00:00',
            cover_image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop&crop=center'
          },
          {
            hotel_uuid: 'hotel-exemplo-3',
            name: 'Hotel Teste S3',
            checkin_time: '16:00:00', 
            checkout_time: '10:00:00',
            cover_image: null // Para testar upload
          }
        ];
        
        // Simular delay da API
        await new Promise(resolve => setTimeout(resolve, 800));
        setHotels(exampleHotels);
        return;
      }

      // Usar endpoint configurado se disponível
      console.log('🌐 Buscando hotéis da API:', config.apiEndpoints.listHotels);
      
      // Preparar headers com autenticação se disponível
      const headers = {
        'Content-Type': 'application/json'
      };
      
      const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(config.apiEndpoints.listHotels, {
        method: 'GET',
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        // O endpoint /my-hotels retorna { success: true, hotels: [...] }
        const hotelList = data.hotels || (Array.isArray(data) ? data : []);
        console.log('✅ Hotéis carregados com sucesso:', hotelList.length, 'hotéis encontrados');
        setHotels(hotelList);
      } else {
        const errorText = await response.text();
        console.error('❌ Erro na resposta da API:', response.status, errorText);
        
        if (response.status === 401) {
          throw new Error('Não autorizado. Faça login novamente.');
        } else if (response.status === 404) {
          throw new Error('Endpoint não encontrado. Verifique a configuração da API.');
        } else {
          throw new Error(`Falha ao carregar hotéis (${response.status}): ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar hotéis:', error);
      const errorMessage = error.message || 'Erro desconhecido ao carregar hotéis';
      setError(errorMessage);
      setHotels([]);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  useEffect(() => {
    // Aguardar um pouco para garantir que o contexto esteja carregado
    const timer = setTimeout(() => {
      fetchHotels();
    }, 100);
    
    return () => clearTimeout(timer);
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
            {hotel.cover_image ? (
              <img 
                src={hotel.cover_image} 
                alt={hotel.name || 'Hotel'} 
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
              {hotel.name || 'Hotel sem nome'}
            </h3>
            <div className="flex items-center space-x-6 text-sm text-sidebar-300">
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Check-in: {hotel.checkin_time || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Check-out: {hotel.checkout_time || 'N/A'}</span>
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

      {/* Initial Loading State - Bloqueia tela até carregar */}
      {initialLoad && loading && (
        <div className="fixed inset-0 bg-gradient-main/95 flex items-center justify-center z-50">
          <div className="bg-sidebar-800/80 backdrop-blur-sm rounded-xl border border-white/20 p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-white mb-2">Carregando Sistema</h3>
            <p className="text-sidebar-300">Aguarde enquanto buscamos seus hotéis...</p>
          </div>
        </div>
      )}

      {/* Error State - Mostra erro se API falhar */}
      {!loading && error && (
        <div className="bg-red-500/10 backdrop-blur-sm rounded-xl border border-red-500/20 p-8 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Erro ao Carregar Hotéis</h3>
          <p className="text-sidebar-300 mb-6">{error}</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={fetchHotels}
              className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Tentar Novamente</span>
            </button>
            <button
              onClick={openDrawer}
              className="bg-sidebar-600 hover:bg-sidebar-500 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Cadastrar Hotel</span>
            </button>
          </div>
        </div>
      )}

      {/* Subsequent Loading State - Loading mais sutil para recarregamentos */}
      {!initialLoad && loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          <span className="ml-3 text-sidebar-300">Recarregando hotéis...</span>
        </div>
      )}

      {/* Empty State - Só mostra se não há erro */}
      {!loading && !error && hotels.length === 0 && (
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

      {/* Hotels List - Só mostra se não há erro */}
      {!loading && !error && hotels.length > 0 && (
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