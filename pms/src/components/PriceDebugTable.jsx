import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

const PriceDebugTable = ({ selectedHotelUuid, startDate, endDate, chartData, propertyNames }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


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
          prices.push({
            check_in_date: dayData.date, // Formato YYYY-MM-DD
            property_name: propertyName,
            price: price.toString(),
            room_type: 'Standard', // Valor padrão
            scraped_at: new Date().toISOString()
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
            {Object.entries(hotelRows).map(([hotelName, dates], rowIndex) => (
              <tr key={hotelName} className="hover:bg-gray-50">
                {/* Coluna A - Nome do hotel */}
                <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-300 sticky left-0 bg-white">
                  <div className="max-w-56">
                    <div className="font-semibold text-blue-600">A{rowIndex + 2}</div>
                    <div className="text-gray-900 mt-1">{hotelName}</div>
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
                  
                  return (
                    <td key={date} className="px-3 py-3 text-center border-r border-gray-300">
                      <div className="text-xs text-gray-400 mb-1">{cellRef}</div>
                      {price ? (
                        <div className="text-sm font-bold text-green-600">
                          R$ {price.toFixed(2)}
                        </div>
                      ) : (
                        <div className="text-gray-300 text-xs">-</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
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