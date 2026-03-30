import { useEffect, useMemo, useRef, useState } from 'react';
import type { ProteinData } from '../../types/protein';
import { useStore } from '../../store';
import { PTM_COLOR_HEX } from '../../constants/ptmColors';

interface SequenceViewerProps {
  protein: ProteinData;
}

const CHAR_W = 9;   // px per residue column
const SEQ_H = 18;   // height of sequence letter row
const PTM_H = 10;   // height of PTM dot row above sequence
const TICK_H = 14;  // height of tick + number row below sequence
const TOTAL_H = PTM_H + SEQ_H + TICK_H;
const HANDLE_HIT_PX = 8; // hit area around each handle in px

type DragHandle = 'start' | 'end';

function tickInterval(len: number): number {
  if (len <= 100) return 10;
  if (len <= 500) return 50;
  return 100;
}

export function SequenceViewer({ protein }: SequenceViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startResidue = useStore((s) => s.startResidue);
  const endResidue = useStore((s) => s.endResidue);
  const setRange = useStore((s) => s.setRange);

  const [dragHandle, setDragHandle] = useState<DragHandle | null>(null);
  // Live residue position while dragging (before committing on mouseup)
  const [liveStart, setLiveStart] = useState<number | null>(null);
  const [liveEnd, setLiveEnd] = useState<number | null>(null);
  const dragRef = useRef<DragHandle | null>(null);
  dragRef.current = dragHandle;

  const { sequence, ptms } = protein;
  const len = sequence.length;
  const totalWidth = len * CHAR_W;
  const interval = tickInterval(len);

  // During drag show live values, otherwise committed store values
  const displayStart = dragHandle ? liveStart : startResidue;
  const displayEnd = dragHandle ? liveEnd : endResidue;

  // PTM lookup: position → first PTM type
  const ptmMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const ptm of ptms) {
      if (!map.has(ptm.position)) map.set(ptm.position, ptm.type);
    }
    return map;
  }, [ptms]);

  // PTM tooltip lookup: position → description
  const ptmDesc = useMemo(() => {
    const map = new Map<number, string>();
    for (const ptm of ptms) {
      map.set(ptm.position, [map.get(ptm.position), `${ptm.type}: ${ptm.description}`].filter(Boolean).join('; '));
    }
    return map;
  }, [ptms]);

  // Auto-scroll so selection start is roughly centered (only when not dragging)
  useEffect(() => {
    if (dragHandle || startResidue == null || !containerRef.current) return;
    const targetX = (startResidue - 1) * CHAR_W;
    const viewW = containerRef.current.clientWidth;
    containerRef.current.scrollLeft = Math.max(0, targetX - viewW / 3);
  }, [startResidue, dragHandle]);

  // Convert clientX to residue number (1-based, clamped)
  function clientXToResidue(clientX: number): number {
    const el = containerRef.current;
    if (!el) return 1;
    const rect = el.getBoundingClientRect();
    const xInContent = clientX - rect.left + el.scrollLeft - 12; // subtract padding
    const residue = Math.round(xInContent / CHAR_W) + 1;
    return Math.max(1, Math.min(len, residue));
  }

  // Hit-test whether clientX is near the start or end handle
  function hitTestHandle(clientX: number): DragHandle | null {
    if (startResidue == null || endResidue == null) return null;
    const el = containerRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const scrollX = el.scrollLeft;
    const startPx = rect.left - scrollX + 12 + (startResidue - 1) * CHAR_W;
    const endPx   = rect.left - scrollX + 12 + endResidue * CHAR_W;
    if (Math.abs(clientX - startPx) <= HANDLE_HIT_PX) return 'start';
    if (Math.abs(clientX - endPx)   <= HANDLE_HIT_PX) return 'end';
    return null;
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return;
    const hit = hitTestHandle(e.clientX);
    if (!hit) return;
    e.preventDefault();
    setDragHandle(hit);
    setLiveStart(startResidue);
    setLiveEnd(endResidue);
  }

  // Global mousemove/mouseup during drag
  useEffect(() => {
    if (!dragHandle) return;

    function onMouseMove(e: MouseEvent) {
      const r = clientXToResidue(e.clientX);
      if (dragRef.current === 'start') {
        setLiveStart(Math.min(r, endResidue ?? r));
      } else {
        setLiveEnd(Math.max(r, startResidue ?? r));
      }
    }

    function onMouseUp(e: MouseEvent) {
      const r = clientXToResidue(e.clientX);
      if (dragRef.current === 'start') {
        setRange(Math.min(r, endResidue ?? r), endResidue ?? r);
      } else {
        setRange(startResidue ?? r, Math.max(r, startResidue ?? r));
      }
      setDragHandle(null);
      setLiveStart(null);
      setLiveEnd(null);
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragHandle !== null, startResidue, endResidue]);

  // Tick positions
  const ticks: number[] = [1];
  for (let t = interval; t <= len; t += interval) ticks.push(t);

  const hasConstruct = displayStart != null && displayEnd != null;

  // Cursor: ew-resize over handles, default elsewhere
  const [hoverHandle, setHoverHandle] = useState<DragHandle | null>(null);

  function handleMouseMove(e: React.MouseEvent) {
    if (dragHandle) return;
    setHoverHandle(hitTestHandle(e.clientX));
  }

  function handleMouseLeave() {
    setHoverHandle(null);
  }

  const cursor = dragHandle ? 'ew-resize' : hoverHandle ? 'ew-resize' : 'default';

  return (
    <div
      ref={containerRef}
      style={{
        overflowX: 'auto',
        overflowY: 'hidden',
        background: '#ffffff',
        padding: '6px 12px',
        height: TOTAL_H + 12,
        cursor,
        userSelect: 'none',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        style={{
          position: 'relative',
          width: totalWidth,
          height: TOTAL_H,
          fontFamily: 'monospace',
          flexShrink: 0,
        }}
      >
        {/* Construct selection highlight band */}
        {hasConstruct && (
          <div
            style={{
              position: 'absolute',
              left: (displayStart! - 1) * CHAR_W,
              width: (displayEnd! - displayStart! + 1) * CHAR_W,
              top: PTM_H,
              height: SEQ_H,
              background: 'rgba(234, 88, 12, 0.18)',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Start handle */}
        {hasConstruct && (
          <div
            style={{
              position: 'absolute',
              left: (displayStart! - 1) * CHAR_W - 2,
              top: PTM_H - 3,
              width: 4,
              height: SEQ_H + 6,
              background: '#ea580c',
              borderRadius: 2,
              cursor: 'ew-resize',
              zIndex: 4,
            }}
          >
            {/* Grip dots */}
            <div style={gripStyle} />
          </div>
        )}

        {/* End handle */}
        {hasConstruct && (
          <div
            style={{
              position: 'absolute',
              left: displayEnd! * CHAR_W - 2,
              top: PTM_H - 3,
              width: 4,
              height: SEQ_H + 6,
              background: '#ea580c',
              borderRadius: 2,
              cursor: 'ew-resize',
              zIndex: 4,
            }}
          >
            <div style={gripStyle} />
          </div>
        )}

        {/* PTM dots row */}
        {ptms.map((ptm, i) => {
          const color = PTM_COLOR_HEX[ptm.type] ?? '#8b5cf6';
          const cx = (ptm.position - 1) * CHAR_W + CHAR_W / 2;
          return (
            <div
              key={i}
              title={ptmDesc.get(ptm.position)}
              style={{
                position: 'absolute',
                left: cx - 3.5,
                top: 1,
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: color,
                cursor: 'help',
                zIndex: 2,
              }}
            />
          );
        })}

        {/* Sequence letters */}
        <div
          style={{
            position: 'absolute',
            top: PTM_H,
            left: 0,
            height: SEQ_H,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {Array.from(sequence.value).map((aa, idx) => {
            const pos = idx + 1;
            const inConstruct = hasConstruct && pos >= displayStart! && pos <= displayEnd!;
            const hasPtm = ptmMap.has(pos);
            return (
              <span
                key={pos}
                id={`residue-${pos}`}
                title={`${aa}${pos}${hasPtm ? ' · ' + ptmDesc.get(pos) : ''}`}
                style={{
                  display: 'inline-block',
                  width: CHAR_W,
                  textAlign: 'center',
                  fontSize: 11,
                  lineHeight: `${SEQ_H}px`,
                  fontWeight: inConstruct ? 700 : 400,
                  color: inConstruct ? '#c2410c' : hasPtm ? '#475569' : '#334155',
                  flexShrink: 0,
                  cursor: 'default',
                  userSelect: 'none',
                }}
              >
                {aa}
              </span>
            );
          })}
        </div>

        {/* Tick marks and position labels */}
        <div style={{ position: 'absolute', top: PTM_H + SEQ_H, left: 0, height: TICK_H }}>
          {ticks.map((pos) => {
            const left = (pos - 1) * CHAR_W + CHAR_W / 2;
            return (
              <div key={pos} style={{ position: 'absolute', left }}>
                <div
                  style={{
                    position: 'absolute',
                    left: -0.5,
                    top: 0,
                    width: 1,
                    height: 4,
                    background: '#cbd5e1',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 4,
                    fontSize: 8,
                    color: '#94a3b8',
                    whiteSpace: 'nowrap',
                    transform: 'translateX(-50%)',
                    fontFamily: 'monospace',
                  }}
                >
                  {pos}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const gripStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 2,
  height: 8,
  borderRadius: 1,
  background: 'rgba(255,255,255,0.7)',
};
