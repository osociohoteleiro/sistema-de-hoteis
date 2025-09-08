import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import apiService from '../services/api';
import PriceHistoryTooltip from './PriceHistoryTooltip';

const PriceDebugTable = ({ selectedHotelUuid, startDate, endDate, chartData, propertyNames }) => {
  const { selectedHotelUuid: contextHotelUuid } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedHotelName, setSelectedHotelName] = useState(null);
  const [priceHistory, setPriceHistory] = useState(null);

  // Função para buscar o nome do hotel selecionado
  const fetchSelectedHotelName = async () => {
    if (!contextHotelUuid) {
      setSelectedHotelName(null);
      return;
    }

    try {
      const response = await apiService.getHotels();
      const hotels = response.hotels || [];
      const selectedHotel = hotels.find(h => 
        (h.hotel_uuid && h.hotel_uuid === contextHotelUuid) ||
        (h.id && h.id.toString() === contextHotelUuid)
      );
      
      if (selectedHotel) {
        const hotelName = selectedHotel.hotel_nome || selectedHotel.name;
        setSelectedHotelName(hotelName);
        console.log('🏨 Hotel selecionado na tabela:', hotelName);
      } else {
        setSelectedHotelName(null);
        console.log('❌ Hotel não encontrado:', contextHotelUuid);
      }
    } catch (error) {
      console.error('Erro ao buscar hotel selecionado:', error);
      setSelectedHotelName(null);
    }
  };

  // Função para buscar histórico de preços
  const fetchPriceHistory = async () => {
    if (!selectedHotelUuid) return;

    try {
      console.log('🔍 Buscando histórico de preços:', { selectedHotelUuid, startDate, endDate });
      
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await apiService.request(`/rate-shopper/${selectedHotelUuid}/price-history`, {
        params: params
      });

      if (response.success) {
        console.log('📈 Histórico de preços carregado:', response.data);
        setPriceHistory(response.data);
      } else {
        console.warn('⚠️ Falha ao carregar histórico de preços');
        setPriceHistory(null);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar histórico de preços:', error);
      setPriceHistory(null);
    }
  };

  // Carregar nome do hotel selecionado quando contextHotelUuid mudar
  useEffect(() => {
    fetchSelectedHotelName();
  }, [contextHotelUuid]);

  // Carregar histórico de preços quando parâmetros mudarem
  useEffect(() => {
    fetchPriceHistory();
  }, [selectedHotelUuid, startDate, endDate]);

  // Função para verificar se um hotel é o principal (selecionado)
  const isMainHotel = (hotelName) => {
    if (!selectedHotelName || !hotelName) return false;
    
    // Comparação case-insensitive e removendo espaços extras
    const normalizeString = (str) => str?.trim().toLowerCase();
    return normalizeString(hotelName) === normalizeString(selectedHotelName);
  };

  // Função para obter o preço do hotel principal em uma data específica
  const getMainHotelPrice = (date, hotelRows) => {
    if (!selectedHotelName) return null;
    
    // Encontrar o hotel principal nos dados
    const mainHotelEntry = Object.entries(hotelRows).find(([hotelName]) => 
      isMainHotel(hotelName)
    );
    
    if (!mainHotelEntry) return null;
    
    const [, dates] = mainHotelEntry;
    return dates[date] || null;
  };

  // Função para determinar a cor do preço baseada na comparação com o hotel principal
  const getPriceColor = (currentPrice, mainPrice, isMainHotel) => {
    // Se é o hotel principal, manter verde
    if (isMainHotel) {
      return 'text-green-600';
    }
    
    // Se não há preço do hotel principal para comparar, usar cor padrão
    if (!mainPrice || !currentPrice) {
      return 'text-green-600';
    }
    
    // Calcular diferença percentual
    const percentDifference = ((currentPrice - mainPrice) / mainPrice) * 100;
    
    // Lógica de coloração:
    if (percentDifference < -10) {
      // Mais de 10% mais barato = VERMELHO
      return 'text-red-600';
    } else if (percentDifference < 0) {
      // Mais barato (menos de 10%) = LARANJA
      return 'text-orange-600';
    } else if (percentDifference > 10) {
      // Mais de 10% mais caro = VERDE
      return 'text-green-600';
    } else {
      // Mais caro (até 10%) = AZUL
      return 'text-blue-600';
    }
  };

  // Função para obter indicador de tendência de preço para uma propriedade e data específica
  const getPriceTrend = (propertyName, date) => {
    console.log('🔍 getPriceTrend called:', { propertyName, date });
    console.log('🔍 priceHistory available:', !!priceHistory);
    console.log('🔍 priceHistory data:', priceHistory);
    
    if (!priceHistory || !priceHistory.price_history) {
      console.log('🔍 No price history available');
      return { indicator: '', color: '', hasChange: false };
    }

    // Normalizar formato de data para comparação (converter ISO date para YYYY-MM-DD)
    const normalizeDate = (dateStr) => {
      if (!dateStr) return '';
      return dateStr.split('T')[0]; // Remove a parte de tempo da data ISO
    };

    // Buscar entradas do histórico para esta propriedade e data
    const historyEntry = priceHistory.price_history.find(entry => {
      const entryDate = normalizeDate(entry.check_in_date);
      const targetDate = normalizeDate(date);
      console.log('🔍 Comparing dates:', { entryDate, targetDate, entryProperty: entry.property_name, targetProperty: propertyName });
      return entry.property_name === propertyName && entryDate === targetDate;
    });

    console.log('🔍 Found history entry:', historyEntry);

    if (!historyEntry) {
      console.log('🔍 No history entry found for:', { propertyName, date });
      return { indicator: '', color: '', hasChange: false };
    }

    console.log('🔍 Returning trend:', {
      indicator: historyEntry.trend_indicator,
      color: historyEntry.trend_color,
      hasChange: true
    });

    return {
      indicator: historyEntry.trend_indicator || '',
      color: historyEntry.trend_color || 'text-gray-500',
      hasChange: true
    };
  };

  // Função auxiliar para encontrar property_id pelo nome
  const getPropertyIdByName = (propertyName) => {
    if (!priceHistory?.price_history) {
      console.log('🔍 getPropertyIdByName: No price history data available');
      return null;
    }
    const entry = priceHistory.price_history.find(entry => entry.property_name === propertyName);
    console.log('🔍 getPropertyIdByName:', { 
      propertyName, 
      availableProperties: priceHistory.price_history.map(p => p.property_name),
      foundEntry: entry, 
      propertyId: entry?.property_id 
    });
    return entry?.property_id || null;
  };

  const loadDebugData = async () => {
    if (!selectedHotelUuid) return;
    
    
    setLoading(true);
    setError(null);
    
    try {
      // Sempre usar as datas recebidas como props
      if (!startDate || !endDate) {
        setError('Datas não fornecidas para a tabela');
        return;
      }
      
      // Usar dados do gráfico (são dados reais, não mockados)
      if (chartData && propertyNames && propertyNames.length > 0) {
        const convertedData = convertChartDataToTableFormat(chartData, propertyNames);
        setData(convertedData);
        setLoading(false);
        return;
      }
      
      // Aguardar dados do gráfico se ainda não estiverem prontos
      setError('Aguardando dados do gráfico...');
      setLoading(false);
      
    } catch (err) {
      console.error('Erro ao processar dados de debug:', err);
      setError('Erro ao processar dados: ' + err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDebugData();
  }, [selectedHotelUuid, startDate, endDate, chartData, propertyNames]);

  // Converter dados do gráfico para formato da tabela
  const convertChartDataToTableFormat = (chartData, propertyNames) => {

    if (!chartData?.processedData || !propertyNames || propertyNames.length === 0) {
      return { prices: [] };
    }

    const prices = [];
    
    // Converter cada dia em registros por propriedade
    chartData.processedData.forEach(dayData => {
      propertyNames.forEach(propertyName => {
        const price = dayData[propertyName];
        if (price !== null && price !== undefined && typeof price === 'number' && price > 0) {
          // Obter informações de bundle do dayData se disponíveis
          const bundleCount = dayData[`${propertyName}_bundle_count`] || 0;
          const regularCount = dayData[`${propertyName}_regular_count`] || 0;
          const avgBundleSize = dayData[`${propertyName}_avg_bundle_size`] || 0;
          const isMostlyBundle = dayData[`${propertyName}_is_mostly_bundle`] || false;
          
          prices.push({
            check_in_date: dayData.date, // Formato YYYY-MM-DD
            property_name: propertyName,
            price: price.toString(),
            room_type: 'Standard', // Valor padrão
            scraped_at: new Date().toISOString(),
            // Adicionar informações de bundle
            bundle_count: bundleCount,
            regular_count: regularCount,
            avg_bundle_size: avgBundleSize,
            is_mostly_bundle: isMostlyBundle,
            has_bundles: bundleCount > 0
          });
        }
      });
    });


    return { 
      prices,
      statistics: {
        total_records: prices.length.toString(),
        unique_properties: propertyNames.length.toString(),
        oldest_date: chartData.processedData[0]?.date,
        newest_date: chartData.processedData[chartData.processedData.length - 1]?.date,
        min_price: Math.min(...prices.map(p => parseFloat(p.price))).toString(),
        max_price: Math.max(...prices.map(p => parseFloat(p.price))).toString(),
        avg_price: (prices.reduce((sum, p) => sum + parseFloat(p.price), 0) / prices.length).toFixed(2)
      }
    };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    // Extrair componentes diretamente da string YYYY-MM-DD para evitar timezone
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return `R$ ${parseFloat(price).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="flex items-center justify-center h-40">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Carregando dados...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={loadDebugData}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <p className="text-gray-600">Nenhum dado encontrado</p>
        </div>
      </div>
    );
  }

  const { statistics, prices } = data;

  // Organizar dados em formato Excel: linhas = hotéis, colunas = dias
  const organizeExcelFormat = () => {
    const hotelRows = {};
    
    // CORREÇÃO: Usar apenas as datas que existem nos dados do gráfico
    // para garantir sincronização perfeita
    const allDates = [];
    
    // Extrair datas diretamente dos dados do gráfico (chartData.processedData)
    if (chartData && chartData.processedData) {
      chartData.processedData.forEach(dayData => {
        if (dayData.date) {
          allDates.push(dayData.date);
        }
      });
    }
    
    const sortedDates = allDates.sort(); // Ordenar as datas

    // Organizar por hotel (linhas)
    
    prices.forEach((price, index) => {
      const hotelName = price.property_name;
      
      // CORREÇÃO: Usar a data diretamente sem conversão de timezone  
      // Os dados do gráfico já vêm no formato correto YYYY-MM-DD
      let dateKey;
      if (typeof price.check_in_date === 'string' && price.check_in_date.includes('T')) {
        dateKey = price.check_in_date.split('T')[0]; // Para timestamps: 2025-09-12T03:00:00.000Z -> 2025-09-12
      } else {
        dateKey = price.check_in_date; // Para strings simples: 2025-09-12
      }
      
      
      if (!hotelRows[hotelName]) {
        hotelRows[hotelName] = {};
      }
      
      hotelRows[hotelName][dateKey] = parseFloat(price.price);
    });

    return { hotelRows, sortedDates };
  };

  const { hotelRows, sortedDates } = organizeExcelFormat();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-2">
      
      {/* Tabela formato Excel: Hotel na coluna A, datas nas colunas B, C, D... */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
          <thead className="bg-gray-50">
            <tr>
              {/* Coluna A - Hotel */}
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-r border-gray-300 bg-gray-100 sticky left-0 min-w-60">
                A - Hotel/Propriedade
              </th>
              {/* Colunas B, C, D, E... - Dias do mês */}
              {sortedDates.map((date, index) => {
                const dayNumber = parseInt(date.split('-')[2]); // Extrair dia diretamente da string YYYY-MM-DD
                const columnLetter = String.fromCharCode(66 + index); // B, C, D, E...
                return (
                  <th key={date} className="px-3 py-3 text-center text-sm font-semibold text-gray-900 border-r border-gray-300 bg-gray-100 min-w-20">
                    <div className="text-xs text-gray-500">{columnLetter}</div>
                    <div className="font-bold">Dia {dayNumber}</div>
                    <div className="text-xs text-gray-500">{formatDate(date)}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Object.entries(hotelRows)
              .sort(([hotelNameA], [hotelNameB]) => {
                // Hotel selecionado sempre primeiro
                const isASelected = isMainHotel(hotelNameA);
                const isBSelected = isMainHotel(hotelNameB);
                
                if (isASelected && !isBSelected) return -1; // A vai primeiro
                if (!isASelected && isBSelected) return 1;  // B vai primeiro
                
                // Se nenhum é selecionado ou ambos são, ordenar alfabeticamente
                return hotelNameA.localeCompare(hotelNameB);
              })
              .map(([hotelName, dates], rowIndex) => {
              const isSelected = isMainHotel(hotelName);
              
              return (
              <tr 
                key={hotelName} 
                className={`hover:bg-gray-50 transition-colors ${
                  isSelected ? 'bg-orange-50 border-l-4 border-l-orange-500' : ''
                }`}
              >
                {/* Coluna A - Nome do hotel */}
                <td className={`px-4 py-3 text-sm font-medium border-r border-gray-300 sticky left-0 ${
                  isSelected ? 'bg-orange-50' : 'bg-white'
                }`}>
                  <div className="max-w-56">
                    <div className="font-semibold text-blue-600">A{rowIndex + 2}</div>
                    <div className={`mt-1 ${
                      isSelected 
                        ? 'text-orange-700 font-bold' 
                        : 'text-gray-900'
                    }`}>
                      {hotelName}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {Object.keys(dates).length} dias com preços
                    </div>
                  </div>
                </td>
                {/* Colunas B, C, D, E... - Preços por dia */}
                {sortedDates.map((date, colIndex) => {
                  const price = dates[date];
                  const columnLetter = String.fromCharCode(66 + colIndex);
                  const cellRef = `${columnLetter}${rowIndex + 2}`;
                  
                  // Obter preço do hotel principal para esta data
                  const mainPrice = getMainHotelPrice(date, hotelRows);
                  
                  // Determinar cor do preço baseada na comparação
                  const priceColor = price ? getPriceColor(price, mainPrice, isSelected) : 'text-gray-300';
                  
                  // Obter indicador de tendência
                  const priceTrend = getPriceTrend(hotelName, date);
                  
                  return (
                    <td key={date} className="px-3 py-3 text-center border-r border-gray-300">
                      <div className="text-xs text-gray-400 mb-1">{cellRef}</div>
                      {price ? (
                        <div className="flex flex-col items-center">
                          <div className={`text-sm font-bold ${priceColor} flex items-center gap-1`}>
                            <span>R$ {price.toFixed(2)}</span>
                            {priceTrend.hasChange && (
                              <PriceHistoryTooltip
                                propertyName={hotelName}
                                propertyId={getPropertyIdByName(hotelName)}
                                date={date}
                                hotelUuid={selectedHotelUuid}
                              >
                                <span 
                                  className={`text-xs font-bold ${priceTrend.color} cursor-help ml-1`}
                                >
                                  {priceTrend.indicator}
                                </span>
                              </PriceHistoryTooltip>
                            )}
                          </div>
                          {/* Indicadores de Bundle */}
                          {(() => {
                            // Buscar informações de bundle nos dados originais
                            const dayData = chartData?.processedData?.find(day => day.date === date);
                            if (dayData) {
                              const bundleCount = dayData[`${hotelName}_bundle_count`] || 0;
                              const regularCount = dayData[`${hotelName}_regular_count`] || 0;
                              const avgBundleSize = dayData[`${hotelName}_avg_bundle_size`] || 0;
                              const isMostlyBundle = dayData[`${hotelName}_is_mostly_bundle`] || false;
                              
                              if (bundleCount > 0) {
                                return (
                                  <div className="text-xs mt-1 flex flex-wrap justify-center gap-1">
                                    {isMostlyBundle && avgBundleSize > 1 && (
                                      <span className="bg-amber-100 text-amber-700 px-1 py-0.5 rounded text-xs font-medium">
                                        📦 {avgBundleSize.toFixed(0)}n
                                      </span>
                                    )}
                                    {bundleCount > regularCount && !isMostlyBundle && (
                                      <span className="bg-purple-100 text-purple-700 px-1 py-0.5 rounded text-xs font-medium">
                                        📦 Mín
                                      </span>
                                    )}
                                    {bundleCount > 0 && regularCount > 0 && bundleCount <= regularCount && (
                                      <span className="bg-blue-100 text-blue-700 px-1 py-0.5 rounded text-xs font-medium">
                                        📦/💰
                                      </span>
                                    )}
                                  </div>
                                );
                              }
                            }
                            return null;
                          })()}
                        </div>
                      ) : (
                        <div className="text-gray-300 text-xs">-</div>
                      )}
                    </td>
                  );
                })}
              </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-blue-50 border-t-2 border-blue-200">
            <tr className="border-t-2 border-blue-300">
              {/* Coluna A - Título da linha de média */}
              <td className="px-4 py-3 text-sm font-bold border-r border-gray-300 bg-blue-100 sticky left-0">
                <div className="max-w-56">
                  <div className="font-semibold text-blue-600">MÉDIA</div>
                  <div className="text-blue-700 font-bold">
                    Concorrentes
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    Média diária dos concorrentes (excl. hotel principal)
                  </div>
                </div>
              </td>
              {/* Colunas B, C, D, E... - Média dos concorrentes por dia */}
              {sortedDates.map((date, colIndex) => {
                const columnLetter = String.fromCharCode(66 + colIndex);
                
                // Calcular média dos concorrentes para esta data (excluindo hotel principal)
                const competitorPrices = Object.entries(hotelRows)
                  .filter(([hotelName]) => !isMainHotel(hotelName)) // Excluir hotel principal
                  .map(([, dates]) => dates[date])
                  .filter(price => price !== null && price !== undefined && typeof price === 'number' && price > 0);
                
                const averagePrice = competitorPrices.length > 0 
                  ? competitorPrices.reduce((sum, price) => sum + price, 0) / competitorPrices.length
                  : null;
                
                return (
                  <td key={date} className="px-3 py-3 text-center border-r border-gray-300 bg-blue-50">
                    <div className="text-xs text-blue-400 mb-1">{columnLetter}</div>
                    {averagePrice ? (
                      <div className="text-sm font-bold text-blue-700">
                        R$ {averagePrice.toFixed(2)}
                      </div>
                    ) : (
                      <div className="text-blue-300 text-xs">-</div>
                    )}
                    {competitorPrices.length > 0 && (
                      <div className="text-xs text-blue-500 mt-1">
                        ({competitorPrices.length} hotéi{competitorPrices.length !== 1 ? 's' : 's'})
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>

        {Object.keys(hotelRows).length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600">Nenhum preço encontrado para o período selecionado</p>
            <p className="text-sm text-gray-500 mt-2">
              Execute uma busca para coletar dados em tempo real da Booking.com.
            </p>
          </div>
        )}
      </div>

      {/* Legenda dos indicadores de bundle */}
      <div className="p-3 bg-yellow-50 border-t border-yellow-200">
        <h4 className="text-sm font-semibold text-yellow-800 mb-2">🔍 Legenda dos Indicadores</h4>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1">
            <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded font-medium">📦 3n</span>
            <span className="text-gray-600">Pacote especial (ex: 3 noites)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded font-medium">📦 Mín</span>
            <span className="text-gray-600">Mínimo de noites exigido</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">📦/💰</span>
            <span className="text-gray-600">Preços mistos (bundle + diária)</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          • Preços de pacotes já foram divididos pelo número de noites para comparação
          <br/>
          • Pontos maiores no gráfico indicam preços oriundos de bundles/pacotes
        </p>
      </div>

      {/* Footer com informações */}
      <div className="p-4 bg-gray-50 text-sm text-gray-600">
        <p>Mostrando {prices.length} registros (máximo 100)</p>
        <button 
          onClick={loadDebugData}
          className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
        >
          Atualizar Dados
        </button>
      </div>
    </div>
  );
};

export default PriceDebugTable;