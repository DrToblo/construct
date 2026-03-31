import { useMemo, useRef, useState, useEffect } from 'react';
import type { Domain, PTM, PTMType, TransmembraneRegion, ProcessingRegion } from '../../types/protein';
import { PTM_COLOR_HEX } from '../../constants/ptmColors';
import { DomainTrack } from './DomainTrack';
import { ConstructOverlay } from './ConstructOverlay';
import { DragOverlay } from './DragOverlay';
import { PdbTrack, pdbTrackHeight } from './PdbTrack';
import { useStore } from '../../store';

const PROCESSING_COLORS: Record<string, string> = {
  Signal: '#7c3aed',
  Transit: '#0891b2',
  Propeptide: '#d97706',
  Chain: '#059669',
  Peptide: '#db2777',
};

function packRows<T extends { start: number; end: number }>(regions: T[]): T[][] {
  const sorted = [...regions].sort((a, b) => a.start - b.start);
  const rows: T[][] = [];
  for (const region of sorted) {
    let placed = false;
    for (const row of rows) {
      const last = row[row.length - 1];
      if (last.end < region.start) {
        row.push(region);
        placed = true;
        break;
      }
    }
    if (!placed) rows.push([region]);
  }
  return rows;
}

interface DomainDiagramProps {
  domains: Domain[];
  sequenceLength: number;
  ptms?: PTM[];
  tmRegions?: TransmembraneRegion[];
  processingRegions?: ProcessingRegion[];
}

const LABEL_WIDTH = 60;
const TRACK_HEIGHT = 28;
const AXIS_HEIGHT = 20;
const PTM_ROW_HEIGHT = 18;
const TM_ROW_HEIGHT = 16;
const SOL_ROW_HEIGHT = 20;
const SVG_PADDING = 8;


type DragMode = 'new' | 'handle-start' | 'handle-end';

interface DragState {
  mode: DragMode;
  anchor: number; // fixed end for handle drags; initial click pos for 'new'
  current: number;
}

export function DomainDiagram({ domains, sequenceLength, ptms = [], tmRegions = [], processingRegions = [] }: DomainDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [hoverResidue, setHoverResidue] = useState<number | null>(null);
  const [hoverHandle, setHoverHandle] = useState<'start' | 'end' | null>(null);
  const dragRef = useRef<DragState | null>(null);
  dragRef.current = drag;

  const startResidue = useStore((s) => s.startResidue);
  const endResidue = useStore((s) => s.endResidue);
  const selectedSources = useStore((s) => s.selectedDomainSources);
  const setRange = useStore((s) => s.setRange);
  const pdbEntries = useStore((s) => s.pdbEntries);
  const showPdbTracks = useStore((s) => s.showPdbTracks);
  const showProcessingTracks = useStore((s) => s.showProcessingTracks);
  const solubilityHits = useStore((s) => s.solubilityHits);
  const solubilityStatus = useStore((s) => s.solubilityStatus);

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
        const s = Math.min(d.anchor, d.current);
        const e = Math.max(d.anchor, d.current);
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
  const hasTmRegions = tmRegions.length > 0;
  const showDomainTracks = groups.length > 0;
  const showPdbSection = showPdbTracks && pdbEntries.length > 0;
  const showSolTrack = solubilityStatus !== 'idle';
  const tracksHeight = groups.length * TRACK_HEIGHT;
  const processingRows = useMemo(
    () => showProcessingTracks && processingRegions.length > 0 ? packRows(processingRegions) : [],
    [processingRegions, showProcessingTracks],
  );
  const processingSecHeight = processingRows.length * TRACK_HEIGHT;
  const tmSecHeight = hasTmRegions ? TM_ROW_HEIGHT : 0;
  const solSecHeight = showSolTrack ? SOL_ROW_HEIGHT : 0;
  const pdbSecHeight = showPdbSection ? pdbTrackHeight(pdbEntries) : 0;
  const svgHeight = tracksHeight + processingSecHeight + tmSecHeight + solSecHeight + pdbSecHeight + AXIS_HEIGHT + (hasPtms ? PTM_ROW_HEIGHT : 0);
  const showProcessingSection = processingRows.length > 0;

  function clientXToResidue(clientX: number): number {
    const svg = svgRef.current;
    if (!svg) return 1;
    const rect = svg.getBoundingClientRect();
    const xInTrack = clientX - rect.left - LABEL_WIDTH;
    const residue = Math.round((xInTrack / svgWidth) * sequenceLength);
    return Math.max(1, Math.min(sequenceLength, residue));
  }

  const HANDLE_HIT_PX = 12;

  function hitTestHandle(clientX: number, rect: DOMRect): 'start' | 'end' | null {
    if (startResidue == null || endResidue == null) return null;
    const startPx = rect.left + LABEL_WIDTH + (startResidue / sequenceLength) * svgWidth;
    const endPx   = rect.left + LABEL_WIDTH + (endResidue   / sequenceLength) * svgWidth;
    if (Math.abs(clientX - startPx) <= HANDLE_HIT_PX) return 'start';
    if (Math.abs(clientX - endPx)   <= HANDLE_HIT_PX) return 'end';
    return null;
  }

  function handleMouseDown(e: React.MouseEvent<SVGSVGElement>) {
    if (e.button !== 0) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    if (e.clientX - rect.left < LABEL_WIDTH) return;

    // Check if clicking on an existing handle
    const hit = hitTestHandle(e.clientX, rect);
    if (hit === 'start') {
      setDrag({ mode: 'handle-start', anchor: endResidue!, current: startResidue! });
      e.preventDefault();
      return;
    }
    if (hit === 'end') {
      setDrag({ mode: 'handle-end', anchor: startResidue!, current: endResidue! });
      e.preventDefault();
      return;
    }

    const r = clientXToResidue(e.clientX);
    setDrag({ mode: 'new', anchor: r, current: r });
    e.preventDefault();
  }

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    if (e.clientX - rect.left < LABEL_WIDTH) {
      setHoverResidue(null);
      setHoverHandle(null);
      return;
    }
    const r = clientXToResidue(e.clientX);
    setHoverResidue(r);
    if (drag) {
      setDrag((prev) => prev ? { ...prev, current: r } : null);
    } else {
      setHoverHandle(hitTestHandle(e.clientX, rect));
    }
  }

  function handleMouseUp(e: React.MouseEvent<SVGSVGElement>) {
    if (!drag) return;
    const r = clientXToResidue(e.clientX);
    const s = Math.min(drag.anchor, r);
    const end = Math.max(drag.anchor, r);
    setRange(s, end);
    setDrag(null);
  }

  function handleMouseLeave() {
    setHoverResidue(null);
    setHoverHandle(null);
  }

  function axisTicks() {
    const ticks: number[] = [];
    const step = sequenceLength > 1000 ? 200 : sequenceLength > 400 ? 100 : 50;
    for (let i = 0; i <= sequenceLength; i += step) ticks.push(i);
    return ticks;
  }

  const dragMin = drag ? Math.min(drag.anchor, drag.current) : null;
  const dragMax = drag ? Math.max(drag.anchor, drag.current) : null;

  // Hover cursor x position (within tracks group coordinate)
  const hoverX = hoverResidue != null ? (hoverResidue / sequenceLength) * svgWidth : null;

  if (!showDomainTracks && !showPdbSection && !showProcessingSection && !showSolTrack) {
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
          cursor: drag ? 'col-resize' : hoverHandle ? 'ew-resize' : 'crosshair',
          userSelect: 'none',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {/* Processing annotation rows */}
        {showProcessingSection && processingRows.map((row, rowIdx) => {
          const yOff = tracksHeight + rowIdx * TRACK_HEIGHT;
          const padding = 4;
          const barH = TRACK_HEIGHT - padding * 2;
          return (
            <g key={rowIdx} transform={`translate(${LABEL_WIDTH}, ${yOff})`}>
              {rowIdx === 0 && (
                <text
                  x={-LABEL_WIDTH + 4}
                  y={TRACK_HEIGHT / 2 + 4}
                  fontSize={9}
                  fill="#94a3b8"
                  fontFamily="monospace"
                >
                  Processing
                </text>
              )}
              <line
                x1={0}
                y1={TRACK_HEIGHT / 2}
                x2={svgWidth}
                y2={TRACK_HEIGHT / 2}
                stroke="#e2e8f0"
                strokeWidth={1}
              />
              {row.map((region, i) => {
                const x = (region.start / sequenceLength) * svgWidth;
                const w = Math.max(2, ((region.end - region.start + 1) / sequenceLength) * svgWidth);
                const color = PROCESSING_COLORS[region.type] ?? '#64748b';
                return (
                  <g key={i}>
                    <rect
                      x={x}
                      y={padding}
                      width={w}
                      height={barH}
                      rx={3}
                      fill={color}
                      fillOpacity={0.85}
                      stroke={color}
                      strokeWidth={1}
                      style={{ cursor: 'default' }}
                    >
                      <title>{region.type}: {region.description} ({region.start}–{region.end})</title>
                    </rect>
                    {w > 40 && (
                      <text
                        x={x + w / 2}
                        y={padding + barH / 2 + 3}
                        textAnchor="middle"
                        fontSize={9}
                        fill="#fff"
                        fontWeight={600}
                        pointerEvents="none"
                        style={{ userSelect: 'none' }}
                      >
                        {region.type}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* TM region row */}
        {hasTmRegions && (
          <g transform={`translate(${LABEL_WIDTH}, ${tracksHeight + processingSecHeight})`}>
            <text
              x={-LABEL_WIDTH + 4}
              y={TM_ROW_HEIGHT / 2 + 4}
              fontSize={9}
              fill="#94a3b8"
              fontFamily="monospace"
            >
              TM
            </text>
            {tmRegions.map((region, i) => {
              const x = (region.start / sequenceLength) * svgWidth;
              const w = Math.max(2, ((region.end - region.start + 1) / sequenceLength) * svgWidth);
              return (
                <rect
                  key={i}
                  x={x}
                  y={3}
                  width={w}
                  height={TM_ROW_HEIGHT - 6}
                  rx={2}
                  fill="#1e293b"
                  fillOpacity={0.85}
                >
                  <title>{region.description} ({region.start}–{region.end})</title>
                </rect>
              );
            })}
          </g>
        )}

        {/* Axis */}
        <g transform={`translate(${LABEL_WIDTH}, ${tracksHeight + processingSecHeight + tmSecHeight + solSecHeight + pdbSecHeight})`}>
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
          <g transform={`translate(${LABEL_WIDTH}, ${tracksHeight + processingSecHeight + tmSecHeight + solSecHeight + pdbSecHeight + AXIS_HEIGHT})`}>
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
              hoverHandle={hoverHandle}
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

        {/* E. coli solubility track */}
        {showSolTrack && (
          <g transform={`translate(${LABEL_WIDTH}, ${tracksHeight + processingSecHeight + tmSecHeight})`}>
            <text
              x={-LABEL_WIDTH + 4}
              y={SOL_ROW_HEIGHT / 2 + 4}
              fontSize={9}
              fill="#94a3b8"
              fontFamily="monospace"
            >
              E.coli
            </text>
            {solubilityStatus === 'searching' && (
              <text
                x={4}
                y={SOL_ROW_HEIGHT / 2 + 4}
                fontSize={9}
                fill="#94a3b8"
                fontFamily="monospace"
                fontStyle="italic"
              >
                Searching…
              </text>
            )}
            {solubilityStatus === 'error' && (
              <text
                x={4}
                y={SOL_ROW_HEIGHT / 2 + 4}
                fontSize={9}
                fill="#f87171"
                fontFamily="monospace"
              >
                Search failed
              </text>
            )}
            {solubilityStatus === 'done' && solubilityHits.length === 0 && (
              <text
                x={4}
                y={SOL_ROW_HEIGHT / 2 + 4}
                fontSize={9}
                fill="#94a3b8"
                fontFamily="monospace"
                fontStyle="italic"
              >
                No matches
              </text>
            )}
            {solubilityStatus === 'done' && solubilityHits.map((hit, i) => {
              const x = (hit.queryStart / sequenceLength) * svgWidth;
              const w = Math.max(2, ((hit.queryEnd - hit.queryStart + 1) / sequenceLength) * svgWidth);
              const barH = SOL_ROW_HEIGHT - 6;
              const label = hit.target.length > 14 ? hit.target.slice(0, 13) + '…' : hit.target;
              return (
                <g key={i}>
                  <rect
                    x={x}
                    y={3}
                    width={w}
                    height={barH}
                    rx={2}
                    fill="#16a34a"
                    fillOpacity={0.75}
                    style={{ cursor: 'default' }}
                  >
                    <title>{hit.target} ({hit.identity.toFixed(1)}% identity, {hit.queryStart}–{hit.queryEnd})</title>
                  </rect>
                  {w > 40 && (
                    <text
                      x={x + w / 2}
                      y={3 + barH / 2 + 3}
                      textAnchor="middle"
                      fontSize={8}
                      fill="#fff"
                      fontWeight={600}
                      pointerEvents="none"
                      style={{ userSelect: 'none' }}
                    >
                      {label}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        )}

        {/* PDB structures track */}
        {showPdbSection && (
          <PdbTrack
            entries={pdbEntries}
            sequenceLength={sequenceLength}
            svgWidth={svgWidth}
            yOffset={tracksHeight + processingSecHeight + tmSecHeight + solSecHeight}
            labelWidth={LABEL_WIDTH}
          />
        )}
      </svg>

      {/* PTM legend + interaction hint */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 4px' }}>
        {hasPtms ? (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {Array.from(new Set(ptms.map((p) => p.type))).map((t) => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width={10} height={10} style={{ flexShrink: 0 }}>
                  <polygon
                    points="5,0 10,5 5,10 0,5"
                    fill={PTM_COLOR_HEX[t] ?? '#8b5cf6'}
                    fillOpacity={0.85}
                  />
                </svg>
                <span style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>{t}</span>
              </div>
            ))}
          </div>
        ) : <div />}
        {!drag && (
          <div style={{ fontSize: 10, color: '#94a3b8' }}>
            {startResidue != null ? 'Drag handles to adjust · Click and drag to reselect' : 'Click and drag to select a construct range'}
          </div>
        )}
      </div>
    </div>
  );
}
