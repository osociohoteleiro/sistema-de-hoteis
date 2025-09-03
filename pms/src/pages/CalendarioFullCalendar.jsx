import { useState, useEffect, useCallback } from 'react';
import { Plus, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, User, Moon, DollarSign, ArrowLeft, ArrowRight, Clock, ClockAlert, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Componente para desenhar linhas conectoras entre reservas do mesmo hóspede
const GuestConnectionLines = ({ reservas, quartos }) => {
  // Agrupar reservas por hóspede
  const reservasPorHospede = reservas.reduce((acc, reserva) => {
    if (!acc[reserva.hospede]) {
      acc[reserva.hospede] = [];
    }
    acc[reserva.hospede].push(reserva);
    return acc;
  }, {});

  // Filtrar apenas hóspedes com múltiplas reservas visíveis
  const hospedes = Object.entries(reservasPorHospede).filter(([_, reservasDoHospede]) => reservasDoHospede.length > 1);

  console.log('🔗 GuestConnectionLines - Hospedes com múltiplas reservas:', hospedes.length);
  
  if (hospedes.length === 0) return null;

  // Função para calcular posição da reserva na tela
  const getReservaPosition = (reserva) => {
    const quarto = quartos.find(q => q.numero === reserva.quarto);
    if (!quarto) return null;

    const quartoIndex = quartos.indexOf(quarto);
    const leftPercent = (reserva.inicio / 15) * 100;
    const widthPercent = (reserva.duracao / 15) * 100;
    
    const position = {
      x: leftPercent + (widthPercent / 2), // Centro horizontal da reserva
      y: 200 + (quartoIndex * 80) + 40, // Posição vertical ajustada
      reserva
    };
    
    console.log(`📍 Posição para ${reserva.hospede} no quarto ${reserva.quarto}:`, position);
    return position;
  };

  // Gerar cores para cada hóspede
  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899'];

  return (
    <div className="absolute inset-0 pointer-events-none z-[15]" style={{ width: '100%', height: '100%' }}>
      <svg 
        width="100%" 
        height="100%"
        style={{ position: 'absolute', top: 0, left: 0 }}
      >        
        {hospedes.map(([hospedeNome, reservasDoHospede], hospedeIndex) => {
          const positions = reservasDoHospede
            .map(getReservaPosition)
            .filter(pos => pos !== null)
            .sort((a, b) => a.reserva.inicio - b.reserva.inicio);

          console.log(`🎯 ${hospedeNome} - ${positions.length} posições válidas`);

          if (positions.length < 2) return null;

          const color = colors[hospedeIndex % colors.length];

          return (
            <g key={hospedeNome}>
              {positions.map((pos, index) => {
                if (index === positions.length - 1) return null;
                
                const nextPos = positions[index + 1];
                
                console.log(`➡️ Linha de ${pos.reserva.hospede}: (${pos.x}%, ${pos.y}) → (${nextPos.x}%, ${nextPos.y})`);
                
                return (
                  <line
                    key={`${pos.reserva.id}-${nextPos.reserva.id}`}
                    x1={`${pos.x}%`}
                    y1={pos.y}
                    x2={`${nextPos.x}%`}
                    y2={nextPos.y}
                    stroke={color}
                    strokeWidth="3"
                    strokeDasharray="8,4"
                    strokeOpacity="0.8"
                  />
                );
              })}
              
              {/* Círculos nas posições das reservas */}
              {positions.map((pos, index) => (
                <circle
                  key={`circle-${pos.reserva.id}`}
                  cx={`${pos.x}%`}
                  cy={pos.y}
                  r="4"
                  fill={color}
                  opacity="0.8"
                />
              ))}
              
              {/* Rótulo do hóspede */}
              <text
                x={`${positions[0].x}%`}
                y={positions[0].y - 15}
                textAnchor="middle"
                fontSize="12"
                fill={color}
                style={{fontWeight: 'bold'}}
              >
                🔗 {hospedeNome}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// Componente de efeito de sucesso - removido, agora usamos animação direta na reserva

const CalendarioFullCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 8, 3)); // Setembro 2025 (mês 8 = setembro)
  const [showNewReservaModal, setShowNewReservaModal] = useState(false);
  
  // Estados para Drag and Drop
  const [draggedReserva, setDraggedReserva] = useState(null);
  const [dragOverCell, setDragOverCell] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Estado para modo PIN (duplo clique)
  const [selectedForMove, setSelectedForMove] = useState(null);
  
  // Estados para Redimensionamento (Resize)
  const [resizeMode, setResizeMode] = useState(null); // { reservaId, type: 'start' | 'end' }
  
  // Estado para Modal de Confirmação de Resize
  const [showResizeConfirmModal, setShowResizeConfirmModal] = useState(false);
  const [resizeConfirmData, setResizeConfirmData] = useState(null);
  
  // Estado para Menu de Contexto
  const [contextMenu, setContextMenu] = useState(null);
  
  // Estado para destacar reserva modificada
  const [highlightedReserva, setHighlightedReserva] = useState(null);
  
  // Estado para efeito de sucesso - animação shake na reserva
  const [shakeReservaId, setShakeReservaId] = useState(null);
  
  // Estado para controlar expansão/colapso das categorias
  const [expandedCategories, setExpandedCategories] = useState({
    'Standard': true,
    'Superior': true,
    'Deluxe': true,
    'Suíte': true
  });
  
  const sidebarWidth = '18rem'; // Fixed JSX structure

  // Dados dos quartos organizados por categorias
  const categorias = [
    {
      nome: 'Standard',
      cor: '#3B82F6',
      quartos: [
        { id: 1, numero: '101', tipo: 'Standard' },
        { id: 5, numero: '102', tipo: 'Standard' },
        { id: 6, numero: '103', tipo: 'Standard' },
        { id: 7, numero: '104', tipo: 'Standard' }
      ]
    },
    {
      nome: 'Superior',
      cor: '#10B981',
      quartos: [
        { id: 2, numero: '201', tipo: 'Superior' },
        { id: 8, numero: '202', tipo: 'Superior' },
        { id: 9, numero: '203', tipo: 'Superior' },
        { id: 10, numero: '204', tipo: 'Superior' }
      ]
    },
    {
      nome: 'Deluxe',
      cor: '#8B5CF6',
      quartos: [
        { id: 3, numero: '301', tipo: 'Deluxe' },
        { id: 11, numero: '302', tipo: 'Deluxe' },
        { id: 12, numero: '303', tipo: 'Deluxe' }
      ]
    },
    {
      nome: 'Suíte',
      cor: '#F59E0B',
      quartos: [
        { id: 4, numero: '401', tipo: 'Suíte' },
        { id: 13, numero: '402', tipo: 'Suíte' }
      ]
    }
  ];

  // Lista plana de quartos para compatibilidade com código existente
  const quartos = categorias.flatMap(categoria => categoria.quartos);

  // Dados das reservas
  const [reservas, setReservas] = useState([
    {
      id: 1,
      hospede: 'João Silva',
      quarto: '101',
      checkin: '03/09/2025',
      checkout: '06/09/2025',
      status: 'reservado',
      inicio: 2.5,
      duracao: 3,
      hospedes: 2,
      earlyCheckin: false,
      lateCheckout: true // Exemplo: saída postergada
    },
    {
      id: 2,
      hospede: 'Maria Santos',
      quarto: '201',
      checkin: '04/09/2025',
      checkout: '08/09/2025',
      status: 'hospedado',
      inicio: 3.5,
      duracao: 4,
      hospedes: 1,
      earlyCheckin: true, // Exemplo: chegada antecipada
      lateCheckout: false
    },
    {
      id: 3,
      hospede: 'Pedro Costa',
      quarto: '301',
      checkin: '05/09/2025',
      checkout: '07/09/2025',
      status: 'checkout',
      inicio: 4.5,
      duracao: 2,
      hospedes: 3,
      earlyCheckin: false,
      lateCheckout: false
    },
    {
      id: 4,
      hospede: 'João Silva',
      quarto: '102',
      checkin: '04/09/2025',
      checkout: '06/09/2025',
      status: 'reservado',
      inicio: 3.5,
      duracao: 2,
      hospedes: 2,
      earlyCheckin: false,
      lateCheckout: false
    },
    {
      id: 5,
      hospede: 'Maria Santos',
      quarto: '302',
      checkin: '06/09/2025',
      checkout: '08/09/2025',
      status: 'reservado',
      inicio: 5.5,
      duracao: 2,
      hospedes: 1,
      earlyCheckin: false,
      lateCheckout: false
    },
    {
      id: 6,
      hospede: 'Ana Costa',
      quarto: '103',
      checkin: '03/09/2025',
      checkout: '05/09/2025',
      status: 'hospedado',
      inicio: 2.5,
      duracao: 2,
      hospedes: 1,
      earlyCheckin: false,
      lateCheckout: false
    },
    {
      id: 7,
      hospede: 'Ana Costa',
      quarto: '203',
      checkin: '06/09/2025',
      checkout: '08/09/2025',
      status: 'reservado',
      inicio: 5.5,
      duracao: 2,
      hospedes: 1,
      earlyCheckin: true,
      lateCheckout: false
    },
    {
      id: 8,
      hospede: 'Carlos Silva',
      quarto: '104',
      checkin: '03/09/2025',
      checkout: '05/09/2025',
      status: 'hospedado',
      inicio: 2.5,
      duracao: 2,
      hospedes: 2,
      earlyCheckin: false,
      lateCheckout: false
    },
    {
      id: 9,
      hospede: 'Carlos Silva',
      quarto: '202',
      checkin: '07/09/2025',
      checkout: '09/09/2025',
      status: 'reservado',
      inicio: 6.5,
      duracao: 2,
      hospedes: 2,
      earlyCheckin: false,
      lateCheckout: false
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

  // Função para verificar sobreposição entre reservas
  const verificarSobreposicao = useCallback((novaReserva, reservaAtual = null) => {
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
  }, [reservas]);

  // Funções de Drag and Drop
  const handleDragStart = (e, reserva) => {
    setDraggedReserva(reserva);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify(reserva));
    // Adicionar transparência visual maior para permitir click-through
    setTimeout(() => {
      e.target.style.opacity = '0.3';
      e.target.style.pointerEvents = 'none'; // Permite que eventos passem através da reserva
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    e.target.style.pointerEvents = 'auto'; // Restaura os eventos de ponteiro
    setDraggedReserva(null);
    setDragOverCell(null);
    setIsDragging(false);
  };

  const handleDragOver = (e, quartoId, dayIndex) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCell({ quartoId, dayIndex });
  };

  const handleDragLeave = (e) => {
    // Só limpa se realmente saiu da célula
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverCell(null);
    }
  };

  const handleDrop = (e, quartoId, dayIndex) => {
    e.preventDefault();
    
    if (!draggedReserva) return;

    // Calcular nova posição baseada no dayIndex
    // Para que a reserva apareça exatamente na célula onde foi solta
    const novoInicio = dayIndex + 0.5; // +0.5 para centralizar na célula
    const novaDuracao = draggedReserva.duracao;

    // Verificar se a nova posição causaria sobreposição
    const novaReserva = {
      ...draggedReserva,
      quarto: quartoId,
      inicio: novoInicio,
      duracao: novaDuracao
    };
    
    if (verificarSobreposicao(novaReserva, draggedReserva)) {
      alert(`❌ Conflito! Não é possível mover "${draggedReserva.hospede}" para esta posição pois há sobreposição com outra reserva.`);
      setDragOverCell(null);
      return;
    }

    // Calcular novas datas baseadas no dayIndex (onde dayIndex 0 = primeiro dia do calendário)
    const hoje = new Date();
    const startDate = new Date(hoje);
    startDate.setDate(hoje.getDate() - 2 + dayIndex); // -2 porque o calendário começa 2 dias antes de hoje
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + novaDuracao);

    // Atualizar a reserva
    setReservas(prev => prev.map(r => 
      r.id === draggedReserva.id 
        ? {
            ...r,
            quarto: quartoId,
            inicio: novoInicio,
            duracao: novaDuracao,
            checkin: startDate.toISOString().split('T')[0].slice(5), // MM/DD format
            checkout: endDate.toISOString().split('T')[0].slice(5) // MM/DD format
          }
        : r
    ));

    setDragOverCell(null);
  };

  // Funções do modo PIN (duplo clique)
  const handleReservaDoubleClick = (e, reserva) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (selectedForMove && selectedForMove.id === reserva.id) {
      setSelectedForMove(null); // Deselecionar se já estava selecionado
    } else {
      setSelectedForMove(reserva); // Selecionar para mover
    }
  };

  const handleCellClickPIN = (e, quartoId, dayIndex) => {
    if (!selectedForMove) return;
    
    e.preventDefault();
    e.stopPropagation();

    // Calcular nova posição (mesma lógica do drag and drop)
    const novoInicio = dayIndex + 0.5;
    const novaDuracao = selectedForMove.duracao;

    // Verificar se a nova posição causaria sobreposição
    const novaReserva = {
      ...selectedForMove,
      quarto: quartoId,
      inicio: novoInicio,
      duracao: novaDuracao
    };
    
    if (verificarSobreposicao(novaReserva, selectedForMove)) {
      alert(`❌ Conflito! Não é possível mover "${selectedForMove.hospede}" para esta posição pois há sobreposição com outra reserva.`);
      return;
    }

    // Calcular novas datas
    const hoje = new Date();
    const startDate = new Date(hoje);
    startDate.setDate(hoje.getDate() - 2 + dayIndex);
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + novaDuracao);

    // Atualizar a reserva
    setReservas(prev => prev.map(r => 
      r.id === selectedForMove.id 
        ? {
            ...r,
            quarto: quartoId,
            inicio: novoInicio,
            duracao: novaDuracao,
            checkin: startDate.toISOString().split('T')[0].slice(5),
            checkout: endDate.toISOString().split('T')[0].slice(5)
          }
        : r
    ));

    setSelectedForMove(null); // Deselecionar após mover
  };

  // Sistema de Redimensionamento Simplificado
  const handleResizeClick = (e, reserva, type) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log(`🔧 RESIZE CLICK: ${type} para ${reserva.hospede}`);
    
    if (resizeMode && resizeMode.reservaId === reserva.id && resizeMode.type === type) {
      // Cancelar modo resize se clicar novamente na mesma alça
      setResizeMode(null);
      console.log('❌ Cancelando modo resize');
      return;
    }
    
    // Ativar modo resize
    setResizeMode({ reservaId: reserva.id, type: type });
    console.log(`✅ Ativado modo resize ${type} para ${reserva.hospede}`);
  };

  // Função para alternar Early Check-in e Late Check-out
  const toggleEarlyCheckin = (reservaId) => {
    setReservas(prev => prev.map(r => 
      r.id === reservaId 
        ? { ...r, earlyCheckin: !r.earlyCheckin }
        : r
    ));
  };

  const toggleLateCheckout = (reservaId) => {
    setReservas(prev => prev.map(r => 
      r.id === reservaId 
        ? { ...r, lateCheckout: !r.lateCheckout }
        : r
    ));
  };

  // Função para lidar com clique direito na reserva
  const handleReservaRightClick = (e, reserva) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      reserva: reserva
    });
  };

  // Fechar menu de contexto quando clicar fora
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  // Função para aplicar redimensionamento quando clicar em uma célula
  const handleCellResizeClick = (e, quartoId, dayIndex) => {
    if (!resizeMode) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    console.log(`📍 RESIZE CELL CLICK: dayIndex=${dayIndex}, quartoId=${quartoId}`);
    
    const reserva = reservas.find(r => r.id === resizeMode.reservaId);
    if (!reserva) return;
    
    let novoInicio = reserva.inicio;
    let novaDuracao = reserva.duracao;
    
    const newPosition = dayIndex + 0.5;
    
    // Calcular datas atuais e novas para o alerta
    const hoje = new Date();
    const dataAtualStart = new Date(hoje);
    dataAtualStart.setDate(hoje.getDate() - 2 + Math.floor(reserva.inicio));
    
    const dataAtualEnd = new Date(dataAtualStart);
    dataAtualEnd.setDate(dataAtualStart.getDate() + Math.floor(reserva.duracao));
    
    if (resizeMode.type === 'start') {
      // Redimensionar início (antecipar check-in)
      novoInicio = newPosition;
      novaDuracao = (reserva.inicio + reserva.duracao) - newPosition;
      
      if (novaDuracao < 1) {
        alert('❌ Duração mínima é de 1 dia');
        return;
      }
      
      // Calcular nova data de check-in
      const novaDataStart = new Date(hoje);
      novaDataStart.setDate(hoje.getDate() - 2 + Math.floor(novoInicio));
      
      // Configurar dados para o modal de confirmação
      const dataAtualFormatada = dataAtualStart.toLocaleDateString('pt-BR');
      const novaDataFormatada = novaDataStart.toLocaleDateString('pt-BR');
      
      setResizeConfirmData({
        reserva,
        quartoId,
        type: 'check-in',
        dataAtual: dataAtualFormatada,
        novaData: novaDataFormatada,
        novoInicio,
        novaDuracao
      });
      setShowResizeConfirmModal(true);
      return;
      
    } else if (resizeMode.type === 'end') {
      // Redimensionar fim (estender check-out)
      novaDuracao = newPosition - reserva.inicio;
      
      if (novaDuracao < 1) {
        alert('❌ Duração mínima é de 1 dia');
        return;
      }
      
      // Calcular nova data de check-out
      const novaDataEnd = new Date(dataAtualStart);
      novaDataEnd.setDate(dataAtualStart.getDate() + Math.floor(novaDuracao));
      
      // Configurar dados para o modal de confirmação  
      const dataAtualFormatada = dataAtualEnd.toLocaleDateString('pt-BR');
      const novaDataFormatada = novaDataEnd.toLocaleDateString('pt-BR');
      
      setResizeConfirmData({
        reserva,
        quartoId,
        type: 'check-out',
        dataAtual: dataAtualFormatada,
        novaData: novaDataFormatada,
        novoInicio,
        novaDuracao
      });
      setShowResizeConfirmModal(true);
      return;
    }
    
    // Verificar conflitos
    const novaReserva = {
      ...reserva,
      quarto: quartoId,
      inicio: novoInicio,
      duracao: novaDuracao
    };
    
    if (verificarSobreposicao(novaReserva, reserva)) {
      alert(`❌ Conflito! Redimensionamento causaria sobreposição.`);
      return;
    }
    
    // Calcular novas datas finais
    const startDateFinal = new Date(hoje);
    startDateFinal.setDate(hoje.getDate() - 2 + Math.floor(novoInicio));
    
    const endDateFinal = new Date(startDateFinal);
    endDateFinal.setDate(startDateFinal.getDate() + Math.floor(novaDuracao));
    
    // Aplicar mudanças
    setReservas(prev => prev.map(r => 
      r.id === reserva.id 
        ? { 
            ...r, 
            quarto: quartoId,
            inicio: novoInicio, 
            duracao: novaDuracao,
            checkin: startDateFinal.toISOString().split('T')[0].slice(5),
            checkout: endDateFinal.toISOString().split('T')[0].slice(5)
          }
        : r
    ));
    
    console.log(`✅ Redimensionamento aplicado: ${resizeMode.type}`);
    setResizeMode(null);
  };

  // Função para confirmar a alteração de redimensionamento
  const handleConfirmResize = () => {
    if (!resizeConfirmData) return;
    
    const { reserva, quartoId, novoInicio, novaDuracao } = resizeConfirmData;
    
    // Verificar conflitos
    const novaReserva = {
      ...reserva,
      quarto: quartoId,
      inicio: novoInicio,
      duracao: novaDuracao
    };
    
    if (verificarSobreposicao(novaReserva, reserva)) {
      alert(`❌ Conflito! Redimensionamento causaria sobreposição.`);
      handleCancelResize();
      return;
    }
    
    // Calcular novas datas finais
    const hoje = new Date();
    const startDateFinal = new Date(hoje);
    startDateFinal.setDate(hoje.getDate() - 2 + Math.floor(novoInicio));
    
    const endDateFinal = new Date(startDateFinal);
    endDateFinal.setDate(startDateFinal.getDate() + Math.floor(novaDuracao));
    
    // Aplicar mudanças
    setReservas(prev => prev.map(r => 
      r.id === reserva.id 
        ? { 
            ...r, 
            quarto: quartoId,
            inicio: novoInicio, 
            duracao: novaDuracao,
            checkin: startDateFinal.toISOString().split('T')[0].slice(5),
            checkout: endDateFinal.toISOString().split('T')[0].slice(5)
          }
        : r
    ));
    
    console.log(`✅ Redimensionamento confirmado: ${resizeConfirmData.type}`);
    
    // Aplicar animação shake na reserva
    setShakeReservaId(reserva.id);
    
    // Destacar a reserva modificada
    setHighlightedReserva(reserva.id);
    
    // Remover efeitos após timing adequado
    setTimeout(() => {
      setShakeReservaId(null);
    }, 1000);
    
    setTimeout(() => {
      setHighlightedReserva(null);
    }, 3000);
    
    // Fechar modal e limpar estados
    setShowResizeConfirmModal(false);
    setResizeConfirmData(null);
    setResizeMode(null);
  };

  // Função para cancelar a alteração
  const handleCancelResize = () => {
    setShowResizeConfirmModal(false);
    setResizeConfirmData(null);
    setResizeMode(null);
  };

  // Função para alternar expansão/colapso de categorias
  const toggleCategory = (categoriaNome) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoriaNome]: !prev[categoriaNome]
    }));
  };

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
          {categorias.map(categoria => (
            <div key={categoria.nome}>
              {/* Header da Categoria */}
              <div className="flex border-b-2 border-slate-300 bg-slate-100">
                {/* Coluna da Categoria */}
                <div className="w-48 flex-shrink-0 border-r border-slate-200">
                  <button
                    onClick={() => toggleCategory(categoria.nome)}
                    className="w-full p-4 flex items-center space-x-3 hover:bg-slate-200 transition-colors text-left"
                  >
                    <div 
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: categoria.cor }}
                    ></div>
                    <div className="flex-1">
                      <h2 className="font-bold text-slate-900 text-lg">{categoria.nome}</h2>
                      <p className="text-xs text-slate-600">{categoria.quartos.length} quartos</p>
                    </div>
                    {expandedCategories[categoria.nome] ? (
                      <ChevronUp size={20} className="text-slate-700" />
                    ) : (
                      <ChevronDown size={20} className="text-slate-700" />
                    )}
                  </button>
                </div>
                
                {/* Timeline da Categoria (vazio) */}
                <div className="flex-1 bg-slate-100 border-b border-slate-200"></div>
              </div>

              {/* Quartos da Categoria */}
              {expandedCategories[categoria.nome] && categoria.quartos.map((quarto, index) => {
                const reservasDoQuarto = reservas.filter(r => r.quarto === quarto.numero);
                
                return (
                  <div key={quarto.id} className="flex border-b border-slate-200 h-20">
                    {/* Coluna do Quarto */}
                    <div className={`w-48 flex-shrink-0 p-4 border-r border-slate-200 flex items-center ${
                      index % 2 === 0 ? 'bg-slate-50' : 'bg-white'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: categoria.cor }}
                        ></div>
                        <div>
                          <h3 className="font-semibold text-slate-800">{quarto.numero}</h3>
                          <p className="text-sm text-slate-600">{quarto.tipo}</p>
                        </div>
                      </div>
                    </div>

                {/* Timeline */}
                <div className="flex-1 relative">
                  {/* Grid de dias */}
                  <div className="absolute inset-0 flex">
                    {Array.from({ length: 15 }, (_, i) => {
                      const isDragOver = dragOverCell && 
                                       dragOverCell.quartoId === quarto.numero && 
                                       dragOverCell.dayIndex === i;
                      const showPin = selectedForMove && true;
                      const showResizeTarget = resizeMode && true;
                      
                      return (
                        <div
                          key={i}
                          className={`flex-1 h-full border-r border-slate-200 cursor-pointer transition-colors relative ${
                            isDragOver 
                              ? 'bg-green-200 hover:bg-green-300' 
                              : selectedForMove
                                ? 'bg-yellow-50 hover:bg-yellow-100'
                                : resizeMode
                                  ? 'bg-purple-50 hover:bg-purple-100'
                                  : 'hover:bg-blue-50'
                          }`}
                          onClick={(e) => {
                            if (resizeMode) {
                              handleCellResizeClick(e, quarto.numero, i);
                            } else if (selectedForMove) {
                              handleCellClickPIN(e, quarto.numero, i);
                            } else {
                              setShowNewReservaModal(true);
                            }
                          }}
                          onDragOver={(e) => handleDragOver(e, quarto.numero, i)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, quarto.numero, i)}
                        >
                          {showPin && !resizeMode && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-2xl">📍</div>
                            </div>
                          )}
                          
                          {showResizeTarget && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-purple-100 rounded-full p-1 shadow-sm">
                                {resizeMode.type === 'start' ? (
                                  <ArrowLeft size={16} className="text-purple-600" />
                                ) : (
                                  <ArrowRight size={16} className="text-purple-600" />
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Reservas */}
                  {reservasDoQuarto.map(reserva => {
                    const currentInicio = reserva.inicio;
                    const currentDuracao = reserva.duracao;
                    const leftPercent = (currentInicio / 15) * 100;
                    const widthPercent = (currentDuracao / 15) * 100;

                    return (
                      <motion.div
                        key={reserva.id}
                        draggable={!resizeMode}
                        initial={{ 
                          y: "-50%"
                        }}
                        animate={shakeReservaId === reserva.id ? {
                          x: [0, -10, 10, -8, 8, -4, 4, 0],
                          y: "-50%",
                          scale: [1, 1.05, 1.05, 1.05, 1.05, 1],
                          boxShadow: [
                            "0 0 0 0 rgba(34, 197, 94, 0)",
                            "0 0 0 12px rgba(34, 197, 94, 0.4), 0 0 30px rgba(34, 197, 94, 0.3)",
                            "0 0 0 0 rgba(34, 197, 94, 0)"
                          ]
                        } : highlightedReserva === reserva.id ? {
                          scale: [1, 1.02, 1],
                          y: ["-50%", "-50%", "-50%"],
                          boxShadow: [
                            "0 0 0 0 rgba(34, 197, 94, 0)",
                            "0 0 0 8px rgba(34, 197, 94, 0.3), 0 0 20px rgba(34, 197, 94, 0.2)",
                            "0 0 0 0 rgba(34, 197, 94, 0)"
                          ]
                        } : {
                          y: "-50%"
                        }}
                        transition={shakeReservaId === reserva.id ? {
                          duration: 0.8,
                          ease: "easeInOut"
                        } : {
                          duration: 2,
                          ease: "easeInOut",
                          times: [0, 0.5, 1]
                        }}
                        onDragStart={(e) => {
                          if (resizeMode) {
                            e.preventDefault();
                            return;
                          }
                          handleDragStart(e, reserva);
                        }}
                        onDragEnd={handleDragEnd}
                        onDoubleClick={(e) => handleReservaDoubleClick(e, reserva)}
                        onContextMenu={(e) => handleReservaRightClick(e, reserva)}
                        className={`absolute text-white text-xs p-2 cursor-move shadow-lg rounded ${getStatusColor(reserva.status)} hover:shadow-xl ${
                          resizeMode?.reservaId === reserva.id ? 'z-50 ring-4 ring-purple-400 shadow-2xl' : ''
                        } ${isDragging && draggedReserva?.id === reserva.id ? 'opacity-50' : ''} ${
                          selectedForMove?.id === reserva.id ? 'ring-4 ring-yellow-400 z-50' : ''
                        } ${highlightedReserva === reserva.id ? 'z-[70]' : ''}`}
                        style={{
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                          top: '50%',
                          minWidth: '80px',
                          height: '36px',
                          clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)'
                        }}
                        title={`${reserva.hospede} - ${reserva.quarto}\n${reserva.checkin} - ${reserva.checkout}\n(Arraste para mover ou duplo clique para modo PIN)`}
                      >
                        <div
                          className={`absolute left-0 top-0 bottom-0 w-4 cursor-pointer transition-colors z-20 ${
                            resizeMode?.reservaId === reserva.id && resizeMode?.type === 'start'
                              ? 'bg-purple-500 bg-opacity-90 ring-2 ring-purple-300'
                              : 'bg-white bg-opacity-50 hover:bg-opacity-80 hover:bg-blue-400'
                          }`}
                          onClick={(e) => handleResizeClick(e, reserva, 'start')}
                          onDragStart={(e) => e.preventDefault()}
                          title="Clique para ativar redimensionamento do check-in"
                        >
                          <div className="h-full flex items-center justify-center">
                            <ArrowLeft 
                              size={12} 
                              className={resizeMode?.reservaId === reserva.id && resizeMode?.type === 'start' ? 'text-white' : 'text-gray-700'} 
                            />
                          </div>
                        </div>

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

                        <div
                          className={`absolute right-0 top-0 bottom-0 w-4 cursor-pointer transition-colors z-20 ${
                            resizeMode?.reservaId === reserva.id && resizeMode?.type === 'end'
                              ? 'bg-purple-500 bg-opacity-90 ring-2 ring-purple-300'
                              : 'bg-white bg-opacity-50 hover:bg-opacity-80 hover:bg-green-400'
                          }`}
                          onClick={(e) => handleResizeClick(e, reserva, 'end')}
                          onDragStart={(e) => e.preventDefault()}
                          title="Clique para ativar redimensionamento do check-out"
                        >
                          <div className="h-full flex items-center justify-center">
                            <ArrowRight 
                              size={12} 
                              className={resizeMode?.reservaId === reserva.id && resizeMode?.type === 'end' ? 'text-white' : 'text-gray-700'} 
                            />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {reservasDoQuarto.map(reserva => {
                    const currentInicio = reserva.inicio;
                    const currentDuracao = reserva.duracao;
                    const leftPercent = (currentInicio / 15) * 100;
                    const widthPercent = (currentDuracao / 15) * 100;

                    return (
                      <div key={`indicator-${reserva.id}`}>
                        {reserva.earlyCheckin && (
                          <div 
                            className="absolute z-[60]"
                            style={{
                              left: `${leftPercent}%`,
                              top: '50%',
                              transform: 'translate(-6px, -50%)',
                              marginTop: '-18px'
                            }}
                          >
                            <Clock 
                              size={14} 
                              className="text-orange-500 bg-white bg-opacity-95 rounded-full p-0.5 cursor-pointer hover:text-orange-700 transition-colors shadow-md border border-orange-200" 
                              title="Early Check-in (clique para remover)" 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleEarlyCheckin(reserva.id);
                              }}
                            />
                          </div>
                        )}
                        
                        {reserva.lateCheckout && (
                          <div 
                            className="absolute z-[60]"
                            style={{
                              left: `${leftPercent + widthPercent}%`,
                              top: '50%',
                              transform: 'translate(-6px, -50%)',
                              marginTop: '-18px'
                            }}
                          >
                            <ClockAlert 
                              size={14} 
                              className="text-red-500 bg-white bg-opacity-95 rounded-full p-0.5 cursor-pointer hover:text-red-700 transition-colors shadow-md border border-red-200" 
                              title="Late Check-out (clique para remover)" 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleLateCheckout(reserva.id);
                              }}
                            />
                          </div>
                        )}
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

      {/* Legenda */}
      <div className="bg-slate-200 border-t border-slate-300 p-3">
        <div className="flex justify-center flex-col items-center space-y-2">
          <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-2 text-xs">
            {/* Status das Reservas */}
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
            
            {/* Separador */}
            <div className="h-4 border-l border-slate-400"></div>
            
            {/* Indicadores Especiais */}
            <div className="flex items-center space-x-1">
              <Clock size={12} className="text-orange-600" />
              <span>Early Check-in</span>
            </div>
            <div className="flex items-center space-x-1">
              <ClockAlert size={12} className="text-red-600" />
              <span>Late Check-out</span>
            </div>
          </div>
          
          <div className="text-xs text-slate-600 flex items-center space-x-2 flex-wrap justify-center">
            <span>🖱️ <strong>Drag & Drop:</strong> Arraste reservas para mover</span>
            <span>•</span>
            <span>👆 <strong>Modo PIN:</strong> Duplo clique na reserva + clique no PIN 📍</span>
            <span>•</span>
            <span className="flex items-center">
              <span className="mr-1">↔️</span>
              <strong>Redimensionar:</strong>
              <span className="mx-1">Clique nas alças</span>
              <ArrowLeft size={12} className="mx-1" />
              <ArrowRight size={12} className="mx-1" />
            </span>
            <span>•</span>
            <span>🖱️ <strong>Clique Direito:</strong> Menu para Early/Late</span>
            <span>•</span>
            <span>🟢 Verde = destino | 🟡 Amarelo = PIN | 🟣 Roxo = redimensionando</span>
            {isDragging && (
              <>
                <span>•</span>
                <span className="text-blue-600 font-medium">
                  📍 Movendo "{draggedReserva?.hospede}"
                </span>
              </>
            )}
            {selectedForMove && (
              <>
                <span>•</span>
                <span className="text-yellow-600 font-medium">
                  🎯 "{selectedForMove.hospede}" selecionada - Clique em um PIN
                </span>
              </>
            )}
            {resizeMode && (
              <>
                <span>•</span>
                <span className="text-purple-600 font-medium flex items-center">
                  <span className="mr-1">↔️</span>
                  <span>Modo Resize ativo - Clique em uma célula</span>
                  {resizeMode.type === 'start' ? (
                    <><ArrowLeft size={12} className="mx-1" /><span>para antecipar check-in</span></>
                  ) : (
                    <><ArrowRight size={12} className="mx-1" /><span>para estender check-out</span></>
                  )}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Estilos CSS para Animações do Modal */}
      <style jsx>{`
        @keyframes modalFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes modalSlideIn {
          0% {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.02) translateY(-5px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes modalBounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.95);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes iconFloat {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-3px);
          }
        }


        @keyframes contentSlideUp {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }


        .modal-backdrop {
          animation: modalFadeIn 0.3s ease-out;
        }

        .modal-container {
          animation: modalSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .modal-icon {
          animation: iconFloat 2s ease-in-out infinite;
        }


        .modal-content {
          animation: contentSlideUp 0.5s ease-out 0.1s both;
        }

        .modal-buttons {
          animation: contentSlideUp 0.5s ease-out 0.2s both;
        }

      `}</style>

      {/* Modal de Confirmação de Redimensionamento */}
      {showResizeConfirmModal && resizeConfirmData && (
        <div className="modal-backdrop fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="modal-container bg-white rounded-2xl shadow-2xl max-w-lg w-full transform relative z-[10000]">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="modal-icon w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    {resizeConfirmData.type === 'check-in' ? (
                      <ArrowLeft size={24} className="text-white" />
                    ) : (
                      <ArrowRight size={24} className="text-white" />
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold">
                    Alteração de {resizeConfirmData.type === 'check-in' ? 'Check-in' : 'Check-out'}
                  </h3>
                  <p className="text-purple-100 text-sm">
                    Confirme os detalhes da alteração
                  </p>
                </div>
              </div>
            </div>
            
            {/* Conteúdo */}
            <div className="modal-content p-6 space-y-6">
              {/* Informações do Hóspede */}
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                    <span className="text-lg">👤</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">{resizeConfirmData.reserva.hospede}</h4>
                    <p className="text-slate-600 text-sm">Quarto {resizeConfirmData.quartoId}</p>
                  </div>
                </div>
              </div>
              
              {/* Comparação de Datas */}
              <div className="space-y-4">
                <h5 className="font-medium text-slate-700 flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  Alteração de {resizeConfirmData.type === 'check-in' ? 'Check-in' : 'Check-out'}
                </h5>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Data Atual */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-red-600 text-sm font-medium mb-1">Data Atual</div>
                    <div className="text-slate-800 font-semibold">{resizeConfirmData.dataAtual}</div>
                  </div>
                  
                  {/* Nova Data */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-green-600 text-sm font-medium mb-1">Nova Data</div>
                    <div className="text-slate-800 font-semibold">{resizeConfirmData.novaData}</div>
                  </div>
                </div>
                
                {/* Seta de Transformação */}
                <div className="flex justify-center">
                  <div className="bg-gradient-to-br from-blue-100 to-purple-100 border border-blue-200/50 rounded-full p-3 shadow-sm">
                    <RefreshCw size={20} className="text-blue-600" />
                  </div>
                </div>
              </div>
              
              {/* Aviso */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <span className="text-amber-600 text-lg flex-shrink-0">⚠️</span>
                  <div>
                    <p className="text-amber-800 text-sm">
                      <strong>Confirme com atenção:</strong> Esta alteração modificará a data de {resizeConfirmData.type === 'check-in' ? 'entrada' : 'saída'} da reserva. 
                      Certifique-se de que não há conflitos com outras reservas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Botões */}
            <div className="modal-buttons border-t border-slate-200 p-6 flex space-x-3">
              <button
                onClick={handleCancelResize}
                className="flex-1 px-4 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-700 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 hover:shadow-md"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmResize}
                className="flex-1 px-4 py-3 text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-purple-500/25"
              >
                Confirmar Alteração
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Menu de Contexto */}
      {contextMenu && (
        <div 
          className="fixed bg-white rounded-lg shadow-2xl border border-slate-200 z-[10001] py-2 min-w-48"
          style={{ 
            left: contextMenu.x, 
            top: contextMenu.y,
            transform: 'translate(-50%, -10px)'
          }}
        >
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="font-medium text-slate-800 text-sm">{contextMenu.reserva.hospede}</p>
            <p className="text-xs text-slate-600">Quarto {contextMenu.reserva.quarto}</p>
          </div>
          
          <div className="py-1">
            <button
              onClick={() => {
                toggleEarlyCheckin(contextMenu.reserva.id);
                setContextMenu(null);
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center space-x-2"
            >
              <Clock size={14} className={contextMenu.reserva.earlyCheckin ? "text-orange-600" : "text-slate-400"} />
              <span>{contextMenu.reserva.earlyCheckin ? 'Remover Early Check-in' : 'Marcar Early Check-in'}</span>
            </button>
            
            <button
              onClick={() => {
                toggleLateCheckout(contextMenu.reserva.id);
                setContextMenu(null);
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center space-x-2"
            >
              <ClockAlert size={14} className={contextMenu.reserva.lateCheckout ? "text-red-600" : "text-slate-400"} />
              <span>{contextMenu.reserva.lateCheckout ? 'Remover Late Check-out' : 'Marcar Late Check-out'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Linhas conectoras entre reservas do mesmo hóspede */}
      <GuestConnectionLines reservas={reservas} quartos={quartos} />

    </div>
  );
};

export default CalendarioFullCalendar;