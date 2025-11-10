// components/tables/SpecialAreas.tsx
import React from 'react';

interface SpecialAreaProps {
  x: number;
  y: number;
  isDesignerMode: boolean;
  onDelete?: () => void;
}

// STAGE COMPONENT
export const Stage: React.FC<SpecialAreaProps> = ({ x, y, isDesignerMode, onDelete }) => {
  const width = 300;
  const height = 80;

  return (
    <div
      className="absolute cursor-move group"
      style={{ left: `${x}px`, top: `${y}px` }}
    >
      <svg width={width} height={height} xmlns="http://www.w3.org/2000/svg">
        {/* Stage background */}
        <rect
          width={width}
          height={height}
          rx="10"
          fill="#e8eaf6"
          stroke="#5c6bc0"
          strokeWidth="3"
          strokeDasharray="10,5"
        />

        {/* Curtain effect - left */}
        <path
          d={`M 0,0 Q 30,${height/2} 0,${height}`}
          fill="#7986cb"
          opacity="0.3"
        />

        {/* Curtain effect - right */}
        <path
          d={`M ${width},0 Q ${width-30},${height/2} ${width},${height}`}
          fill="#7986cb"
          opacity="0.3"
        />

        {/* Spotlight circles */}
        <circle cx={width * 0.25} cy={height / 2} r="8" fill="#FFD700" opacity="0.4" />
        <circle cx={width * 0.5} cy={height / 2} r="8" fill="#FFD700" opacity="0.4" />
        <circle cx={width * 0.75} cy={height / 2} r="8" fill="#FFD700" opacity="0.4" />

        {/* Label */}
        <text
          x={width / 2}
          y={height / 2 + 7}
          textAnchor="middle"
          fill="#5c6bc0"
          fontSize="20"
          fontWeight="bold"
        >
          🎭 STAGE
        </text>
      </svg>

      {isDesignerMode && onDelete && (
        <button
          onClick={onDelete}
          className="absolute -top-3 -right-3 w-7 h-7 bg-red-500 text-white rounded-full 
                     font-bold opacity-0 group-hover:opacity-100 transition-opacity
                     hover:bg-red-600 z-20"
        >
          ×
        </button>
      )}
    </div>
  );
};

// DANCE FLOOR COMPONENT
export const DanceFloor: React.FC<SpecialAreaProps> = ({ x, y, isDesignerMode, onDelete }) => {
  const size = 200;

  return (
    <div
      className="absolute cursor-move group"
      style={{ left: `${x}px`, top: `${y}px` }}
    >
      <svg width={size} height={size} xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Checkerboard pattern */}
          <pattern id="checkerboard" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="20" height="20" fill="#667eea" />
            <rect x="20" y="0" width="20" height="20" fill="#764ba2" />
            <rect x="0" y="20" width="20" height="20" fill="#764ba2" />
            <rect x="20" y="20" width="20" height="20" fill="#667eea" />
          </pattern>

          {/* Gradient overlay */}
          <radialGradient id="danceGlow">
            <stop offset="0%" stopColor="white" stopOpacity="0.2" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Dance floor base */}
        <rect
          width={size}
          height={size}
          rx="10"
          fill="url(#checkerboard)"
          stroke="#5568d3"
          strokeWidth="5"
        />

        {/* Glow effect */}
        <rect
          width={size}
          height={size}
          rx="10"
          fill="url(#danceGlow)"
        />

        {/* Label */}
        <text
          x={size / 2}
          y={size / 2 - 10}
          textAnchor="middle"
          fill="white"
          fontSize="24"
          fontWeight="bold"
          style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
        >
          💃
        </text>
        <text
          x={size / 2}
          y={size / 2 + 15}
          textAnchor="middle"
          fill="white"
          fontSize="18"
          fontWeight="bold"
          style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
        >
          DANCE FLOOR
        </text>
      </svg>

      {isDesignerMode && onDelete && (
        <button
          onClick={onDelete}
          className="absolute -top-3 -right-3 w-7 h-7 bg-red-500 text-white rounded-full 
                     font-bold opacity-0 group-hover:opacity-100 transition-opacity
                     hover:bg-red-600 z-20"
        >
          ×
        </button>
      )}
    </div>
  );
};

// BAR COMPONENT
export const Bar: React.FC<SpecialAreaProps> = ({ x, y, isDesignerMode, onDelete }) => {
  const width = 150;
  const height = 80;

  return (
    <div
      className="absolute cursor-move group"
      style={{ left: `${x}px`, top: `${y}px` }}
    >
      <svg width={width} height={height} xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Wood grain pattern */}
          <linearGradient id="woodGrain" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8B4513" />
            <stop offset="50%" stopColor="#A0522D" />
            <stop offset="100%" stopColor="#8B4513" />
          </linearGradient>
        </defs>

        {/* Bar counter */}
        <rect
          width={width}
          height={height}
          rx="10"
          fill="url(#woodGrain)"
          stroke="#654321"
          strokeWidth="3"
        />

        {/* Bar top shine */}
        <rect
          x="5"
          y="5"
          width={width - 10}
          height="15"
          rx="5"
          fill="white"
          opacity="0.2"
        />

        {/* Glass icons */}
        <circle cx={width * 0.3} cy={height * 0.6} r="6" fill="#87CEEB" opacity="0.6" />
        <circle cx={width * 0.5} cy={height * 0.6} r="6" fill="#FFD700" opacity="0.6" />
        <circle cx={width * 0.7} cy={height * 0.6} r="6" fill="#FF6347" opacity="0.6" />

        {/* Label */}
        <text
          x={width / 2}
          y={height - 15}
          textAnchor="middle"
          fill="white"
          fontSize="16"
          fontWeight="bold"
          style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}
        >
          🍸 BAR
        </text>
      </svg>

      {isDesignerMode && onDelete && (
        <button
          onClick={onDelete}
          className="absolute -top-3 -right-3 w-7 h-7 bg-red-500 text-white rounded-full 
                     font-bold opacity-0 group-hover:opacity-100 transition-opacity
                     hover:bg-red-600 z-20"
        >
          ×
        </button>
      )}
    </div>
  );
};

// BUFFET TABLE COMPONENT
export const BuffetTable: React.FC<SpecialAreaProps> = ({ x, y, isDesignerMode, onDelete }) => {
  const width = 300;
  const height = 100;

  return (
    <div
      className="absolute cursor-move group"
      style={{ left: `${x}px`, top: `${y}px` }}
    >
      <svg width={width} height={height} xmlns="http://www.w3.org/2000/svg">
        {/* Table */}
        <rect
          width={width}
          height={height}
          rx="10"
          fill="#fff8e1"
          stroke="#FF9800"
          strokeWidth="3"
          strokeDasharray="8,4"
        />

        {/* Table cloth pattern */}
        <rect
          x="5"
          y="5"
          width={width - 10}
          height={height - 10}
          rx="8"
          fill="white"
          opacity="0.3"
        />

        {/* Food icons */}
        <text x={width * 0.2} y={height / 2 + 8} fontSize="24">🍽️</text>
        <text x={width * 0.4} y={height / 2 + 8} fontSize="24">🥗</text>
        <text x={width * 0.6} y={height / 2 + 8} fontSize="24">🍲</text>
        <text x={width * 0.8} y={height / 2 + 8} fontSize="24">🥘</text>

        {/* Label */}
        <text
          x={width / 2}
          y={height - 20}
          textAnchor="middle"
          fill="#FF9800"
          fontSize="16"
          fontWeight="bold"
        >
          🍱 BUFFET
        </text>
      </svg>

      {isDesignerMode && onDelete && (
        <button
          onClick={onDelete}
          className="absolute -top-3 -right-3 w-7 h-7 bg-red-500 text-white rounded-full 
                     font-bold opacity-0 group-hover:opacity-100 transition-opacity
                     hover:bg-red-600 z-20"
        >
          ×
        </button>
      )}
    </div>
  );
};

// ENTRANCE COMPONENT
export const Entrance: React.FC<SpecialAreaProps> = ({ x, y, isDesignerMode, onDelete }) => {
  const width = 150;
  const height = 100;

  return (
    <div
      className="absolute cursor-move group"
      style={{ left: `${x}px`, top: `${y}px` }}
    >
      <svg width={width} height={height} xmlns="http://www.w3.org/2000/svg">
        {/* Double doors */}
        <rect
          x="10"
          y="10"
          width={width / 2 - 15}
          height={height - 20}
          rx="8"
          fill="#8B4513"
          stroke="#654321"
          strokeWidth="2"
        />
        <rect
          x={width / 2 + 5}
          y="10"
          width={width / 2 - 15}
          height={height - 20}
          rx="8"
          fill="#8B4513"
          stroke="#654321"
          strokeWidth="2"
        />

        {/* Door handles */}
        <circle cx={width / 2 - 10} cy={height / 2} r="4" fill="#FFD700" />
        <circle cx={width / 2 + 10} cy={height / 2} r="4" fill="#FFD700" />

        {/* Welcome mat */}
        <rect
          x="20"
          y={height - 15}
          width={width - 40}
          height="10"
          rx="2"
          fill="#DC143C"
        />

        {/* Label */}
        <text
          x={width / 2}
          y={height + 20}
          textAnchor="middle"
          fill="#2c3e50"
          fontSize="14"
          fontWeight="bold"
        >
          🚪 ENTRANCE
        </text>
      </svg>

      {isDesignerMode && onDelete && (
        <button
          onClick={onDelete}
          className="absolute -top-3 -right-3 w-7 h-7 bg-red-500 text-white rounded-full 
                     font-bold opacity-0 group-hover:opacity-100 transition-opacity
                     hover:bg-red-600 z-20"
        >
          ×
        </button>
      )}
    </div>
  );
};
