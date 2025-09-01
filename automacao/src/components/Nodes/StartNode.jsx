import { Handle, Position } from 'reactflow';
import { useState } from 'react';

const StartNode = ({ data, isConnectable }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="start-node"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <style>{`
        .start-node {
          width: 80px;
          height: 80px;
          background: linear-gradient(145deg, #10b981 0%, #059669 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
          border: 3px solid rgba(255, 255, 255, 0.9);
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
        }
        
        .start-node:hover {
          transform: scale(1.1);
          box-shadow: 0 12px 32px rgba(16, 185, 129, 0.5);
        }
        
        .start-node-play {
          width: 0;
          height: 0;
          border-left: 28px solid white;
          border-top: 16px solid transparent;
          border-bottom: 16px solid transparent;
          margin-left: 6px;
        }
        
        .start-node-label {
          position: absolute;
          bottom: -25px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 12px;
          font-weight: 600;
          color: #059669;
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .start-node:hover .start-node-label {
          opacity: 1;
        }
      `}</style>
      
      <div className="start-node-play"></div>
      
      <div className="start-node-label">
        INÍCIO
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        isConnectable={isConnectable}
        style={{
          background: '#ffffff',
          border: '2px solid #10b981',
          width: '12px',
          height: '12px',
          right: '-6px',
        }}
      />
    </div>
  );
};

export default StartNode;