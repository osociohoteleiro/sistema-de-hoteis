import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useHotel } from '../hooks/useHotel';
import ImageUpload from '../components/ImageUpload';
import toast from 'react-hot-toast';

const EditHotel = () => {
  const { hotelUuid } = useParams();
  const navigate = useNavigate();
  const { hotel, loading, fetchHotel, updateHotel, deleteHotel } = useHotel();
  
  const [formData, setFormData] = useState({
    hotel_nome: '',
    hora_checkin: '',
    hora_checkout: '',
    hotel_capa: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Carregar dados do hotel
  useEffect(() => {
    if (hotelUuid) {
      fetchHotel(hotelUuid);
    }
  }, [hotelUuid, fetchHotel]);

  // Atualizar form quando hotel for carregado
  useEffect(() => {
    if (hotel) {
      console.log('Carregando dados do hotel no formulário:', hotel);
      
      // Converter horários do formato "14:00:00" para "14:00" (formato input time)
      const formatTimeForInput = (time) => {
        if (!time) return '';
        return time.substring(0, 5); // Pega apenas HH:MM
      };
      
      setFormData({
        hotel_nome: hotel.hotel_nome === 'Hotel para Editar' ? '' : hotel.hotel_nome || '',
        hora_checkin: formatTimeForInput(hotel.hora_checkin),
        hora_checkout: formatTimeForInput(hotel.hora_checkout),
        hotel_capa: hotel.hotel_capa || ''
      });
      
      console.log('Form data definido:', {
        hotel_nome: hotel.hotel_nome,
        hora_checkin: formatTimeForInput(hotel.hora_checkin),
        hora_checkout: formatTimeForInput(hotel.hora_checkout),
        hotel_capa: hotel.hotel_capa
      });
    }
  }, [hotel]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (imageUrl) => {
    setFormData(prev => ({
      ...prev,
      hotel_capa: imageUrl
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.hotel_nome.trim()) {
      toast.error('Nome do hotel é obrigatório');
      return;
    }

    if (!formData.hora_checkin || !formData.hora_checkout) {
      toast.error('Horários de check-in e check-out são obrigatórios');
      return;
    }

    setIsSubmitting(true);

    const success = await updateHotel(hotelUuid, formData);
    
    if (success) {
      setTimeout(() => {
        navigate('/hoteis');
      }, 1500);
    }
    
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    const success = await deleteHotel(hotelUuid);
    
    if (success) {
      setTimeout(() => {
        navigate('/hoteis');
      }, 1500);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="text-white mt-4">Carregando hotel...</p>
        </div>
      </div>
    );
  }

  if (!hotel && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.31 13.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Hotel não encontrado</h2>
          <p className="text-sidebar-300 mb-6">O hotel solicitado não existe ou foi removido.</p>
          <Link
            to="/hoteis"
            className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Voltar para Hotéis
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-sidebar-400 text-sm mb-2">
            <Link to="/" className="hover:text-white transition-colors">Dashboard</Link>
            <span>›</span>
            <Link to="/hoteis" className="hover:text-white transition-colors">Hotéis</Link>
            <span>›</span>
            <span className="text-white">Editar Hotel</span>
          </div>
          <h1 className="text-2xl font-bold text-white">
            {hotel?.hotel_nome || 'Editar Hotel'}
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/hoteis"
            className="px-4 py-2 text-sidebar-300 hover:text-white border border-sidebar-600 hover:border-sidebar-500 rounded-lg transition-colors"
          >
            Voltar
          </Link>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            disabled={loading}
          >
            Excluir Hotel
          </button>
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Hotel Image */}
          <ImageUpload
            value={formData.hotel_capa}
            onChange={handleImageChange}
            label="Imagem de Capa do Hotel"
            hotelName={formData.hotel_nome || hotel?.hotel_nome}
            acceptFiles="image/*"
          />

          {/* Hotel Name */}
          <div>
            <label htmlFor="hotel_nome" className="block text-sm font-medium text-white mb-2">
              Nome do Hotel
            </label>
            <input
              type="text"
              id="hotel_nome"
              name="hotel_nome"
              value={formData.hotel_nome}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-sidebar-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Digite o nome do hotel"
              required
            />
          </div>

          {/* Check-in and Check-out Times */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="hora_checkin" className="block text-sm font-medium text-white mb-2">
                Horário de Check-in
              </label>
              <input
                type="time"
                id="hora_checkin"
                name="hora_checkin"
                value={formData.hora_checkin}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            <div>
              <label htmlFor="hora_checkout" className="block text-sm font-medium text-white mb-2">
                Horário de Check-out
              </label>
              <input
                type="time"
                id="hora_checkout"
                name="hora_checkout"
                value={formData.hora_checkout}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
          </div>


          {/* Action Buttons */}
          <div className="flex gap-4">
            <Link
              to="/hoteis"
              className="flex-1 px-6 py-3 text-center text-sidebar-300 hover:text-white border border-sidebar-600 hover:border-sidebar-500 rounded-lg transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>

      {/* Hotel Info Card */}
      {hotel && (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Informações do Hotel</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-sidebar-400">UUID:</span>
              <p className="text-white font-mono break-all">{hotel.hotel_uuid}</p>
            </div>
            <div>
              <span className="text-sidebar-400">Criado em:</span>
              <p className="text-white">{hotel.hotel_criado_em || 'N/A'}</p>
            </div>
            <div>
              <span className="text-sidebar-400">ID:</span>
              <p className="text-white">{hotel.id || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditHotel;