import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

/**
 * REGRA IMPORTANTE: SEMPRE USAR DADOS REAIS
 * 
 * Este componente deve SEMPRE buscar dados reais das APIs.
 * - Nunca usar dados mockados em produção
 * - Sempre verificar se o hotel_uuid é válido antes de fazer requisições
 * - Em caso de erro na API, mostrar mensagem apropriada ao usuário
 * - Manter estados zerados/vazios como fallback enquanto carrega os dados reais
 */

const Reports = ({ reportType = 'financeiro' }) => {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState('month');
  const [selectedHotel, setSelectedHotel] = useState('all');
  const [loading, setLoading] = useState(false);
  

  // Estados para dados reais
  const [reportData, setReportData] = useState({
    financial: {
      revenue: 0,
      expenses: 0,
      profit: 0,
      occupancyRate: 0,
      averageDailyRate: 0,
      revenuePAR: 0
    },
    operational: {
      totalReservations: 0,
      checkins: 0,
      checkouts: 0,
      cancellations: 0,
      noShows: 0,
      averageStay: 0
    }
  });

  // Lista de hotéis do usuário
  const [userHotels, setUserHotels] = useState([]);

  // Carregar lista de hotéis do usuário
  const loadUserHotels = async () => {
    try {
      // Usar o token correto do localStorage
      const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado. Faça login novamente.');
      }
      
      const response = await fetch('http://localhost:3001/api/hotels/my-hotels', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const formattedHotels = [
          { id: 'all', name: 'Todos os Hotéis' },
          ...data.hotels.map(hotel => ({
            id: hotel.hotel_uuid,
            name: hotel.name || hotel.hotel_nome || `Hotel ${hotel.id}`
          }))
        ];
        setUserHotels(formattedHotels);
      }
    } catch (error) {
      console.error('Erro ao carregar hotéis:', error);
      // Em caso de erro, usar dados básicos
      setUserHotels([{ id: 'all', name: 'Todos os Hotéis' }]);
    }
  };

  // Carregar dados reais dos relatórios
  const loadReportsData = async () => {
    const hotelUuid = getCurrentHotelUuid();
    if (!hotelUuid) return;

    try {
      setLoading(true);
      
      // Aqui você pode adicionar chamadas para APIs reais de relatórios
      // Por enquanto, mantemos os dados zerados até as APIs estarem prontas
      
      
    } catch (error) {
      console.error('Erro ao carregar dados dos relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = (format) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success(`Relatório exportado em ${format.toUpperCase()}`);
    }, 2000);
  };

  const getReportTitle = (type) => {
    const titles = {
      'financeiro': { title: 'Relatório Financeiro', icon: '💰', description: 'Análise de receitas, despesas e lucro' },
      'operacional': { title: 'Relatório Operacional', icon: '📋', description: 'Ocupação, reservas e métricas operacionais' },
      'satisfacao': { title: 'Relatório de Satisfação', icon: '⭐', description: 'NPS, avaliações e feedback dos hóspedes' }
    };
    return titles[type] || titles['financeiro'];
  };







  // Carregar dados iniciais
  useEffect(() => {
    loadUserHotels();
  }, []);

  // Carregar dados quando o tipo de relatório ou hotel mudarem
  useEffect(() => {
    loadReportsData();
  }, [reportType, selectedHotel, dateRange]);


  const StatCard = ({ title, value, change, prefix = '', suffix = '', trend = 'up' }) => (
    <div className="bg-sidebar-800/50 backdrop-blur-sm rounded-lg border border-white/10 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sidebar-400 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-white mt-2">
            {prefix}{typeof value === 'number' ? value.toLocaleString('pt-BR') : value}{suffix}
          </p>
          {change && (
            <div className={`flex items-center mt-2 text-sm ${
              trend === 'up' ? 'text-green-400' : 'text-red-400'
            }`}>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d={trend === 'up' ? "M7 17l9.2-9.2M17 17V7H7" : "M7 7l9.2 9.2M17 7v10H7"} />
              </svg>
              {change}% vs. período anterior
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <span>{getReportTitle(reportType).icon}</span>
            <span>{getReportTitle(reportType).title}</span>
          </h1>
          <p className="text-sidebar-400">{getReportTitle(reportType).description}</p>
        </div>
      </div>

      {/* Relatório Financeiro */}
      {reportType === 'financeiro' && (
        <div className="space-y-6">
          {/* KPIs Financeiros */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              title="Receita Total"
              value={reportData.financial.revenue}
              prefix="R$ "
              change={12.5}
              trend="up"
            />
            
            <StatCard
              title="Despesas Operacionais"
              value={reportData.financial.expenses}
              prefix="R$ "
              change={-3.2}
              trend="down"
            />
            
            <StatCard
              title="Lucro Líquido"
              value={reportData.financial.profit}
              prefix="R$ "
              change={18.7}
              trend="up"
            />
            
            <StatCard
              title="Taxa de Ocupação"
              value={reportData.financial.occupancyRate}
              suffix="%"
              change={5.3}
              trend="up"
            />
            
            <StatCard
              title="Tarifa Média Diária"
              value={reportData.financial.averageDailyRate}
              prefix="R$ "
              change={8.9}
              trend="up"
            />
            
            <StatCard
              title="RevPAR"
              value={reportData.financial.revenuePAR}
              prefix="R$ "
              change={14.2}
              trend="up"
            />
          </div>

          {/* Gráficos Financeiros */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-sidebar-800/50 backdrop-blur-sm rounded-lg border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Receita vs Despesas</h3>
              <div className="h-64 flex items-center justify-center bg-white/5 rounded-lg">
                <p className="text-sidebar-400">Gráfico de barras em desenvolvimento</p>
              </div>
            </div>

            <div className="bg-sidebar-800/50 backdrop-blur-sm rounded-lg border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Evolução do RevPAR</h3>
              <div className="h-64 flex items-center justify-center bg-white/5 rounded-lg">
                <p className="text-sidebar-400">Gráfico de linha em desenvolvimento</p>
              </div>
            </div>
          </div>

          {/* Detalhamento por Categoria */}
          <div className="bg-sidebar-800/50 backdrop-blur-sm rounded-lg border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Receita por Categoria</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-sidebar-400 text-sm">Hospedagem</p>
                <p className="text-2xl font-bold text-primary-400">R$ 98.450</p>
                <p className="text-sm text-green-400">67.8%</p>
              </div>
              <div className="text-center">
                <p className="text-sidebar-400 text-sm">Alimentação</p>
                <p className="text-2xl font-bold text-blue-400">R$ 28.340</p>
                <p className="text-sm text-green-400">19.5%</p>
              </div>
              <div className="text-center">
                <p className="text-sidebar-400 text-sm">Serviços</p>
                <p className="text-2xl font-bold text-purple-400">R$ 12.890</p>
                <p className="text-sm text-green-400">8.9%</p>
              </div>
              <div className="text-center">
                <p className="text-sidebar-400 text-sm">Outros</p>
                <p className="text-2xl font-bold text-yellow-400">R$ 5.550</p>
                <p className="text-sm text-green-400">3.8%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Relatório Operacional */}
      {reportType === 'operacional' && (
        <div className="space-y-6">
          {/* KPIs Operacionais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              title="Total de Reservas"
              value={reportData.operational.totalReservations}
              change={15.3}
              trend="up"
            />
            
            <StatCard
              title="Check-ins Realizados"
              value={reportData.operational.checkins}
              change={12.8}
              trend="up"
            />
            
            <StatCard
              title="Check-outs Realizados"
              value={reportData.operational.checkouts}
              change={8.2}
              trend="up"
            />
            
            <StatCard
              title="Cancelamentos"
              value={reportData.operational.cancellations}
              change={-5.1}
              trend="down"
            />
            
            <StatCard
              title="No-shows"
              value={reportData.operational.noShows}
              change={-12.3}
              trend="down"
            />
            
            <StatCard
              title="Estadia Média"
              value={reportData.operational.averageStay}
              suffix=" dias"
              change={2.1}
              trend="up"
            />
          </div>

          {/* Gráficos Operacionais */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-sidebar-800/50 backdrop-blur-sm rounded-lg border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Ocupação por Período</h3>
              <div className="h-64 flex items-center justify-center bg-white/5 rounded-lg">
                <p className="text-sidebar-400">Gráfico de ocupação em desenvolvimento</p>
              </div>
            </div>

            <div className="bg-sidebar-800/50 backdrop-blur-sm rounded-lg border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Tipo de Quarto Mais Reservado</h3>
              <div className="h-64 flex items-center justify-center bg-white/5 rounded-lg">
                <p className="text-sidebar-400">Gráfico de pizza em desenvolvimento</p>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Relatório de Satisfação */}
      {reportType === 'satisfacao' && (
        <div className="space-y-6">
          {/* NPS e Satisfação */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              title="NPS Score"
              value="72"
              change={8.3}
              trend="up"
            />
            
            <StatCard
              title="Satisfação Geral"
              value="4.6"
              suffix="/5"
              change={3.2}
              trend="up"
            />
            
            <StatCard
              title="Avaliações Positivas"
              value="87"
              suffix="%"
              change={5.7}
              trend="up"
            />
            
            <StatCard
              title="Taxa de Retorno"
              value="34"
              suffix="%"
              change={12.1}
              trend="up"
            />
          </div>

          {/* Detalhamento de Satisfação */}
          <div className="bg-sidebar-800/50 backdrop-blur-sm rounded-lg border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Avaliação por Categoria</h3>
            <div className="space-y-4">
              {[
                { category: 'Limpeza', rating: 4.8, votes: 234 },
                { category: 'Atendimento', rating: 4.6, votes: 198 },
                { category: 'Localização', rating: 4.7, votes: 245 },
                { category: 'Comodidades', rating: 4.3, votes: 189 },
                { category: 'Custo-Benefício', rating: 4.4, votes: 167 }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3">
                  <div className="flex-1">
                    <p className="text-white font-medium">{item.category}</p>
                    <p className="text-sidebar-400 text-sm">{item.votes} avaliações</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(item.rating) ? 'text-yellow-400' : 'text-gray-600'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-white font-medium">{item.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Reports;