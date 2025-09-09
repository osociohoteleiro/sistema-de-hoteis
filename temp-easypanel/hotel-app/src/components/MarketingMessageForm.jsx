import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const MarketingMessageForm = ({ selectedHotelUuid, onMessageAdded, onCancel, editingMessage }) => {
  const textareaRef = useRef(null);
  const { config } = useApp();
  
  const [formData, setFormData] = useState(editingMessage ? {
    nome: editingMessage.nome || '',
    descricao: editingMessage.descricao || '',
    offset_tempo: editingMessage.offset_tempo || '',
    unidade_tempo: editingMessage.unidade_tempo || 'horas',
    antes_apos: editingMessage.antes_apos || 'antes',
    referencia: editingMessage.referencia || 'checkin',
    canal: editingMessage.canal || 'whatsapp',
    modelo_mensagem: editingMessage.modelo_mensagem || '',
    hotel_uuid: editingMessage.hotel_uuid || selectedHotelUuid || ''
  } : {
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
  const [hotelName, setHotelName] = useState('Carregando...');

  // Função para buscar nome do hotel por UUID
  const getHotelName = async (hotelUuid) => {
    if (!hotelUuid || !config.apiEndpoints.listHotels) return `Hotel ${hotelUuid}`;
    
    try {
      const response = await fetch(config.apiEndpoints.listHotels);
      if (!response.ok) throw new Error('Erro ao buscar hotéis');
      
      const hotels = await response.json();
      const hotel = Array.isArray(hotels) ? hotels.find(h => h.hotel_uuid === hotelUuid) : null;
      
      return hotel?.hotel_nome || `Hotel ${hotelUuid}`;
    } catch (error) {
      console.error('Erro ao buscar nome do hotel:', error);
      return `Hotel ${hotelUuid}`;
    }
  };

  // Buscar nome do hotel quando o UUID mudar
  useEffect(() => {
    if (selectedHotelUuid) {
      getHotelName(selectedHotelUuid).then(setHotelName);
    }
  }, [selectedHotelUuid, config.apiEndpoints.listHotels]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle radio buttons for canal with warnings
    if (name === 'canal' && (value === 'email' || value === 'sms')) {
      alert('Esta opção não está disponível no momento. Apenas WhatsApp está disponível.');
      return;
    }
    
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
    const requiredFields = ['nome', 'offset_tempo', 'modelo_mensagem', 'hotel_uuid']; // descricao é opcional

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
        hotel_uuid: selectedHotelUuid || ''
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

  // Templates disponíveis para inserção
  const templateOptions = [
    { 
      value: '{{hospede}}', 
      label: 'Hóspede', 
      icon: '👤',
      description: 'Nome do hóspede'
    },
    { 
      value: '{{hotel}}', 
      label: 'Hotel', 
      icon: '🏨',
      description: 'Nome do hotel'
    },
    { 
      value: '{{data_checkin}}', 
      label: 'Data Check-in', 
      icon: '📅',
      description: 'Data do check-in'
    },
    { 
      value: '{{data_checkout}}', 
      label: 'Data Check-out', 
      icon: '📅',
      description: 'Data do check-out'
    },
    { 
      value: '{{hora_checkin}}', 
      label: 'Hora Check-in', 
      icon: '🕐',
      description: 'Horário do check-in'
    },
    { 
      value: '{{hora_checkout}}', 
      label: 'Hora Check-out', 
      icon: '🕐',
      description: 'Horário do check-out'
    }
  ];

  // Função para inserir template na posição do cursor
  const insertTemplate = (template) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = formData.modelo_mensagem;
    
    // Inserir template na posição do cursor
    const newValue = currentValue.substring(0, start) + template + currentValue.substring(end);
    
    // Auto-fill reference based on template
    let newReference = formData.referencia;
    if (template.includes('checkin')) {
      newReference = 'checkin';
    } else if (template.includes('checkout')) {
      newReference = 'checkout';
    }
    
    // Atualizar o formData
    setFormData(prev => ({
      ...prev,
      modelo_mensagem: newValue,
      referencia: newReference
    }));

    // Focar no textarea e posicionar cursor após o template inserido
    setTimeout(() => {
      textarea.focus();
      const newCursorPosition = start + template.length;
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-white">{editingMessage ? 'Editar Campanha de Marketing' : 'Nova Campanha de Marketing'}</h4>
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
            <span className="text-sidebar-400 ml-1">(opcional)</span>
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

        {/* Modelo da Mensagem - TERCEIRO */}
        <div>
          <label htmlFor="modelo_mensagem" className="block text-sm font-medium text-sidebar-300 mb-2">
            Modelo da Mensagem
            <span className="text-red-400 ml-1">*</span>
          </label>
          
          {/* Botões de Templates */}
          <div className="mb-3">
            <p className="text-xs text-sidebar-400 mb-2">Templates disponíveis:</p>
            <div className="flex flex-wrap gap-2">
              {/* Dados Pessoais */}
              {templateOptions.slice(0, 2).map((template) => (
                <button
                  key={template.value}
                  type="button"
                  onClick={() => insertTemplate(template.value)}
                  className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 
                    text-xs text-blue-300 rounded-full transition-colors border border-blue-500/30 
                    hover:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  title={template.description}
                  disabled={isSubmitting}
                >
                  <span className="text-xs">{template.icon}</span>
                  <span>{template.label}</span>
                </button>
              ))}
              
              {/* Datas */}
              {templateOptions.slice(2, 4).map((template) => (
                <button
                  key={template.value}
                  type="button"
                  onClick={() => insertTemplate(template.value)}
                  className="inline-flex items-center space-x-1 px-2 py-1 bg-green-500/20 hover:bg-green-500/30 
                    text-xs text-green-300 rounded-full transition-colors border border-green-500/30 
                    hover:border-green-400/50 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  title={template.description}
                  disabled={isSubmitting}
                >
                  <span className="text-xs">{template.icon}</span>
                  <span>{template.label}</span>
                </button>
              ))}
              
              {/* Horários */}
              {templateOptions.slice(4, 6).map((template) => (
                <button
                  key={template.value}
                  type="button"
                  onClick={() => insertTemplate(template.value)}
                  className="inline-flex items-center space-x-1 px-2 py-1 bg-purple-500/20 hover:bg-purple-500/30 
                    text-xs text-purple-300 rounded-full transition-colors border border-purple-500/30 
                    hover:border-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  title={template.description}
                  disabled={isSubmitting}
                >
                  <span className="text-xs">{template.icon}</span>
                  <span>{template.label}</span>
                </button>
              ))}
            </div>
          </div>

          <textarea
            ref={textareaRef}
            id="modelo_mensagem"
            name="modelo_mensagem"
            value={formData.modelo_mensagem}
            onChange={handleInputChange}
            placeholder="Olá {{hospede}}, seu checkin está para o dia {{data_checkin}} às {{hora_checkin}}. O hotel {{hotel}} te aguarda ansiosamente!"
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
            Clique nos botões acima para inserir templates ou digite diretamente as variáveis
          </p>
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
              <label className="block text-sm font-medium text-sidebar-300 mb-2">
                Unidade
              </label>
              <div className="space-y-2">
                {unidadeTempoOptions.map((option) => (
                  <label key={option.value} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="unidade_tempo"
                      value={option.value}
                      checked={formData.unidade_tempo === option.value}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary-600 bg-transparent border-2 border-white/20 
                        focus:ring-primary-500 focus:ring-2"
                      disabled={isSubmitting}
                    />
                    <span className="ml-2 text-sm text-white">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Antes/Após */}
            <div>
              <label className="block text-sm font-medium text-sidebar-300 mb-2">
                Momento
              </label>
              <div className="space-y-2">
                {antesAposOptions.map((option) => (
                  <label key={option.value} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="antes_apos"
                      value={option.value}
                      checked={formData.antes_apos === option.value}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary-600 bg-transparent border-2 border-white/20 
                        focus:ring-primary-500 focus:ring-2"
                      disabled={isSubmitting}
                    />
                    <span className="ml-2 text-sm text-white">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Referência */}
          <div>
            <label className="block text-sm font-medium text-sidebar-300 mb-2">
              Referência
            </label>
            <div className="flex flex-wrap gap-4">
              {referenciaOptions.map((option) => (
                <label key={option.value} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="referencia"
                    value={option.value}
                    checked={formData.referencia === option.value}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-primary-600 bg-transparent border-2 border-white/20 
                      focus:ring-primary-500 focus:ring-2"
                    disabled={isSubmitting}
                  />
                  <span className="ml-2 text-sm text-white">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <p className="text-xs text-sidebar-400">
            Ex: "2 horas antes do check-in" enviará a mensagem 2 horas antes do horário de check-in
          </p>
        </div>

        {/* Canal */}
        <div>
          <label className="block text-sm font-medium text-sidebar-300 mb-2">
            Canal de Envio
          </label>
          <div className="flex flex-wrap gap-4">
            {canalOptions.map((option) => (
              <label key={option.value} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="canal"
                  value={option.value}
                  checked={formData.canal === option.value}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-primary-600 bg-transparent border-2 border-white/20 
                    focus:ring-primary-500 focus:ring-2"
                  disabled={isSubmitting}
                />
                <span className={`ml-2 text-sm ${option.value === 'whatsapp' ? 'text-green-300' : 'text-sidebar-400'}`}>
                  {option.label}
                  {option.value !== 'whatsapp' && <span className="text-red-400 ml-1">(indisponível)</span>}
                </span>
              </label>
            ))}
          </div>
          <p className="text-xs text-sidebar-400 mt-2">
            Apenas WhatsApp está disponível no momento. As outras opções serão habilitadas em breve.
          </p>
        </div>

        {/* Hotel Info */}
        <div>
          <label className="block text-sm font-medium text-sidebar-300 mb-2">
            Hotel Selecionado
          </label>
          <div className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white">
            {selectedHotelUuid ? (
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
                <span className="text-white font-medium">{hotelName}</span>
              </div>
            ) : (
              <span className="text-red-400">⚠️ Nenhum hotel selecionado</span>
            )}
          </div>
          {!selectedHotelUuid && (
            <p className="text-red-400 text-xs mt-1">Selecione um hotel na página "Meus Hotéis" primeiro</p>
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
                <span>{editingMessage ? 'Atualizando...' : 'Cadastrando...'}</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{editingMessage ? 'Atualizar Campanha' : 'Cadastrar Campanha'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MarketingMessageForm;