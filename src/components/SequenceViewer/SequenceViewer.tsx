import { useEffect, useMemo, useRef } from 'react';
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

function tickInterval(len: number): number {
  if (len <= 100) return 10;
  if (len <= 500) return 50;
  return 100;
}

export function SequenceViewer({ protein }: SequenceViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startResidue = useStore((s) => s.startResidue);
  const endResidue = useStore((s) => s.endResidue);

  const { sequence, ptms } = protein;
  const len = sequence.length;
  const totalWidth = len * CHAR_W;
  const interval = tickInterval(len);

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

  // Auto-scroll so selection start is roughly centered
  useEffect(() => {
    if (startResidue == null || !containerRef.current) return;
    const targetX = (startResidue - 1) * CHAR_W;
    const viewW = containerRef.current.clientWidth;
    containerRef.current.scrollLeft = Math.max(0, targetX - viewW / 3);
  }, [startResidue]);

  // Tick positions: always include 1, then multiples of interval
  const ticks: number[] = [1];
  for (let t = interval; t <= len; t += interval) ticks.push(t);

  const hasConstruct = startResidue != null && endResidue != null;

  return (
    <div
      ref={containerRef}
      style={{
        overflowX: 'auto',
        overflowY: 'hidden',
        background: '#ffffff',
        padding: '6px 12px',
        height: TOTAL_H + 12,
      }}
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
              left: (startResidue! - 1) * CHAR_W,
              width: (endResidue! - startResidue! + 1) * CHAR_W,
              top: PTM_H,
              height: SEQ_H,
              background: 'rgba(234, 88, 12, 0.18)',
              borderLeft: '2px solid #ea580c',
              borderRight: '2px solid #ea580c',
              borderRadius: 2,
              pointerEvents: 'none',
            }}
          />
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
            const inConstruct = hasConstruct && pos >= startResidue! && pos <= endResidue!;
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
                {/* Tick mark */}
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
                {/* Label */}
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
