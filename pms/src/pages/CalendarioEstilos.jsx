import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import { Plus, Palette } from 'lucide-react';

const CalendarioEstilos = () => {
  const [selectedStyle, setSelectedStyle] = useState('default');
  const [selectedReserva, setSelectedReserva] = useState(null);
  const [showStyleSelector, setShowStyleSelector] = useState(false);

  // Recursos (quartos)
  const resources = [
    { id: '101', title: '101', category: 'Standard', extendedProps: { status: 'livre' } },
    { id: '102', title: '102', category: 'Standard', extendedProps: { status: 'livre' } },
    { id: '103', title: '103', category: 'Standard', extendedProps: { status: 'ocupado' } },
    { id: '201', title: '201', category: 'Superior', extendedProps: { status: 'livre' } },
    { id: '202', title: '202', category: 'Superior', extendedProps: { status: 'ocupado' } },
    { id: '301', title: '301', category: 'Deluxe', extendedProps: { status: 'livre' } },
    { id: '401', title: '401', category: 'Suíte', extendedProps: { status: 'livre' } }
  ];

  // Eventos (reservas) com diferentes estilos
  const events = [
    {
      id: '1',
      resourceId: '101',
      title: 'João Silva',
      start: '2025-09-03T12:00:00',
      end: '2025-09-06T12:00:00',
      backgroundColor: '#3B82F6',
      borderColor: '#1E40AF',
      extendedProps: { status: 'confirmada', pax: 2 }
    },
    {
      id: '2',
      resourceId: '201',
      title: 'Maria Santos',
      start: '2025-09-02T12:00:00',
      end: '2025-09-08T12:00:00',
      backgroundColor: '#10B981',
      borderColor: '#047857',
      extendedProps: { status: 'checkedin', pax: 1 }
    },
    {
      id: '3',
      resourceId: '301',
      title: 'Pedro Costa',
      start: '2025-09-05T12:00:00',
      end: '2025-09-12T12:00:00',
      backgroundColor: '#8B5CF6',
      borderColor: '#6D28D9',
      extendedProps: { status: 'confirmada', pax: 3 }
    },
    {
      id: '4',
      resourceId: '103',
      title: 'Ana Paula',
      start: '2025-09-01T12:00:00',
      end: '2025-09-04T12:00:00',
      backgroundColor: '#F59E0B',
      borderColor: '#D97706',
      extendedProps: { status: 'checkedin', pax: 2 }
    },
    {
      id: '5',
      resourceId: '202',
      title: 'Carlos Lima',
      start: '2025-09-04T12:00:00',
      end: '2025-09-07T12:00:00',
      backgroundColor: '#EF4444',
      borderColor: '#DC2626',
      extendedProps: { status: 'checkout', pax: 4 }
    }
  ];

  // Estilos disponíveis
  const availableStyles = {
    default: {
      name: 'Padrão Retangular',
      description: 'Cards retangulares simples com cantos arredondados'
    },
    diamond: {
      name: 'Hexagonal/Losango',
      description: 'Formato diamante moderno e distintivo'
    },
    gradient: {
      name: 'Gradiente',
      description: 'Fundo com gradiente para efeito de profundidade'
    },
    bordered: {
      name: 'Bordas Destacadas',
      description: 'Cards com bordas grossas coloridas'
    },
    minimalist: {
      name: 'Minimalista',
      description: 'Apenas bordas laterais com fundo semi-transparente'
    },
    elevated: {
      name: 'Elevado',
      description: 'Cards com sombras e efeito 3D'
    },
    progress: {
      name: 'Barra de Progresso',
      description: 'Indicação visual do progresso da estadia'
    },
    glassmorphism: {
      name: 'Glassmorphism',
      description: 'Efeito de vidro fosco moderno'
    }
  };

  const renderEventContent = (eventInfo) => {
    const { extendedProps } = eventInfo.event;
    
    return {
      html: `
        <div class="event-content h-full flex flex-col justify-center items-center px-2 py-1">
          <div class="font-semibold text-xs text-white truncate text-center w-full">
            ${eventInfo.event.title}
          </div>
          ${extendedProps.pax ? 
            `<div class="text-xs text-white/80 text-center">${extendedProps.pax} pax</div>` : 
            ''
          }
          ${extendedProps.status ? 
            `<div class="status-badge text-xs mt-1">${extendedProps.status}</div>` : 
            ''
          }
        </div>
      `
    };
  };

  const getStyleCSS = (style) => {
    const baseStyles = `
      .fc-timeline-event {
        transition: all 0.3s ease !important;
        cursor: pointer !important;
        overflow: visible !important;
      }
      
      .fc-timeline-event:hover {
        transform: scale(1.02) !important;
        z-index: 999 !important;
      }
    `;

    switch (style) {
      case 'diamond':
        return baseStyles + `
          .fc-timeline-event {
            clip-path: polygon(15% 0%, 85% 0%, 100% 50%, 85% 100%, 15% 100%, 0% 50%) !important;
            margin: 15% 5% !important;
            height: 70% !important;
          }
        `;
      
      case 'gradient':
        return baseStyles + `
          .fc-timeline-event {
            background: linear-gradient(135deg, var(--fc-event-bg-color, #3B82F6), rgba(255,255,255,0.2)) !important;
            border: none !important;
            border-radius: 8px !important;
            margin: 10% 2% !important;
            height: 80% !important;
            box-shadow: 0 4px 8px rgba(0,0,0,0.15) !important;
          }
        `;
      
      case 'bordered':
        return baseStyles + `
          .fc-timeline-event {
            background: rgba(255,255,255,0.95) !important;
            border: none !important;
            border-left: 6px solid var(--fc-event-bg-color, #3B82F6) !important;
            border-right: 6px solid var(--fc-event-bg-color, #3B82F6) !important;
            border-radius: 4px !important;
            margin: 8% 1% !important;
            height: 84% !important;
            color: #374151 !important;
          }
          .fc-timeline-event .event-content {
            color: #374151 !important;
          }
          .fc-timeline-event .event-content .text-white {
            color: #374151 !important;
          }
        `;
      
      case 'minimalist':
        return baseStyles + `
          .fc-timeline-event {
            background: rgba(255,255,255,0.1) !important;
            border: none !important;
            border-left: 4px solid var(--fc-event-bg-color, #3B82F6) !important;
            border-right: 4px solid var(--fc-event-bg-color, #3B82F6) !important;
            border-radius: 2px !important;
            margin: 20% 3% !important;
            height: 60% !important;
            backdrop-filter: blur(5px) !important;
          }
        `;
      
      case 'elevated':
        return baseStyles + `
          .fc-timeline-event {
            border-radius: 12px !important;
            margin: 5% 1% !important;
            height: 90% !important;
            box-shadow: 0 8px 16px rgba(0,0,0,0.2) !important;
            border: none !important;
          }
          .fc-timeline-event:hover {
            box-shadow: 0 12px 24px rgba(0,0,0,0.3) !important;
            transform: scale(1.02) translateY(-2px) !important;
          }
        `;
      
      case 'progress':
        return baseStyles + `
          .fc-timeline-event {
            border-radius: 6px !important;
            margin: 8% 1% !important;
            height: 84% !important;
            position: relative !important;
            overflow: hidden !important;
          }
          .fc-timeline-event::before {
            content: '' !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            height: 4px !important;
            width: 60% !important;
            background: rgba(255,255,255,0.8) !important;
            z-index: 10 !important;
          }
          .fc-timeline-event::after {
            content: '' !important;
            position: absolute !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            height: 2px !important;
            background: rgba(0,0,0,0.2) !important;
          }
        `;
      
      case 'glassmorphism':
        return baseStyles + `
          .fc-timeline-event {
            background: rgba(255, 255, 255, 0.15) !important;
            backdrop-filter: blur(10px) !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
            border-radius: 12px !important;
            margin: 8% 2% !important;
            height: 84% !important;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
          }
          .fc-timeline-event:hover {
            background: rgba(255, 255, 255, 0.25) !important;
            border-color: rgba(255, 255, 255, 0.3) !important;
          }
        `;
      
      default:
        return baseStyles + `
          .fc-timeline-event {
            border-radius: 6px !important;
            margin: 8% 2% !important;
            height: 84% !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
          }
        `;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-100">
      <style jsx global>{getStyleCSS(selectedStyle)}</style>
      
      {/* Header */}
      <div className="bg-slate-200 border-b border-slate-300 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Demonstração de Estilos - Calendário PMS</h1>
            <p className="text-sm text-slate-600 mt-1">
              Estilo atual: <span className="font-medium">{availableStyles[selectedStyle].name}</span>
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Seletor de Estilos */}
            <div className="relative">
              <button
                onClick={() => setShowStyleSelector(!showStyleSelector)}
                className="px-3 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <Palette size={16} />
                <span>Estilos</span>
              </button>
              
              {showStyleSelector && (
                <div className="absolute right-0 top-12 bg-white border border-slate-300 rounded-lg shadow-lg z-50 w-80">
                  <div className="p-3 border-b border-slate-200">
                    <h3 className="font-semibold text-slate-800">Escolha um Estilo</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {Object.entries(availableStyles).map(([key, style]) => (
                      <button
                        key={key}
                        onClick={() => {
                          setSelectedStyle(key);
                          setShowStyleSelector(false);
                        }}
                        className={`w-full text-left p-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 ${
                          selectedStyle === key ? 'bg-purple-50 border-purple-200' : ''
                        }`}
                      >
                        <div className="font-medium text-slate-900">{style.name}</div>
                        <div className="text-sm text-slate-600 mt-1">{style.description}</div>
                        {selectedStyle === key && (
                          <div className="text-xs text-purple-600 mt-1">✓ Selecionado</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
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
                <div className="w-2 h-2 bg-red-500 rounded"></div>
                <span className="text-slate-700">Check-out</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FullCalendar */}
      <div className="flex-1 p-4">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 h-full">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, resourceTimelinePlugin, interactionPlugin]}
            initialView="resourceTimelineWeek"
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
            eventContent={renderEventContent}
            height="100%"
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
              }
            ]}
            slotMinWidth={100}
            resourceAreaWidth="250px"
            eventMinHeight={50}
            eventMaxStack={1}
            nowIndicator={true}
          />
        </div>
      </div>

      {/* Informações do Estilo Atual */}
      <div className="bg-slate-200 border-t border-slate-300 p-3">
        <div className="text-center">
          <div className="text-sm font-medium text-slate-800">
            {availableStyles[selectedStyle].name}
          </div>
          <div className="text-xs text-slate-600 mt-1">
            {availableStyles[selectedStyle].description}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarioEstilos;