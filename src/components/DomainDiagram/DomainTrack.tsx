import { useState } from 'react';
import type { Domain } from '../../types/protein';
import { DomainTooltip } from './DomainTooltip';

// Deterministic color from string
function colorForDb(db: string): string {
  const palette = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#ef4444'];
  let hash = 0;
  for (let i = 0; i < db.length; i++) hash = (hash * 31 + db.charCodeAt(i)) & 0xffffffff;
  return palette[Math.abs(hash) % palette.length];
}

interface DomainTrackProps {
  sourceDatabase: string;
  domains: Domain[];
  sequenceLength: number;
  svgWidth: number;
  y: number;
  trackHeight: number;
}

export function DomainTrack({
  sourceDatabase,
  domains,
  sequenceLength,
  svgWidth,
  y,
  trackHeight,
}: DomainTrackProps) {
  const [tooltip, setTooltip] = useState<{ domain: Domain; x: number } | null>(null);
  const color = colorForDb(sourceDatabase);
  const padding = 4;
  const barY = y + padding;
  const barH = trackHeight - padding * 2;

  function pos(residue: number) {
    return (residue / sequenceLength) * svgWidth;
  }

  return (
    <g>
      {/* Track label */}
      <text
        x={4}
        y={y + trackHeight / 2 + 4}
        fontSize={10}
        fill="#6b7280"
        fontFamily="monospace"
      >
        {sourceDatabase}
      </text>

      {/* Baseline */}
      <line
        x1={0}
        y1={y + trackHeight / 2}
        x2={svgWidth}
        y2={y + trackHeight / 2}
        stroke="#374151"
        strokeWidth={1}
      />

      {/* Domain rectangles */}
      {domains.map((d, i) => {
        const x = pos(d.start);
        const w = Math.max(2, pos(d.end) - pos(d.start));
        return (
          <g key={`${d.accession}-${i}`}>
            <rect
              x={x}
              y={barY}
              width={w}
              height={barH}
              rx={3}
              fill={color}
              fillOpacity={0.85}
              stroke={color}
              strokeWidth={1}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setTooltip({ domain: d, x })}
              onMouseLeave={() => setTooltip(null)}
            />
            {w > 40 && (
              <text
                x={x + w / 2}
                y={barY + barH / 2 + 3}
                textAnchor="middle"
                fontSize={9}
                fill="#fff"
                fontWeight={600}
                pointerEvents="none"
                style={{ userSelect: 'none' }}
              >
                {d.name.length > 12 ? d.name.slice(0, 11) + '…' : d.name}
              </text>
            )}
          </g>
        );
      })}

      {tooltip && (
        <DomainTooltip
          domain={tooltip.domain}
          x={tooltip.x}
          y={y}
          svgWidth={svgWidth}
        />
      )}
    </g>
  );
}
