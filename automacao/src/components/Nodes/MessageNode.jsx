import { Handle, Position } from 'reactflow';
import { useState } from 'react';

const MessageNode = ({ data, isConnectable, id, selected, onNodeClick }) => {
  const [nodeName, setNodeName] = useState(data?.label || 'Mensagem');

  const handleClick = () => {
    if (onNodeClick) {
      onNodeClick(id, 'Mensagem', data);
    }
  };

  return (
    <div 
      className={`message-node ${selected ? 'selected' : ''}`}
      onClick={handleClick}
    >
      <style>{`
        .message-node {
          background: linear-gradient(145deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
          border-radius: 12px;
          padding: 16px;
          min-width: 180px;
          text-align: center;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
          border: 2px solid rgba(255, 255, 255, 0.3);
          position: relative;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .message-node:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4);
        }
        
        .message-node.selected {
          border-color: #fbbf24;
          box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.3);
        }
        
        .message-node-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 8px;
          opacity: 0.9;
        }
        
        .message-node-content {
          font-size: 14px;
          font-weight: 500;
          line-height: 1.3;
        }
      `}</style>
      
      <div className="message-node-header">
        💬 {nodeName.toUpperCase()}
      </div>
      
      <div className="message-node-content">
        Clique para configurar
      </div>
      
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        isConnectable={isConnectable}
        style={{
          background: '#ffffff',
          border: '3px solid #8b5cf6',
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
          border: '3px solid #8b5cf6',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
        }}
      />
    </div>
  );
};

export default MessageNode;