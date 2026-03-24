import { useMemo, useRef, useState, useEffect } from 'react';
import type { Domain } from '../../types/protein';
import { DomainTrack } from './DomainTrack';
import { ConstructOverlay } from './ConstructOverlay';
import { useStore } from '../../store';

interface DomainDiagramProps {
  domains: Domain[];
  sequenceLength: number;
}

const LABEL_WIDTH = 60; // reserved for database name label
const TRACK_HEIGHT = 28;
const AXIS_HEIGHT = 20;
const SVG_PADDING = 8;

export function DomainDiagram({ domains, sequenceLength }: DomainDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);

  const startResidue = useStore((s) => s.startResidue);
  const endResidue = useStore((s) => s.endResidue);

  // Observe container width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 800;
      setContainerWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Group domains by source database
  const groups = useMemo(() => {
    const map = new Map<string, Domain[]>();
    for (const d of domains) {
      if (!map.has(d.sourceDatabase)) map.set(d.sourceDatabase, []);
      map.get(d.sourceDatabase)!.push(d);
    }
    return Array.from(map.entries());
  }, [domains]);

  const svgWidth = Math.max(0, containerWidth - LABEL_WIDTH - SVG_PADDING * 2);
  const svgHeight = groups.length * TRACK_HEIGHT + AXIS_HEIGHT;

  // Axis tick marks
  function axisTicks() {
    const ticks: number[] = [];
    const step = sequenceLength > 1000 ? 200 : sequenceLength > 400 ? 100 : 50;
    for (let i = 0; i <= sequenceLength; i += step) ticks.push(i);
    return ticks;
  }

  if (domains.length === 0) {
    return (
      <div
        style={{
          padding: '12px 16px',
          color: '#6b7280',
          fontSize: '13px',
          fontStyle: 'italic',
        }}
      >
        No domain annotations found
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ width: '100%', overflowX: 'auto', padding: `${SVG_PADDING}px` }}>
      <svg
        width={svgWidth + LABEL_WIDTH}
        height={svgHeight}
        style={{ display: 'block', fontFamily: 'monospace' }}
      >
        {/* Axis */}
        <g transform={`translate(${LABEL_WIDTH}, ${groups.length * TRACK_HEIGHT})`}>
          <line x1={0} y1={0} x2={svgWidth} y2={0} stroke="#4b5563" strokeWidth={1} />
          {axisTicks().map((tick) => {
            const x = (tick / sequenceLength) * svgWidth;
            return (
              <g key={tick}>
                <line x1={x} y1={0} x2={x} y2={5} stroke="#4b5563" strokeWidth={1} />
                <text x={x} y={16} textAnchor="middle" fontSize={9} fill="#6b7280">
                  {tick}
                </text>
              </g>
            );
          })}
        </g>

        {/* Tracks */}
        <g transform={`translate(${LABEL_WIDTH}, 0)`}>
          {groups.map(([db, dbDomains], i) => (
            <DomainTrack
              key={db}
              sourceDatabase={db}
              domains={dbDomains}
              sequenceLength={sequenceLength}
              svgWidth={svgWidth}
              y={i * TRACK_HEIGHT}
              trackHeight={TRACK_HEIGHT}
            />
          ))}

          {/* Construct overlay on top of all tracks */}
          {startResidue != null && endResidue != null && (
            <ConstructOverlay
              startResidue={startResidue}
              endResidue={endResidue}
              sequenceLength={sequenceLength}
              svgWidth={svgWidth}
              svgHeight={groups.length * TRACK_HEIGHT}
            />
          )}
        </g>
      </svg>
    </div>
  );
}
