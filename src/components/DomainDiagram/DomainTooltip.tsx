import type { Domain } from '../../types/protein';

interface DomainTooltipProps {
  domain: Domain;
  x: number;
  y: number;
  svgWidth: number;
}

export function DomainTooltip({ domain, x, y, svgWidth }: DomainTooltipProps) {
  const width = 220;
  // Keep tooltip within SVG bounds
  const clampedX = Math.min(x, svgWidth - width - 8);

  return (
    <foreignObject x={clampedX} y={y - 70} width={width} height={80}>
      <div
        style={{
          background: '#1f2937',
          border: '1px solid #4b5563',
          borderRadius: '6px',
          padding: '8px 10px',
          fontSize: '12px',
          color: '#e2e8f0',
          pointerEvents: 'none',
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: '3px', wordBreak: 'break-all' }}>
          {domain.name}
        </div>
        <div style={{ color: '#9ca3af' }}>
          {domain.accession} · {domain.sourceDatabase}
        </div>
        <div style={{ color: '#6b7280', marginTop: '2px' }}>
          Residues {domain.start}–{domain.end}
        </div>
      </div>
    </foreignObject>
  );
}
