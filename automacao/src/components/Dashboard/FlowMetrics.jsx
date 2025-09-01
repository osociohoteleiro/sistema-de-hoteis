import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Clock, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import useDashboardStore from '../../stores/dashboardStore';

const FlowMetrics = () => {
  const [timeRange, setTimeRange] = useState('24h');
  const { 
    executionMetrics, 
    loading, 
    errors, 
    fetchExecutionMetrics 
  } = useDashboardStore();

  useEffect(() => {
    fetchExecutionMetrics(timeRange);
  }, [timeRange, fetchExecutionMetrics]);

  const handleTimeRangeChange = (newRange) => {
    setTimeRange(newRange);
    fetchExecutionMetrics(newRange);
  };

  const currentData = executionMetrics || [];
  const maxValue = currentData.length > 0 ? Math.max(...currentData.map(item => item.executions)) : 0;

  const totalExecutions = currentData.reduce((sum, item) => sum + item.executions, 0);
  const totalSuccess = currentData.reduce((sum, item) => sum + item.success, 0);
  const successRate = totalExecutions > 0 ? ((totalSuccess / totalExecutions) * 100).toFixed(1) : '0.0';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Métricas de Execução
            </h3>
            <p className="text-sm text-gray-600 mt-1">Performance dos fluxos ao longo do tempo</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleTimeRangeChange('24h')}
              disabled={loading.metrics}
              className={`px-3 py-1 text-sm rounded-md transition-colors disabled:opacity-50 ${
                timeRange === '24h'
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              24h
            </button>
            <button
              onClick={() => handleTimeRangeChange('7d')}
              disabled={loading.metrics}
              className={`px-3 py-1 text-sm rounded-md transition-colors disabled:opacity-50 ${
                timeRange === '7d'
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              7 dias
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {loading.metrics ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Carregando métricas...</span>
          </div>
        ) : errors.metrics ? (
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">Erro ao carregar métricas</p>
          </div>
        ) : currentData.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Nenhum dado disponível para o período selecionado</p>
          </div>
        ) : (
          <>
            {/* Resumo das métricas */}
            <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg mx-auto mb-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalExecutions.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Total de Execuções</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg mx-auto mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{successRate}%</p>
            <p className="text-sm text-gray-600">Taxa de Sucesso</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 bg-yellow-100 rounded-lg mx-auto mb-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalExecutions - totalSuccess}</p>
            <p className="text-sm text-gray-600">Falhas</p>
          </div>
        </div>

        {/* Gráfico de barras */}
        <div className="space-y-3">
          {currentData.map((item, index) => {
            const percentage = (item.executions / maxValue) * 100;
            const successPercentage = (item.success / item.executions) * 100;
            
            return (
              <div key={index} className="flex items-center gap-4">
                <div className="w-12 text-sm text-gray-600 font-medium">
                  {timeRange === '24h' ? item.hour : item.day}
                </div>
                <div className="flex-1 relative">
                  <div className="w-full bg-gray-100 rounded-full h-6 relative overflow-hidden">
                    {/* Barra total */}
                    <div
                      className="bg-blue-200 h-full rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                    {/* Barra de sucesso */}
                    <div
                      className="bg-blue-500 h-full rounded-full absolute top-0 left-0 transition-all duration-300"
                      style={{ width: `${(percentage * successPercentage) / 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>{item.executions} execuções</span>
                    <span>{item.success} sucessos ({successPercentage.toFixed(1)}%)</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legenda */}
        <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-200 rounded-full"></div>
            <span className="text-sm text-gray-600">Total de Execuções</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Execuções com Sucesso</span>
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FlowMetrics;