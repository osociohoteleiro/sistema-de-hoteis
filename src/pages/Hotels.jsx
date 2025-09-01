import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import HotelDrawer from '../components/HotelDrawer';
import HotelForm from '../components/HotelForm';
import apiService from '../services/api';
import toast from 'react-hot-toast';

const Hotels = () => {
  const { loading, setLoading, selectedHotelUuid, selectHotel } = useApp();
  const [hotels, setHotels] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  const fetchHotels = async () => {
    setLoading(true);
    
    try {
      const response = await apiService.getHotels();
      
      // A API retorna { hotels: [...], pagination: {...} }
      const hotelsData = response.hotels || [];
      
      console.log('Hotéis carregados:', hotelsData);
      setHotels(hotelsData);
    } catch (error) {
      console.error('Erro ao carregar hotéis:', error);
      
      // Se não houver token, mostrar dados de exemplo
      if (error.message.includes('401') || error.message.includes('403')) {
        console.log('Sem autenticação, usando dados de exemplo');
        const exampleHotels = [
          {
            id: 1,
            hotel_uuid: 'hotel-exemplo-1',
            hotel_nome: 'Hotel Exemplo 1',
            hora_checkin: '14:00:00',
            hora_checkout: '12:00:00',
            hotel_capa: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&crop=center'
          },
          {
            id: 2,
            hotel_uuid: 'hotel-exemplo-2', 
            hotel_nome: 'Hotel Exemplo 2',
            hora_checkin: '15:00:00',
            hora_checkout: '11:00:00',
            hotel_capa: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop&crop=center'
          },
          {
            id: 3,
            hotel_uuid: 'hotel-exemplo-3',
            hotel_nome: 'Hotel Teste',
            hora_checkin: '16:00:00', 
            hora_checkout: '10:00:00',
            hotel_capa: null
          }
        ];
        setHotels(exampleHotels);
      } else {
        toast.error('Erro ao carregar hotéis');
        setHotels([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  const handleDeleteHotel = async (hotelId) => {
    if (!confirm('Tem certeza que deseja excluir este hotel?')) return;

    try {
      await apiService.deleteHotel(hotelId);
      toast.success('Hotel excluído com sucesso!');
      setHotels(hotels.filter(hotel => hotel.id !== hotelId));
    } catch (error) {
      console.error('Erro ao excluir hotel:', error);
      toast.error('Erro ao excluir hotel');
    }
  };

  const HotelCard = ({ hotel }) => (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden hover:bg-white/15 transition-all duration-200">
      {/* Hotel Image */}
      {hotel.hotel_capa && (
        <div className="h-48 overflow-hidden">
          <img 
            src={hotel.hotel_capa} 
            alt={hotel.hotel_nome || 'Hotel'} 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}
      
      {/* Hotel Info */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-white mb-3">
          {hotel.hotel_nome || 'Hotel sem nome'}
        </h3>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-2 text-sm text-sidebar-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Check-in: {hotel.hora_checkin || 'N/A'}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-sidebar-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Check-out: {hotel.hora_checkout || 'N/A'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
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

          <div className="flex items-center space-x-2">
            {selectedHotelUuid !== hotel.hotel_uuid && (
              <button
                onClick={() => selectHotel(hotel.hotel_uuid)}
                className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-colors"
                title="Selecionar hotel"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            )}
            <Link
              to={`/hoteis/editar/${hotel.id || hotel.hotel_uuid}`}
              className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
              title="Editar hotel"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Link>
            <button
              onClick={() => handleDeleteHotel(hotel.id)}
              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Excluir hotel"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

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
            Comece cadastrando seu primeiro hotel.
          </p>
          <button
            onClick={openDrawer}
            className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Cadastrar Primeiro Hotel
          </button>
        </div>
      )}

      {/* Hotels Grid */}
      {!loading && hotels.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotels.map((hotel) => (
            <HotelCard key={hotel.id || hotel.hotel_uuid} hotel={hotel} />
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