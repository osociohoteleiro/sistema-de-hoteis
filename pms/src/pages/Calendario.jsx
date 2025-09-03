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
  const [dragOverCell, setDragOverCell] = useState(null);
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

  const getDayOfWeek = (date) => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return days[date.getDay()];
  };

  const calculateReservaPosition = (reserva, dayWidth) => {
    const checkInDate = new Date(reserva.checkIn);
    const checkOutDate = new Date(reserva.checkOut);
    const firstDay = days[0];
    
    // Calcular dias de ocupação (estilo Gantt)
    const startDay = Math.floor((checkInDate - firstDay) / (1000 * 60 * 60 * 24));
    const endDay = Math.floor((checkOutDate - firstDay) / (1000 * 60 * 60 * 24));
    
    // REGRA GANTT: Check-out não ocupa a noite de saída
    const occupiedDays = endDay - startDay; // Não inclui o dia de check-out
    
    // POSIÇÃO CENTRALIZADA: Cards ficam no meio das células
    // Margem de 5% de cada lado para centralizar o card
    const cardMargin = 0.05; // 5% de margem
    const leftPosition = startDay + cardMargin;           // 5% dentro da primeira célula
    const widthInDays = occupiedDays - (2 * cardMargin);  // Largura com margens
    
    return {
      left: leftPosition * dayWidth,
      width: Math.max(widthInDays * dayWidth, dayWidth * 0.1), // Mínimo 10% de largura
      visible: startDay < 30 && endDay > 0,
      occupiedDays: occupiedDays
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

  // Funções de Drag and Drop
  const handleDragStart = (e, reserva) => {
    setDraggedReserva(reserva);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedReserva(null);
    setDragOverCell(null);
  };

  const handleDragOver = (e, quartoId, date) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCell({ quartoId, date: formatDate(date) });
  };

  const handleDragLeave = (e) => {
    // Só limpa se realmente saiu da célula
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverCell(null);
    }
  };

  const handleDrop = (e, quartoId, date) => {
    e.preventDefault();
    
    if (!draggedReserva) return;

    const targetDate = formatDate(date);
    const checkInDate = new Date(draggedReserva.checkIn);
    const checkOutDate = new Date(draggedReserva.checkOut);
    const duration = Math.floor((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

    // Calcular nova data de check-out
    const newCheckOut = new Date(date);
    newCheckOut.setDate(newCheckOut.getDate() + duration);

    // Verificar conflitos estilo Gantt (check-out libera o dia)
    const conflictingReservations = reservas.filter(r => {
      if (r.id === draggedReserva.id || r.quartoId !== quartoId) return false;
      
      const rCheckIn = new Date(r.checkIn).getTime();
      const rCheckOut = new Date(r.checkOut).getTime();
      const newCheckInTime = new Date(targetDate).getTime();
      const newCheckOutTime = newCheckOut.getTime();
      
      // Conflito apenas se houver sobreposição real de períodos de ocupação
      // Check-out no mesmo dia de check-in é permitido (regra Gantt)
      return (
        (rCheckIn < newCheckOutTime && rCheckOut > newCheckInTime)
      );
    });

    if (conflictingReservations.length > 0) {
      alert('Não é possível mover a reserva. O quarto já possui reserva neste período.');
      setDragOverCell(null);
      return;
    }

    // Atualizar a reserva
    setReservas(prev => prev.map(r => 
      r.id === draggedReserva.id 
        ? {
            ...r,
            quartoId,
            checkIn: targetDate,
            checkOut: formatDate(newCheckOut)
          }
        : r
    ));

    setDragOverCell(null);
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <div className="flex flex-col h-full bg-slate-100">
      <style jsx>{`
        .gantt-bar {
          position: relative;
          border-left: none;
          border-right: none;
        }
        .gantt-bar::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: inherit;
          z-index: -1;
        }
        .gantt-bar:hover {
          filter: brightness(0.9);
          transform: scaleY(1.05);
        }
        /* Efeito de transição suave entre reservas */
        .gantt-bar + .gantt-bar {
          margin-left: 0;
        }
      `}</style>
      {/* Layout Principal: Sidebar + Timeline */}
      <div className="flex-1 flex bg-slate-50 overflow-hidden">
        
        {/* Sidebar de Quartos */}
        <div className="w-48 bg-slate-300 border-r border-slate-400 flex flex-col">
          {/* Header da Sidebar */}
          <div className="p-2 border-b border-slate-400 bg-slate-300">
            <div className="font-semibold text-slate-800 text-sm text-center">
              Quartos
            </div>
            <div className="text-xs text-slate-700 text-center mt-1">
              Categoria / Número
            </div>
          </div>
          
          {/* Lista de Quartos */}
          <div className="flex-1 overflow-y-auto">
            {categorias.map((categoria) => (
              <div key={categoria.nome}>
                {/* Header da Categoria */}
                <div className="bg-slate-400 border-b border-slate-500 sticky top-0 z-20">
                  <button
                    onClick={() => toggleCategory(categoria.nome)}
                    className="w-full p-3 flex items-center space-x-2 hover:bg-slate-500 transition-colors text-left"
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
                </div>

                {/* Quartos da Categoria */}
                {expandedCategories[categoria.nome] && categoria.quartos.map((quarto, index) => (
                  <div 
                    key={quarto.id}
                    className={`min-h-[60px] p-3 border-b border-slate-300 flex items-center space-x-3 ${
                      index % 2 === 0 ? 'bg-slate-200' : 'bg-slate-250'
                    } hover:bg-blue-100/30 transition-colors`}
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900 text-sm">{quarto.numero}</div>
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
                ))}
              </div>
            ))}
          </div>
        </div>
        
        {/* Área do Timeline */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header do Timeline */}
          <div className="bg-slate-200 border-b border-slate-300 flex flex-col">
            {/* Linha de Controles e Legenda */}
            <div className="p-2 flex items-center justify-between bg-slate-200">
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
            
            {/* Header das Datas */}
            <div className="flex border-t border-slate-300">
              {days.map((date, index) => {
                const isToday = formatDate(date) === formatDate(new Date());
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                
                return (
                  <div 
                    key={index}
                    className={`flex-1 min-w-[80px] p-2 text-center text-xs border-r border-slate-300 ${
                      isToday ? 'bg-blue-100 text-blue-700 font-semibold' : 
                      isWeekend ? 'bg-slate-200 text-slate-600' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="font-medium">{date.getDate()}</div>
                    <div className="text-xs opacity-70">
                      {getDayOfWeek(date)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline de Reservas */}
          <div className="flex-1 overflow-y-auto">
            {categorias.map((categoria) => (
              expandedCategories[categoria.nome] && categoria.quartos.map((quarto, index) => {
                const quartoReservas = reservas.filter(r => r.quartoId === quarto.id);
                const dayWidth = 100 / 30; // Cada dia ocupa 3.333% da timeline
                
                return (
                  <div 
                    key={quarto.id}
                    className={`min-h-[60px] relative border-b border-slate-200 ${
                      index % 2 === 0 ? 'bg-slate-50' : 'bg-slate-100'
                    } hover:bg-blue-100/30 transition-colors`}
                  >

                    {/* Timeline de Reservas */}
                    <div className="absolute inset-0">
                      {/* Grid de linhas verticais alinhadas com header */}
                      <div className="absolute inset-0">
                        {days.map((date, dayIndex) => {
                          const leftPosition = (dayIndex * 100) / 30; // Mesmo cálculo do dayWidth
                          return (
                            <div
                              key={`grid-${dayIndex}`}
                              className="absolute top-0 bottom-0 border-r border-slate-200"
                              style={{ left: `${leftPosition + (100/30)}%` }} // Linha no final de cada dia
                            />
                          );
                        })}
                      </div>
                      
                      {/* Área de clique invisível */}
                      <div className="absolute inset-0 flex">
                        {days.map((date, dayIndex) => {
                          const isDragOver = dragOverCell && 
                                           dragOverCell.quartoId === quarto.id && 
                                           dragOverCell.date === formatDate(date);
                          
                          return (
                            <div 
                              key={dayIndex}
                              className={`flex-1 min-w-[80px] transition-colors cursor-pointer ${
                                isDragOver 
                                  ? 'bg-green-200/60' 
                                  : 'hover:bg-blue-200/40'
                              }`}
                              onClick={() => {
                                console.log(`Criar reserva para quarto ${quarto.numero} em ${formatDate(date)}`);
                              }}
                              onDragOver={(e) => handleDragOver(e, quarto.id, date)}
                              onDragLeave={handleDragLeave}
                              onDrop={(e) => handleDrop(e, quarto.id, date)}
                              title={`Criar reserva para ${quarto.numero} - ${formatDateDisplay(date)}`}
                            />
                          );
                        })}
                      </div>

                      {/* Reservas como blocos */}
                      {quartoReservas.map(reserva => {
                        const position = calculateReservaPosition(reserva, dayWidth);
                        if (!position.visible) return null;

                        const statusBadge = getStatusBadge(reserva.status);
                        
                        return (
                          <div
                            key={reserva.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, reserva)}
                            onDragEnd={handleDragEnd}
                            className={`absolute top-2 bottom-2 shadow-md cursor-move hover:shadow-lg transition-all z-10 reserva-card gantt-bar ${
                              reserva.status === 'confirmada' ? 'bg-blue-300' :
                              reserva.status === 'checkedin' ? 'bg-green-300' :
                              'bg-gray-300'
                            } ${draggedReserva?.id === reserva.id ? 'opacity-50' : ''}`}
                            style={{
                              left: `${position.left}%`,
                              width: `${position.width}%`,
                              clipPath: 'polygon(2% 0%, 98% 0%, 100% 50%, 98% 100%, 2% 100%, 0% 50%)'
                            }}
                            onClick={() => setSelectedReserva(reserva)}
                            title={`${reserva.hospede} - ${reserva.checkIn} à ${reserva.checkOut} (Arraste para mover)`}
                          >
                            <div className="p-2 h-full flex flex-col justify-center relative">
                              <div className="text-xs font-semibold text-slate-900 truncate text-center">
                                {reserva.hospede}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            ))}
          </div>
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