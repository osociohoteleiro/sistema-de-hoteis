import { Handle, Position } from 'reactflow';
import { useState } from 'react';

const WebhookNode = ({ data, isConnectable }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [url, setUrl] = useState(data?.config?.url || '');
  const [method, setMethod] = useState(data?.config?.method || 'POST');

  const handleSave = () => {
    if (data.config) {
      data.config.url = url;
      data.config.method = method;
    }
    setIsEditing(false);
  };

  const getMethodColor = (method) => {
    switch (method) {
      case 'GET': return '#10b981';
      case 'POST': return '#3b82f6';
      case 'PUT': return '#f59e0b';
      case 'DELETE': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="webhook-node">
      <style>{`
        .webhook-node {
          background: linear-gradient(145deg, #6366f1 0%, #4f46e5 100%);
          color: white;
          border-radius: 8px;
          padding: 12px 16px;
          min-width: 180px;
          text-align: center;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
          border: 2px solid rgba(255, 255, 255, 0.3);
        }
        
        .webhook-node-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 8px;
          opacity: 0.9;
        }
        
        .webhook-node-content {
          font-size: 14px;
          font-weight: 500;
          line-height: 1.3;
        }
        
        .webhook-node-input {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 4px;
          color: white;
          padding: 4px 8px;
          font-size: 12px;
          width: 100%;
          margin-bottom: 6px;
        }
        
        .webhook-node-select {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 4px;
          color: white;
          padding: 4px 8px;
          font-size: 12px;
          width: 100%;
          margin-bottom: 6px;
        }
        
        .webhook-node-input::placeholder {
          color: rgba(255, 255, 255, 0.7);
        }
        
        .webhook-node-buttons {
          display: flex;
          gap: 4px;
          justify-content: center;
        }
        
        .webhook-node-btn {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 4px;
          color: white;
          padding: 2px 8px;
          font-size: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .webhook-node-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        .webhook-display {
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .webhook-display:hover {
          opacity: 0.8;
        }
        
        .webhook-icon {
          font-size: 24px;
          margin-bottom: 6px;
        }
        
        .webhook-method {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          margin-bottom: 4px;
        }
        
        .webhook-url {
          font-size: 10px;
          opacity: 0.8;
          font-family: 'Courier New', monospace;
          word-break: break-all;
          margin-top: 4px;
        }
        
        .input-label {
          font-size: 10px;
          opacity: 0.8;
          margin-bottom: 2px;
          text-align: left;
        }
      `}</style>
      
      <div className="webhook-node-header">
        🔗 WEBHOOK
      </div>
      
      <div className="webhook-node-content">
        {isEditing ? (
          <div>
            <div className="input-label">Método:</div>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="webhook-node-select"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
            </select>
            <div className="input-label">URL:</div>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.exemplo.com/webhook"
              className="webhook-node-input"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') setIsEditing(false);
              }}
            />
            <div className="webhook-node-buttons">
              <button className="webhook-node-btn" onClick={handleSave}>
                ✓
              </button>
              <button className="webhook-node-btn" onClick={() => setIsEditing(false)}>
                ✕
              </button>
            </div>
          </div>
        ) : (
          <div 
            className="webhook-display"
            onClick={() => setIsEditing(true)}
          >
            <div className="webhook-icon">🌐</div>
            <div 
              className="webhook-method"
              style={{ backgroundColor: getMethodColor(method) }}
            >
              {method}
            </div>
            <div className="webhook-url">
              {url || 'Clique para configurar'}
            </div>
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
          border: '2px solid #6366f1',
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
          border: '2px solid #6366f1',
          width: '12px',
          height: '12px',
        }}
      />
    </div>
  );
};

export default WebhookNode;