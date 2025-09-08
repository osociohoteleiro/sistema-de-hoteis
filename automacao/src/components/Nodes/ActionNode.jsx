import { Handle, Position } from 'reactflow';
import { useState } from 'react';

const ActionNode = ({ data, isConnectable, id, selected, onNodeClick }) => {
  const [nodeName, setNodeName] = useState(data?.label || 'Ação');

  const handleClick = () => {
    if (onNodeClick) {
      onNodeClick(id, 'Ação', data);
    }
  };

  // Determinar o conteúdo baseado na configuração
  const getActionContent = () => {
    if (!data?.config?.type) {
      return 'Clique para configurar';
    }

    const config = data.config;
    switch (config.type) {
      case 'set_field':
        return `Definir ${config.fieldName || 'campo'}`;
      case 'clear_field':
        return `Limpar ${config.fieldName || 'campo'}`;
      case 'webhook':
        return 'Webhook configurado';
      case 'sequence':
        return `Seq: ${config.sequenceName || 'nome'}`;
      case 'http_request':
        return `HTTP ${config.method || 'GET'}`;
      default:
        return 'Ação configurada';
    }
  };

  return (
    <div 
      className={`action-node ${selected ? 'selected' : ''}`}
      onClick={handleClick}
    >
      <style>{`
        .action-node {
          background: linear-gradient(145deg, #22c55e 0%, #16a34a 100%);
          color: white;
          border-radius: 12px;
          padding: 16px;
          min-width: 180px;
          text-align: center;
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
          border: 2px solid rgba(255, 255, 255, 0.3);
          position: relative;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .action-node:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(34, 197, 94, 0.4);
        }
        
        .action-node.selected {
          border-color: #fbbf24;
          box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.3);
        }
        
        .action-node-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 8px;
          opacity: 0.9;
        }
        
        .action-node-content {
          font-size: 14px;
          font-weight: 500;
          line-height: 1.3;
        }
      `}</style>
      
      <div className="action-node-header">
        ⚡ {nodeName.toUpperCase()}
      </div>
      
      <div className="action-node-content">
        {getActionContent()}
      </div>
      
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        isConnectable={isConnectable}
        style={{
          background: '#ffffff',
          border: '3px solid #22c55e',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
        }}
      />
      
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        isConnectable={isConnectable}
        style={{
          background: '#ffffff',
          border: '3px solid #22c55e',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
        }}
      />
    </div>
  );
};

export default ActionNode;