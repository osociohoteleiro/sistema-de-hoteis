import { useState, useEffect } from 'react';
import { Plus, ChevronLeft, ChevronRight, User, Moon, DollarSign } from 'lucide-react';

const CalendarioFullCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showNewReservaModal, setShowNewReservaModal] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeType, setResizeType] = useState(null);
  const [resizingReserva, setResizingReserva] = useState(null);
  const [tempPosition, setTempPosition] = useState(null);
  
  const sidebarWidth = '18rem';

  // Dados dos quartos
  const quartos = [
    { id: 1, numero: '101', tipo: 'Standard' },
    { id: 2, numero: '201', tipo: 'Superior' },
    { id: 3, numero: '301', tipo: 'Deluxe' },
    { id: 4, numero: '401', tipo: 'Suíte' }
  ];

  // Dados das reservas
  const [reservas, setReservas] = useState([
    {
      id: 1,
      hospede: 'João Silva',
      quarto: '101',
      checkin: '03/09',
      checkout: '06/09',
      status: 'reservado',
      inicio: 2.5,
      duracao: 3,
      hospedes: 2
    },
    {
      id: 2,
      hospede: 'Maria Santos',
      quarto: '201',
      checkin: '04/09',
      checkout: '08/09',
      status: 'hospedado',
      inicio: 3.5,
      duracao: 4,
      hospedes: 1
    },
    {
      id: 3,
      hospede: 'Pedro Costa',
      quarto: '301',
      checkin: '05/09',
      checkout: '07/09',
      status: 'checkout',
      inicio: 4.5,
      duracao: 2,
      hospedes: 3
    }
  ]);

  // Cores por status
  const getStatusColor = (status) => {
    switch(status) {
      case 'reservado': return 'bg-blue-500';
      case 'hospedado': return 'bg-green-500';
      case 'checkout': return 'bg-orange-500';
      default: return 'bg-gray-400';
    }
  };

  // Navegação de mês
  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  // Redimensionamento
  const handleResizeStart = (e, reserva, type) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeType(type);
    setResizingReserva(reserva);
    setTempPosition({ inicio: reserva.inicio, duracao: reserva.duracao });
    console.log(`Iniciando redimensionamento ${type} para:`, reserva.hospede);
  };

  const handleResizeEnd = () => {
    if (isResizing && resizingReserva && tempPosition) {
      setReservas(prev => prev.map(r => 
        r.id === resizingReserva.id 
          ? { ...r, inicio: tempPosition.inicio, duracao: tempPosition.duracao }
          : r
      ));
      console.log('Redimensionamento concluído');
    }
    setIsResizing(false);
    setResizeType(null);
    setResizingReserva(null);
    setTempPosition(null);
  };

  useEffect(() => {
    const handleMouseUp = () => {
      if (isResizing) handleResizeEnd();
    };
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [isResizing]);

  return (
    <div className="flex flex-col h-full bg-slate-100">
      {/* Header do Calendário */}
      <div 
        className="bg-slate-200 border-b border-slate-300 fixed z-30 py-4 px-6"
        style={{
          top: '4rem',
          left: sidebarWidth,
          right: 0,
          width: `calc(100vw - ${sidebarWidth})`
        }}
      >
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-slate-800">Calendário</h1>
          
          <div className="flex items-center space-x-4">
            <button onClick={goToPreviousMonth} className="p-2 rounded-lg bg-white hover:bg-slate-50 border">
              <ChevronLeft size={16} />
            </button>
            <h2 className="text-lg font-semibold text-slate-700 min-w-[180px] text-center">
              {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={goToNextMonth} className="p-2 rounded-lg bg-white hover:bg-slate-50 border">
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            onClick={() => setShowNewReservaModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={16} />
            <span>Nova Reserva</span>
          </button>
        </div>
      </div>

      {/* Header dos Dias */}
      <div 
        className="bg-slate-300 border-b border-slate-400 sticky z-20"
        style={{ top: '8rem' }}
      >
        <div className="flex">
          <div className="w-48 flex-shrink-0 p-3 border-r border-slate-400 bg-slate-400 font-semibold text-slate-800">
            Quartos
          </div>
          <div className="flex-1 flex">
            {Array.from({ length: 15 }, (_, i) => {
              const today = new Date();
              const startDate = new Date(today);
              startDate.setDate(today.getDate() - 2);
              
              const date = new Date(startDate);
              date.setDate(date.getDate() + i);
              
              const isToday = date.toDateString() === today.toDateString();
              
              return (
                <div
                  key={i}
                  className={`flex-1 p-2 text-center text-sm font-medium border-r border-slate-400 ${
                    isToday ? 'bg-blue-500 text-white' : 'bg-slate-300 text-slate-700'
                  }`}
                >
                  <div className="text-xs">
                    {date.toLocaleDateString('pt-BR', { weekday: 'short' })}
                  </div>
                  <div className="font-bold">
                    {date.getDate()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 overflow-auto" style={{ paddingTop: '8rem' }}>
        <div className="bg-white">
          {quartos.map(quarto => {
            const reservasDoQuarto = reservas.filter(r => r.quarto === quarto.numero);
            
            return (
              <div key={quarto.id} className="flex border-b border-slate-200 h-20">
                {/* Coluna do Quarto */}
                <div className="w-48 flex-shrink-0 p-4 border-r border-slate-200 bg-slate-50 flex items-center">
                  <div>
                    <h3 className="font-semibold text-slate-800">{quarto.numero}</h3>
                    <p className="text-sm text-slate-600">{quarto.tipo}</p>
                  </div>
                </div>

                {/* Timeline */}
                <div className="flex-1 relative">
                  {/* Grid de dias */}
                  <div className="absolute inset-0 flex">
                    {Array.from({ length: 15 }, (_, i) => (
                      <div
                        key={i}
                        className="flex-1 h-full border-r border-slate-200 hover:bg-blue-50 cursor-pointer"
                        onClick={() => setShowNewReservaModal(true)}
                      />
                    ))}
                  </div>
                  
                  {/* Reservas */}
                  {reservasDoQuarto.map(reserva => {
                    const currentInicio = (isResizing && resizingReserva?.id === reserva.id) ? 
                                        tempPosition?.inicio : reserva.inicio;
                    const currentDuracao = (isResizing && resizingReserva?.id === reserva.id) ? 
                                         tempPosition?.duracao : reserva.duracao;
                    
                    const leftPercent = (currentInicio / 15) * 100;
                    const widthPercent = (currentDuracao / 15) * 100;

                    return (
                      <div
                        key={reserva.id}
                        className={`absolute text-white text-xs p-2 cursor-move shadow-lg rounded ${getStatusColor(reserva.status)} hover:shadow-xl ${
                          isResizing && resizingReserva?.id === reserva.id ? 'z-50 ring-2 ring-blue-400' : ''
                        }`}
                        style={{
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          minWidth: '80px',
                          height: '36px',
                          clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)'
                        }}
                        title={`${reserva.hospede} - ${reserva.quarto}\n${reserva.checkin} - ${reserva.checkout}`}
                      >
                        {/* Alça esquerda */}
                        <div
                          className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize bg-white bg-opacity-30 hover:bg-opacity-50"
                          onMouseDown={(e) => handleResizeStart(e, reserva, 'start')}
                          title="Redimensionar início"
                        />
                        
                        {/* Conteúdo */}
                        <div className="px-2 flex items-center justify-between h-full">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium leading-tight truncate">
                              {reserva.hospede}
                            </div>
                            <div className="text-[10px] opacity-90">
                              {reserva.checkin} - {reserva.checkout}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1 ml-2">
                            <User size={10} className="opacity-80" />
                            <span className="text-[10px]">{reserva.hospedes}</span>
                            <Moon size={10} className="opacity-80" />
                            <span className="text-[10px]">{currentDuracao}</span>
                          </div>
                        </div>

                        {/* Alça direita */}
                        <div
                          className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-white bg-opacity-30 hover:bg-opacity-50"
                          onMouseDown={(e) => handleResizeStart(e, reserva, 'end')}
                          title="Redimensionar fim"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legenda */}
      <div className="bg-slate-200 border-t border-slate-300 p-3">
        <div className="flex justify-center">
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
              <span>Reservado</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
              <span>Hospedado</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-orange-500 rounded-sm"></div>
              <span>Check-out</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Nova Reserva */}
      {showNewReservaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">Nova Reserva</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Hóspede</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="Nome do hóspede" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Check-in</label>
                  <input 
                    type="date" 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Check-out</label>
                  <input 
                    type="date" 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Quarto</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Selecionar quarto</option>
                  {quartos.map(quarto => (
                    <option key={quarto.id} value={quarto.numero}>
                      {quarto.numero} - {quarto.tipo}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowNewReservaModal(false)}
                className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => setShowNewReservaModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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

export default CalendarioFullCalendar;