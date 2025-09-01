import { Handle, Position } from 'reactflow';
import { useState } from 'react';

const QuestionNode = ({ data, isConnectable, id, selected, onNodeClick }) => {
  const [nodeName, setNodeName] = useState(data?.label || 'Pergunta');

  const handleClick = () => {
    if (onNodeClick) {
      onNodeClick(id, 'Pergunta', data);
    }
  };

  return (
    <div 
      className={`question-node ${selected ? 'selected' : ''}`}
      onClick={handleClick}
    >
      <style>{`
        .question-node {
          background: linear-gradient(145deg, #06b6d4 0%, #0891b2 100%);
          color: white;
          border-radius: 12px;
          padding: 16px;
          min-width: 180px;
          text-align: center;
          box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
          border: 2px solid rgba(255, 255, 255, 0.3);
          position: relative;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .question-node:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(6, 182, 212, 0.4);
        }
        
        .question-node.selected {
          border-color: #fbbf24;
          box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.3);
        }
        
        .question-node-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 8px;
          opacity: 0.9;
        }
        
        .question-node-content {
          font-size: 14px;
          font-weight: 500;
          line-height: 1.3;
        }
      `}</style>
      
      <div className="question-node-header">
        ❓ {nodeName.toUpperCase()}
      </div>
      
      <div className="question-node-content">
        Clique para configurar
      </div>
      
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        isConnectable={isConnectable}
        style={{
          background: '#ffffff',
          border: '3px solid #06b6d4',
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
          border: '3px solid #06b6d4',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
        }}
      />
    </div>
  );
};

export default QuestionNode;