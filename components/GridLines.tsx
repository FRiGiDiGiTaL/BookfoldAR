import React from 'react';

interface GridLinesProps {
  width: number;
  height: number;
  isVisible: boolean;
  gridType?: 'rule-of-thirds' | 'quarters' | 'golden-ratio';
  opacity?: number;
  color?: string;
}

export const GridLines: React.FC<GridLinesProps> = ({
  width,
  height,
  isVisible,
  gridType = 'rule-of-thirds',
  opacity = 0.3,
  color = '#60a5fa'
}) => {
  if (!isVisible) return null;

  const getGridLines = () => {
    const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];

    switch (gridType) {
      case 'rule-of-thirds':
        // Vertical lines
        lines.push(
          { x1: width / 3, y1: 0, x2: width / 3, y2: height },
          { x1: (width * 2) / 3, y1: 0, x2: (width * 2) / 3, y2: height }
        );
        // Horizontal lines
        lines.push(
          { x1: 0, y1: height / 3, x2: width, y2: height / 3 },
          { x1: 0, y1: (height * 2) / 3, x2: width, y2: (height * 2) / 3 }
        );
        break;

      case 'quarters':
        // Vertical lines
        lines.push(
          { x1: width / 4, y1: 0, x2: width / 4, y2: height },
          { x1: width / 2, y1: 0, x2: width / 2, y2: height },
          { x1: (width * 3) / 4, y1: 0, x2: (width * 3) / 4, y2: height }
        );
        // Horizontal lines
        lines.push(
          { x1: 0, y1: height / 4, x2: width, y2: height / 4 },
          { x1: 0, y1: height / 2, x2: width, y2: height / 2 },
          { x1: 0, y1: (height * 3) / 4, x2: width, y2: (height * 3) / 4 }
        );
        break;

      case 'golden-ratio':
        const goldenRatio = 1.618;
        const vGolden1 = width / goldenRatio;
        const vGolden2 = width - vGolden1;
        const hGolden1 = height / goldenRatio;
        const hGolden2 = height - hGolden1;

        // Vertical lines
        lines.push(
          { x1: vGolden1, y1: 0, x2: vGolden1, y2: height },
          { x1: vGolden2, y1: 0, x2: vGolden2, y2: height }
        );
        // Horizontal lines
        lines.push(
          { x1: 0, y1: hGolden1, x2: width, y2: hGolden1 },
          { x1: 0, y1: hGolden2, x2: width, y2: hGolden2 }
        );
        break;
    }

    return lines;
  };

  const lines = getGridLines();

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-5"
      width={width}
      height={height}
      style={{ opacity }}
    >
      <defs>
        <pattern
          id="grid-dots"
          patternUnits="userSpaceOnUse"
          width="20"
          height="20"
        >
          <circle cx="10" cy="10" r="1" fill={color} opacity="0.5" />
        </pattern>
      </defs>

      {/* Grid lines */}
      {lines.map((line, index) => (
        <line
          key={index}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke={color}
          strokeWidth="1"
          strokeDasharray="5,5"
          className="grid-line"
          style={{
            filter: 'drop-shadow(0 0 2px rgba(0, 0, 0, 0.5))'
          }}
        />
      ))}

      {/* Intersection points (focal points) */}
      {gridType === 'rule-of-thirds' && (
        <>
          <circle cx={width / 3} cy={height / 3} r="3" fill={color} opacity="0.8" />
          <circle cx={(width * 2) / 3} cy={height / 3} r="3" fill={color} opacity="0.8" />
          <circle cx={width / 3} cy={(height * 2) / 3} r="3" fill={color} opacity="0.8" />
          <circle cx={(width * 2) / 3} cy={(height * 2) / 3} r="3" fill={color} opacity="0.8" />
        </>
      )}

      {/* Center line for alignment */}
      <line
        x1={width / 2}
        y1="0"
        x2={width / 2}
        y2={height}
        stroke={color}
        strokeWidth="2"
        opacity="0.4"
        strokeDasharray="10,10"
      />
    </svg>
  );
};

interface GridControlsProps {
  isVisible: boolean;
  onToggle: () => void;
  gridType: 'rule-of-thirds' | 'quarters' | 'golden-ratio';
  onGridTypeChange: (type: 'rule-of-thirds' | 'quarters' | 'golden-ratio') => void;
  opacity: number;
  onOpacityChange: (opacity: number) => void;
}

export const GridControls: React.FC<GridControlsProps> = ({
  isVisible,
  onToggle,
  gridType,
  onGridTypeChange,
  opacity,
  onOpacityChange
}) => {
  return (
    <div className="glass-card rounded-lg p-3 mb-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-300 flex items-center">
          📐 Alignment Grid
        </h4>
        <button
          onClick={onToggle}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
            isVisible 
              ? 'glass-button text-blue-300' 
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
          }`}
        >
          {isVisible ? 'Hide' : 'Show'}
        </button>
      </div>

      {isVisible && (
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Grid Type:</label>
            <select
              value={gridType}
              onChange={(e) => onGridTypeChange(e.target.value as any)}
              className="glass-input w-full text-xs rounded px-2 py-1"
            >
              <option value="rule-of-thirds">Rule of Thirds</option>
              <option value="quarters">Quarters</option>
              <option value="golden-ratio">Golden Ratio</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Opacity: {Math.round(opacity * 100)}%
            </label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={opacity}
              onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};