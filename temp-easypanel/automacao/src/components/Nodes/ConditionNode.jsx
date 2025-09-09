import { Handle, Position } from 'reactflow';
import { useState } from 'react';

const ConditionNode = ({ data, isConnectable, id, selected, onNodeClick }) => {
  const [nodeName, setNodeName] = useState(data?.label || 'Condição');

  const handleClick = () => {
    if (onNodeClick) {
      onNodeClick(id, 'Condição', data);
    }
  };

  return (
    <div 
      className={`condition-node ${selected ? 'selected' : ''}`}
      onClick={handleClick}
    >
      <style>{`
        .condition-node {
          background: linear-gradient(145deg, #f59e0b 0%, #d97706 100%);
          color: white;
          border-radius: 12px;
          padding: 16px;
          min-width: 180px;
          text-align: center;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
          border: 2px solid rgba(255, 255, 255, 0.3);
          position: relative;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .condition-node:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(245, 158, 11, 0.4);
        }
        
        .condition-node.selected {
          border-color: #fbbf24;
          box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.3);
        }
        
        .condition-node-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 8px;
          opacity: 0.9;
        }
        
        .condition-node-content {
          font-size: 14px;
          font-weight: 500;
          line-height: 1.3;
        }
      `}</style>
      
      <div className="condition-node-header">
        🔀 {nodeName.toUpperCase()}
      </div>
      
      <div className="condition-node-content">
        Clique para configurar
      </div>
      
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        isConnectable={isConnectable}
        style={{
          background: '#ffffff',
          border: '3px solid #f59e0b',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
        }}
      />
      
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        isConnectable={isConnectable}
        style={{
          background: '#22c55e',
          border: '3px solid #ffffff',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          top: '40%',
        }}
      />
      
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        isConnectable={isConnectable}
        style={{
          background: '#ef4444',
          border: '3px solid #ffffff',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          top: '60%',
        }}
      />
    </div>
  );
};

export default ConditionNode;