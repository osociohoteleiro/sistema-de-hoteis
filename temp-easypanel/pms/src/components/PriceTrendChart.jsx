import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Brush,
  ReferenceLine,
  Area,
  ComposedChart
} from 'recharts';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Calendar
} from 'lucide-react';
import apiService from '../services/api';

const PriceTrendChart = ({ selectedHotelUuid, selectedProperty = 'all' }) => {
  const [chartData, setChartData] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewPeriod, setViewPeriod] = useState(30); // Dias a visualizar
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [showFuture, setShowFuture] = useState(true);
  const [zoomDomain, setZoomDomain] = useState(null);
  const [visibleProperties, setVisibleProperties] = useState(new Set());

  // Calcular datas padrão - Período das extrações reais (05/09/2025 - 31/10/2025)
  const getDefaultDates = () => {
    const today = new Date();
    const start = new Date('2025-09-05'); // Período real das extrações
    const end = new Date('2025-10-31');
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0], 
      today: today.toISOString().split('T')[0]
    };
  };

  const loadPriceTrends = async () => {
    if (!selectedHotelUuid) return;
    
    setLoading(true);
    try {
      const { start, today } = getDefaultDates();
      
      const queryParams = new URLSearchParams({
        start_date: startDate || start,
        end_date: endDate || today,
        future_days: 30
      });
      
      const response = await apiService.request(`/rate-shopper/${selectedHotelUuid}/price-trends?${queryParams}`);
      
      if (response.success) {
        setChartData(response.data.chart_data || []);
        const props = response.data.properties || [];
        setProperties(props);
        setDateRange(response.data.date_range);
        
        // Inicializar propriedades visíveis (todas por padrão)
        setVisibleProperties(new Set(props));
      }
    } catch (error) {
      console.error('Erro ao carregar tendência de preços:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPriceTrends();
  }, [selectedHotelUuid, startDate, endDate]);

  const navigateDate = (direction) => {
    const days = viewPeriod || 30;
    const currentStart = new Date(startDate || getDefaultDates().start);
    const currentEnd = new Date(endDate || getDefaultDates().today);
    
    if (direction === 'prev') {
      currentStart.setDate(currentStart.getDate() - days);
      currentEnd.setDate(currentEnd.getDate() - days);
    } else if (direction === 'next') {
      currentStart.setDate(currentStart.getDate() + days);
      currentEnd.setDate(currentEnd.getDate() + days);
    }
    
    setStartDate(currentStart.toISOString().split('T')[0]);
    setEndDate(currentEnd.toISOString().split('T')[0]);
  };

  const resetToToday = () => {
    setStartDate(null);
    setEndDate(null);
    setViewPeriod(30);
    setZoomDomain(null);
  };

  const handleZoom = (domain) => {
    if (domain) {
      setZoomDomain(domain);
    }
  };

  const resetZoom = () => {
    setZoomDomain(null);
  };

  const toggleProperty = (propertyName) => {
    setVisibleProperties(prev => {
      const newSet = new Set(prev);
      if (newSet.has(propertyName)) {
        newSet.delete(propertyName);
      } else {
        newSet.add(propertyName);
      }
      return newSet;
    });
  };

  const changePeriod = (days) => {
    setViewPeriod(days);
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - days);
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]); // Fim é hoje
  };

  // Filtrar dados baseado no período de visualização
  const getFilteredData = () => {
    if (!showFuture) {
      const today = new Date().toISOString().split('T')[0];
      return chartData.filter(item => item.date <= today);
    }
    return chartData;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  const formatTooltipDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getLineColor = (index) => {
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#F97316'];
    return colors[index % colors.length];
  };

  const today = new Date().toISOString().split('T')[0];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Tendência de Preços</h3>
        </div>
        <div className="p-6 flex items-center justify-center h-80">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Carregando dados...</p>
          </div>
        </div>
      </div>
    );
  }

  const filteredData = getFilteredData();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header com controles */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Tendência de Preços</h3>
            <p className="text-sm text-gray-600">
              Evolução dos preços coletados da Booking.com
              {dateRange && (
                <span className="ml-2">
                  ({formatTooltipDate(dateRange.start)} - {formatTooltipDate(dateRange.future_end)})
                </span>
              )}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Toggle para mostrar futuro */}
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={showFuture}
                onChange={(e) => setShowFuture(e.target.checked)}
                className="mr-2"
              />
              Próximos 30 dias
            </label>
            
            {/* Controles de zoom */}
            {zoomDomain && (
              <button
                onClick={resetZoom}
                className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                title="Resetar zoom"
              >
                <ZoomOut className="h-4 w-4 mr-1" />
                Reset Zoom
              </button>
            )}
            
            {/* Seletor de período */}
            <select 
              value={viewPeriod} 
              onChange={(e) => changePeriod(parseInt(e.target.value))}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value={7}>7 dias</option>
              <option value={15}>15 dias</option>
              <option value={30}>30 dias</option>
              <option value={60}>60 dias</option>
              <option value={90}>90 dias</option>
            </select>
            
            {/* Navegação temporal */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => navigateDate('prev')}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                title="Período anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <button
                onClick={resetToToday}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                title="Voltar para hoje"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              
              <button
                onClick={() => navigateDate('next')}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                title="Próximo período"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Legenda Interativa */}
      {properties.length > 0 && (
        <div className="px-6 pb-4 border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Propriedades:</span>
            {properties.map((property, index) => (
              <button
                key={property}
                onClick={() => toggleProperty(property)}
                className={`flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  visibleProperties.has(property)
                    ? 'text-white shadow-sm'
                    : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
                }`}
                style={{
                  backgroundColor: visibleProperties.has(property) ? getLineColor(index) : undefined
                }}
              >
                <div 
                  className="w-3 h-3 rounded-full mr-2 border-2"
                  style={{
                    backgroundColor: visibleProperties.has(property) ? 'white' : getLineColor(index),
                    borderColor: getLineColor(index)
                  }}
                />
                {property}
              </button>
            ))}
            
            {/* Botões de controle da legenda */}
            <div className="ml-4 flex items-center space-x-2">
              <button
                onClick={() => setVisibleProperties(new Set(properties))}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Mostrar Todas
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => setVisibleProperties(new Set())}
                className="text-xs text-red-600 hover:text-red-800"
              >
                Ocultar Todas
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Gráfico */}
      <div className="p-6">
        {/* Aviso quando há poucos dados */}
        {chartData.filter(d => !d.isFuture && properties.some(prop => d[prop] !== null)).length === 1 && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center">
              <div className="text-amber-600 mr-2">ℹ️</div>
              <div className="text-sm text-amber-700">
                <strong>Dados limitados:</strong> Apenas 1 dia de dados extraídos. 
                Execute mais extrações para visualizar tendências completas ao longo do tempo.
              </div>
            </div>
          </div>
        )}
        
        {filteredData.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={filteredData}
                onMouseDown={(e) => {
                  if (e && e.activeLabel) {
                    // Capturar início do drag para zoom
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  tick={{ fontSize: 12 }}
                  domain={zoomDomain ? [zoomDomain.startIndex, zoomDomain.endIndex] : ['dataMin', 'dataMax']}
                />
                <YAxis 
                  tickFormatter={(value) => `R$ ${value}`}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value, name) => {
                    if (value === null) return ['Sem dados', name];
                    return [`R$ ${parseFloat(value).toFixed(2)}`, name];
                  }}
                  labelFormatter={(label) => formatTooltipDate(label)}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    
                    const isToday = label === today;
                    const isFuture = new Date(label) > new Date(today);
                    
                    return (
                      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                        <p className="font-medium text-gray-900 mb-2">
                          {formatTooltipDate(label)}
                          {isToday && <span className="ml-2 text-blue-600">(Hoje)</span>}
                          {isFuture && <span className="ml-2 text-orange-600">(Futuro)</span>}
                        </p>
                        {payload.map((entry, index) => (
                          <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: {entry.value ? `R$ ${parseFloat(entry.value).toFixed(2)}` : 'Sem dados'}
                          </p>
                        ))}
                      </div>
                    );
                  }}
                />
                
                {/* Linha de referência para hoje */}
                <ReferenceLine 
                  x={today} 
                  stroke="#10B981" 
                  strokeDasharray="5 5"
                  label={{ value: "Hoje", position: "top" }}
                />
                
                {/* Linhas para cada propriedade (apenas visíveis) */}
                {properties.map((property, index) => {
                  if (!visibleProperties.has(property)) return null;
                  
                  return (
                    <Line
                      key={property}
                      type="monotone"
                      dataKey={property}
                      stroke={getLineColor(index)}
                      strokeWidth={3}
                      dot={{ 
                        fill: getLineColor(index), 
                        strokeWidth: 2, 
                        r: filteredData.filter(d => d[property] !== null && d[property] !== undefined).length === 1 ? 6 : 4 
                      }}
                      connectNulls={false}
                      strokeDasharray={filteredData.some(d => d.isFuture && d[property] !== null) ? "5 5" : "0"}
                      animationDuration={300}
                    />
                  );
                })}
                
                {/* Brush para navegação e zoom */}
                <Brush 
                  dataKey="date" 
                  height={30}
                  stroke="#3B82F6"
                  tickFormatter={formatDate}
                  onChange={(brushData) => {
                    if (brushData && brushData.startIndex !== undefined && brushData.endIndex !== undefined) {
                      setZoomDomain(brushData);
                    }
                  }}
                  startIndex={zoomDomain?.startIndex}
                  endIndex={zoomDomain?.endIndex}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Nenhum dado de preços encontrado</h4>
              <p className="text-gray-600 mb-4">
                Não há dados de preços extraídos para o período selecionado.
                <br />
                Execute algumas extrações da Booking.com para visualizar as tendências.
              </p>
              <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                💡 <strong>Dica:</strong> Crie algumas buscas e aguarde a extração de dados para ver o gráfico de tendências funcionando!
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceTrendChart;