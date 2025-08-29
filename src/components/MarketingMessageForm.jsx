import { useState } from 'react';
import { useHotelList } from '../hooks/useHotelList';

const MarketingMessageForm = ({ selectedHotelUuid, onMessageAdded, onCancel }) => {
  const { hotels, loading: loadingHotels, error: hotelError } = useHotelList();
  
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    offset_tempo: '',
    unidade_tempo: 'horas',
    antes_apos: 'antes',
    referencia: 'checkin',
    canal: 'whatsapp',
    modelo_mensagem: '',
    hotel_uuid: selectedHotelUuid || ''
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
    const requiredFields = ['nome', 'descricao', 'offset_tempo', 'modelo_mensagem', 'hotel_uuid'];

    requiredFields.forEach(field => {
      if (field === 'offset_tempo') {
        if (!formData[field] || parseInt(formData[field]) <= 0) {
          newErrors[field] = 'Tempo deve ser um número maior que zero';
        }
      } else if (!formData[field] || (typeof formData[field] === 'string' && !formData[field].trim())) {
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
      onMessageAdded(formData);
      
      // Reset form
      setFormData({
        nome: '',
        descricao: '',
        offset_tempo: '',
        unidade_tempo: 'horas',
        antes_apos: 'antes',
        referencia: 'checkin',
        canal: 'whatsapp',
        modelo_mensagem: '',
        hotel_uuid: ''
      });
    } catch (error) {
      console.error('Erro ao cadastrar mensagem:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const unidadeTempoOptions = [
    { value: 'horas', label: 'Horas' },
    { value: 'dias', label: 'Dias' }
  ];

  const antesAposOptions = [
    { value: 'antes', label: 'Antes' },
    { value: 'apos', label: 'Após' }
  ];

  const referenciaOptions = [
    { value: 'checkin', label: 'Check-in' },
    { value: 'checkout', label: 'Check-out' },
    { value: 'ao_reservar', label: 'Ao Reservar' }
  ];

  const canalOptions = [
    { value: 'email', label: 'E-mail' },
    { value: 'sms', label: 'SMS' },
    { value: 'whatsapp', label: 'WhatsApp' }
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-white">Nova Campanha de Marketing</h4>
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
        {/* Nome */}
        <div>
          <label htmlFor="nome" className="block text-sm font-medium text-sidebar-300 mb-2">
            Nome da Campanha
            <span className="text-red-400 ml-1">*</span>
          </label>
          <input
            type="text"
            id="nome"
            name="nome"
            value={formData.nome}
            onChange={handleInputChange}
            placeholder="Ex: Lembrete Check-in WhatsApp"
            className={`w-full px-3 py-2 bg-white/5 border rounded-lg text-white placeholder-sidebar-400 
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
              ${errors.nome ? 'border-red-500' : 'border-white/20'}
            `}
            disabled={isSubmitting}
          />
          {errors.nome && (
            <p className="text-red-400 text-xs mt-1">{errors.nome}</p>
          )}
        </div>

        {/* Descrição */}
        <div>
          <label htmlFor="descricao" className="block text-sm font-medium text-sidebar-300 mb-2">
            Descrição
            <span className="text-red-400 ml-1">*</span>
          </label>
          <textarea
            id="descricao"
            name="descricao"
            value={formData.descricao}
            onChange={handleInputChange}
            placeholder="Descreva o objetivo desta campanha de marketing..."
            rows={3}
            className={`w-full px-3 py-2 bg-white/5 border rounded-lg text-white placeholder-sidebar-400 
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-vertical
              ${errors.descricao ? 'border-red-500' : 'border-white/20'}
            `}
            disabled={isSubmitting}
          />
          {errors.descricao && (
            <p className="text-red-400 text-xs mt-1">{errors.descricao}</p>
          )}
        </div>

        {/* Configuração de Timing */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-4">
          <h4 className="text-white font-medium text-sm">Configuração de Tempo</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tempo */}
            <div>
              <label htmlFor="offset_tempo" className="block text-sm font-medium text-sidebar-300 mb-2">
                Tempo
                <span className="text-red-400 ml-1">*</span>
              </label>
              <input
                type="number"
                id="offset_tempo"
                name="offset_tempo"
                value={formData.offset_tempo}
                onChange={handleInputChange}
                placeholder="2"
                min="1"
                className={`w-full px-3 py-2 bg-white/5 border rounded-lg text-white placeholder-sidebar-400 
                  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                  ${errors.offset_tempo ? 'border-red-500' : 'border-white/20'}
                `}
                disabled={isSubmitting}
              />
              {errors.offset_tempo && (
                <p className="text-red-400 text-xs mt-1">{errors.offset_tempo}</p>
              )}
            </div>

            {/* Unidade de Tempo */}
            <div>
              <label htmlFor="unidade_tempo" className="block text-sm font-medium text-sidebar-300 mb-2">
                Unidade
              </label>
              <select
                id="unidade_tempo"
                name="unidade_tempo"
                value={formData.unidade_tempo}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white 
                  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={isSubmitting}
              >
                {unidadeTempoOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-sidebar-800">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Antes/Após */}
            <div>
              <label htmlFor="antes_apos" className="block text-sm font-medium text-sidebar-300 mb-2">
                Momento
              </label>
              <select
                id="antes_apos"
                name="antes_apos"
                value={formData.antes_apos}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white 
                  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={isSubmitting}
              >
                {antesAposOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-sidebar-800">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Referência */}
          <div>
            <label htmlFor="referencia" className="block text-sm font-medium text-sidebar-300 mb-2">
              Referência
            </label>
            <select
              id="referencia"
              name="referencia"
              value={formData.referencia}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white 
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={isSubmitting}
            >
              {referenciaOptions.map((option) => (
                <option key={option.value} value={option.value} className="bg-sidebar-800">
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-sidebar-400">
            Ex: "2 horas antes do check-in" enviará a mensagem 2 horas antes do horário de check-in
          </p>
        </div>

        {/* Canal */}
        <div>
          <label htmlFor="canal" className="block text-sm font-medium text-sidebar-300 mb-2">
            Canal de Envio
          </label>
          <select
            id="canal"
            name="canal"
            value={formData.canal}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white 
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={isSubmitting}
          >
            {canalOptions.map((option) => (
              <option key={option.value} value={option.value} className="bg-sidebar-800">
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Modelo da Mensagem */}
        <div>
          <label htmlFor="modelo_mensagem" className="block text-sm font-medium text-sidebar-300 mb-2">
            Modelo da Mensagem
            <span className="text-red-400 ml-1">*</span>
          </label>
          <textarea
            id="modelo_mensagem"
            name="modelo_mensagem"
            value={formData.modelo_mensagem}
            onChange={handleInputChange}
            placeholder="Olá {{nome_hospede}}, seu check-in está chegando! Lembre-se de apresentar um documento..."
            rows={4}
            className={`w-full px-3 py-2 bg-white/5 border rounded-lg text-white placeholder-sidebar-400 
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-vertical
              ${errors.modelo_mensagem ? 'border-red-500' : 'border-white/20'}
            `}
            disabled={isSubmitting}
          />
          {errors.modelo_mensagem && (
            <p className="text-red-400 text-xs mt-1">{errors.modelo_mensagem}</p>
          )}
          <p className="text-xs text-sidebar-400 mt-1">
            Use variáveis como {{nome_hospede}}, {{hotel_nome}}, {{data_checkin}} para personalizar
          </p>
        </div>

        {/* Select de Hotel */}
        <div>
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
            <option value="" className="bg-sidebar-800 text-sidebar-300">
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
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed
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
                <span>Cadastrar Campanha</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MarketingMessageForm;