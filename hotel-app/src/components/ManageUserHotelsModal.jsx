import { useState, useEffect } from 'react';
import { USER_TYPES } from '../context/AuthContext';
import apiService from '../services/api';
import toast from 'react-hot-toast';

const ManageUserHotelsModal = ({ isOpen, onClose, user }) => {
  const [hotels, setHotels] = useState([]);
  const [userHotels, setUserHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingHotels, setLoadingHotels] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Carregar dados quando o modal abrir
  useEffect(() => {
    if (isOpen && user) {
      loadData();
    }
  }, [isOpen, user]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadHotels(),
        loadUserHotels()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const loadHotels = async () => {
    try {
      setLoadingHotels(true);
      const response = await apiService.getHotels();
      setHotels(response.hotels || []);
    } catch (error) {
      console.error('Erro ao carregar hotéis:', error);
      throw error;
    } finally {
      setLoadingHotels(false);
    }
  };

  const loadUserHotels = async () => {
    try {
      // Por enquanto, vamos usar uma API fictícia
      // Esta será implementada no backend
      const response = await apiService.request(`/users/${user.id}/hotels`);
      setUserHotels(response.hotels || []);
    } catch (error) {
      console.error('Erro ao carregar hotéis do usuário:', error);
      // Se a API não existir ainda, inicializar com array vazio
      setUserHotels([]);
    }
  };

  const handleHotelToggle = (hotelId) => {
    setUserHotels(prev => {
      const isCurrentlyLinked = prev.some(h => h.hotel_id === hotelId);
      
      if (isCurrentlyLinked) {
        // Remover vinculação
        return prev.filter(h => h.hotel_id !== hotelId);
      } else {
        // Adicionar vinculação
        return [...prev, {
          hotel_id: hotelId,
          role: 'STAFF',
          active: true
        }];
      }
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Preparar dados para enviar
      const hotelIds = userHotels.map(h => h.hotel_id);
      
      // Chamar API para salvar vinculações
      await apiService.request(`/users/${user.id}/hotels`, {
        method: 'PUT',
        body: JSON.stringify({ hotel_ids: hotelIds })
      });

      toast.success('Vinculações de hotéis atualizadas com sucesso!');
      onClose();

    } catch (error) {
      console.error('Erro ao salvar vinculações:', error);
      
      let errorMessage = 'Erro ao salvar vinculações';
      if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      // Reset search term when closing
      setSearchTerm('');
      onClose();
    }
  };

  // Filtrar hotéis com base no termo de busca
  const filteredHotels = hotels.filter(hotel => 
    hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (hotel.address && hotel.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Separar hotéis vinculados e não vinculados
  const linkedHotels = filteredHotels.filter(hotel => 
    userHotels.some(h => h.hotel_id === hotel.id)
  );
  
  const unlinkedHotels = filteredHotels.filter(hotel => 
    !userHotels.some(h => h.hotel_id === hotel.id)
  );

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-sidebar-800/95 border border-white/10 rounded-lg max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-semibold text-white">Gerenciar Hotéis</h2>
            <p className="text-sidebar-400 text-sm mt-1">
              Vincular <span className="text-white font-medium">{user.name}</span> aos hotéis
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={saving}
            className="text-sidebar-400 hover:text-white transition-colors p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Info do usuário */}
          <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {user.name?.charAt(0) || '?'}
                </span>
              </div>
              <div>
                <h3 className="text-white font-medium">{user.name}</h3>
                <p className="text-sidebar-400 text-sm">{user.email}</p>
                <span className={`inline-block text-xs px-2 py-1 rounded-full mt-1 ${
                  user.user_type === 'SUPER_ADMIN' ? 'bg-red-500/20 text-red-400' :
                  user.user_type === 'ADMIN' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {user.user_type === 'SUPER_ADMIN' ? 'Super Admin' :
                   user.user_type === 'ADMIN' ? 'Admin' : 'Hoteleiro'}
                </span>
              </div>
            </div>
            
            {user.user_type !== USER_TYPES.HOTEL && (
              <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-yellow-300 text-sm">
                  ℹ️ Este usuário não é do tipo "Hoteleiro", mas ainda pode ser vinculado a hotéis específicos.
                </p>
              </div>
            )}
          </div>

          {/* Hotéis Vinculados (mostrar primeiro se houver) */}
          {linkedHotels.length > 0 && (
            <div className="mb-6">
              <h4 className="text-white font-medium mb-3 flex items-center">
                <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Hotéis Vinculados ({linkedHotels.length})
              </h4>
              
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="space-y-2">
                  {linkedHotels.map((hotel) => (
                    <label
                      key={hotel.id}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-green-500/5 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={true}
                        onChange={() => handleHotelToggle(hotel.id)}
                        className="w-4 h-4 text-green-600 bg-white/10 border-white/20 rounded focus:ring-green-500 focus:ring-2"
                        disabled={saving}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{hotel.name}</p>
                        {hotel.address && (
                          <p className="text-sidebar-400 text-xs truncate">{hotel.address}</p>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <span className="text-green-400 text-xs bg-green-500/20 px-2 py-1 rounded-full">
                          ✓ Vinculado
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Busca e Seleção de Hotéis */}
          <div>
            <h4 className="text-white font-medium mb-3">Buscar e Vincular Hotéis:</h4>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                <span className="ml-2 text-sidebar-400">Carregando...</span>
              </div>
            ) : hotels.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <p className="text-sidebar-400 text-sm">Nenhum hotel encontrado no sistema.</p>
                <p className="text-sidebar-400 text-xs mt-1">Cadastre hotéis antes de vincular usuários.</p>
              </div>
            ) : (
              <>
                {/* Campo de Busca */}
                <div className="mb-4">
                  <div className="relative">
                    <svg className="w-5 h-5 text-sidebar-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Buscar hotéis por nome ou endereço..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-sidebar-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      disabled={saving}
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-sidebar-400 hover:text-white transition-colors"
                        disabled={saving}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Lista de Hotéis Disponíveis */}
                {filteredHotels.length === 0 ? (
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <p className="text-sidebar-400 text-sm text-center">
                      {searchTerm ? `Nenhum hotel encontrado para "${searchTerm}"` : 'Use a busca acima para encontrar hotéis'}
                    </p>
                  </div>
                ) : unlinkedHotels.length === 0 ? (
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <p className="text-sidebar-400 text-sm text-center">
                      Todos os hotéis encontrados já estão vinculados
                    </p>
                  </div>
                ) : (
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <div className="space-y-2">
                      {unlinkedHotels.map((hotel) => (
                        <label
                          key={hotel.id}
                          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={false}
                            onChange={() => handleHotelToggle(hotel.id)}
                            className="w-4 h-4 text-primary-600 bg-white/10 border-white/20 rounded focus:ring-primary-500 focus:ring-2"
                            disabled={saving}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{hotel.name}</p>
                            {hotel.address && (
                              <p className="text-sidebar-400 text-xs truncate">{hotel.address}</p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contador de hotéis selecionados */}
                {userHotels.length > 0 && (
                  <div className="mt-4 p-3 bg-primary-500/10 border border-primary-500/20 rounded-lg">
                    <p className="text-primary-400 text-sm text-center">
                      ✓ {userHotels.length} hotel{userHotels.length !== 1 ? 'éis' : ''} selecionado{userHotels.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-white/10">
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="flex-1 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-500 disabled:bg-primary-800 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : (
              'Salvar Vinculações'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageUserHotelsModal;