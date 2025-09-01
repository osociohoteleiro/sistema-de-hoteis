import { useState, useEffect, useRef } from 'react';

const NodeSelectorModal = ({ 
  isVisible, 
  onClose, 
  onNodeSelect, 
  position = { x: 100, y: 100 } 
}) => {
  const [modalPosition, setModalPosition] = useState(position);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const modalRef = useRef(null);

  const nodeTypes = [
    { type: 'messageNode', icon: '💬', label: 'Mensagem', description: 'Enviar mensagens para o usuário' },
    { type: 'questionNode', icon: '❓', label: 'Pergunta', description: 'Fazer perguntas e capturar respostas' },
    { type: 'actionNode', icon: '⚡', label: 'Ação', description: 'Executar ações automáticas' },
    { type: 'conditionNode', icon: '🔀', label: 'Condição', description: 'Criar ramificações condicionais' },
    { type: 'emailNode', icon: '📧', label: 'Email', description: 'Enviar emails automáticos' },
    { type: 'goToNode', icon: '🔄', label: 'Ir Para', description: 'Redirecionar para outro fluxo' },
  ];

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      setModalPosition(position);
      console.log('🎭 Modal: Posicionando em:', position);
    }
  }, [isVisible, position]);

  const handleMouseDown = (e) => {
    // Só iniciar drag se for especificamente no header e não em um botão/link
    const isHeader = e.target.classList.contains('modal-header') || e.target.closest('.modal-header');
    const isButton = e.target.classList.contains('modal-close') || e.target.closest('.modal-close');
    
    if (isHeader && !isButton) {
      // Calcular offset baseado na posição atual do modal
      setDragOffset({
        x: e.clientX - modalPosition.x,
        y: e.clientY - modalPosition.y
      });
      setDragStart({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e) => {
    if (dragStart && !isDragging) {
      // Só começar a arrastar se o mouse se moveu mais de 5px
      const deltaX = Math.abs(e.clientX - dragStart.x);
      const deltaY = Math.abs(e.clientY - dragStart.y);
      if (deltaX > 5 || deltaY > 5) {
        setIsDragging(true);
      }
    }
    
    if (isDragging) {
      e.preventDefault();
      setModalPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  useEffect(() => {
    if (isDragging || dragStart) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart, dragOffset]);

  const handleNodeSelect = (e, nodeType) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🔥 Modal: Componente clicado:', nodeType);
    
    // Encontrar o label do nodeType
    const selectedNode = nodeTypes.find(node => node.type === nodeType);
    const nodeLabel = selectedNode ? selectedNode.label : nodeType;
    
    onNodeSelect(nodeType, nodeLabel);
    handleClose();
  };

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  if (!isVisible && !isAnimating) return null;

  return (
    <>
      <style>{`
        .node-selector-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.1);
          z-index: 10000;
          opacity: ${isVisible ? 1 : 0};
          transition: opacity 0.2s ease;
        }

        .node-selector-modal {
          position: fixed;
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 244, 255, 0.9) 100%);
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(45, 71, 211, 0.3);
          border: 2px solid rgba(84, 122, 241, 0.2);
          backdrop-filter: blur(20px);
          min-width: 320px;
          z-index: 10001;
          transform: ${isVisible ? 'scale(1) rotate(0deg)' : 'scale(0.7) rotate(-5deg)'};
          opacity: ${isVisible ? 1 : 0};
          transition: ${isDragging ? 'none' : 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'};
          cursor: ${isDragging ? 'grabbing' : 'default'};
        }

        .modal-header {
          background: linear-gradient(145deg, #547af1 0%, #2d47d3 100%);
          color: white;
          padding: 16px 20px;
          border-radius: 14px 14px 0 0;
          cursor: grab;
          user-select: none;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
        }

        .modal-header:active {
          cursor: grabbing;
        }

        .modal-title {
          font-size: 16px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .modal-close {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          transition: all 0.2s ease;
        }

        .modal-close:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: rotate(90deg);
        }

        .modal-body {
          padding: 20px;
        }

        .node-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        .node-option {
          padding: 16px;
          border-radius: 12px;
          border: 2px solid rgba(84, 122, 241, 0.2);
          background: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
          overflow: hidden;
        }

        .node-option::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(84, 122, 241, 0.1), transparent);
          transition: left 0.5s ease;
        }

        .node-option:hover::before {
          left: 100%;
        }

        .node-option:hover {
          border-color: rgba(84, 122, 241, 0.4);
          background: rgba(84, 122, 241, 0.1);
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 8px 24px rgba(84, 122, 241, 0.2);
        }

        .node-option:active {
          transform: translateY(0) scale(0.98);
        }

        .node-icon {
          font-size: 24px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: linear-gradient(145deg, rgba(84, 122, 241, 0.1) 0%, rgba(45, 71, 211, 0.1) 100%);
          border: 2px solid rgba(84, 122, 241, 0.2);
        }

        .node-info {
          flex: 1;
        }

        .node-label {
          font-size: 14px;
          font-weight: 600;
          color: #2d47d3;
          margin-bottom: 4px;
        }

        .node-description {
          font-size: 12px;
          color: #64748b;
          opacity: 0.8;
        }

        .drag-hint {
          position: absolute;
          top: -6px;
          right: -6px;
          background: rgba(84, 122, 241, 0.9);
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }

        .modal-footer {
          padding: 0 20px 20px 20px;
          text-align: center;
        }

        .footer-text {
          font-size: 11px;
          color: #64748b;
          opacity: 0.7;
        }
      `}</style>

      <div className="node-selector-overlay" onClick={handleClose} />
      
      <div 
        ref={modalRef}
        className="node-selector-modal"
        style={{ 
          left: modalPosition.x, 
          top: modalPosition.y 
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="modal-header">
          <div className="modal-title">
            ⚡ Adicionar Componente
          </div>
          <button className="modal-close" onClick={handleClose}>
            ✕
          </button>
          <div className="drag-hint">⋮⋮</div>
        </div>

        <div className="modal-body">
          <div className="node-grid">
            {nodeTypes.map(node => (
              <div 
                key={node.type}
                className="node-option"
                onClick={(e) => handleNodeSelect(e, node.type)}
              >
                <div className="node-icon">
                  {node.icon}
                </div>
                <div className="node-info">
                  <div className="node-label">{node.label}</div>
                  <div className="node-description">{node.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <div className="footer-text">
            💡 Arraste o cabeçalho para reposicionar
          </div>
        </div>
      </div>
    </>
  );
};

export default NodeSelectorModal;