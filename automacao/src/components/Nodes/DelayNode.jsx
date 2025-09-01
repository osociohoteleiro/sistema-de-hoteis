import { Handle, Position } from 'reactflow';
import { useState } from 'react';

const DelayNode = ({ data, isConnectable }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [delay, setDelay] = useState(data?.config?.delay || 1000);

  const handleSave = () => {
    if (data.config) {
      data.config.delay = parseInt(delay) || 1000;
    }
    setIsEditing(false);
  };

  const formatDelay = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="delay-node">
      <style>{`
        .delay-node {
          background: linear-gradient(145deg, #f59e0b 0%, #d97706 100%);
          color: white;
          border-radius: 8px;
          padding: 12px 16px;
          min-width: 140px;
          text-align: center;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
          border: 2px solid rgba(255, 255, 255, 0.3);
        }
        
        .delay-node-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 8px;
          opacity: 0.9;
        }
        
        .delay-node-content {
          font-size: 14px;
          font-weight: 500;
          line-height: 1.3;
        }
        
        .delay-node-input {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 4px;
          color: white;
          padding: 4px 8px;
          font-size: 14px;
          width: 100px;
          margin-bottom: 8px;
          text-align: center;
        }
        
        .delay-node-input::placeholder {
          color: rgba(255, 255, 255, 0.7);
        }
        
        .delay-node-buttons {
          display: flex;
          gap: 4px;
          justify-content: center;
        }
        
        .delay-node-btn {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 4px;
          color: white;
          padding: 2px 8px;
          font-size: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .delay-node-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        .delay-display {
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Courier New', monospace;
          font-weight: 600;
        }
        
        .delay-display:hover {
          opacity: 0.8;
        }
        
        .delay-label {
          font-size: 10px;
          opacity: 0.8;
          margin-bottom: 4px;
        }
      `}</style>
      
      <div className="delay-node-header">
        ⏱️ ATRASO
      </div>
      
      <div className="delay-node-content">
        {isEditing ? (
          <div>
            <div className="delay-label">Tempo (ms):</div>
            <input
              type="number"
              value={delay}
              onChange={(e) => setDelay(e.target.value)}
              placeholder="1000"
              min="0"
              step="100"
              className="delay-node-input"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') setIsEditing(false);
              }}
            />
            <div className="delay-node-buttons">
              <button className="delay-node-btn" onClick={handleSave}>
                ✓
              </button>
              <button className="delay-node-btn" onClick={() => setIsEditing(false)}>
                ✕
              </button>
            </div>
          </div>
        ) : (
          <div 
            className="delay-display"
            onClick={() => setIsEditing(true)}
          >
            {formatDelay(delay)}
          </div>
        )}
      </div>
      
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        isConnectable={isConnectable}
        style={{
          background: '#ffffff',
          border: '2px solid #f59e0b',
          width: '12px',
          height: '12px',
        }}
      />
      
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        isConnectable={isConnectable}
        style={{
          background: '#ffffff',
          border: '2px solid #f59e0b',
          width: '12px',
          height: '12px',
        }}
      />
    </div>
  );
};

export default DelayNode;