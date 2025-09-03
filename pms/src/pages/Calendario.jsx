import { useState, useMemo, useCallback } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  Plus, 
  Filter,
  Search,
  User,
  Calendar,
  Clock,
  MapPin,
  Users,
  Edit,
  Trash2
} from 'lucide-react';

const Calendario = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedReserva, setSelectedReserva] = useState(null);
  const [showNewReservaModal, setShowNewReservaModal] = useState(false);
  const [draggedReserva, setDraggedReserva] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({
    'Standard': true,
    'Superior': true, 
    'Deluxe': true,
    'Suíte': true
  });

  // Gerar 30 dias a partir da data atual
  const getDays = () => {
    const days = [];
    const startDate = new Date(currentDate);
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const days = getDays();

  // Dados organizados por categorias
  const categorias = [
    {
      nome: 'Standard',
      cor: '#3B82F6',
      quartos: [
        { id: 101, numero: '101', status: 'livre' },
        { id: 102, numero: '102', status: 'livre' },
        { id: 103, numero: '103', status: 'ocupado' },
        { id: 104, numero: '104', status: 'livre' },
        { id: 105, numero: '105', status: 'manutencao' },
      ]
    },
    {
      nome: 'Superior',
      cor: '#10B981', 
      quartos: [
        { id: 201, numero: '201', status: 'livre' },
        { id: 202, numero: '202', status: 'ocupado' },
        { id: 203, numero: '203', status: 'livre' },
        { id: 204, numero: '204', status: 'livre' },
      ]
    },
    {
      nome: 'Deluxe',
      cor: '#8B5CF6',
      quartos: [
        { id: 301, numero: '301', status: 'livre' },
        { id: 302, numero: '302', status: 'livre' },
        { id: 303, numero: '303', status: 'ocupado' },
      ]
    },
    {
      nome: 'Suíte',
      cor: '#F59E0B',
      quartos: [
        { id: 401, numero: '401', status: 'livre' },
        { id: 402, numero: '402', status: 'livre' },
      ]
    }
  ];

  // Dados de reservas - timeline horizontal
  const [reservas, setReservas] = useState([
    {
      id: 1,
      quartoId: 101,
      hospede: 'João Silva',
      checkIn: '2025-09-03',
      checkOut: '2025-09-06',
      status: 'confirmada',
      pax: 2,
      cor: '#3B82F6'
    },
    {
      id: 2,
      quartoId: 201,
      hospede: 'Maria Santos', 
      checkIn: '2025-09-02',
      checkOut: '2025-09-08',
      status: 'checkedin',
      pax: 1,
      cor: '#10B981'
    },
    {
      id: 3,
      quartoId: 301,
      hospede: 'Pedro Costa',
      checkIn: '2025-09-05',
      checkOut: '2025-09-12',
      status: 'confirmada', 
      pax: 3,
      cor: '#8B5CF6'
    },
    {
      id: 4,
      quartoId: 103,
      hospede: 'Ana Paula',
      checkIn: '2025-09-01',
      checkOut: '2025-09-04',
      status: 'checkedin',
      pax: 2,
      cor: '#3B82F6'
    }
  ]);

  const getStatusBadge = (status) => {
    const badges = {
      'confirmada': { text: 'Confirmada', class: 'bg-blue-100 text-blue-800' },
      'checkedin': { text: 'Check-in', class: 'bg-green-100 text-green-800' },
      'checkout': { text: 'Check-out', class: 'bg-gray-100 text-gray-800' },
      'cancelada': { text: 'Cancelada', class: 'bg-red-100 text-red-800' }
    };
    return badges[status] || badges.confirmada;
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const formatDateDisplay = (date) => {
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit',
      month: 'short'
    });
  };

  const calculateReservaPosition = (reserva, dayWidth) => {
    const checkInDate = new Date(reserva.checkIn);
    const checkOutDate = new Date(reserva.checkOut);
    const firstDay = days[0];
    
    const startDiff = Math.floor((checkInDate - firstDay) / (1000 * 60 * 60 * 24));
    const duration = Math.floor((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    
    // As posições são relativas à área da timeline (após a coluna dos quartos)
    return {
      left: Math.max(startDiff * dayWidth, 0),
      width: Math.max(duration * dayWidth, dayWidth * 0.3), // Mínimo de 30% de um dia
      visible: startDiff < 30 && startDiff + duration > 0
    };
  };

  const navigateDays = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction * 7)); // Navega por semana
    setCurrentDate(newDate);
  };

  const toggleCategory = (categoriaNome) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoriaNome]: !prev[categoriaNome]
    }));
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <div className="flex flex-col h-full bg-slate-100">
      {/* Timeline Scheduler */}
      <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
        
        {/* Header com Mês e Datas */}
        <div className="bg-slate-200 border-b border-slate-300">
          {/* Linha do Mês */}
          <div className="flex border-b border-slate-300">
            <div className="w-48 bg-slate-300 border-r border-slate-400 p-2 flex items-center justify-center font-semibold text-slate-800 text-sm">
              Quartos
            </div>
            <div className="flex-1 p-2 flex items-center justify-between bg-slate-200">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateDays(-1)}
                  className="px-2 py-1 text-xs bg-slate-300 text-slate-800 rounded hover:bg-slate-400 transition-colors"
                >
                  ← Anterior
                </button>
                <div className="font-semibold text-slate-900 text-sm">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </div>
                <button
                  onClick={() => navigateDays(1)}
                  className="px-2 py-1 text-xs bg-slate-300 text-slate-800 rounded hover:bg-slate-400 transition-colors"
                >
                  Próximo →
                </button>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* Legenda */}
                <div className="flex items-center space-x-2 text-xs">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded"></div>
                    <span className="text-slate-700">Confirmada</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded"></div>
                    <span className="text-slate-700">Check-in</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded"></div>
                    <span className="text-slate-700">Check-out</span>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowNewReservaModal(true)}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center space-x-1"
                >
                  <Plus size={12} />
                  <span>Nova Reserva</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Linha das Datas */}
          <div className="flex">
            <div className="w-48 bg-slate-300 border-r border-slate-400 p-2 text-xs text-slate-700 text-center">
              Categoria / Número
            </div>
            <div className="flex flex-1">
              {days.map((date, index) => {
                const isToday = formatDate(date) === formatDate(new Date());
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                
                return (
                  <div 
                    key={index}
                    className={`flex-1 min-w-[40px] p-2 text-center text-xs border-r border-slate-300 ${
                      isToday ? 'bg-blue-100 text-blue-700 font-semibold' : 
                      isWeekend ? 'bg-slate-200 text-slate-600' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="font-medium">{date.getDate()}</div>
                    <div className="text-xs opacity-70">
                      {formatDateDisplay(date).split(' ')[1]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Grid de Quartos e Reservas por Categoria */}
        <div className="flex-1 overflow-y-auto">
          {categorias.map((categoria) => (
            <div key={categoria.nome}>
              {/* Header da Categoria */}
              <div className="bg-slate-300 border-b border-slate-400 sticky top-0 z-20">
                <div className="flex items-center h-10">
                  {/* Botão da Categoria */}
                  <button
                    onClick={() => toggleCategory(categoria.nome)}
                    className="w-48 border-r border-slate-400 px-3 py-2 flex items-center space-x-2 hover:bg-slate-400 transition-colors text-left"
                  >
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: categoria.cor }}
                    ></div>
                    <div className="flex-1 font-semibold text-slate-800 text-sm">
                      {categoria.nome}
                    </div>
                    <div className="text-xs text-slate-600 mr-2">
                      {categoria.quartos.length}
                    </div>
                    {expandedCategories[categoria.nome] ? (
                      <ChevronUp size={16} className="text-slate-700" />
                    ) : (
                      <ChevronDown size={16} className="text-slate-700" />
                    )}
                  </button>
                  
                  {/* Linha da Timeline da Categoria */}
                  <div className="flex-1 bg-slate-300"></div>
                </div>
              </div>

              {/* Quartos da Categoria */}
              {expandedCategories[categoria.nome] && categoria.quartos.map((quarto, index) => {
                const quartoReservas = reservas.filter(r => r.quartoId === quarto.id);
                const dayWidth = 100 / 30;
                
                return (
                  <div 
                    key={quarto.id}
                    className={`flex border-b border-slate-200 min-h-[60px] relative ${
                      index % 2 === 0 ? 'bg-slate-50' : 'bg-slate-100'
                    } hover:bg-blue-100/30 transition-colors`}
                  >
                    {/* Coluna do Quarto */}
                    <div className="w-48 border-r border-slate-300 p-3 flex items-center space-x-3">
                      <div className="w-4 h-4 flex-shrink-0"></div> {/* Espaço para alinhamento */}
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900">{quarto.numero}</div>
                        <div className="text-xs text-slate-600">{categoria.nome}</div>
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        quarto.status === 'livre' ? 'bg-green-200 text-green-800' :
                        quarto.status === 'ocupado' ? 'bg-red-200 text-red-800' :
                        'bg-yellow-200 text-yellow-800'
                      }`}>
                        {quarto.status === 'livre' ? 'Livre' : 
                         quarto.status === 'ocupado' ? 'Ocupado' : 'Manutenção'}
                      </div>
                    </div>

                    {/* Timeline de Reservas */}
                    <div className="flex-1 relative">
                      {/* Grid de Dias (invisível, para clique) */}
                      <div className="absolute inset-0 flex">
                        {days.map((date, dayIndex) => (
                          <div 
                            key={dayIndex}
                            className="flex-1 min-w-[40px] hover:bg-blue-200/40 transition-colors cursor-pointer border-r border-slate-200"
                            onClick={() => {
                              console.log(`Criar reserva para quarto ${quarto.numero} em ${formatDate(date)}`);
                            }}
                            title={`Criar reserva para ${quarto.numero} - ${formatDateDisplay(date)}`}
                          />
                        ))}
                      </div>

                      {/* Reservas como blocos */}
                      {quartoReservas.map(reserva => {
                        const position = calculateReservaPosition(reserva, dayWidth);
                        if (!position.visible) return null;

                        const statusBadge = getStatusBadge(reserva.status);
                        
                        return (
                          <div
                            key={reserva.id}
                            className={`absolute top-2 bottom-2 rounded-lg shadow-sm border-l-4 cursor-pointer hover:shadow-md transition-all z-10 ${
                              reserva.status === 'confirmada' ? 'bg-blue-100 border-blue-400' :
                              reserva.status === 'checkedin' ? 'bg-green-100 border-green-400' :
                              'bg-gray-100 border-gray-400'
                            }`}
                            style={{
                              left: `${position.left}%`,
                              width: `${position.width}%`
                            }}
                            onClick={() => setSelectedReserva(reserva)}
                            title={`${reserva.hospede} - ${reserva.checkIn} à ${reserva.checkOut}`}
                          >
                            <div className="p-2 h-full flex flex-col justify-center">
                              <div className="text-xs font-semibold text-slate-800 truncate">
                                {reserva.hospede}
                              </div>
                              <div className="text-xs text-slate-600">
                                {reserva.pax} pax
                              </div>
                              <div className={`text-xs px-1 py-0.5 rounded mt-1 ${statusBadge.class} w-fit`}>
                                {statusBadge.text}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>


      {/* Modal Nova Reserva */}
      {showNewReservaModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">Nova Reserva</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Hóspede</label>
                <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nome do hóspede" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Check-in</label>
                  <input type="date" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Check-out</label>
                  <input type="date" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Quarto</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Selecionar quarto</option>
                  {categorias.map(categoria => 
                    categoria.quartos.map(quarto => (
                      <option key={quarto.id} value={quarto.id}>
                        {quarto.numero} - {categoria.nome}
                      </option>
                    ))
                  )}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Pax</label>
                <input type="number" min="1" max="6" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Número de pessoas" />
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowNewReservaModal(false)}
                className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => setShowNewReservaModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Criar Reserva
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendario;