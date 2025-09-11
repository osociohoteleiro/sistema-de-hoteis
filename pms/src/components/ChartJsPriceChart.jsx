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
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
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
  
  // Cores especiais para propriedades principais (mais destacadas)
  const mainPropertyColors = [
    { 
      border: '#DC2626', 
      background: 'rgba(220, 38, 38, 0.2)',
      point: '#DC2626'
    }, // Vermelho forte
    { 
      border: '#0D9488', 
      background: 'rgba(13, 148, 136, 0.2)',
      point: '#0D9488'
    } // Verde forte
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
            
            const dataIndex = context.dataIndex;
            const rawData = chartData?.processedData?.[dataIndex];
            const propertyName = context.dataset.label.replace('🏆 ', ''); // Remover ícone para acessar dados
            
            // Usar o label original (com ícone) no tooltip, mas usar nome limpo para acessar dados
            const displayLabel = context.dataset.label; // Com ícone para exibição
            let label = `${displayLabel}: R$ ${value.toFixed(2)}`;
            
            // Adicionar informações de bundle se disponível
            if (rawData) {
              const bundleCount = rawData[`${propertyName}_bundle_count`];
              const regularCount = rawData[`${propertyName}_regular_count`];
              const isMostlyBundle = rawData[`${propertyName}_is_mostly_bundle`];
              const avgBundleSize = rawData[`${propertyName}_avg_bundle_size`];
              
              if (bundleCount > 0) {
                if (isMostlyBundle && avgBundleSize > 1) {
                  label += ` 📦 (Pacote ${avgBundleSize.toFixed(0)} noites)`;
                } else if (bundleCount > regularCount) {
                  label += ` 📦 (Mín. noites)`;
                } else if (bundleCount > 0 && regularCount > 0) {
                  label += ` 📦/💰 (Misto)`;
                }
              }
            }
            
            return label;
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
    console.log('🚀 GRÁFICO: loadPriceData called with selectedHotelUuid:', selectedHotelUuid);
    
    if (!selectedHotelUuid) {
      console.log('❌ GRÁFICO: No hotel UUID, returning early');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const endDate = addDays(currentStartDate, periodDays - 1);
      const startDateStr = format(currentStartDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');
      
      console.log('📅 GRÁFICO: Date range:', { startDateStr, endDateStr, periodDays });
      
      const apiUrl = `/rate-shopper/${selectedHotelUuid}/price-trends?start_date=${startDateStr}&end_date=${endDateStr}&future_days=${periodDays}`;
      console.log('🌐 GRÁFICO: Making API call to:', apiUrl);
      
      const response = await apiService.request(apiUrl);
      
      console.log('📡 GRÁFICO: API response received:', {
        success: response.success,
        hasData: !!response.data,
        hasChartData: !!response.data?.chart_data,
        chartDataLength: response.data?.chart_data?.length,
        mainProperties: response.data?.main_properties
      });
      
      if (response.success && response.data.chart_data) {
        console.log('✅ GRÁFICO: Usando DADOS REAIS da API');
        console.log('🏆 GRÁFICO: Propriedades principais:', response.data.main_properties);
        console.log('📊 GRÁFICO: Primeiro registro de dados:', response.data.chart_data[0]);
        processRealData(response.data.chart_data, currentStartDate, endDate, response.data.main_properties);
      } else {
        console.log('⚠️ GRÁFICO: Usando DADOS MOCKADOS - response:', response);
        processMockData(currentStartDate, endDate);
      }
    } catch (err) {
      console.error('❌ GRÁFICO: Erro ao carregar dados:', err);
      console.error('❌ GRÁFICO: Error stack:', err.stack);
      setError('Erro ao carregar dados do gráfico: ' + err.message);
      processMockData(currentStartDate, endDate);
    } finally {
      console.log('✅ GRÁFICO: loadPriceData finished, setting loading to false');
      setLoading(false);
    }
  };

  const processRealData = (apiData, startDate, endDate, mainProperties = []) => {
    // Log inicial para debug
    console.log('🔧 GRÁFICO: processRealData called with:', {
      apiDataLength: apiData.length,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      mainProperties
    });
    console.log('📊 GRÁFICO: API Data recebida:', apiData.length, 'registros');
    console.log('📊 GRÁFICO: Primeiros 3 registros:', apiData.slice(0, 3));
    console.log('📊 GRÁFICO: Últimos 3 registros:', apiData.slice(-3));
    
    // A API retorna dados já processados no formato: [{ date: '2025-01-01', 'Hotel A': 280, 'Hotel B': 250, ... }]
    // Cada objeto representa uma data com todos os preços das propriedades para aquela data
    
    // Detectar propriedades únicas (colunas que não são 'date' ou campos meta)
    const propertiesSet = new Set();
    
    // DEBUG: Log the first record to see what keys we have
    console.log('🔍 GRÁFICO: Primeiro registro completo:', apiData[0]);
    console.log('🔍 GRÁFICO: Keys do primeiro registro:', Object.keys(apiData[0] || {}));
    
    apiData.forEach(record => {
      Object.keys(record).forEach(key => {
        const trimmedKey = key.trim();
        
        // Log each key being processed
        console.log('🔍 GRÁFICO: Processando key:', { 
          key: trimmedKey, 
          isDate: trimmedKey === 'date',
          isEmpty: trimmedKey === '',
          isFuture: trimmedKey === 'isFuture',
          hasUnderscore: trimmedKey.includes('_'),
          value: record[key]
        });
        
        // Filtrar apenas nomes de propriedades válidos (excluir campos meta e bundle)
        if (trimmedKey !== 'date' && 
            trimmedKey !== '' &&
            trimmedKey !== 'isFuture' &&
            trimmedKey !== 'isSimulated' &&
            !trimmedKey.includes('_id') &&
            !trimmedKey.includes('_min') &&
            !trimmedKey.includes('_max') &&
            !trimmedKey.includes('_count') &&
            !trimmedKey.includes('_bundle_count') &&
            !trimmedKey.includes('_regular_count') &&
            !trimmedKey.includes('_avg_bundle_size') &&
            !trimmedKey.includes('_max_bundle_size') &&
            !trimmedKey.includes('_is_mostly_bundle') &&
            !trimmedKey.includes('_platform') &&
            !trimmedKey.includes('_is_main_property') &&
            !trimmedKey.includes('created_at') &&
            !trimmedKey.includes('updated_at')) {
          console.log('✅ GRÁFICO: Adding property:', trimmedKey);
          propertiesSet.add(trimmedKey);
        } else {
          console.log('❌ GRÁFICO: Filtering out key:', trimmedKey);
        }
      });
    });
    
    const propertiesList = Array.from(propertiesSet).sort();
    
    // Log para debug
    console.log('🏨 GRÁFICO: Propriedades detectadas FINAL:', propertiesList);
    console.log('🏨 GRÁFICO: Total propriedades encontradas:', propertiesList.length);
    
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

    createChartData(processedData, propertiesList, mainProperties);
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

  const createChartData = (processedData, propertiesList, mainProperties = []) => {
    // Garantir que não há duplicação de labels (datas)
    const labels = processedData.map(item => item.dateFormatted);
    
    // Garantir que não há duplicação de propriedades
    const uniqueProperties = [...new Set(propertiesList)].filter(prop => prop && prop.trim() !== '');
    
    console.log('📊 Criando chart com', labels.length, 'labels e', uniqueProperties.length, 'propriedades únicas');
    console.log('🏆 Propriedades principais recebidas:', mainProperties);
    
    const datasets = uniqueProperties.map((propertyName, index) => {
      // Verificar se é propriedade principal
      const isMainProperty = mainProperties && mainProperties.includes(propertyName);
      console.log(`🎨 ${propertyName} é principal:`, isMainProperty);
      
      // Usar cores especiais para propriedades principais
      let colors;
      if (isMainProperty) {
        const mainIndex = mainProperties.indexOf(propertyName);
        colors = mainPropertyColors[mainIndex % mainPropertyColors.length];
      } else {
        colors = colorPalette[index % colorPalette.length];
      }
      
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
      
      // Adicionar ícone especial na legenda para propriedades principais
      const displayLabel = isMainProperty ? `🏆 ${propertyName.trim()}` : propertyName.trim();
      
      return {
        label: displayLabel,
        data: data,
        borderColor: colors.border,
        backgroundColor: colors.background,
        pointBackgroundColor: colors.point,
        borderWidth: isMainProperty ? 4 : 2, // Linha mais grossa para propriedades principais
        pointBorderColor: (context) => {
          // Borda dourada para pontos de bundles
          const dataIndex = context?.dataIndex;
          const rawData = context?.chart?.data?.processedData?.[dataIndex];
          const propertyName = context?.dataset?.label;
          
          if (rawData && propertyName) {
            const bundleCount = rawData[`${propertyName}_bundle_count`];
            const isMostlyBundle = rawData[`${propertyName}_is_mostly_bundle`];
            
            if (bundleCount > 0 && isMostlyBundle) {
              return '#F59E0B'; // Cor dourada para pacotes
            } else if (bundleCount > 0) {
              return '#8B5CF6'; // Cor roxa para misto
            }
          }
          
          return '#ffffff'; // Branco padrão
        },
        pointBorderWidth: (context) => {
          // Borda mais espessa para bundles
          const dataIndex = context?.dataIndex;
          const rawData = context?.chart?.data?.processedData?.[dataIndex];
          const propertyName = context?.dataset?.label;
          
          if (rawData && propertyName) {
            const bundleCount = rawData[`${propertyName}_bundle_count`];
            if (bundleCount > 0) {
              return 3; // Borda mais espessa para bundles
            }
          }
          
          return 2; // Espessura padrão
        },
        pointRadius: (context) => {
          // Mostrar pontos apenas onde há dados (não para valores null)
          if (context.parsed.y === null) return 0;
          
          // Limpar ícone da legenda para obter nome real da propriedade
          const cleanPropertyName = context.dataset.label.replace('🏆 ', '');
          
          // Destacar pontos de bundles com tamanho maior
          const dataIndex = context.dataIndex;
          const rawData = context.chart.data.processedData?.[dataIndex];
          
          if (rawData) {
            const bundleCount = rawData[`${cleanPropertyName}_bundle_count`];
            const isMostlyBundle = rawData[`${cleanPropertyName}_is_mostly_bundle`];
            
            // Pontos maiores para bundles
            if (bundleCount > 0 && isMostlyBundle) {
              return isMainProperty ? 8 : 6; // Ainda maior para propriedades principais
            } else if (bundleCount > 0) {
              return isMainProperty ? 7 : 5; // Ponto médio para misto
            }
          }
          
          return isMainProperty ? 6 : 4; // Tamanho maior para propriedades principais
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
    
    console.log('🎯 GRÁFICO: Setting chart data with:', {
      labelsCount: labels.length,
      datasetsCount: datasets.length,
      firstLabel: labels[0],
      lastLabel: labels[labels.length - 1],
      datasetsInfo: datasets.map(d => ({ label: d.label, dataCount: d.data.length }))
    });
    
    setChartData(newChartData);
    
    // Informar ao Dashboard sobre mudança de dados
    if (onDataChange) {
      console.log('📞 GRÁFICO: Calling onDataChange callback');
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

  const handleDateChange = (date) => {
    if (date && !isNaN(date.getTime())) {
      const newDate = startOfDay(date);
      if (onStartDateChange) {
        onStartDateChange(newDate);
      } else {
        setInternalStartDate(newDate);
      }
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
                Tendência de Preços
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
              Tendência de Preços
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
            
            {/* Datepicker elegante para ir para uma data específica */}
            <div className="flex items-center space-x-1 relative">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div className="date-picker-wrapper">
                <DatePicker
                  selected={currentStartDate}
                  onChange={handleDateChange}
                  dateFormat="dd/MM/yyyy"
                  locale={ptBR}
                  showPopperArrow={false}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer w-28"
                  placeholderText="Selecionar data"
                  todayButton="Hoje"
                  showTodayButton
                  title="Selecionar data específica"
                  popperClassName="date-picker-popper"
                  calendarClassName="date-picker-calendar"
                />
              </div>
            </div>
            
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
        {(() => {
          console.log('🖼️ GRÁFICO: Render check - chartData exists:', !!chartData);
          console.log('🖼️ GRÁFICO: Render check - datasets length:', chartData?.datasets?.length || 0);
          console.log('🖼️ GRÁFICO: Render check - loading:', loading);
          console.log('🖼️ GRÁFICO: Render check - error:', error);
          return null;
        })()}
        
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