import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const NodeConfigSidebar = ({ 
  isVisible, 
  nodeId, 
  nodeType, 
  nodeData, 
  onClose, 
  onSave 
}) => {
  const [isClosing, setIsClosing] = useState(false);

  // Função para fechar com animação
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 400);
  };

  if (!isVisible || !nodeType) return null;

  return createPortal(
    <>
      <style>{`
        .sidebar-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.3);
          z-index: 99998;
          animation: fadeIn 0.3s ease-in-out forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideInFromRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        @keyframes slideOutToRight {
          from { transform: translateX(0); }
          to { transform: translateX(100%); }
        }

        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        .sidebar {
          position: fixed;
          top: 0;
          right: 0;
          width: 400px;
          height: 100vh;
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%);
          backdrop-filter: blur(20px);
          border-left: 2px solid rgba(84, 122, 241, 0.2);
          box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
          z-index: 99999;
          display: flex;
          flex-direction: column;
          animation: ${isClosing ? 'slideOutToRight' : 'slideInFromRight'} 0.4s ease-out forwards;
        }

        .sidebar-overlay.closing {
          animation: fadeOut 0.3s ease-in-out forwards;
        }

        .sidebar-header {
          background: linear-gradient(145deg, #547af1 0%, #2d47d3 100%);
          color: white;
          padding: 20px;
          border-bottom: 2px solid rgba(255, 255, 255, 0.2);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .sidebar-title {
          font-size: 18px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .sidebar-close {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          transition: all 0.2s ease;
        }

        .sidebar-close:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: rotate(90deg);
        }

        .sidebar-content {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
        }

        .config-placeholder {
          text-align: center;
          color: #64748b;
          font-size: 14px;
          margin-top: 40px;
        }

        .config-placeholder-icon {
          font-size: 48px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .sidebar-footer {
          padding: 20px;
          border-top: 1px solid rgba(84, 122, 241, 0.2);
          background: rgba(248, 250, 252, 0.5);
        }

        .sidebar-actions {
          display: flex;
          gap: 12px;
        }

        .sidebar-btn {
          flex: 1;
          padding: 12px 16px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .sidebar-btn-primary {
          background: linear-gradient(145deg, #547af1 0%, #2d47d3 100%);
          color: white;
        }

        .sidebar-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(84, 122, 241, 0.3);
        }

        .sidebar-btn-secondary {
          background: rgba(100, 116, 139, 0.1);
          color: #64748b;
          border: 1px solid rgba(100, 116, 139, 0.2);
        }

        .sidebar-btn-secondary:hover {
          background: rgba(100, 116, 139, 0.2);
        }
      `}</style>

      <div className={`sidebar-overlay ${isClosing ? 'closing' : ''}`} onClick={handleClose} />
      
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-title">
            {getNodeIcon(nodeType)} Configurar {nodeType}
          </div>
          <button className="sidebar-close" onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className="sidebar-content">
          <div className="config-placeholder">
            <div className="config-placeholder-icon">
              {getNodeIcon(nodeType)}
            </div>
            <div>
              Configurações para o componente <strong>{nodeType}</strong> serão implementadas aqui.
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-actions">
            <button 
              className="sidebar-btn sidebar-btn-secondary"
              onClick={handleClose}
            >
              Cancelar
            </button>
            <button 
              className="sidebar-btn sidebar-btn-primary"
              onClick={() => {
                // Por enquanto apenas fecha a sidebar
                handleClose();
              }}
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

const getNodeIcon = (nodeType) => {
  const icons = {
    'Mensagem': '💬',
    'Pergunta': '❓',
    'Ação': '⚡',
    'Condição': '🔀',
    'Email': '📧',
    'Ir Para': '🔄',
  };
  return icons[nodeType] || '⚙️';
};

export default NodeConfigSidebar;