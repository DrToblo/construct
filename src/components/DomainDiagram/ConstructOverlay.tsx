interface ConstructOverlayProps {
  startResidue: number;
  endResidue: number;
  sequenceLength: number;
  svgWidth: number;
  svgHeight: number;
}

export function ConstructOverlay({
  startResidue,
  endResidue,
  sequenceLength,
  svgWidth,
  svgHeight,
}: ConstructOverlayProps) {
  const x = (startResidue / sequenceLength) * svgWidth;
  const w = Math.max(2, ((endResidue - startResidue + 1) / sequenceLength) * svgWidth);

  return (
    <g pointerEvents="none">
      {/* Semi-transparent fill */}
      <rect
        x={x}
        y={0}
        width={w}
        height={svgHeight}
        fill="#16a34a"
        fillOpacity={0.15}
      />
      {/* Left border */}
      <line x1={x} y1={0} x2={x} y2={svgHeight} stroke="#16a34a" strokeWidth={2} />
      {/* Right border */}
      <line
        x1={x + w}
        y1={0}
        x2={x + w}
        y2={svgHeight}
        stroke="#16a34a"
        strokeWidth={2}
      />
    </g>
  );
}
