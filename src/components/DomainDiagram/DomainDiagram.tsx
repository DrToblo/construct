import { useMemo, useRef, useState, useEffect } from 'react';
import type { Domain, PTM, PTMType } from '../../types/protein';
import { PTM_COLOR_HEX } from '../../constants/ptmColors';
import { DomainTrack } from './DomainTrack';
import { ConstructOverlay } from './ConstructOverlay';
import { DragOverlay } from './DragOverlay';
import { PdbTrack, pdbTrackHeight } from './PdbTrack';
import { useStore } from '../../store';

interface DomainDiagramProps {
  domains: Domain[];
  sequenceLength: number;
  ptms?: PTM[];
}

const LABEL_WIDTH = 60;
const TRACK_HEIGHT = 28;
const AXIS_HEIGHT = 20;
const PTM_ROW_HEIGHT = 18;
const SVG_PADDING = 8;


interface DragState {
  start: number;
  current: number;
}

export function DomainDiagram({ domains, sequenceLength, ptms = [] }: DomainDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [hoverResidue, setHoverResidue] = useState<number | null>(null);
  const dragRef = useRef<DragState | null>(null);
  dragRef.current = drag;

  const startResidue = useStore((s) => s.startResidue);
  const endResidue = useStore((s) => s.endResidue);
  const selectedSources = useStore((s) => s.selectedDomainSources);
  const setRange = useStore((s) => s.setRange);
  const pdbEntries = useStore((s) => s.pdbEntries);
  const showPdbTracks = useStore((s) => s.showPdbTracks);

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

  // Global mouseup to commit drag even if pointer leaves SVG
  useEffect(() => {
    if (!drag) return;
    function onGlobalMouseUp() {
      const d = dragRef.current;
      if (d) {
        const s = Math.min(d.start, d.current);
        const e = Math.max(d.start, d.current);
        setRange(s, e);
      }
      setDrag(null);
    }
    window.addEventListener('mouseup', onGlobalMouseUp);
    return () => window.removeEventListener('mouseup', onGlobalMouseUp);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag !== null]);

  const groups = useMemo(() => {
    const map = new Map<string, Domain[]>();
    for (const d of domains) {
      if (!selectedSources.includes(d.sourceDatabase)) continue;
      if (!map.has(d.sourceDatabase)) map.set(d.sourceDatabase, []);
      map.get(d.sourceDatabase)!.push(d);
    }
    return Array.from(map.entries());
  }, [domains, selectedSources]);

  const svgWidth = Math.max(0, containerWidth - LABEL_WIDTH - SVG_PADDING * 2);
  const hasPtms = ptms.length > 0;
  const showDomainTracks = groups.length > 0;
  const showPdbSection = showPdbTracks && pdbEntries.length > 0;
  const tracksHeight = groups.length * TRACK_HEIGHT;
  const pdbSecHeight = showPdbSection ? pdbTrackHeight(pdbEntries) : 0;
  const svgHeight = tracksHeight + pdbSecHeight + AXIS_HEIGHT + (hasPtms ? PTM_ROW_HEIGHT : 0);

  function clientXToResidue(clientX: number): number {
    const svg = svgRef.current;
    if (!svg) return 1;
    const rect = svg.getBoundingClientRect();
    const xInTrack = clientX - rect.left - LABEL_WIDTH;
    const residue = Math.round((xInTrack / svgWidth) * sequenceLength);
    return Math.max(1, Math.min(sequenceLength, residue));
  }

  function handleMouseDown(e: React.MouseEvent<SVGSVGElement>) {
    if (e.button !== 0) return;
    // Only start drag in the track area (not the label zone)
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    if (e.clientX - rect.left < LABEL_WIDTH) return;
    const r = clientXToResidue(e.clientX);
    setDrag({ start: r, current: r });
    e.preventDefault();
  }

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    if (e.clientX - rect.left < LABEL_WIDTH) {
      setHoverResidue(null);
      return;
    }
    const r = clientXToResidue(e.clientX);
    setHoverResidue(r);
    if (drag) {
      setDrag((prev) => prev ? { ...prev, current: r } : null);
    }
  }

  function handleMouseUp(e: React.MouseEvent<SVGSVGElement>) {
    if (!drag) return;
    const r = clientXToResidue(e.clientX);
    const s = Math.min(drag.start, r);
    const end = Math.max(drag.start, r);
    setRange(s, end);
    setDrag(null);
  }

  function handleMouseLeave() {
    setHoverResidue(null);
  }

  function axisTicks() {
    const ticks: number[] = [];
    const step = sequenceLength > 1000 ? 200 : sequenceLength > 400 ? 100 : 50;
    for (let i = 0; i <= sequenceLength; i += step) ticks.push(i);
    return ticks;
  }

  const dragMin = drag ? Math.min(drag.start, drag.current) : null;
  const dragMax = drag ? Math.max(drag.start, drag.current) : null;

  // Hover cursor x position (within tracks group coordinate)
  const hoverX = hoverResidue != null ? (hoverResidue / sequenceLength) * svgWidth : null;

  if (!showDomainTracks && !showPdbSection) {
    const msg = domains.length === 0
      ? 'No domain annotations found'
      : 'No sources selected. Use the menu above to enable domain tracks.';
    return (
      <div style={{ padding: '12px 16px', color: '#94a3b8', fontSize: 13, fontStyle: 'italic', background: '#ffffff' }}>
        {msg}
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ width: '100%', overflowX: 'auto', padding: SVG_PADDING, background: '#ffffff' }}>
      <svg
        ref={svgRef}
        width={svgWidth + LABEL_WIDTH}
        height={svgHeight}
        style={{
          display: 'block',
          fontFamily: 'monospace',
          cursor: drag ? 'col-resize' : 'crosshair',
          userSelect: 'none',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {/* Axis */}
        <g transform={`translate(${LABEL_WIDTH}, ${tracksHeight + pdbSecHeight})`}>
          <line x1={0} y1={0} x2={svgWidth} y2={0} stroke="#e2e8f0" strokeWidth={1} />
          {axisTicks().map((tick) => {
            const x = (tick / sequenceLength) * svgWidth;
            return (
              <g key={tick}>
                <line x1={x} y1={0} x2={x} y2={5} stroke="#e2e8f0" strokeWidth={1} />
                <text x={x} y={16} textAnchor="middle" fontSize={9} fill="#94a3b8">{tick}</text>
              </g>
            );
          })}
        </g>

        {/* PTM row */}
        {hasPtms && (
          <g transform={`translate(${LABEL_WIDTH}, ${tracksHeight + pdbSecHeight + AXIS_HEIGHT})`}>
            {/* Row label in the reserved label area */}
            <text
              x={-LABEL_WIDTH + 4}
              y={PTM_ROW_HEIGHT / 2 + 3}
              fontSize={9}
              fill="#94a3b8"
              fontFamily="monospace"
            >
              Mods
            </text>
            {/* Baseline */}
            <line x1={0} y1={PTM_ROW_HEIGHT / 2} x2={svgWidth} y2={PTM_ROW_HEIGHT / 2} stroke="#f1f5f9" strokeWidth={1} />
            {/* PTM markers */}
            {ptms.map((ptm, i) => {
              const x = (ptm.position / sequenceLength) * svgWidth;
              const color = PTM_COLOR_HEX[ptm.type] ?? '#8b5cf6';
              const cy = PTM_ROW_HEIGHT / 2;
              const s = 4; // half-size of diamond
              return (
                <g key={i} style={{ cursor: 'default' }}>
                  {/* Diamond shape */}
                  <polygon
                    points={`${x},${cy - s} ${x + s},${cy} ${x},${cy + s} ${x - s},${cy}`}
                    fill={color}
                    fillOpacity={0.85}
                    stroke={color}
                    strokeWidth={0.5}
                  >
                    <title>{ptm.type}: {ptm.description} (pos {ptm.position})</title>
                  </polygon>
                </g>
              );
            })}
            {/* PTM legend */}
            {(() => {
              const types = Array.from(new Set(ptms.map((p) => p.type)));
              return types.map((t, i) => (
                <g key={t} transform={`translate(${svgWidth - types.length * 68 + i * 68}, 0)`}>
                  <polygon
                    points={`${0},${-3} ${4},${PTM_ROW_HEIGHT / 2 - 1} ${0},${PTM_ROW_HEIGHT - 1} ${-4},${PTM_ROW_HEIGHT / 2 - 1}`}
                    fill={PTM_COLOR_HEX[t] ?? '#8b5cf6'}
                    fillOpacity={0.85}
                  />
                  <text x={6} y={PTM_ROW_HEIGHT / 2 + 3} fontSize={8} fill="#64748b" fontFamily="monospace">
                    {t}
                  </text>
                </g>
              ));
            })()}
          </g>
        )}

        {/* Tracks group */}
        <g transform={`translate(${LABEL_WIDTH}, 0)`}>
          {/* Transparent interaction backdrop */}
          <rect x={0} y={0} width={svgWidth} height={tracksHeight} fill="transparent" />

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

          {/* Committed construct overlay (green) */}
          {!drag && startResidue != null && endResidue != null && (
            <ConstructOverlay
              startResidue={startResidue}
              endResidue={endResidue}
              sequenceLength={sequenceLength}
              svgWidth={svgWidth}
              svgHeight={tracksHeight}
            />
          )}

          {/* Active drag overlay (blue) */}
          {drag && dragMin != null && dragMax != null && (
            <DragOverlay
              startResidue={dragMin}
              endResidue={dragMax}
              sequenceLength={sequenceLength}
              svgWidth={svgWidth}
              svgHeight={tracksHeight}
            />
          )}

          {/* Hover cursor */}
          {hoverX != null && !drag && (
            <g pointerEvents="none">
              <line
                x1={hoverX}
                y1={0}
                x2={hoverX}
                y2={tracksHeight}
                stroke="#94a3b8"
                strokeWidth={1}
                strokeDasharray="3,2"
              />
              <rect
                x={hoverX - 14}
                y={tracksHeight - 16}
                width={28}
                height={14}
                rx={2}
                fill="#1e293b"
                fillOpacity={0.75}
              />
              <text
                x={hoverX}
                y={tracksHeight - 5}
                textAnchor="middle"
                fontSize={9}
                fill="#f8fafc"
                fontFamily="monospace"
              >
                {hoverResidue}
              </text>
            </g>
          )}
        </g>

        {/* PDB structures track */}
        {showPdbSection && (
          <PdbTrack
            entries={pdbEntries}
            sequenceLength={sequenceLength}
            svgWidth={svgWidth}
            yOffset={tracksHeight}
            labelWidth={LABEL_WIDTH}
          />
        )}
      </svg>

      {/* Interaction hint */}
      {!drag && (
        <div style={{ fontSize: 10, color: '#94a3b8', padding: '2px 4px', textAlign: 'right' }}>
          Click and drag to select a construct range
        </div>
      )}
    </div>
  );
}
