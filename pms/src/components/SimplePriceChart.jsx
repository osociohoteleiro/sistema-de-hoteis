import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import apiService from '../services/api';

const SimplePriceChart = ({ selectedHotelUuid }) => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPriceData();
  }, [selectedHotelUuid]);

  const loadPriceData = async () => {
    if (!selectedHotelUuid) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.request(
        `/rate-shopper/${selectedHotelUuid}/price-trends?start_date=2025-09-05&end_date=2025-10-31&future_days=30`
      );
      
      if (response.success && response.data.chart_data) {
        // Processar dados para formato simples
        const processedData = response.data.chart_data.map(item => ({
          date: item.date,
          dateFormatted: new Date(item.date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit'
          }),
          'Kaliman Pousada': item['Kaliman Pousada'] || null,
          'Aldeia Da Lagoinha': item['Aldeia Da Lagoinha'] || null,
          'Eco Encanto Pousada': item['Eco Encanto Pousada'] || null,
          'Recanto Maranduba': item['Recanto Maranduba'] || null
        }));
        
        setChartData(processedData);
      } else {
        setError('Falha ao carregar dados do gráfico');
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar dados: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (value) => {
    if (!value) return '';
    return `R$ ${parseFloat(value).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Tendência de Preços (Simplificado)</h3>
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

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Tendência de Preços (Simplificado)</h3>
        </div>
        <div className="p-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={loadPriceData}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Tendência de Preços (Simplificado)</h3>
        <p className="text-sm text-gray-600 mt-1">
          {chartData.length} dias com dados • Período: Set-Out 2025
        </p>
      </div>
      
      <div className="p-6">
        {chartData.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="dateFormatted" 
                  tick={{ fontSize: 11 }}
                  interval={'preserveStartEnd'}
                />
                <YAxis 
                  tickFormatter={(value) => `R$ ${value}`}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip 
                  formatter={(value, name) => [formatPrice(value), name]}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Legend />
                
                <Line
                  type="monotone"
                  dataKey="Kaliman Pousada"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="Aldeia Da Lagoinha"
                  stroke="#EF4444"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="Eco Encanto Pousada"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="Recanto Maranduba"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">Nenhum dado encontrado</p>
            <p className="text-gray-500 text-sm mt-2">
              Execute algumas extrações para ver os preços no gráfico
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimplePriceChart;