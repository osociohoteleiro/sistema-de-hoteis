import { useState } from 'react';
import toast from 'react-hot-toast';
import ImageUpload from './ImageUpload';
import apiService from '../services/api';

const HotelForm = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    hotel_nome: '',
    hora_checkin: '',
    hora_checkout: '',
    hotel_capa: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
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
    
    if (!formData.hotel_nome || !formData.hora_checkin || !formData.hora_checkout) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsSubmitting(true);

    try {
      // Formatar dados para a API
      const hotelData = {
        hotel_nome: formData.hotel_nome,
        hotel_capa: formData.hotel_capa || '',
        hora_checkin: formData.hora_checkin + ':00', // Adicionar segundos
        hora_checkout: formData.hora_checkout + ':00' // Adicionar segundos
      };

      const response = await apiService.createHotel(hotelData);

      toast.success(response.message || 'Hotel cadastrado com sucesso!');
      
      // Limpar formulário
      setFormData({
        hotel_nome: '',
        hora_checkin: '',
        hora_checkout: '',
        hotel_capa: ''
      });
      
      onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Erro ao cadastrar hotel:', error);
      
      let errorMessage = 'Erro ao cadastrar hotel. Tente novamente.';
      
      if (error.message.includes('401')) {
        errorMessage = 'Sessão expirada. Por favor, faça login novamente.';
      } else if (error.message.includes('403')) {
        errorMessage = 'Você não tem permissão para cadastrar hotéis.';
      } else if (error.message.includes('409')) {
        errorMessage = 'Já existe um hotel com esse nome.';
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="hotel_nome" className="block text-sm font-medium text-white mb-2">
          Nome do Hotel *
        </label>
        <input
          type="text"
          id="hotel_nome"
          name="hotel_nome"
          value={formData.hotel_nome}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-sidebar-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="Digite o nome do hotel"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="hora_checkin" className="block text-sm font-medium text-white mb-2">
            Horário de Check-in *
          </label>
          <input
            type="time"
            id="hora_checkin"
            name="hora_checkin"
            value={formData.hora_checkin}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            required
          />
        </div>

        <div>
          <label htmlFor="hora_checkout" className="block text-sm font-medium text-white mb-2">
            Horário de Check-out *
          </label>
          <input
            type="time"
            id="hora_checkout"
            name="hora_checkout"
            value={formData.hora_checkout}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            required
          />
        </div>
      </div>

      <ImageUpload
        value={formData.hotel_capa}
        onChange={handleImageChange}
        label="Imagem de Capa do Hotel (Opcional)"
        hotelName={formData.hotel_nome}
      />

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2 text-sm font-medium text-sidebar-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-lg transition-colors"
          disabled={isSubmitting}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 border border-transparent rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
        </button>
      </div>
    </form>
  );
};

export default HotelForm;