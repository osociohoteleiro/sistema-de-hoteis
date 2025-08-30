import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useHotelList } from '../hooks/useHotelList';
import { useApp } from '../context/AppContext';

const MarketingMessageFormTest = ({ selectedHotelUuid, editingMessage, onMessageAdded, onCancel }) => {
  const { hotels, loading: loadingHotels, error: hotelError } = useHotelList();
  const { createMarketingMessage, updateMarketingMessage } = useApp();
  const [formData, setFormData] = useState(
    editingMessage ? {
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
    }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [wasEditing, setWasEditing] = useState(false);
  const [cooldownActive, setCooldownActive] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpar erro do campo quando usuário digita
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

    // Prevenir múltiplos cliques ou durante cooldown
    if (isSubmitting || cooldownActive) {
      return;
    }

    setIsSubmitting(true);
    
    // Guardar se é edição antes de processar
    const isEditing = !!editingMessage;
    const editingId = editingMessage?.id;
    
    try {
      console.log(isEditing ? 'Atualizando mensagem:' : 'Criando mensagem:', formData);

      let result;
      if (isEditing && editingId) {
        // Atualizar mensagem existente
        result = await updateMarketingMessage(editingId, formData);
      } else {
        // Criar nova mensagem
        result = await createMarketingMessage(formData);
      }
      
      console.log('Sucesso na API:', result);
      
      // Notificar componente pai sobre sucesso
      onMessageAdded(formData);
      
      // Marcar se era edição para o toast
      setWasEditing(isEditing);
      
      // Exibir toast de sucesso
      setShowSuccessToast(true);
      setTimeout(() => {
        setShowSuccessToast(false);
        setWasEditing(false);
      }, 3000);
      
      // Se foi uma atualização, fechar o formulário após 2 segundos
      if (isEditing) {
        setTimeout(() => {
          onCancel(); // Fechar formulário e limpar editingMessage
        }, 2000);
      } else {
        // Para criação, ativar cooldown de 5 segundos
        setCooldownActive(true);
        setCooldownSeconds(5);
        
        // Countdown regressivo só para criação
        const countdown = setInterval(() => {
          setCooldownSeconds(prev => {
            if (prev <= 1) {
              clearInterval(countdown);
              setCooldownActive(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
      
    } catch (error) {
      console.error('Erro ao cadastrar campanha:', error);
      let message = error.message || 'Erro ao cadastrar campanha. Tente novamente.';
      
      // Mensagem específica para endpoint não configurado
      if (message.includes('Endpoint de criação de mensagem não configurado')) {
        message = 'Endpoint de criação de mensagem não configurado. Vá para Configurações → Endpoints de Marketing e configure o campo "Criar Mensagem".';
      }
      
      setErrorMessage(message);
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 7000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Success Toast - Portal */}
      {showSuccessToast && createPortal(
        <div className="fixed top-4 right-4 z-[9999] bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Campanha {wasEditing ? 'atualizada' : 'cadastrada'} com sucesso!</span>
          {!wasEditing && (
            <button
              onClick={() => {
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
                setShowSuccessToast(false);
              }}
              className="ml-2 px-2 py-1 bg-green-700 hover:bg-green-800 rounded text-sm font-medium transition-colors"
            >
              Nova
            </button>
          )}
        </div>,
        document.body
      )}

      {/* Error Toast - Portal */}
      {showErrorToast && createPortal(
        <div className="fixed top-4 right-4 z-[9999] bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{errorMessage}</span>
        </div>,
        document.body
      )}

      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-white">
          {editingMessage ? 'Editar Campanha de Marketing' : 'Nova Campanha de Marketing'}
        </h4>
        <button
          onClick={onCancel}
          className="text-sidebar-400 hover:text-white transition-colors"
          disabled={isSubmitting}
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nome */}
        <div>
          <label className="block text-sm font-medium text-sidebar-300 mb-2">
            Nome da Campanha *
          </label>
          <input
            type="text"
            name="nome"
            value={formData.nome}
            onChange={handleInputChange}
            placeholder="Ex: Lembrete Check-in WhatsApp"
            className={`w-full px-3 py-2 bg-white/5 border rounded-lg text-white placeholder-sidebar-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.nome ? 'border-red-500' : 'border-white/20'}`}
            disabled={isSubmitting}
          />
          {errors.nome && (
            <p className="text-red-400 text-xs mt-1">{errors.nome}</p>
          )}
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium text-sidebar-300 mb-2">
            Descrição *
          </label>
          <textarea
            name="descricao"
            value={formData.descricao}
            onChange={handleInputChange}
            placeholder="Descreva o objetivo desta campanha..."
            rows={3}
            className={`w-full px-3 py-2 bg-white/5 border rounded-lg text-white placeholder-sidebar-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-vertical ${errors.descricao ? 'border-red-500' : 'border-white/20'}`}
            disabled={isSubmitting}
          />
          {errors.descricao && (
            <p className="text-red-400 text-xs mt-1">{errors.descricao}</p>
          )}
        </div>

        {/* Tempo */}
        <div>
          <label className="block text-sm font-medium text-sidebar-300 mb-2">
            Tempo *
          </label>
          <input
            type="number"
            name="offset_tempo"
            value={formData.offset_tempo}
            onChange={handleInputChange}
            placeholder="2"
            min="1"
            className={`w-full px-3 py-2 bg-white/5 border rounded-lg text-white placeholder-sidebar-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.offset_tempo ? 'border-red-500' : 'border-white/20'}`}
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
          <select
            name="unidade_tempo"
            value={formData.unidade_tempo}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
          >
            <option value="horas" className="bg-sidebar-800">Horas</option>
            <option value="dias" className="bg-sidebar-800">Dias</option>
          </select>
        </div>

        {/* Antes/Após */}
        <div>
          <label className="block text-sm font-medium text-sidebar-300 mb-2">
            Momento
          </label>
          <select
            name="antes_apos"
            value={formData.antes_apos}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
          >
            <option value="antes" className="bg-sidebar-800">Antes</option>
            <option value="apos" className="bg-sidebar-800">Após</option>
          </select>
        </div>

        {/* Referência */}
        <div>
          <label className="block text-sm font-medium text-sidebar-300 mb-2">
            Referência
          </label>
          <select
            name="referencia"
            value={formData.referencia}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
          >
            <option value="checkin" className="bg-sidebar-800">Check-in</option>
            <option value="checkout" className="bg-sidebar-800">Check-out</option>
            <option value="ao_reservar" className="bg-sidebar-800">Ao Reservar</option>
          </select>
        </div>

        {/* Canal */}
        <div>
          <label className="block text-sm font-medium text-sidebar-300 mb-2">
            Canal de Envio
          </label>
          <select
            name="canal"
            value={formData.canal}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
          >
            <option value="email" className="bg-sidebar-800">E-mail</option>
            <option value="sms" className="bg-sidebar-800">SMS</option>
            <option value="whatsapp" className="bg-sidebar-800">WhatsApp</option>
          </select>
        </div>

        {/* Modelo da Mensagem */}
        <div>
          <label className="block text-sm font-medium text-sidebar-300 mb-2">
            Modelo da Mensagem *
          </label>
          <div className="space-y-2">
            <textarea
              name="modelo_mensagem"
              value={formData.modelo_mensagem}
              onChange={handleInputChange}
              placeholder="Olá {{hospede}}, seu check-in está chegando!"
              rows={4}
              className={`w-full px-3 py-2 bg-white/5 border rounded-lg text-white placeholder-sidebar-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-vertical ${errors.modelo_mensagem ? 'border-red-500' : 'border-white/20'}`}
              disabled={isSubmitting}
            />
            {errors.modelo_mensagem && (
              <p className="text-red-400 text-xs mt-1">{errors.modelo_mensagem}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-sidebar-400">Inserir variáveis:</span>
              {[
                { label: 'Hóspede', value: '{{hospede}}' },
                { label: 'Hotel', value: '{{hotel}}' },
                { label: 'Data Check-in', value: '{{data_checkin}}' },
                { label: 'Data Check-out', value: '{{data_checkout}}' },
                { label: 'Hora Check-in', value: '{{hora_checkin}}' },
                { label: 'Hora Check-out', value: '{{hora_checkout}}' },
                { label: 'Aniversário', value: '{{aniversario}}' }
              ].map((variable) => (
                <button
                  key={variable.value}
                  type="button"
                  onClick={() => {
                    const textarea = document.querySelector('textarea[name="modelo_mensagem"]');
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const newValue = formData.modelo_mensagem.slice(0, start) + variable.value + formData.modelo_mensagem.slice(end);
                    setFormData(prev => ({ ...prev, modelo_mensagem: newValue }));
                    setTimeout(() => {
                      textarea.focus();
                      textarea.setSelectionRange(start + variable.value.length, start + variable.value.length);
                    }, 0);
                  }}
                  className="px-2 py-1 text-xs bg-primary-600/20 text-primary-300 border border-primary-600/30 rounded hover:bg-primary-600/30 transition-colors"
                >
                  {variable.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Select de Hotel */}
        <div>
          <label className="block text-sm font-medium text-sidebar-300 mb-2">
            Hotel *
          </label>
          {hotelError && (
            <div className="mb-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-yellow-300 text-xs">
              {hotelError}
            </div>
          )}
          <select
            name="hotel_uuid"
            value={formData.hotel_uuid}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 bg-white/5 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.hotel_uuid ? 'border-red-500' : 'border-white/20'} ${selectedHotelUuid ? 'opacity-70' : ''}`}
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
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
            disabled={isSubmitting || cooldownActive}
          >
            {isSubmitting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{editingMessage ? 'Atualizando...' : 'Cadastrando...'}</span>
              </>
            ) : cooldownActive ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Aguarde {cooldownSeconds}s</span>
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
    </>
  );
};

export default MarketingMessageFormTest;