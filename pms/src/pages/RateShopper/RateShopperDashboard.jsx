import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Search,
  Eye,
  BarChart3,
  MapPin,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Play,
  Pause,
  RefreshCw,
  Filter,
  Calendar,
  Building
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const RateShopperDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState('all');
  const [dateRange, setDateRange] = useState('30d');

  // Mock data - será substituído pela chamada real da API
  const mockData = {
    summary: {
      total_properties: 4,
      total_searches: 15,
      total_prices: 1250,
      running_searches: 1,
      avg_price: 285.50,
      min_price: 180.00,
      max_price: 420.00
    },
    recent_searches: [
      {
        id: 1,
        property_name: 'HOTEL MARANDUBA',
        status: 'RUNNING',
        progress_percentage: 65,
        total_dates: 30,
        processed_dates: 19,
        started_at: '2025-01-04T10:30:00Z'
      },
      {
        id: 2,
        property_name: 'POUSADA KALIMAN',
        status: 'COMPLETED',
        progress_percentage: 100,
        total_dates: 30,
        total_prices_found: 28,
        completed_at: '2025-01-04T09:45:00Z'
      }
    ],
    properties: [
      {
        id: 1,
        property_name: 'HOTEL MARANDUBA',
        latest_price: 295.00,
        latest_scraped_at: '2025-01-04T08:30:00Z',
        avg_price_30d: 285.50,
        price_count_30d: 28
      },
      {
        id: 2,
        property_name: 'POUSADA KALIMAN',
        latest_price: 220.00,
        latest_scraped_at: '2025-01-04T09:45:00Z',
        avg_price_30d: 215.75,
        price_count_30d: 30
      }
    ],
    price_trends: [
      { date: '2025-01-01', 'HOTEL MARANDUBA': 280, 'POUSADA KALIMAN': 210 },
      { date: '2025-01-02', 'HOTEL MARANDUBA': 290, 'POUSADA KALIMAN': 215 },
      { date: '2025-01-03', 'HOTEL MARANDUBA': 285, 'POUSADA KALIMAN': 220 },
      { date: '2025-01-04', 'HOTEL MARANDUBA': 295, 'POUSADA KALIMAN': 225 }
    ]
  };

  useEffect(() => {
    // Simular carregamento dos dados
    setTimeout(() => {
      setDashboardData(mockData);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const { summary, recent_searches, properties, price_trends } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rate Shopper</h1>
            <p className="text-gray-600">Análise de preços da concorrência</p>
          </div>
          
          <div className="flex gap-4">
            <select 
              value={selectedProperty} 
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas as propriedades</option>
              {properties?.map(prop => (
                <option key={prop.id} value={prop.id}>{prop.property_name}</option>
              ))}
            </select>
            
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Propriedades Monitoradas</p>
              <p className="text-3xl font-bold text-gray-900">{summary.total_properties}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Preços Coletados</p>
              <p className="text-3xl font-bold text-gray-900">{summary.total_prices.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Preço Médio</p>
              <p className="text-3xl font-bold text-gray-900">R$ {summary.avg_price?.toFixed(2)}</p>
              <div className="flex items-center mt-1">
                <span className="text-xs text-gray-500">
                  R$ {summary.min_price?.toFixed(2)} - R$ {summary.max_price?.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Buscas Ativas</p>
              <p className="text-3xl font-bold text-gray-900">{summary.running_searches}</p>
              <div className="flex items-center mt-1">
                <div className="flex items-center text-xs text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                  Em execução
                </div>
              </div>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Search className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Price Trends Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Tendência de Preços</h3>
            <p className="text-sm text-gray-600">Evolução dos preços nos últimos dias</p>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={price_trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis 
                  tickFormatter={(value) => `R$ ${value}`}
                />
                <Tooltip 
                  formatter={(value, name) => [`R$ ${value}`, name]}
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Line 
                  type="monotone" 
                  dataKey="HOTEL MARANDUBA" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="POUSADA KALIMAN" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  dot={{ fill: '#EF4444', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Searches */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Buscas Recentes</h3>
            <p className="text-sm text-gray-600">Status das execuções mais recentes</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recent_searches?.map((search) => (
                <div key={search.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      search.status === 'RUNNING' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      {search.status === 'RUNNING' ? (
                        <Play className="h-4 w-4 text-blue-600" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{search.property_name}</p>
                      <p className="text-sm text-gray-600">
                        {search.status === 'RUNNING' 
                          ? `${search.processed_dates}/${search.total_dates} processados`
                          : `${search.total_prices_found} preços encontrados`
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {search.status === 'RUNNING' && (
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${search.progress_percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {search.progress_percentage}%
                        </span>
                      </div>
                    )}
                    
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      search.status === 'RUNNING' 
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {search.status === 'RUNNING' ? 'Executando' : 'Concluída'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Properties Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Propriedades Monitoradas</h3>
              <p className="text-sm text-gray-600">Visão geral dos preços mais recentes</p>
            </div>
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
              <Search className="h-4 w-4 mr-2" />
              Nova Busca
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Propriedade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Último Preço
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Média (30d)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preços Coletados
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Última Atualização
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {properties?.map((property) => (
                <tr key={property.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {property.property_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          Booking.com
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      R$ {property.latest_price?.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      R$ {property.avg_price_30d?.toFixed(2)}
                    </div>
                    <div className={`text-xs flex items-center ${
                      property.latest_price > property.avg_price_30d ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {property.latest_price > property.avg_price_30d ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(((property.latest_price - property.avg_price_30d) / property.avg_price_30d) * 100).toFixed(1)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {property.price_count_30d}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(property.latest_scraped_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-900">
                      <Search className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RateShopperDashboard;