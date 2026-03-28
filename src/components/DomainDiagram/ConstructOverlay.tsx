interface ConstructOverlayProps {
  startResidue: number;
  endResidue: number;
  sequenceLength: number;
  svgWidth: number;
  svgHeight: number;
  hoverHandle?: 'start' | 'end' | null;
}

export function ConstructOverlay({
  startResidue,
  endResidue,
  sequenceLength,
  svgWidth,
  svgHeight,
  hoverHandle = null,
}: ConstructOverlayProps) {
  const x1 = (startResidue / sequenceLength) * svgWidth;
  const x2 = (endResidue / sequenceLength) * svgWidth;
  const w = Math.max(2, x2 - x1);
  const mid = x1 + w / 2;
  const cy = svgHeight / 2;

  return (
    <g pointerEvents="none">
      {/* Semi-transparent fill */}
      <rect x={x1} y={0} width={w} height={svgHeight} fill="#16a34a" fillOpacity={0.15} />
      {/* Left border */}
      <line x1={x1} y1={0} x2={x1} y2={svgHeight} stroke="#16a34a" strokeWidth={2} />
      {/* Right border */}
      <line x1={x1 + w} y1={0} x2={x1 + w} y2={svgHeight} stroke="#16a34a" strokeWidth={2} />
      {/* Start handle */}
      <circle cx={x1} cy={cy} r={hoverHandle === 'start' ? 7 : 5} fill="#16a34a" stroke="white" strokeWidth={hoverHandle === 'start' ? 1.5 : 0} />
      {/* End handle */}
      <circle cx={x1 + w} cy={cy} r={hoverHandle === 'end' ? 7 : 5} fill="#16a34a" stroke="white" strokeWidth={hoverHandle === 'end' ? 1.5 : 0} />
      {/* Residue labels */}
      {w > 6 && (
        <text x={x1 + 4} y={11} fontSize={9} fill="#15803d" fontWeight={700} fontFamily="monospace">
          {startResidue}
        </text>
      )}
      {w > 30 && (
        <text x={x1 + w - 4} y={11} textAnchor="end" fontSize={9} fill="#15803d" fontWeight={700} fontFamily="monospace">
          {endResidue}
        </text>
      )}
      {w > 60 && (
        <text x={mid} y={cy + 4} textAnchor="middle" fontSize={10} fill="#15803d" fontWeight={700} fontFamily="monospace">
          {startResidue}–{endResidue}
        </text>
      )}
    </g>
  );
}
