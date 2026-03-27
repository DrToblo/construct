interface DragOverlayProps {
  startResidue: number;
  endResidue: number;
  sequenceLength: number;
  svgWidth: number;
  svgHeight: number;
}

export function DragOverlay({
  startResidue,
  endResidue,
  sequenceLength,
  svgWidth,
  svgHeight,
}: DragOverlayProps) {
  const x1 = (startResidue / sequenceLength) * svgWidth;
  const x2 = (endResidue / sequenceLength) * svgWidth;
  const w = Math.max(2, x2 - x1);
  const mid = x1 + w / 2;

  return (
    <g pointerEvents="none">
      {/* Fill */}
      <rect x={x1} y={0} width={w} height={svgHeight} fill="#2563eb" fillOpacity={0.18} />
      {/* Left edge */}
      <line x1={x1} y1={0} x2={x1} y2={svgHeight} stroke="#2563eb" strokeWidth={2} strokeDasharray="4,2" />
      {/* Right edge */}
      <line x1={x1 + w} y1={0} x2={x1 + w} y2={svgHeight} stroke="#2563eb" strokeWidth={2} strokeDasharray="4,2" />
      {/* Handles */}
      <circle cx={x1} cy={svgHeight / 2} r={5} fill="#2563eb" />
      <circle cx={x1 + w} cy={svgHeight / 2} r={5} fill="#2563eb" />
      {/* Residue labels inside overlay */}
      {w > 6 && (
        <text x={x1 + 4} y={11} fontSize={9} fill="#1d4ed8" fontWeight={700} fontFamily="monospace">
          {startResidue}
        </text>
      )}
      {w > 30 && (
        <text x={x1 + w - 4} y={11} textAnchor="end" fontSize={9} fill="#1d4ed8" fontWeight={700} fontFamily="monospace">
          {endResidue}
        </text>
      )}
      {/* Center range label */}
      {w > 60 && (
        <text x={mid} y={svgHeight / 2 + 4} textAnchor="middle" fontSize={10} fill="#1d4ed8" fontWeight={700} fontFamily="monospace">
          {startResidue}–{endResidue}
        </text>
      )}
    </g>
  );
}
