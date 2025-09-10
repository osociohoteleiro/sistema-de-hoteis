import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import apiService from '../../services/api';
import toast from 'react-hot-toast';

const MyHotels = () => {
  const { user } = useAuth();
  const { selectedHotelUuid, selectHotel } = useApp();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [error, setError] = useState(null);
  const [initialLoad, setInitialLoad] = useState(true);

  // Carregar hotéis da API
  const fetchHotels = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🏨 Buscando meus hotéis...');
      const response = await apiService.request('/hotels/my-hotels');
      
      if (response && Array.isArray(response)) {
        // Mapear dados da API para o formato esperado pelo componente
        const mappedHotels = response.map(hotel => ({
          id: hotel.id,
          uuid: hotel.hotel_uuid,
          name: hotel.hotel_nome || hotel.name,
          location: hotel.hotel_endereco || hotel.address || 'Localização não informada',
          image: hotel.hotel_capa || hotel.cover_image,
          description: hotel.hotel_descricao || hotel.description || 'Descrição não disponível',
          status: hotel.hotel_status?.toLowerCase() || hotel.status?.toLowerCase() || 'active',
          checkin_time: hotel.hora_checkin || hotel.checkin_time,
          checkout_time: hotel.hora_checkout || hotel.checkout_time,
          lastUpdate: hotel.created_at
        }));
        
        console.log('✅ Hotéis carregados com sucesso:', mappedHotels.length, 'hotéis encontrados');
        setHotels(mappedHotels);
        
        // Auto-selecionar hotel se usuário tem apenas 1 e nenhum está selecionado
        if (mappedHotels.length === 1 && !selectedHotelUuid) {
          selectHotel(mappedHotels[0].uuid);
          toast.success(`Hotel "${mappedHotels[0].name}" selecionado automaticamente`);
        }
      } else if (response && response.hotels && Array.isArray(response.hotels)) {
        // Fallback para formato antigo
        const mappedHotels = response.hotels.map(hotel => ({
          id: hotel.id,
          uuid: hotel.hotel_uuid,
          name: hotel.name,
          location: hotel.address || 'Localização não informada',
          image: hotel.cover_image,
          description: hotel.description || 'Descrição não disponível',
          status: hotel.status?.toLowerCase() || 'active',
          checkin_time: hotel.checkin_time,
          checkout_time: hotel.checkout_time,
          lastUpdate: hotel.created_at
        }));
        
        setHotels(mappedHotels);
      } else {
        console.log('⚠️ Nenhum hotel encontrado na resposta');
        setHotels([]);
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
    fetchHotels();
  }, []);


  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-500/10 text-green-400 border-green-500/20',
      maintenance: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      inactive: 'bg-red-500/10 text-red-400 border-red-500/20'
    };
    return colors[status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  };

  const getStatusLabel = (status) => {
    const labels = {
      active: 'Ativo',
      maintenance: 'Manutenção',
      inactive: 'Inativo'
    };
    return labels[status] || 'Desconhecido';
  };

  const handleViewDetails = (hotel) => {
    setSelectedHotel(hotel);
  };

  const handleManageHotel = (hotelId) => {
    toast.info('Redirecionando para gestão do hotel...');
    // Aqui seria implementada a navegação para a área específica do hotel
  };

  // Initial Loading State - Bloqueia tela até carregar
  if (initialLoad && loading) {
    return (
      <div className="fixed inset-0 bg-gradient-main/95 flex items-center justify-center z-50">
        <div className="bg-sidebar-800/80 backdrop-blur-sm rounded-xl border border-white/20 p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-white mb-2">Carregando Hotéis</h3>
          <p className="text-sidebar-300">Aguarde enquanto buscamos seus hotéis...</p>
        </div>
      </div>
    );
  }
  
  // Error State - Mostra erro se API falhar
  if (!loading && error) {
    return (
      <div className="space-y-6">
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
          </div>
        </div>
      </div>
    );
  }
  
  // Subsequent Loading State - Loading mais sutil para recarregamentos
  if (!initialLoad && loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-white/10 rounded animate-pulse w-48"></div>
            <div className="h-4 bg-white/10 rounded animate-pulse w-64 mt-2"></div>
          </div>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          <span className="ml-3 text-sidebar-300">Recarregando hotéis...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Meus Hotéis</h1>
          <p className="text-sidebar-400">Gerencie os hotéis aos quais você tem acesso</p>
        </div>
        
        <div className="text-right">
          <p className="text-sidebar-400 text-sm">Total de Hotéis</p>
          <p className="text-2xl font-bold text-primary-400">{hotels.length}</p>
        </div>
      </div>


      {/* Lista de Hotéis */}
      <div className="space-y-4">
        {hotels.map((hotel) => {
          const HotelCard = () => {
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
              if (selectedHotelUuid !== hotel.uuid) {
                selectHotel(hotel.uuid);
                toast.success(`Hotel "${hotel.name}" selecionado`);
              }
            };

            const handleMenuClick = (e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            };

            return (
              <div 
                key={hotel.id}
                onClick={handleCardClick}
                className={`bg-white/10 backdrop-blur-sm rounded-xl border transition-all duration-200 cursor-pointer relative ${
                  selectedHotelUuid === hotel.uuid 
                    ? 'border-blue-400/50 bg-blue-500/10' 
                    : 'border-white/20 hover:bg-white/15'
                }`}
              >
                <div className="flex items-center p-4">
                  {/* Hotel Image */}
                  <div className="w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-sidebar-600">
                    {hotel.image && hotel.image !== '/api/placeholder/300/200' ? (
                      <img 
                        src={hotel.image} 
                        alt={hotel.name} 
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
                      {hotel.name}
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
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(hotel.status)}`}>
                        {getStatusLabel(hotel.status)}
                      </span>
                      {selectedHotelUuid === hotel.uuid && (
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
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleManageHotel(hotel.id);
                                setShowMenu(false);
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-sidebar-200 hover:bg-white/5 transition-colors flex items-center space-x-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span>Gerenciar</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          };

          return <HotelCard key={hotel.id} />;
        })}
      </div>

      {/* Nenhum hotel encontrado - Só mostra se não há erro */}
      {hotels.length === 0 && !loading && !error && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏨</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Nenhum hotel encontrado
          </h3>
          <p className="text-sidebar-400">
            Você ainda não tem hotéis cadastrados ou não possui acesso a nenhum hotel.
          </p>
        </div>
      )}

      {/* Modal de Detalhes do Hotel */}
      {selectedHotel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-sidebar-800 rounded-lg border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">{selectedHotel.name}</h3>
                <button
                  onClick={() => setSelectedHotel(null)}
                  className="text-sidebar-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Informações Básicas */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-3">Informações Básicas</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sidebar-400 text-sm">Localização</p>
                    <p className="text-white">{selectedHotel.location}</p>
                  </div>
                  <div>
                    <p className="text-sidebar-400 text-sm">Status</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedHotel.status)}`}>
                      {getStatusLabel(selectedHotel.status)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sidebar-400 text-sm">Check-in</p>
                    <p className="text-white">{selectedHotel.checkin_time || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-sidebar-400 text-sm">Check-out</p>
                    <p className="text-white">{selectedHotel.checkout_time || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-sidebar-400 text-sm">Criado em</p>
                    <p className="text-white">{new Date(selectedHotel.lastUpdate).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              </div>

              {/* Descrição */}
              {selectedHotel.description && selectedHotel.description !== 'Descrição não disponível' && (
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">Descrição</h4>
                  <p className="text-sidebar-300">{selectedHotel.description}</p>
                </div>
              )}

              {/* Ações */}
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    handleManageHotel(selectedHotel.id);
                    setSelectedHotel(null);
                  }}
                  className="flex-1 bg-primary-600 hover:bg-primary-500 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                >
                  Gerenciar Hotel
                </button>
                <button
                  onClick={() => setSelectedHotel(null)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyHotels;