import { useState, useEffect, useRef } from 'react';
import { Plus, Calendar, Users, Edit, Trash2, Settings, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, User, Moon, DollarSign } from 'lucide-react';

// Versão simplificada sem biblioteca externa por enquanto
// import GSTC from 'gantt-schedule-timeline-calendar';
// import 'gantt-schedule-timeline-calendar/dist/style.css';

const CalendarioFullCalendar = () => {
  const gstcRef = useRef(null);
  const [selectedReserva, setSelectedReserva] = useState(null);
  const [showNewReservaModal, setShowNewReservaModal] = useState(false);
  const [draggedReserva, setDraggedReserva] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [tempPosition, setTempPosition] = useState(null);
  const [dragMoved, setDragMoved] = useState(false); // Para detectar se houve movimento real
  const [currentDate, setCurrentDate] = useState(new Date()); // Estado para controlar a data atual
  const [isHeaderCompact, setIsHeaderCompact] = useState(false); // Estado para header compacto
  const [isDaysHeaderFixed, setIsDaysHeaderFixed] = useState(false); // Estado para header dos dias
  
  // Detectar se a sidebar está colapsada (assumindo expandida por padrão)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const sidebarWidth = sidebarCollapsed ? '5rem' : '18rem';

  // Mapeamento de cores por status
  const getStatusColor = (status) => {
    const statusColors = {
      'pre-reserva': 'bg-gray-300', // Cinza claro - aguardando confirmação
      'reservado': 'bg-blue-500', // Azul - confirmado
      'hospedado': 'bg-green-500', // Verde - ativo
      'checkin-nao-efetuado': 'bg-red-600', // Vermelho forte - alerta crítico
      'checkin-efetuado': 'bg-green-600', // Verde escuro - ok
      'checkout-nao-efetuado': 'bg-orange-600', // Laranja forte - alerta
      'checkout-efetuado': 'bg-gray-500' // Cinza - finalizado
    };
    return statusColors[status] || 'bg-gray-400';
  };

  // Função para obter cor do texto baseada no status
  const getTextColor = (status) => {
    return status === 'pre-reserva' ? 'text-gray-700' : 'text-white';
  };

  // Funções de navegação de data
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  // Função para formatar o mês atual
  const getCurrentMonthYear = () => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  };

  // Função para alternar categoria (expandir/colapsar)
  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Detectar scroll para ativar headers fixos
  useEffect(() => {
    const handleScroll = () => {
      // Obter o elemento main que tem o scroll
      const mainElement = document.querySelector('main');
      if (!mainElement) return;
      
      const scrollTop = mainElement.scrollTop;
      console.log('Scroll detectado:', scrollTop); // Debug
      
      const shouldBeCompact = scrollTop > 150;
      const shouldFixDaysHeader = scrollTop > 200; // Header dos dias fixa um pouco depois
      
      console.log('Header compacto:', shouldBeCompact, 'Days header fixo:', shouldFixDaysHeader); // Debug
      
      setIsHeaderCompact(shouldBeCompact);
      setIsDaysHeaderFixed(shouldFixDaysHeader);
    };

    console.log('Adicionando listener de scroll no main'); // Debug
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.addEventListener('scroll', handleScroll);
      return () => {
        console.log('Removendo listener de scroll'); // Debug
        mainElement.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);

  // Estado das reservas com procedência e status
  const [reservas, setReservas] = useState([
    { id: 1, nome: 'João Silva', quarto: '101', inicio: 1.5, duracao: 3, procedencia: 'Booking.com', status: 'reservado', hospedes: 2, noites: 3, valorTotal: 450, valorPago: 450, pagamentoPendente: false },
    { id: 2, nome: 'Carlos Lima da Silva Santos', quarto: '101', inicio: 4.5, duracao: 3, procedencia: 'WhatsApp', status: 'checkin-nao-efetuado', hospedes: 4, noites: 3, valorTotal: 750, valorPago: 200, pagamentoPendente: true },
    { id: 3, nome: 'Maria Santos', quarto: '201', inicio: 0.5, duracao: 3, procedencia: 'Airbnb', status: 'hospedado', hospedes: 1, noites: 3, valorTotal: 390, valorPago: 390, pagamentoPendente: false },
    { id: 4, nome: 'Ana Paula Ferreira dos Santos', quarto: '201', inicio: 3.5, duracao: 3, procedencia: 'Telefone', status: 'checkout-nao-efetuado', hospedes: 3, noites: 3, valorTotal: 600, valorPago: 300, pagamentoPendente: true },
    { id: 5, nome: 'Pedro Costa', quarto: '301', inicio: 2.5, duracao: 3, procedencia: 'Site Direto', status: 'pre-reserva', hospedes: 2, noites: 3, valorTotal: 480, valorPago: 0, pagamentoPendente: true }
  ]);

  // Estrutura de categorias de quartos
  const [categorias] = useState([
    {
      id: 'economico',
      nome: 'Econômico',
      cor: '#64748B',
      quartos: [
        { id: '001', numero: '001', status: 'disponivel' },
        { id: '002', numero: '002', status: 'ocupado' },
        { id: '003', numero: '003', status: 'disponivel' },
        { id: '004', numero: '004', status: 'limpeza' },
        { id: '005', numero: '005', status: 'disponivel' },
        { id: '006', numero: '006', status: 'manutencao' },
        { id: '007', numero: '007', status: 'disponivel' },
        { id: '008', numero: '008', status: 'disponivel' }
      ]
    },
    {
      id: 'standard',
      nome: 'Standard',
      cor: '#3B82F6',
      quartos: [
        { id: '101', numero: '101', status: 'disponivel' },
        { id: '102', numero: '102', status: 'ocupado' },
        { id: '103', numero: '103', status: 'manutencao' },
        { id: '104', numero: '104', status: 'disponivel' },
        { id: '105', numero: '105', status: 'limpeza' },
        { id: '106', numero: '106', status: 'disponivel' },
        { id: '107', numero: '107', status: 'ocupado' },
        { id: '108', numero: '108', status: 'disponivel' },
        { id: '109', numero: '109', status: 'disponivel' },
        { id: '110', numero: '110', status: 'ocupado' }
      ]
    },
    {
      id: 'superior',
      nome: 'Superior',
      cor: '#10B981',
      quartos: [
        { id: '201', numero: '201', status: 'disponivel' },
        { id: '202', numero: '202', status: 'ocupado' },
        { id: '203', numero: '203', status: 'ocupado' },
        { id: '204', numero: '204', status: 'disponivel' },
        { id: '205', numero: '205', status: 'limpeza' },
        { id: '206', numero: '206', status: 'disponivel' },
        { id: '207', numero: '207', status: 'manutencao' },
        { id: '208', numero: '208', status: 'disponivel' }
      ]
    },
    {
      id: 'deluxe',
      nome: 'Deluxe',
      cor: '#8B5CF6',
      quartos: [
        { id: '301', numero: '301', status: 'disponivel' },
        { id: '302', numero: '302', status: 'ocupado' },
        { id: '303', numero: '303', status: 'disponivel' },
        { id: '304', numero: '304', status: 'limpeza' },
        { id: '305', numero: '305', status: 'disponivel' },
        { id: '306', numero: '306', status: 'ocupado' }
      ]
    },
    {
      id: 'suite',
      nome: 'Suíte',
      cor: '#F59E0B',
      quartos: [
        { id: '401', numero: '401', status: 'disponivel' },
        { id: '402', numero: '402', status: 'limpeza' },
        { id: '403', numero: '403', status: 'ocupado' },
        { id: '404', numero: '404', status: 'disponivel' }
      ]
    },
    {
      id: 'premium',
      nome: 'Premium',
      cor: '#DC2626',
      quartos: [
        { id: '501', numero: '501', status: 'disponivel' },
        { id: '502', numero: '502', status: 'ocupado' },
        { id: '503', numero: '503', status: 'disponivel' },
        { id: '504', numero: '504', status: 'manutencao' },
        { id: '505', numero: '505', status: 'disponivel' }
      ]
    },
    {
      id: 'executivo',
      nome: 'Executivo',
      cor: '#7C2D12',
      quartos: [
        { id: '601', numero: '601', status: 'disponivel' },
        { id: '602', numero: '602', status: 'ocupado' },
        { id: '603', numero: '603', status: 'limpeza' },
        { id: '604', numero: '604', status: 'disponivel' }
      ]
    },
    {
      id: 'presidencial',
      nome: 'Presidencial',
      cor: '#581C87',
      quartos: [
        { id: '701', numero: '701', status: 'disponivel' },
        { id: '702', numero: '702', status: 'ocupado' },
        { id: '703', numero: '703', status: 'disponivel' }
      ]
    }
  ]);

  // Estado para controlar categorias expandidas/colapsadas
  const [expandedCategories, setExpandedCategories] = useState({
    'economico': true,
    'standard': true,
    'superior': true,
    'deluxe': true,
    'suite': true,
    'premium': true,
    'executivo': true,
    'presidencial': true
  });

  // Função para verificar se há sobreposição entre reservas
  const verificarSobreposicao = (novaReserva, reservaAtual = null) => {
    const reservasDoQuarto = reservas.filter(r => 
      r.quarto === novaReserva.quarto && 
      (!reservaAtual || r.id !== reservaAtual.id) // Excluir a reserva atual (para drag)
    );

    const novoInicio = novaReserva.inicio;
    const novoFim = novaReserva.inicio + novaReserva.duracao;

    return reservasDoQuarto.some(r => {
      const inicioExistente = r.inicio;
      const fimExistente = r.inicio + r.duracao;
      
      // Verificar se há sobreposição
      return (novoInicio < fimExistente && novoFim > inicioExistente);
    });
  };

  // Sistema de drag personalizado com mouse events - CORRIGIDO
  const handleMouseDown = (e, reserva) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    setDraggedReserva(reserva);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setTempPosition({ inicio: reserva.inicio });
    setDragMoved(false); // Reset do flag de movimento
  };

  // Listeners globais usando useEffect
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !draggedReserva) return;
      
      const deltaX = e.clientX - dragStartPos.x;
      
      // Calcular nova posição
      const timelineElement = document.querySelector('.timeline-container');
      if (!timelineElement) return;
      
      const timelineRect = timelineElement.getBoundingClientRect();
      const timelineWidth = timelineRect.width - 192; // 192px = largura da coluna de quartos
      const pixelsPerDay = timelineWidth / 15;
      const dayOffset = deltaX / pixelsPerDay;
      
      const novaInicio = Math.max(0, Math.min(14 - draggedReserva.duracao, draggedReserva.inicio + dayOffset));
      setTempPosition({ inicio: novaInicio });
      
      // Detectar se houve movimento significativo (mais que 5px)
      if (Math.abs(deltaX) > 5) {
        setDragMoved(true);
      }
    };

    const handleMouseUp = () => {
      if (isDragging && draggedReserva && tempPosition && dragMoved) {
        // Só atualizar se houve movimento real - usar mesma lógica do clique+pin
        const snapInicio = Math.round(tempPosition.inicio - 0.5) + 0.5;
        
        // Verificar se a nova posição causaria sobreposição
        const novaReserva = {
          ...draggedReserva,
          inicio: snapInicio
        };
        
        if (verificarSobreposicao(novaReserva, draggedReserva)) {
          // Não mover se há conflito - mostrar feedback
          alert(`❌ Conflito! Não é possível mover "${draggedReserva.nome}" para esta posição pois há sobreposição com outra reserva.`);
        } else {
          setReservas(prev => prev.map(r => 
            r.id === draggedReserva.id 
              ? { ...r, inicio: snapInicio }
              : r
          ));
        }
      }
      
      // Limpar estados
      setIsDragging(false);
      setDraggedReserva(null);
      setTempPosition(null);
      setDragMoved(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, draggedReserva, dragStartPos, tempPosition]);

  // Funções de drag & drop HTML5 (backup)
  const handleDragStart = (e, reserva) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(reserva));
    setDraggedReserva(reserva);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetQuarto, targetDia) => {
    e.preventDefault();
    if (draggedReserva) {
      // Verificar se a nova posição causaria sobreposição (targetDia é índice, converter para posição)
      const inicioReal = targetDia + 1; // CSS adiciona +0.5 para centralizar
      const novaReserva = {
        ...draggedReserva,
        inicio: inicioReal,
        quarto: targetQuarto
      };
      
      if (verificarSobreposicao(novaReserva, draggedReserva)) {
        // Não mover se há conflito
        alert(`❌ Conflito! Não é possível mover "${draggedReserva.nome}" para esta posição pois há sobreposição com outra reserva.`);
        setDraggedReserva(null);
        return;
      }
      
      setReservas(prev => prev.map(r => 
        r.id === draggedReserva.id 
          ? { ...r, inicio: inicioReal, quarto: targetQuarto }
          : r
      ));
      setDraggedReserva(null);
    }
  };

  // Função alternativa de clique para mover reservas
  const [selectedForMove, setSelectedForMove] = useState(null);
  
  const handleReservaDoubleClick = (reserva) => {
    if (selectedForMove && selectedForMove.id === reserva.id) {
      setSelectedForMove(null); // Deselecionar se já estava selecionado
    } else {
      setSelectedForMove(reserva); // Selecionar para mover
    }
  };

  const handleReservaClick = (reserva) => {
    // Clique simples não faz nada agora - só duplo clique ativa o modo pin
    // Reservado para futuras funcionalidades (ex: mostrar detalhes da reserva)
  };

  const handleCellClick = (e, quarto, dia) => {
    if (selectedForMove) {
      // Modo pin: ajustar para centralizar corretamente
      // Usar o valor que funcionava: dia + 1.5 
      const inicioNoCentroDaCelula = dia + 1.5; // Para centralizar (CSS adiciona +0.5)
      
      // Verificar se a nova posição causaria sobreposição
      const novaReserva = {
        ...selectedForMove,
        inicio: inicioNoCentroDaCelula,
        quarto: quarto
      };
      
      if (verificarSobreposicao(novaReserva, selectedForMove)) {
        // Mostrar feedback visual de erro
        alert(`❌ Conflito! Não é possível mover "${selectedForMove.nome}" para esta posição pois há sobreposição com outra reserva.`);
        return;
      }
      
      setReservas(prev => prev.map(r => 
        r.id === selectedForMove.id 
          ? { ...r, inicio: inicioNoCentroDaCelula, quarto: quarto }
          : r
      ));
      setSelectedForMove(null);
    }
  };

  // Configuração dos dados de quartos (recursos)
  const rows = {
    '101': {
      id: '101',
      label: 'Quarto 101 - Standard',
      parentId: 'standard',
      expanded: false,
    },
    '102': {
      id: '102',
      label: 'Quarto 102 - Standard',
      parentId: 'standard',
      expanded: false,
    },
    '103': {
      id: '103',
      label: 'Quarto 103 - Standard',
      parentId: 'standard',
      expanded: false,
    },
    'standard': {
      id: 'standard',
      label: '🏠 Standard',
      expanded: true,
    },
    '201': {
      id: '201',
      label: 'Quarto 201 - Superior',
      parentId: 'superior',
      expanded: false,
    },
    '202': {
      id: '202',
      label: 'Quarto 202 - Superior', 
      parentId: 'superior',
      expanded: false,
    },
    'superior': {
      id: 'superior',
      label: '⭐ Superior',
      expanded: true,
    },
    '301': {
      id: '301',
      label: 'Quarto 301 - Deluxe',
      parentId: 'deluxe',
      expanded: false,
    },
    '302': {
      id: '302',
      label: 'Quarto 302 - Deluxe',
      parentId: 'deluxe',
      expanded: false,
    },
    'deluxe': {
      id: 'deluxe',
      label: '💎 Deluxe',
      expanded: true,
    },
    '401': {
      id: '401',
      label: 'Quarto 401 - Suíte',
      parentId: 'suite',
      expanded: false,
    },
    'suite': {
      id: 'suite',
      label: '👑 Suíte',
      expanded: true,
    },
  };

  // Dados das reservas (items) com encaixe perfeito
  const items = {
    'reserva1': {
      id: 'reserva1',
      label: 'João Silva',
      rowId: '101',
      time: {
        start: new Date('2025-09-03T12:00:00').getTime(),
        end: new Date('2025-09-06T12:00:00').getTime(),
      },
      style: {
        background: '#3B82F6',
        color: 'white',
        borderRadius: '6px',
        border: '2px solid #1E40AF'
      }
    },
    'reserva2': {
      id: 'reserva2',
      label: 'Carlos Lima',
      rowId: '101', // Mesmo quarto - encaixe perfeito
      time: {
        start: new Date('2025-09-06T12:00:00').getTime(), // Exatamente onde João Silva termina
        end: new Date('2025-09-09T12:00:00').getTime(),
      },
      style: {
        background: '#F59E0B',
        color: 'white',
        borderRadius: '6px',
        border: '2px solid #D97706'
      }
    },
    'reserva3': {
      id: 'reserva3',
      label: 'Maria Santos',
      rowId: '201',
      time: {
        start: new Date('2025-09-02T12:00:00').getTime(),
        end: new Date('2025-09-05T12:00:00').getTime(),
      },
      style: {
        background: '#10B981',
        color: 'white',
        borderRadius: '6px',
        border: '2px solid #047857'
      }
    },
    'reserva4': {
      id: 'reserva4',
      label: 'Ana Paula',
      rowId: '201', // Mesmo quarto - encaixe perfeito
      time: {
        start: new Date('2025-09-05T12:00:00').getTime(), // Exatamente onde Maria Santos termina
        end: new Date('2025-09-08T12:00:00').getTime(),
      },
      style: {
        background: '#EF4444',
        color: 'white',
        borderRadius: '6px',
        border: '2px solid #DC2626'
      }
    },
    'reserva5': {
      id: 'reserva5',
      label: 'Pedro Costa',
      rowId: '301',
      time: {
        start: new Date('2025-09-04T12:00:00').getTime(),
        end: new Date('2025-09-07T12:00:00').getTime(),
      },
      style: {
        background: '#8B5CF6',
        color: 'white',
        borderRadius: '6px',
        border: '2px solid #6D28D9'
      }
    },
  };

  // Configuração do Gantt Schedule Timeline Calendar
  const config = {
    height: 600,
    list: {
      rows,
      items,
    },
    chart: {
      time: {
        from: new Date('2025-09-01').getTime(),
        to: new Date('2025-09-30').getTime(),
        zoom: 16, // Zoom para visualizar dias
        period: 'day',
      },
      items: {
        // Configuração para reservas hoteleiras
        minWidth: 100,
        maxWidth: 400,
        gap: {
          horizontal: 2,
          vertical: 4,
        }
      }
    },
    locale: {
      name: 'pt-BR',
      weekdays: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
      months: [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ]
    },
    plugins: [
      // Plugin para permitir movimentação de reservas
      'ItemMovement', 
      // Plugin para permitir redimensionamento
      'ItemResizing',
      // Plugin para seleção
      'Selection'
    ]
  };

  // useEffect(() => {
  //   if (gstcRef.current) {
  //     // Inicializar o Gantt Schedule Timeline Calendar
  //     const gstc = GSTC(gstcRef.current, config);

  //     // Event listeners
  //     if (gstc.state) {
  //       gstc.state.subscribe('config.list.items', (items) => {
  //         console.log('Reservas atualizadas:', items);
  //       });
  //     }

  //     // Cleanup
  //     return () => {
  //       if (gstc && typeof gstc.destroy === 'function') {
  //         gstc.destroy();
  //       }
  //     };
  //   }
  // }, []);

  return (
    <div className="flex flex-col h-full bg-slate-100">
      {/* Header do Calendário */}
      <div className="bg-slate-200 border-b border-slate-300 fixed z-30 py-2 px-4"
      style={{
        top: '4rem', // Logo abaixo do header do site (64px)
        left: sidebarWidth,
        right: 0,
        width: `calc(100vw - ${sidebarWidth})`
      }}>
        <div className="flex justify-between items-center">
          {/* Título à esquerda - reduz no modo compacto */}
          <h1 className="font-semibold text-slate-800 text-sm">
            Calendário
          </h1>
          
          {/* Navegação de mês no centro - reduz no modo compacto */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateMonth(-1)}
              className="text-slate-600 hover:text-slate-800 hover:bg-slate-300 rounded-full p-1"
            >
              <ChevronLeft size={16} />
            </button>
            
            <div className="font-medium text-slate-800 text-center text-sm min-w-[120px]">
              {getCurrentMonthYear()}
            </div>
            
            <button
              onClick={() => navigateMonth(1)}
              className="text-slate-600 hover:text-slate-800 hover:bg-slate-300 rounded-full p-1"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          
          {/* Botão à direita - reduz no modo compacto */}
          <button
            onClick={() => setShowNewReservaModal(true)}
            className={`bg-blue-600 text-white rounded hover:bg-blue-700 transition-all duration-300 flex items-center space-x-1 ${
              isHeaderCompact ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'
            }`}
          >
            <Plus size={isHeaderCompact ? 12 : 16} />
            <span>Nova Reserva</span>
          </button>
        </div>
      </div>
      
      {/* Spacer para quando os headers estiverem fixos */}
      {(isHeaderCompact || isDaysHeaderFixed) && (
        <div className={`bg-transparent transition-all duration-300 ${
          isDaysHeaderFixed ? 'h-40' : isHeaderCompact ? 'h-24' : 'h-20'
        }`}></div>
      )}
      


      {/* Gantt Timeline Container - Demonstração */}
      <div className="flex-1 pt-20">
        <div className="bg-white shadow-sm border border-slate-200">
          <div className="w-full flex flex-col">
            {/* Header de datas */}
            <div className="flex border-b border-slate-200 fixed bg-white transition-all duration-300 ease-in-out"
            style={{
              top: isHeaderCompact ? '6.5rem' : '7.3rem', // Ajusta quando o header "Calendário" fica compacto
              left: sidebarWidth,
              right: 0,
              width: `calc(100vw - ${sidebarWidth})`,
              zIndex: 25
            }}>
              <div className="w-48 p-3 font-semibold text-slate-700 border-r border-slate-200">
                Quartos
              </div>
              <div className="flex-1 flex">
                {Array.from({ length: 15 }, (_, i) => {
                  // Usar data real de hoje como referência
                  const today = new Date();
                  const startDate = new Date(today);
                  startDate.setDate(today.getDate() - 2); // Começar 2 dias antes de hoje
                  
                  const date = new Date(startDate);
                  date.setDate(startDate.getDate() + i);
                  const isToday = i === 2; // Hoje no centro do calendário
                  const dayOfWeek = date.getDay(); // 0 = Domingo, 6 = Sábado
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                  
                  return (
                    <div 
                      key={i}
                      className={`flex-1 p-2 text-center text-xs border-r border-slate-200 relative ${
                        isToday ? 'bg-blue-100 font-semibold text-blue-700' : 
                        isWeekend ? 'bg-red-50 text-red-700 font-medium' : 
                        'text-slate-600'
                      }`}
                    >
                      <div className="font-medium">{date.getDate()}</div>
                      <div className="text-xs opacity-70">
                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][date.getDay()]}
                      </div>
                      {/* Linha central para indicar meio do dia - OCULTA */}
                      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-300 opacity-0"></div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timeline dinâmico com drag & drop */}
            <div className="timeline-container relative">
              {/* Grid de categorias e quartos */}
              {categorias.map((categoria) => (
                <div key={categoria.id}>
                  {/* Header da Categoria */}
                  <div 
                    className="bg-slate-200 border-b border-slate-300 sticky z-20 transition-all duration-300 ease-in-out"
                    style={{
                      top: isHeaderCompact ? '5.1rem' : '5.9rem' // Ajusta junto com os outros headers
                    }}
                  >
                    <button
                      onClick={() => toggleCategory(categoria.id)}
                      className="w-full p-3 flex items-center space-x-3 hover:bg-slate-300 transition-colors text-left"
                    >
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: categoria.cor }}
                      ></div>
                      <div className="flex-1 font-semibold text-slate-800 text-sm">
                        {categoria.nome}
                      </div>
                      <div className="text-xs text-slate-600 bg-slate-300 px-2 py-1 rounded-full">
                        {categoria.quartos.length}
                      </div>
                      {expandedCategories[categoria.id] ? (
                        <ChevronUp size={16} className="text-slate-700" />
                      ) : (
                        <ChevronDown size={16} className="text-slate-700" />
                      )}
                    </button>
                  </div>

                  {/* Quartos da Categoria */}
                  {expandedCategories[categoria.id] && categoria.quartos.map((quarto, quartoIndex) => {
                    const reservasDoQuarto = reservas.filter(r => r.quarto === quarto.numero);
                    
                    return (
                      <div key={quarto.id} className="flex min-h-[60px] hover:bg-slate-50 border-b border-slate-100">
                        <div className="w-48 p-3 border-r border-slate-200">
                          <div className="font-medium text-slate-900">Quarto {quarto.numero}</div>
                          <div className="text-xs text-slate-500 flex items-center space-x-2">
                            <span>{categoria.nome}</span>
                            <div className={`px-2 py-1 rounded-full text-xs ${
                              quarto.status === 'disponivel' ? 'bg-green-100 text-green-700' :
                              quarto.status === 'ocupado' ? 'bg-red-100 text-red-700' :
                              quarto.status === 'manutencao' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {quarto.status === 'disponivel' ? 'Livre' :
                               quarto.status === 'ocupado' ? 'Ocupado' :
                               quarto.status === 'manutencao' ? 'Manutenção' : 'Limpeza'}
                            </div>
                          </div>
                        </div>
                    
                    {/* Área do timeline com grid */}
                    <div className="flex-1 relative">
                      {/* Grid de células (15 dias) - agora clicável com destaque de fins de semana */}
                      <div className="absolute inset-0 flex">
                        {Array.from({ length: 15 }, (_, i) => {
                          // Usar mesma lógica de data do header
                          const today = new Date();
                          const startDate = new Date(today);
                          startDate.setDate(today.getDate() - 2); // Começar 2 dias antes de hoje
                          
                          const date = new Date(startDate);
                          date.setDate(startDate.getDate() + i);
                          const dayOfWeek = date.getDay(); // 0 = Domingo, 6 = Sábado
                          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                          
                          return (
                            <div 
                              key={i}
                              className={`flex-1 border-r border-slate-100 relative cursor-pointer transition-colors ${
                                isWeekend 
                                  ? 'bg-red-50 hover:bg-red-100' 
                                  : 'hover:bg-blue-50'
                              }`}
                              style={{ minWidth: '60px' }}
                              onClick={(e) => handleCellClick(e, quarto.numero, i)}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, quarto.numero, i)}
                              title={selectedForMove ? `Mover "${selectedForMove.nome}" para dia ${i + 1}` : `Dia ${i + 1}`}
                            >
                            {/* Linha central para snap - OCULTA */}
                            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-300 opacity-0"></div>
                            
                            {/* Indicador de drop */}
                            {selectedForMove && (
                              <div className="absolute inset-0 bg-green-100 opacity-50 flex items-center justify-center">
                                <div className="text-xs text-green-600 font-medium">📍</div>
                              </div>
                            )}
                          </div>
                          );
                        })}
                      </div>
                      
                      {/* Reservas dinâmicas com drag personalizado */}
                      {reservasDoQuarto.map(reserva => {
                        // Usar posição temporária durante o drag ou posição atual
                        const currentInicio = (isDragging && draggedReserva?.id === reserva.id && tempPosition) 
                          ? tempPosition.inicio 
                          : reserva.inicio;
                        
                        return (
                          <div
                            key={reserva.id}
                            className={`absolute h-10 ${getStatusColor(reserva.status)} ${getTextColor(reserva.status)} text-xs flex items-center pl-4 pr-2 cursor-move hover:opacity-90 transition-all select-none ${
                              isDragging && draggedReserva?.id === reserva.id ? 'opacity-70 z-50 ring-2 ring-white' : 
                              selectedForMove?.id === reserva.id ? 'ring-2 ring-yellow-400 z-50' : 'z-10'
                            }`}
                            style={{
                              top: '50%',
                              left: `${((currentInicio + 0.5) / 15) * 100}%`,
                              width: `${(reserva.duracao / 15) * 100}%`,
                              transform: 'translate(-50%, -50%)',
                              transition: isDragging && draggedReserva?.id === reserva.id ? 'none' : 'all 0.2s ease',
                              boxShadow: '3px 4px 8px rgba(0, 0, 0, 0.3)',
                              marginLeft: '1px',
                              marginRight: '1px',
                              clipPath: 'polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%)', // Chanfrado: início mais atrás, fim mais à frente
                              borderRadius: '0' // Remove border-radius para que o clipPath funcione melhor
                            }}
                            title={`${reserva.nome} - ${reserva.duracao} dias - Arraste para mover | Duplo clique para modo pin`}
                            onMouseDown={(e) => handleMouseDown(e, reserva)}
                            onDragStart={(e) => handleDragStart(e, reserva)}
                            onClick={(e) => {
                              e.stopPropagation();
                              // Clique simples não faz nada - só duplo clique ativa modo pin
                              if (!dragMoved) {
                                handleReservaClick(reserva);
                              }
                            }}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              // Duplo clique ativa/desativa modo de movimentação
                              handleReservaDoubleClick(reserva);
                            }}
                            draggable={true} // Manter HTML5 drag como backup
                          >
                            {/* Informações principais à esquerda */}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium leading-tight">
                                {reserva.nome.length > 15 ? reserva.nome.substring(0, 15) + '...' : reserva.nome}
                                {selectedForMove?.id === reserva.id && (
                                  <span className="ml-1">📍</span>
                                )}
                                {isDragging && draggedReserva?.id === reserva.id && (
                                  <span className="ml-1">🎯</span>
                                )}
                              </div>
                              <div className="text-[10px] opacity-75 leading-tight">
                                {reserva.procedencia}
                              </div>
                            </div>

                            {/* Ícones informativos à direita */}
                            <div className="flex items-center space-x-1.5 flex-shrink-0 mr-2">
                              {/* Número de hóspedes */}
                              <div className="flex items-center">
                                <User size={12} className="opacity-70" />
                                <span className="text-[10px] ml-0.5">{reserva.hospedes}</span>
                              </div>
                              
                              {/* Número de noites */}
                              <div className="flex items-center">
                                <Moon size={12} className="opacity-70" />
                                <span className="text-[10px] ml-0.5">{reserva.noites}</span>
                              </div>
                              
                              {/* Pagamento pendente */}
                              {reserva.pagamentoPendente && (
                                <div 
                                  className="flex items-center cursor-help"
                                  title={`Total: R$ ${reserva.valorTotal.toFixed(2)} | Pago: R$ ${reserva.valorPago.toFixed(2)} | Pendente: R$ ${(reserva.valorTotal - reserva.valorPago).toFixed(2)}`}
                                >
                                  <DollarSign size={12} className="opacity-70 text-yellow-300" />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Área vazia indicativa */}
                      {reservasDoQuarto.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="text-xs text-slate-400">
                            {selectedForMove ? 'Clique aqui para mover a reserva' : 'Disponível'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                        );
                      })}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legenda de Status */}
      <div className="bg-slate-200 border-t border-slate-300 p-3">
        <div className="flex justify-center">
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gray-300 rounded-sm"></div>
              <span className="text-slate-700">Pré-reserva</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
              <span className="text-slate-700">Reservado</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
              <span className="text-slate-700">Hospedado</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-600 rounded-sm"></div>
              <span className="text-slate-700">⚠️ Atraso Check-in</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-orange-600 rounded-sm"></div>
              <span className="text-slate-700">⚠️ Atraso Check-out</span>
            </div>
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
                  <option value="101">101 - Standard</option>
                  <option value="102">102 - Standard</option>
                  <option value="103">103 - Standard</option>
                  <option value="201">201 - Superior</option>
                  <option value="202">202 - Superior</option>
                  <option value="301">301 - Deluxe</option>
                  <option value="302">302 - Deluxe</option>
                  <option value="401">401 - Suíte</option>
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