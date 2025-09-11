import { useState } from 'react';
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';
import ImageUpload from './ImageUpload';
import apiService from '../services/api'; // ✅ CORREÇÃO: Usar apiService

const HotelForm = ({ onClose, onSuccess }) => {
  const { config } = useApp();
  // ✅ CORREÇÃO: Usar nomes de campos que a API espera
  const [formData, setFormData] = useState({
    name: '',
    checkin_time: '14:00:00', // ✅ Padrão da API
    checkout_time: '12:00:00', // ✅ Padrão da API
    cover_image: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: ''
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
      cover_image: imageUrl // ✅ CORREÇÃO: cover_image
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ✅ CORREÇÃO: Validar campos obrigatórios corretos
    if (!formData.name || !formData.checkin_time || !formData.checkout_time) {
      toast.error('Nome do hotel e horários são obrigatórios');
      return;
    }

    setIsSubmitting(true);

    try {
      // ✅ CORREÇÃO: Usar apiService
      const response = await apiService.createHotel({
        name: formData.name,
        cover_image: formData.cover_image || null,
        checkin_time: formData.checkin_time + (formData.checkin_time.length === 5 ? ':00' : ''), // Garantir formato HH:MM:SS
        checkout_time: formData.checkout_time + (formData.checkout_time.length === 5 ? ':00' : ''), // Garantir formato HH:MM:SS
        description: formData.description || null,
        address: formData.address || null,
        phone: formData.phone || null,
        email: formData.email || null,
        website: formData.website || null
      });

      toast.success('Hotel cadastrado com sucesso!');
      
      // ✅ CORREÇÃO: Reset com campos corretos
      setFormData({
        name: '',
        checkin_time: '14:00:00',
        checkout_time: '12:00:00', 
        cover_image: '',
        description: '',
        address: '',
        phone: '',
        email: '',
        website: ''
      });
      
      onClose();
      if (onSuccess) onSuccess();
      
    } catch (error) {
      toast.error(`Erro ao cadastrar hotel: ${error.message}`);
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Nome do Hotel *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="Digite o nome do hotel"
          required
        />
      </div>

      <div>
        <label htmlFor="checkin_time" className="block text-sm font-medium text-gray-700 mb-2">
          Horário de Check-in
        </label>
        <input
          type="time"
          id="checkin_time"
          name="checkin_time"
          value={formData.checkin_time.substring(0, 5)}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          required
        />
      </div>

      <div>
        <label htmlFor="checkout_time" className="block text-sm font-medium text-gray-700 mb-2">
          Horário de Check-out
        </label>
        <input
          type="time"
          id="checkout_time"
          name="checkout_time"
          value={formData.checkout_time.substring(0, 5)}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          required
        />
      </div>

      <ImageUpload
        value={formData.cover_image}
        onChange={handleImageChange}
        label="Imagem de Capa do Hotel"
      />

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Descrição do Hotel
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="Descreva o hotel..."
        />
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
          Endereço
        </label>
        <input
          type="text"
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="Endereço completo do hotel"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Telefone
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="(11) 99999-9999"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            E-mail
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="contato@hotel.com"
          />
        </div>
      </div>

      <div>
        <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
          Website
        </label>
        <input
          type="url"
          id="website"
          name="website"
          value={formData.website}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="https://www.hotel.com"
        />
      </div>

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