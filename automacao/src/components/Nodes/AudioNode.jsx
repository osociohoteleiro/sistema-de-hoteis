import { Handle, Position } from 'reactflow';
import { useState } from 'react';

const AudioNode = ({ data, isConnectable }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [url, setUrl] = useState(data?.config?.url || '');
  const [title, setTitle] = useState(data?.config?.title || 'Áudio');

  const handleSave = () => {
    if (data.config) {
      data.config.url = url;
      data.config.title = title;
    }
    setIsEditing(false);
  };

  return (
    <div className="audio-node">
      <style>{`
        .audio-node {
          background: linear-gradient(145deg, #06b6d4 0%, #0891b2 100%);
          color: white;
          border-radius: 8px;
          padding: 12px 16px;
          min-width: 160px;
          text-align: center;
          box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
          border: 2px solid rgba(255, 255, 255, 0.3);
        }
        
        .audio-node-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 8px;
          opacity: 0.9;
        }
        
        .audio-node-content {
          font-size: 14px;
          font-weight: 500;
          line-height: 1.3;
        }
        
        .audio-node-input {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 4px;
          color: white;
          padding: 4px 8px;
          font-size: 12px;
          width: 100%;
          margin-bottom: 6px;
        }
        
        .audio-node-input::placeholder {
          color: rgba(255, 255, 255, 0.7);
        }
        
        .audio-node-buttons {
          display: flex;
          gap: 4px;
          justify-content: center;
        }
        
        .audio-node-btn {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 4px;
          color: white;
          padding: 2px 8px;
          font-size: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .audio-node-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        .audio-display {
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .audio-display:hover {
          opacity: 0.8;
        }
        
        .audio-placeholder {
          width: 60px;
          height: 40px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.2);
          margin: 4px auto;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          position: relative;
        }
        
        .audio-waves {
          position: absolute;
          display: flex;
          gap: 2px;
          align-items: center;
        }
        
        .wave-bar {
          width: 2px;
          background: rgba(255, 255, 255, 0.6);
          border-radius: 1px;
          animation: wave 1.5s infinite ease-in-out;
        }
        
        .wave-bar:nth-child(1) { height: 8px; animation-delay: 0s; }
        .wave-bar:nth-child(2) { height: 12px; animation-delay: 0.2s; }
        .wave-bar:nth-child(3) { height: 6px; animation-delay: 0.4s; }
        .wave-bar:nth-child(4) { height: 10px; animation-delay: 0.6s; }
        .wave-bar:nth-child(5) { height: 8px; animation-delay: 0.8s; }
        
        @keyframes wave {
          0%, 40%, 100% { transform: scaleY(0.4); }
          20% { transform: scaleY(1); }
        }
        
        .audio-title {
          font-size: 10px;
          opacity: 0.8;
          margin-top: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .input-label {
          font-size: 10px;
          opacity: 0.8;
          margin-bottom: 2px;
          text-align: left;
        }
      `}</style>
      
      <div className="audio-node-header">
        🎵 ÁUDIO
      </div>
      
      <div className="audio-node-content">
        {isEditing ? (
          <div>
            <div className="input-label">URL do áudio:</div>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://exemplo.com/audio.mp3"
              className="audio-node-input"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') setIsEditing(false);
              }}
            />
            <div className="input-label">Título:</div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título do áudio"
              className="audio-node-input"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') setIsEditing(false);
              }}
            />
            <div className="audio-node-buttons">
              <button className="audio-node-btn" onClick={handleSave}>
                ✓
              </button>
              <button className="audio-node-btn" onClick={() => setIsEditing(false)}>
                ✕
              </button>
            </div>
          </div>
        ) : (
          <div 
            className="audio-display"
            onClick={() => setIsEditing(true)}
          >
            <div className="audio-placeholder">
              🎧
              <div className="audio-waves">
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
              </div>
            </div>
            <div className="audio-title">{title}</div>
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
          border: '2px solid #06b6d4',
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
          border: '2px solid #06b6d4',
          width: '12px',
          height: '12px',
        }}
      />
    </div>
  );
};

export default AudioNode;