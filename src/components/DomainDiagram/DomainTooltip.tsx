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
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          padding: '8px 10px',
          fontSize: '12px',
          color: '#1e293b',
          pointerEvents: 'none',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: '3px', wordBreak: 'break-all' }}>
          {domain.name}
        </div>
        <div style={{ color: '#64748b' }}>
          {domain.accession} · {domain.sourceDatabase}
        </div>
        <div style={{ color: '#94a3b8', marginTop: '2px' }}>
          Residues {domain.start}–{domain.end}
        </div>
      </div>
    </foreignObject>
  );
}
