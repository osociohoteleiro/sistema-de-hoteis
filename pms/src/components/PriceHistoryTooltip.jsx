import React, { useState, useEffect, useRef } from 'react';
import apiService from '../services/api';

const PriceHistoryTooltip = ({ children, propertyName, propertyId, date, hotelUuid }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const tooltipRef = useRef(null);
  const timerRef = useRef(null);

  const handleMouseEnter = (e) => {
    console.log('🔍 Tooltip handleMouseEnter TRIGGERED:', { propertyName, propertyId, date, hotelUuid });
    
    // Cancelar timer de hide se existir
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Calcular posição do tooltip com detecção inteligente
    const rect = e.target.getBoundingClientRect();
    const tooltipHeight = 200; // Altura estimada do tooltip
    const marginFromEdge = 20; // Margem mínima das bordas
    
    const x = rect.left + rect.width / 2;
    
    // Verificar se tooltip caberia acima do elemento
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    
    let y, showBelow;
    
    if (spaceAbove < tooltipHeight + marginFromEdge && spaceBelow > tooltipHeight + marginFromEdge) {
      // Não há espaço acima, mas há espaço abaixo - mostrar abaixo
      y = rect.bottom + 10;
      showBelow = true;
    } else {
      // Posição padrão - acima do elemento
      y = rect.top - 10;
      showBelow = false;
    }

    setPosition({ x, y, showBelow });
    setIsVisible(true);

    // SEMPRE buscar dados para teste
    console.log('🔍 ALWAYS Calling fetchPriceHistory with:', { propertyId, date, hotelUuid });
    fetchPriceHistory();
  };

  const handleMouseLeave = () => {
    // Delay antes de esconder para permitir hover no tooltip
    timerRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 300);
  };

  const handleTooltipMouseEnter = () => {
    // Cancelar timer de hide quando mouse entra no tooltip
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const handleTooltipMouseLeave = () => {
    // Esconder imediatamente quando mouse sai do tooltip
    setIsVisible(false);
  };

  const fetchPriceHistory = async () => {
    setLoading(true);
    console.log('🔍 Frontend Tooltip fetchPriceHistory called with:', { 
      propertyName, 
      propertyId, 
      date, 
      hotelUuid,
      dateType: typeof date,
      dateValue: date
    });
    
    if (!date) {
      console.error('❌ Date is null/undefined, cannot fetch history');
      setLoading(false);
      return;
    }
    
    try {
      const url = `/rate-shopper/${hotelUuid}/property-history/${propertyId}`;
      const params = { date };
      console.log('🔍 Making API request:', { url, params });
      
      const response = await apiService.request(url, {
        params: params
      });

      if (response.success) {
        setHistory(response.data);
      } else {
        console.warn('Falha ao carregar histórico detalhado');
        setHistory(null);
      }
    } catch (error) {
      console.error('Erro ao buscar histórico detalhado:', error);
      setHistory(null);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    // Extrair componentes diretamente da string YYYY-MM-DD para evitar problemas de timezone
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  // Limpar timer ao desmontar componente
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <>
      <span
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </span>

      {isVisible && (
        <div
          ref={tooltipRef}
          className="fixed z-50 pointer-events-auto"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: position.showBelow ? 'translate(-50%, 0%)' : 'translate(-50%, -100%)'
          }}
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
        >
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-xs min-w-64">
            {/* Seta do tooltip - posição dinâmica */}
            {position.showBelow ? (
              // Seta apontando para cima (tooltip abaixo do elemento)
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2">
                <div className="border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-white"></div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1">
                  <div className="border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-gray-200"></div>
                </div>
              </div>
            ) : (
              // Seta apontando para baixo (tooltip acima do elemento)
              <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                <div className="border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1">
                  <div className="border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-200"></div>
                </div>
              </div>
            )}

            <div className="text-center">
              <h4 className="font-semibold text-gray-900 text-sm mb-1">
                {propertyName}
              </h4>
              <p className="text-xs text-gray-500 mb-3">
                {formatDate(date)}
              </p>

              {loading ? (
                <div className="flex items-center justify-center py-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-xs text-gray-600">Carregando...</span>
                </div>
              ) : history ? (
                <div className="space-y-2">
                  {history.history.map((entry, index) => (
                    <div 
                      key={index} 
                      className={`text-left p-2 rounded border-l-2 ${
                        entry.change === null 
                          ? 'border-gray-300 bg-gray-50' 
                          : entry.change > 0 
                            ? 'border-green-400 bg-green-50' 
                            : 'border-red-400 bg-red-50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">
                          R$ {entry.price.toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTime(entry.scraped_at)}
                        </span>
                      </div>
                      
                      {entry.change !== null && (
                        <div className={`text-xs mt-1 ${
                          entry.change > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {entry.change > 0 ? '↗' : '↘'} 
                          {entry.change > 0 ? '+' : ''}R$ {entry.change.toFixed(2)} 
                          ({entry.change_percent > 0 ? '+' : ''}{entry.change_percent.toFixed(1)}%)
                        </div>
                      )}
                    </div>
                  ))}
                  
                  <div className="pt-2 border-t border-gray-200 text-center">
                    <p className="text-xs text-gray-500">
                      {history.total_extractions} extração{history.total_extractions !== 1 ? 'ões' : ''}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center py-2">
                  Nenhum histórico encontrado
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PriceHistoryTooltip;