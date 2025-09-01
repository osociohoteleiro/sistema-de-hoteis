import { Handle, Position } from 'reactflow';
import { useState } from 'react';

const VideoNode = ({ data, isConnectable }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [url, setUrl] = useState(data?.config?.url || '');
  const [title, setTitle] = useState(data?.config?.title || 'Vídeo');

  const handleSave = () => {
    if (data.config) {
      data.config.url = url;
      data.config.title = title;
    }
    setIsEditing(false);
  };

  return (
    <div className="video-node">
      <style>{`
        .video-node {
          background: linear-gradient(145deg, #ef4444 0%, #dc2626 100%);
          color: white;
          border-radius: 8px;
          padding: 12px 16px;
          min-width: 160px;
          text-align: center;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
          border: 2px solid rgba(255, 255, 255, 0.3);
        }
        
        .video-node-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 8px;
          opacity: 0.9;
        }
        
        .video-node-content {
          font-size: 14px;
          font-weight: 500;
          line-height: 1.3;
        }
        
        .video-node-input {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 4px;
          color: white;
          padding: 4px 8px;
          font-size: 12px;
          width: 100%;
          margin-bottom: 6px;
        }
        
        .video-node-input::placeholder {
          color: rgba(255, 255, 255, 0.7);
        }
        
        .video-node-buttons {
          display: flex;
          gap: 4px;
          justify-content: center;
        }
        
        .video-node-btn {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 4px;
          color: white;
          padding: 2px 8px;
          font-size: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .video-node-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        .video-display {
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .video-display:hover {
          opacity: 0.8;
        }
        
        .video-placeholder {
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
        
        .play-button {
          position: absolute;
          width: 16px;
          height: 16px;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          color: #ef4444;
        }
        
        .video-title {
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
      
      <div className="video-node-header">
        🎥 VÍDEO
      </div>
      
      <div className="video-node-content">
        {isEditing ? (
          <div>
            <div className="input-label">URL do vídeo:</div>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://exemplo.com/video.mp4"
              className="video-node-input"
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
              placeholder="Título do vídeo"
              className="video-node-input"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') setIsEditing(false);
              }}
            />
            <div className="video-node-buttons">
              <button className="video-node-btn" onClick={handleSave}>
                ✓
              </button>
              <button className="video-node-btn" onClick={() => setIsEditing(false)}>
                ✕
              </button>
            </div>
          </div>
        ) : (
          <div 
            className="video-display"
            onClick={() => setIsEditing(true)}
          >
            <div className="video-placeholder">
              🎬
              <div className="play-button">▶</div>
            </div>
            <div className="video-title">{title}</div>
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
          border: '2px solid #ef4444',
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
          border: '2px solid #ef4444',
          width: '12px',
          height: '12px',
        }}
      />
    </div>
  );
};

export default VideoNode;