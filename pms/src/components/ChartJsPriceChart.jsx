import React, { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  TrendingUp,
  Clock
} from 'lucide-react';
import { format, addDays, subDays, startOfDay, isToday, isFuture, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import apiService from '../services/api';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ChartJsPriceChart = ({ 
  selectedHotelUuid, 
  externalStartDate, 
  externalPeriodDays, 
  onStartDateChange, 
  onPeriodDaysChange,
  onDataChange  // Callback para informar dados ao dashboard
}) => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [propertyNames, setPropertyNames] = useState([]);
  const chartRef = useRef();
  
  // Estados para controle de tempo - usar externos se fornecidos, senão usar internos
  const [internalStartDate, setInternalStartDate] = useState(() => startOfDay(new Date()));
  const [internalPeriodDays, setInternalPeriodDays] = useState(30);
  
  const currentStartDate = externalStartDate || internalStartDate;
  const periodDays = externalPeriodDays || internalPeriodDays;
  
  
  // Opções de período
  const periodOptions = [
    { value: 7, label: '7 dias' },
    { value: 15, label: '15 dias' },
    { value: 30, label: '30 dias' },
    { value: 60, label: '60 dias' },
    { value: 90, label: '90 dias' }
  ];

  // Paleta de cores para os hotéis
  const colorPalette = [
    { 
      border: '#3B82F6', 
      background: 'rgba(59, 130, 246, 0.1)',
      point: '#3B82F6'
    }, // Azul
    { 
      border: '#EF4444', 
      background: 'rgba(239, 68, 68, 0.1)',
      point: '#EF4444'
    }, // Vermelho
    { 
      border: '#10B981', 
      background: 'rgba(16, 185, 129, 0.1)',
      point: '#10B981'
    }, // Verde
    { 
      border: '#F59E0B', 
      background: 'rgba(245, 158, 11, 0.1)',
      point: '#F59E0B'
    }, // Laranja
    { 
      border: '#8B5CF6', 
      background: 'rgba(139, 92, 246, 0.1)',
      point: '#8B5CF6'
    }, // Roxo
    { 
      border: '#EC4899', 
      background: 'rgba(236, 72, 153, 0.1)',
      point: '#EC4899'
    }, // Pink
    { 
      border: '#06B6D4', 
      background: 'rgba(6, 182, 212, 0.1)',
      point: '#06B6D4'
    }, // Cyan
    { 
      border: '#84CC16', 
      background: 'rgba(132, 204, 22, 0.1)',
      point: '#84CC16'
    }  // Lime
  ];

  // Configurações do Chart.js
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      title: {
        display: false
      },
      legend: {
        display: true,
        position: 'top',
        align: 'start',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#374151',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: function(context) {
            const dataIndex = context[0].dataIndex;
            const rawData = chartData?.processedData?.[dataIndex];
            if (rawData) {
              let title = rawData.fullDate;
              if (rawData.isToday) title += ' (Hoje)';
              if (rawData.isFuture) title += ' (Futuro)';
              return title;
            }
            return context[0].label;
          },
          label: function(context) {
            const value = context.parsed.y;
            if (value === null || value === undefined) return null;
            return `${context.dataset.label}: R$ ${value.toFixed(2)}`;
          },
          afterBody: function(context) {
            const dataIndex = context[0].dataIndex;
            const rawData = chartData?.processedData?.[dataIndex];
            if (rawData) {
              const totalProperties = propertyNames.length;
              const validPrices = propertyNames.filter(name => 
                rawData[name] !== null && rawData[name] !== undefined && typeof rawData[name] === 'number' && rawData[name] > 0
              );
              
              if (totalProperties > 0) {
                return [``, `${validPrices.length} de ${totalProperties} hotel(s) com preços neste dia`];
              }
            }
            return null;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Data',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        ticks: {
          font: {
            size: periodDays <= 7 ? 10 : periodDays <= 15 ? 9 : 8
          },
          maxRotation: periodDays > 15 ? 45 : 0,
          callback: function(value, index, values) {
            const rawData = chartData?.processedData?.[index];
            if (rawData?.isToday) {
              return '• ' + this.getLabelForValue(value) + ' •';
            }
            return this.getLabelForValue(value);
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Preço (R$)',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        beginAtZero: false,
        ticks: {
          font: {
            size: 10
          },
          callback: function(value) {
            return 'R$ ' + value.toFixed(0);
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    },
    elements: {
      line: {
        tension: 0.3, // Suavizar as curvas
        borderWidth: 2
      },
      point: {
        radius: 4,
        hoverRadius: 6,
        borderWidth: 2,
        backgroundColor: '#ffffff'
      }
    },
    // Garantir que datasets com dados parciais sejam exibidos
    datasets: {
      line: {
        showLine: true // Sempre mostrar a linha mesmo com pontos faltantes
      }
    }
  };

  useEffect(() => {
    loadPriceData();
  }, [selectedHotelUuid, currentStartDate, periodDays]);

  const loadPriceData = async () => {
    if (!selectedHotelUuid) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const endDate = addDays(currentStartDate, periodDays - 1);
      const startDateStr = format(currentStartDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');
      
      const response = await apiService.request(
        `/rate-shopper/${selectedHotelUuid}/price-trends?start_date=${startDateStr}&end_date=${endDateStr}&future_days=${periodDays}`
      );
      
      if (response.success && response.data.chart_data) {
        console.log('✅ Usando DADOS REAIS da API');
        processRealData(response.data.chart_data, currentStartDate, endDate);
      } else {
        console.log('⚠️ Usando DADOS MOCKADOS');
        processMockData(currentStartDate, endDate);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      processMockData(currentStartDate, endDate);
    } finally {
      setLoading(false);
    }
  };

  const processRealData = (apiData, startDate, endDate) => {
    // Log inicial para debug
    console.log('📊 API Data recebida:', apiData.length, 'registros');
    console.log('📊 Primeiros 3 registros:', apiData.slice(0, 3));
    console.log('📊 Últimos 3 registros:', apiData.slice(-3));
    
    // A API retorna dados já processados no formato: [{ date: '2025-01-01', 'Hotel A': 280, 'Hotel B': 250, ... }]
    // Cada objeto representa uma data com todos os preços das propriedades para aquela data
    
    // Detectar propriedades únicas (colunas que não são 'date' ou campos meta)
    const propertiesSet = new Set();
    
    apiData.forEach(record => {
      Object.keys(record).forEach(key => {
        const trimmedKey = key.trim();
        // Filtrar apenas nomes de propriedades válidos (excluir campos meta)
        if (trimmedKey !== 'date' && 
            trimmedKey !== '' &&
            trimmedKey !== 'isFuture' &&
            trimmedKey !== 'isSimulated' &&
            !trimmedKey.includes('_id') &&
            !trimmedKey.includes('_min') &&
            !trimmedKey.includes('_max') &&
            !trimmedKey.includes('_count') &&
            !trimmedKey.includes('created_at') &&
            !trimmedKey.includes('updated_at')) {
          propertiesSet.add(trimmedKey);
        }
      });
    });
    
    const propertiesList = Array.from(propertiesSet).sort();
    
    // Log para debug
    console.log('🏨 Propriedades detectadas:', propertiesList);
    
    setPropertyNames(propertiesList);

    // Criar sequência completa de dias (mesmo que não tenham dados)
    const allDates = eachDayOfInterval({ start: startDate, end: endDate });

    // Criar mapa de dados da API indexado por data
    const apiDataMap = {};
    apiData.forEach(item => {
      // CORREÇÃO: Usar a data diretamente da API sem conversão de timezone
      // A API já retorna no formato YYYY-MM-DD correto
      const dateKey = item.date; // Usar diretamente, sem new Date()
      apiDataMap[dateKey] = item; // Usar o objeto completo da API
    });

    // Processar dados dia por dia, garantindo continuidade
    const processedData = allDates.map(date => {
      const dateKey = format(date, 'yyyy-MM-dd');
      const dayApiData = apiDataMap[dateKey]; // Objeto completo da API ou undefined
      
      const dayData = {
        date: dateKey,
        dateFormatted: format(date, 'dd/MM', { locale: ptBR }),
        fullDate: format(date, 'dd/MM/yyyy', { locale: ptBR }),
        isToday: isToday(date),
        isFuture: isFuture(date) || (dayApiData && dayApiData.isFuture)
      };

      // Adicionar dados das propriedades
      propertiesList.forEach(propertyName => {
        if (dayApiData && dayApiData[propertyName] !== undefined) {
          const price = dayApiData[propertyName];
          // Validar se é um número válido
          if (typeof price === 'number' && price > 0 && price < 50000) {
            dayData[propertyName] = price;
          } else {
            dayData[propertyName] = null;
            if (dayApiData[propertyName] !== null) {
              console.log(`⚠️ Preço inválido para ${propertyName} em ${dateKey}:`, price, 'tipo:', typeof price);
            }
          }
        } else {
          dayData[propertyName] = null; // Sem dados para esta data/propriedade
          
          // Debug: mostrar apenas quando deveria ter dados mas não tem
          // (apenas para datas onde a API retornou dados mas não para essa propriedade)
          if (dayApiData && Object.keys(dayApiData).length > 2) { // Mais que 'date' e 'isFuture'
            // console.log(`❌ Sem dados de ${propertyName} em ${dateKey}. API tem:`, Object.keys(dayApiData));
          }
        }
      });

      return dayData;
    });

    // Log final para debug
    console.log('📈 Dados processados:', processedData.length, 'dias');
    console.log('📈 Propriedades encontradas:', propertiesList.length, ':', propertiesList);
    console.log('📈 Primeiros 3 dias processados:', processedData.slice(0, 3));

    createChartData(processedData, propertiesList);
  };

  const processMockData = (startDate, endDate) => {
    console.log('⚠️ Usando dados mock para demonstração');
    
    const mockProperties = ['Hotel Maranduba', 'Pousada Kaliman', 'Eco Encanto'];
    setPropertyNames(mockProperties);
    
    const allDates = eachDayOfInterval({ start: startDate, end: endDate });
    
    const processedData = allDates.map((date, index) => {
      const dayData = {
        date: format(date, 'yyyy-MM-dd'),
        dateFormatted: format(date, 'dd/MM', { locale: ptBR }),
        fullDate: format(date, 'dd/MM/yyyy', { locale: ptBR }),
        isToday: isToday(date),
        isFuture: isFuture(date)
      };
      
      mockProperties.forEach(propertyName => {
        const basePrice = propertyName === 'Hotel Maranduba' ? 280 : 
                         propertyName === 'Pousada Kaliman' ? 220 : 180;
        const variation = Math.sin(index * 0.1) * 30;
        const randomGap = Math.random() > 0.15;
        
        dayData[propertyName] = randomGap ? Math.round(basePrice + variation) : null;
      });
      
      return dayData;
    });

    createChartData(processedData, mockProperties);
  };

  const createChartData = (processedData, propertiesList) => {
    // Garantir que não há duplicação de labels (datas)
    const labels = processedData.map(item => item.dateFormatted);
    
    // Garantir que não há duplicação de propriedades
    const uniqueProperties = [...new Set(propertiesList)].filter(prop => prop && prop.trim() !== '');
    
    console.log('📊 Criando chart com', labels.length, 'labels e', uniqueProperties.length, 'propriedades únicas');
    
    const datasets = uniqueProperties.map((propertyName, index) => {
      const colors = colorPalette[index % colorPalette.length];
      const data = processedData.map(item => {
        const value = item[propertyName];
        // Retornar null em vez de undefined para que Chart.js trate corretamente os gaps
        return (value !== null && value !== undefined && typeof value === 'number' && value > 0) ? value : null;
      });
      
      // Contar quantos pontos válidos existem
      const validPoints = data.filter(point => point !== null).length;
      
      console.log(`📈 Dataset "${propertyName}": ${validPoints} pontos válidos de ${data.length} total`);
      
      // Só incluir dataset se tiver pelo menos 1 ponto válido
      if (validPoints === 0) {
        console.log(`⚠️ Removendo dataset "${propertyName}" - sem pontos válidos`);
        return null;
      }
      
      return {
        label: propertyName.trim(),
        data: data,
        borderColor: colors.border,
        backgroundColor: colors.background,
        pointBackgroundColor: colors.point,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: (context) => {
          // Mostrar pontos apenas onde há dados (não para valores null)
          return context.parsed.y !== null ? 4 : 0;
        },
        pointHoverRadius: 6,
        fill: false,
        tension: 0.3,
        spanGaps: false, // Não conectar através de gaps - isso permite ver outras propriedades independentemente
        connectNulls: false,
        // Garantir que a linha seja visível mesmo com gaps
        hidden: false
      };
    }).filter(dataset => dataset !== null); // Remover datasets nulos

    const newChartData = {
      labels,
      datasets,
      processedData
    };
    
    setChartData(newChartData);
    
    // Informar ao Dashboard sobre mudança de dados
    if (onDataChange) {
      onDataChange(newChartData, propertiesList);
    }

    console.log('✅ Chart.js finalizado:', {
      labels: labels.length,
      datasets: datasets.length,
      properties: uniqueProperties,
      firstLabels: labels.slice(0, 5),
      datasetNames: datasets.map(d => d.label)
    });
  };

  // Funções de navegação
  const goToPreviousPeriod = () => {
    const newDate = subDays(currentStartDate, periodDays);
    if (onStartDateChange) {
      onStartDateChange(newDate);
    } else {
      setInternalStartDate(newDate);
    }
  };

  const goToNextPeriod = () => {
    const newDate = addDays(currentStartDate, periodDays);
    if (onStartDateChange) {
      onStartDateChange(newDate);
    } else {
      setInternalStartDate(newDate);
    }
  };

  const goToToday = () => {
    const newDate = startOfDay(new Date());
    if (onStartDateChange) {
      onStartDateChange(newDate);
    } else {
      setInternalStartDate(newDate);
    }
  };

  const handlePeriodChange = (days) => {
    if (onPeriodDaysChange) {
      onPeriodDaysChange(days);
    } else {
      setInternalPeriodDays(days);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                Tendência de Preços (Chart.js)
              </h3>
              <p className="text-sm text-gray-600 mt-1">Análise temporal com controles avançados</p>
            </div>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
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
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-red-600" />
            Tendência de Preços (Chart.js)
          </h3>
        </div>
        <div className="p-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={loadPriceData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentEndDate = addDays(currentStartDate, periodDays - 1);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header com controles */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
              Tendência de Preços (Chart.js)
            </h3>
            <p className="text-sm text-gray-600 mt-1 flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {format(currentStartDate, 'dd/MM/yyyy', { locale: ptBR })} → {format(currentEndDate, 'dd/MM/yyyy', { locale: ptBR })}
              <span className="ml-2">• {chartData?.processedData?.length || 0} dias com dados</span>
            </p>
          </div>
        </div>

        {/* Controles de navegação */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={goToPreviousPeriod}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </button>
            
            {/* Botão Hoje no meio */}
            <button
              onClick={goToToday}
              className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              title="Ir para período atual"
            >
              <Clock className="h-4 w-4 mr-1" />
              Hoje
            </button>
            
            <button
              onClick={goToNextPeriod}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Próximo
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>

          {/* Seletor de período */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Período:</span>
            {periodOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handlePeriodChange(option.value)}
                className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  periodDays === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Gráfico Chart.js */}
      <div className="p-6">
        {chartData && chartData.datasets.length > 0 ? (
          <div className="h-96">
            <Line 
              ref={chartRef}
              data={chartData} 
              options={chartOptions} 
            />
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Nenhum dado encontrado</h4>
            <p className="text-gray-600 text-sm">
              Execute algumas extrações para ver os preços no gráfico.
              <br />
              O período selecionado pode não ter dados disponíveis.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartJsPriceChart;