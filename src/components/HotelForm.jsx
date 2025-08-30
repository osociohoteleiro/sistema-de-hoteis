import { useState } from 'react';
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';
import ImageUpload from './ImageUpload';

const HotelForm = ({ onClose, onSuccess }) => {
  const { config } = useApp();
  const [formData, setFormData] = useState({
    nome_hotel: '',
    hora_checkin: '',
    hora_checkout: '',
    img_capa: ''
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
      img_capa: imageUrl
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nome_hotel || !formData.hora_checkin || !formData.hora_checkout || !formData.img_capa) {
      toast.error('Todos os campos são obrigatórios');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(config.apiEndpoints.createHotel, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Hotel cadastrado com sucesso!');
        setFormData({
          nome_hotel: '',
          hora_checkin: '',
          hora_checkout: '',
          img_capa: ''
        });
        onClose();
        if (onSuccess) onSuccess();
      } else {
        throw new Error('Erro na resposta do servidor');
      }
    } catch (error) {
      toast.error('Erro ao cadastrar hotel. Tente novamente.');
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="nome_hotel" className="block text-sm font-medium text-gray-700 mb-2">
          Nome do Hotel
        </label>
        <input
          type="text"
          id="nome_hotel"
          name="nome_hotel"
          value={formData.nome_hotel}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="Digite o nome do hotel"
          required
        />
      </div>

      <div>
        <label htmlFor="hora_checkin" className="block text-sm font-medium text-gray-700 mb-2">
          Horário de Check-in
        </label>
        <input
          type="time"
          id="hora_checkin"
          name="hora_checkin"
          value={formData.hora_checkin}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          required
        />
      </div>

      <div>
        <label htmlFor="hora_checkout" className="block text-sm font-medium text-gray-700 mb-2">
          Horário de Check-out
        </label>
        <input
          type="time"
          id="hora_checkout"
          name="hora_checkout"
          value={formData.hora_checkout}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          required
        />
      </div>

      <ImageUpload
        value={formData.img_capa}
        onChange={handleImageChange}
        label="Imagem de Capa do Hotel"
      />

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          disabled={isSubmitting}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-500 border border-transparent rounded-md shadow-sm hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
        </button>
      </div>
    </form>
  );
};

export default HotelForm;