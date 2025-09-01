import { Handle, Position } from 'reactflow';
import { useState } from 'react';

const ImageNode = ({ data, isConnectable }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [url, setUrl] = useState(data?.config?.url || '');
  const [alt, setAlt] = useState(data?.config?.alt || 'Imagem');

  const handleSave = () => {
    if (data.config) {
      data.config.url = url;
      data.config.alt = alt;
    }
    setIsEditing(false);
  };

  return (
    <div className="image-node">
      <style>{`
        .image-node {
          background: linear-gradient(145deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
          border-radius: 8px;
          padding: 12px 16px;
          min-width: 160px;
          text-align: center;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
          border: 2px solid rgba(255, 255, 255, 0.3);
        }
        
        .image-node-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 8px;
          opacity: 0.9;
        }
        
        .image-node-content {
          font-size: 14px;
          font-weight: 500;
          line-height: 1.3;
        }
        
        .image-node-input {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 4px;
          color: white;
          padding: 4px 8px;
          font-size: 12px;
          width: 100%;
          margin-bottom: 6px;
        }
        
        .image-node-input::placeholder {
          color: rgba(255, 255, 255, 0.7);
        }
        
        .image-node-buttons {
          display: flex;
          gap: 4px;
          justify-content: center;
        }
        
        .image-node-btn {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 4px;
          color: white;
          padding: 2px 8px;
          font-size: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .image-node-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        .image-display {
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .image-display:hover {
          opacity: 0.8;
        }
        
        .image-preview {
          width: 40px;
          height: 40px;
          border-radius: 4px;
          object-fit: cover;
          margin: 4px auto;
          display: block;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .image-placeholder {
          width: 40px;
          height: 40px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.2);
          margin: 4px auto;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .image-alt {
          font-size: 10px;
          opacity: 0.8;
          margin-top: 4px;
        }
        
        .input-label {
          font-size: 10px;
          opacity: 0.8;
          margin-bottom: 2px;
          text-align: left;
        }
      `}</style>
      
      <div className="image-node-header">
        🖼️ IMAGEM
      </div>
      
      <div className="image-node-content">
        {isEditing ? (
          <div>
            <div className="input-label">URL da imagem:</div>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://exemplo.com/imagem.jpg"
              className="image-node-input"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') setIsEditing(false);
              }}
            />
            <div className="input-label">Texto alternativo:</div>
            <input
              type="text"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Descrição da imagem"
              className="image-node-input"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') setIsEditing(false);
              }}
            />
            <div className="image-node-buttons">
              <button className="image-node-btn" onClick={handleSave}>
                ✓
              </button>
              <button className="image-node-btn" onClick={() => setIsEditing(false)}>
                ✕
              </button>
            </div>
          </div>
        ) : (
          <div 
            className="image-display"
            onClick={() => setIsEditing(true)}
          >
            {url ? (
              <img 
                src={url} 
                alt={alt} 
                className="image-preview"
                onError={(e) => e.target.style.display = 'none'}
              />
            ) : (
              <div className="image-placeholder">
                🖼️
              </div>
            )}
            <div className="image-alt">{alt}</div>
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
          border: '2px solid #8b5cf6',
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
          border: '2px solid #8b5cf6',
          width: '12px',
          height: '12px',
        }}
      />
    </div>
  );
};

export default ImageNode;