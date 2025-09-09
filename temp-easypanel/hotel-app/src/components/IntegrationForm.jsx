import { useState } from 'react';
import { useHotelList } from '../hooks/useHotelList';

const IntegrationForm = ({ selectedHotelUuid, onIntegrationAdded, onCancel }) => {
  const { hotels, loading: loadingHotels, error: hotelError } = useHotelList();
  
  const [formData, setFormData] = useState({
    integration_name: '',
    hotel_uuid: selectedHotelUuid || '',
    apikey: '',
    client_id: '',
    client_secret: '',
    token: '',
    instancia_name: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ['integration_name', 'hotel_uuid'];

    requiredFields.forEach(field => {
      if (!formData[field].trim()) {
        newErrors[field] = 'Este campo é obrigatório';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Send data to API endpoint
      // For now, we'll just pass the data to the parent component
      onIntegrationAdded(formData);
      
      // Reset form
      setFormData({
        integration_name: '',
        hotel_uuid: '',
        apikey: '',
        client_id: '',
        client_secret: '',
        token: '',
        instancia_name: ''
      });
    } catch (error) {
      console.error('Erro ao cadastrar integração:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formFields = [
    { name: 'integration_name', label: 'Nome da Integração', type: 'text', placeholder: 'Ex: WhatsApp Bot Hotel XYZ', required: true },
    { name: 'apikey', label: 'API Key', type: 'password', placeholder: 'Chave da API', required: false },
    { name: 'client_id', label: 'Client ID', type: 'text', placeholder: 'ID do cliente', required: false },
    { name: 'client_secret', label: 'Client Secret', type: 'password', placeholder: 'Segredo do cliente', required: false },
    { name: 'token', label: 'Token', type: 'password', placeholder: 'Token de acesso', required: false },
    { name: 'instancia_name', label: 'Nome da Instância', type: 'text', placeholder: 'Nome da instância', required: false }
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-white">Nova Integração</h4>
        <button
          onClick={onCancel}
          className="text-sidebar-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nome da Integração */}
          <div className="md:col-span-2">
            <label htmlFor="integration_name" className="block text-sm font-medium text-sidebar-300 mb-2">
              Nome da Integração
              <span className="text-red-400 ml-1">*</span>
            </label>
            <input
              type="text"
              id="integration_name"
              name="integration_name"
              value={formData.integration_name}
              onChange={handleInputChange}
              placeholder="Ex: WhatsApp Bot Hotel XYZ"
              className={`w-full px-3 py-2 bg-white/5 border rounded-lg text-white placeholder-sidebar-400 
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                ${errors.integration_name ? 'border-red-500' : 'border-white/20'}
              `}
              disabled={isSubmitting}
            />
            {errors.integration_name && (
              <p className="text-red-400 text-xs mt-1">{errors.integration_name}</p>
            )}
          </div>

          {/* Select de Hotel */}
          <div className="md:col-span-2">
            <label htmlFor="hotel_uuid" className="block text-sm font-medium text-sidebar-300 mb-2">
              Hotel
              <span className="text-red-400 ml-1">*</span>
            </label>
            {hotelError && (
              <div className="mb-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-yellow-300 text-xs">
                {hotelError}
              </div>
            )}
            <select
              id="hotel_uuid"
              name="hotel_uuid"
              value={formData.hotel_uuid}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 bg-white/5 border rounded-lg text-white 
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                ${errors.hotel_uuid ? 'border-red-500' : 'border-white/20'}
                ${selectedHotelUuid ? 'opacity-70' : ''}
              `}
              disabled={isSubmitting || loadingHotels || !!selectedHotelUuid}
            >
              <option value="">
                {loadingHotels ? 'Carregando hotéis...' : 'Selecione um hotel'}
              </option>
              {hotels.map((hotel) => (
                <option key={hotel.value} value={hotel.value} className="bg-sidebar-800">
                  {hotel.label}
                </option>
              ))}
            </select>
            {errors.hotel_uuid && (
              <p className="text-red-400 text-xs mt-1">{errors.hotel_uuid}</p>
            )}
          </div>

          {/* Campos opcionais */}
          {formFields.map((field) => (
            <div key={field.name}>
              <label htmlFor={field.name} className="block text-sm font-medium text-sidebar-300 mb-2">
                {field.label}
                {field.required && <span className="text-red-400 ml-1">*</span>}
                {!field.required && <span className="text-sidebar-500 ml-1">(opcional)</span>}
              </label>
              <input
                type={field.type}
                id={field.name}
                name={field.name}
                value={formData[field.name]}
                onChange={handleInputChange}
                placeholder={field.placeholder}
                className={`w-full px-3 py-2 bg-white/5 border rounded-lg text-white placeholder-sidebar-400 
                  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                  ${errors[field.name] ? 'border-red-500' : 'border-white/20'}
                `}
                disabled={isSubmitting}
              />
              {errors[field.name] && (
                <p className="text-red-400 text-xs mt-1">{errors[field.name]}</p>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sidebar-300 hover:text-white transition-colors"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed
              text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Cadastrando...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Cadastrar Integração</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default IntegrationForm;