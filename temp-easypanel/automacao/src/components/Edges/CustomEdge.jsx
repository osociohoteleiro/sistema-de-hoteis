import { useState, useEffect, useRef } from 'react';
import { EdgeLabelRenderer, getBezierPath } from 'reactflow';

const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
  selected,
}) => {
  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const deleteButtonRef = useRef(null);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Parar animação após 2 segundos da criação da conexão
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsConnecting(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  // Detectar cliques fora do botão de delete
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDeleteButton && deleteButtonRef.current && !deleteButtonRef.current.contains(event.target)) {
        setShowDeleteButton(false);
      }
    };

    if (showDeleteButton) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showDeleteButton]);

  const onEdgeClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setShowDeleteButton(true);
  };

  const onDelete = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (data?.onEdgeDelete) {
      data.onEdgeDelete(id);
    }
    setShowDeleteButton(false);
  };

  // Definir estilos baseado no estado
  const getEdgeStyle = () => {
    if (showDeleteButton) {
      return {
        stroke: '#ef4444',
        strokeWidth: 3,
        strokeDasharray: '5, 5',
        animation: 'dash 0.5s linear infinite',
      };
    } else if (isConnecting) {
      return {
        stroke: '#3b82f6',
        strokeWidth: 2.5,
        strokeDasharray: '5, 5',
        animation: 'dash 0.8s linear infinite',
      };
    } else {
      return {
        stroke: '#3b82f6',
        strokeWidth: 1.5,
        strokeDasharray: 'none',
        animation: 'none',
      };
    }
  };

  return (
    <>
      <style>{`
        @keyframes dash {
          0% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: 20;
          }
        }
      `}</style>

      <path
        id={id}
        style={{
          ...style,
          ...getEdgeStyle(),
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          fill: 'none'
        }}
        d={edgePath}
        markerEnd={markerEnd}
        onClick={onEdgeClick}
      />

      {showDeleteButton && (
        <EdgeLabelRenderer>
          <div
            ref={deleteButtonRef}
            style={{
              position: 'absolute',
              left: labelX,
              top: labelY,
              pointerEvents: 'all',
            }}
          >
            <button
              onClick={onDelete}
              title="Remover conexão"
              style={{
                position: 'absolute',
                transform: 'translate(-50%, -50%)',
                width: '28px',
                height: '28px',
                background: 'linear-gradient(145deg, #ef4444 0%, #dc2626 100%)',
                border: '2px solid #ffffff',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '14px',
                color: 'white',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
                transition: 'all 0.2s ease',
                zIndex: 10000
              }}
            >
              🗑️
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default CustomEdge;