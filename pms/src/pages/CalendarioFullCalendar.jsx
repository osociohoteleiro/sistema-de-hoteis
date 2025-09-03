import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import { Plus } from 'lucide-react';

const CalendarioFullCalendar = () => {
  const [selectedReserva, setSelectedReserva] = useState(null);
  const [showNewReservaModal, setShowNewReservaModal] = useState(false);

  // Dados de recursos (quartos) com status extendido
  const resources = [
    // Standard
    { id: '101', title: '101', category: 'Standard', extendedProps: { status: 'livre' } },
    { id: '102', title: '102', category: 'Standard', extendedProps: { status: 'livre' } },
    { id: '103', title: '103', category: 'Standard', extendedProps: { status: 'ocupado' } },
    { id: '104', title: '104', category: 'Standard', extendedProps: { status: 'livre' } },
    { id: '105', title: '105', category: 'Standard', extendedProps: { status: 'manutencao' } },
    
    // Superior
    { id: '201', title: '201', category: 'Superior', extendedProps: { status: 'livre' } },
    { id: '202', title: '202', category: 'Superior', extendedProps: { status: 'ocupado' } },
    { id: '203', title: '203', category: 'Superior', extendedProps: { status: 'livre' } },
    { id: '204', title: '204', category: 'Superior', extendedProps: { status: 'livre' } },
    
    // Deluxe
    { id: '301', title: '301', category: 'Deluxe', extendedProps: { status: 'livre' } },
    { id: '302', title: '302', category: 'Deluxe', extendedProps: { status: 'livre' } },
    { id: '303', title: '303', category: 'Deluxe', extendedProps: { status: 'ocupado' } },
    
    // Suíte
    { id: '401', title: '401', category: 'Suíte', extendedProps: { status: 'livre' } },
    { id: '402', title: '402', category: 'Suíte', extendedProps: { status: 'livre' } }
  ];

  // Dados de eventos (reservas) - demonstrando encaixe perfeito
  const events = [
    {
      id: '1',
      resourceId: '101',
      title: 'João Silva',
      start: '2025-09-03T12:00:00', // Meio do dia 3
      end: '2025-09-06T12:00:00',   // Meio do dia 6
      backgroundColor: '#3B82F6',
      borderColor: '#1E40AF',
      extendedProps: {
        status: 'confirmada',
        pax: 2,
        hospede: 'João Silva'
      }
    },
    {
      id: '2',
      resourceId: '101', // Mesmo quarto - reserva adjacente
      title: 'Carlos Lima',
      start: '2025-09-06T14:00:00', // Check-in às 14h (padrão hoteleiro)
      end: '2025-09-09T12:00:00',   // Check-out às 12h
      backgroundColor: '#F59E0B',
      borderColor: '#D97706',
      extendedProps: {
        status: 'confirmada',
        pax: 1,
        hospede: 'Carlos Lima'
      }
    },
    {
      id: '3',
      resourceId: '201',
      title: 'Maria Santos',
      start: '2025-09-02T12:00:00', // Meio do dia 2
      end: '2025-09-05T12:00:00',   // Meio do dia 5
      backgroundColor: '#10B981',
      borderColor: '#047857',
      extendedProps: {
        status: 'checkedin',
        pax: 1,
        hospede: 'Maria Santos'
      }
    },
    {
      id: '4',
      resourceId: '201', // Mesmo quarto - reserva adjacente  
      title: 'Ana Paula',
      start: '2025-09-05T14:00:00', // Check-in às 14h
      end: '2025-09-08T12:00:00',   // Check-out às 12h
      backgroundColor: '#EF4444',
      borderColor: '#DC2626',
      extendedProps: {
        status: 'confirmada',
        pax: 2,
        hospede: 'Ana Paula'
      }
    },
    {
      id: '5',
      resourceId: '301',
      title: 'Pedro Costa',
      start: '2025-09-04T12:00:00', // Meio do dia 4
      end: '2025-09-07T12:00:00',   // Meio do dia 7
      backgroundColor: '#8B5CF6',
      borderColor: '#6D28D9',
      extendedProps: {
        status: 'confirmada',
        pax: 3,
        hospede: 'Pedro Costa'
      }
    }
  ];

  const handleEventClick = (clickInfo) => {
    setSelectedReserva({
      id: clickInfo.event.id,
      title: clickInfo.event.title,
      start: clickInfo.event.start,
      end: clickInfo.event.end,
      resource: clickInfo.event.getResources()[0],
      ...clickInfo.event.extendedProps
    });
  };

  const handleDateSelect = (selectInfo) => {
    const title = prompt('Digite o nome do hóspede:');
    if (title) {
      const newEvent = {
        id: Date.now().toString(),
        title,
        start: selectInfo.start,
        end: selectInfo.end,
        resourceId: selectInfo.resource.id,
        backgroundColor: '#3B82F6',
        borderColor: '#1E40AF'
      };
      
      // Aqui você adicionaria o evento ao estado
      console.log('Nova reserva:', newEvent);
    }
    selectInfo.view.calendar.unselect();
  };

  const handleEventDrop = (dropInfo) => {
    console.log('Reserva movida:', {
      id: dropInfo.event.id,
      newStart: dropInfo.event.start,
      newEnd: dropInfo.event.end,
      newResource: dropInfo.newResource?.id
    });
  };

  const renderEventContent = (eventInfo) => {
    const { extendedProps } = eventInfo.event;
    
    return {
      html: `
        <div class="h-full flex flex-col justify-center items-center px-2 py-1">
          <div class="font-semibold text-xs text-white truncate text-center w-full">
            ${eventInfo.event.title}
          </div>
          ${extendedProps.pax ? 
            `<div class="text-xs text-white/80 text-center">${extendedProps.pax} pax</div>` : 
            ''
          }
        </div>
      `
    };
  };

  return (
    <div className="flex flex-col h-full bg-slate-100">
      <style jsx global>{`
        /* ENCAIXE PERFEITO: Cards que se conectam no meio das células */
        
        /* Estilo padrão limpo para timeline events */
        .fc-timeline-event {
          border-radius: 6px !important;
          height: 70% !important;
          top: 15% !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
          transition: all 0.2s ease !important;
        }
        
        /* Hover suave */
        .fc-timeline-event:hover {
          transform: scale(1.02) !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.25) !important;
          z-index: 100 !important;
        }
        
        /* Conteúdo do card */
        .fc-timeline-event .fc-event-main {
          padding: 8px !important;
          text-align: center !important;
          border: none !important;
          height: 100% !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          border-radius: 6px !important;
        }
        
        /* Título limpo */
        .fc-event-title {
          font-weight: 600 !important;
          font-size: 0.8rem !important;
          color: white !important;
          line-height: 1.2 !important;
          text-shadow: 0 1px 2px rgba(0,0,0,0.5) !important;
        }
        
        /* Indicadores de meio dia nas extremidades */
        .fc-timeline-event::before {
          content: '';
          position: absolute;
          left: -10px;
          top: 50%;
          width: 6px;
          height: 6px;
          background: rgba(255,255,255,0.9);
          border-radius: 50%;
          transform: translateY(-50%);
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          z-index: 10;
        }
        
        .fc-timeline-event::after {
          content: '';
          position: absolute;
          right: -10px;
          top: 50%;
          width: 6px;
          height: 6px;
          background: rgba(255,255,255,0.9);
          border-radius: 50%;
          transform: translateY(-50%);
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          z-index: 10;
        }
        
        /* Linha sutil nas extremidades para indicar conexão */
        .fc-timeline-event {
          position: relative !important;
        }
        
        .fc-timeline-event::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 2px;
          background: rgba(255,255,255,0.6);
          border-radius: 1px 0 0 1px;
        }
        
        .fc-timeline-event::after {
          content: '';
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 2px;
          background: rgba(255,255,255,0.6);
          border-radius: 0 1px 1px 0;
        }
        
        /* Texto legível */
        .fc-timeline-event .event-content * {
          color: white !important;
          text-shadow: 0 1px 2px rgba(0,0,0,0.5) !important;
        }
      `}</style>
      {/* Header */}
      <div className="bg-slate-200 border-b border-slate-300 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-800">Calendário de Reservas</h1>
          
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
                <div className="w-2 h-2 bg-purple-500 rounded"></div>
                <span className="text-slate-700">Deluxe</span>
              </div>
            </div>
            
            <button
              onClick={() => setShowNewReservaModal(true)}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center space-x-1"
            >
              <Plus size={16} />
              <span>Nova Reserva</span>
            </button>
          </div>
        </div>
      </div>

      {/* FullCalendar */}
      <div className="flex-1 p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, resourceTimelinePlugin, interactionPlugin]}
          initialView="resourceTimelineMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'resourceTimelineMonth,resourceTimelineWeek'
          }}
          resources={resources}
          events={events}
          editable={true}
          selectable={true}
          selectMirror={true}
          eventClick={handleEventClick}
          select={handleDateSelect}
          eventDrop={handleEventDrop}
          eventContent={renderEventContent}
          height="auto"
          locale="pt-br"
          resourceAreaHeaderContent="Quartos"
          resourceLabelText="Quarto"
          slotDuration="1day"
          slotLabelFormat={{
            day: '2-digit',
            month: 'short'
          }}
          resourceOrder="category,title"
          resourceGroupField="category"
          schedulerLicenseKey="CC-Attribution-NonCommercial-NoDerivatives"
          resourceAreaColumns={[
            {
              field: 'title',
              headerContent: 'Quarto'
            },
            {
              field: 'category',
              headerContent: 'Categoria'
            },
            {
              field: 'status',
              headerContent: 'Status',
              render: (resource) => {
                const statusColors = {
                  'livre': 'bg-green-100 text-green-800',
                  'ocupado': 'bg-red-100 text-red-800',
                  'manutencao': 'bg-yellow-100 text-yellow-800'
                };
                const statusTexts = {
                  'livre': 'Livre',
                  'ocupado': 'Ocupado', 
                  'manutencao': 'Manutenção'
                };
                return (
                  `<span class="px-2 py-1 rounded-full text-xs ${statusColors[resource.extendedProps.status]}">
                    ${statusTexts[resource.extendedProps.status]}
                  </span>`
                );
              }
            }
          ]}
          slotMinWidth={80}
          resourceAreaWidth="300px"
          eventMinHeight={50}
          eventMaxStack={3}
          eventOverlap={false}
          eventResourceEditable={true}
          eventDurationEditable={true}
        />
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
                  {resources.map(resource => (
                    <option key={resource.id} value={resource.id}>
                      {resource.title} - {resource.category}
                    </option>
                  ))}
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

export default CalendarioFullCalendar;