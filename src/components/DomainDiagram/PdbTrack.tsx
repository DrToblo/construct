import { useState } from 'react';
import type { PDBEntry } from '../../types/protein';
import { useStore } from '../../store';

interface PdbTrackProps {
  entries: PDBEntry[];
  sequenceLength: number;
  svgWidth: number;
  yOffset: number;           // top of this section in SVG coordinates
  labelWidth: number;        // width of the label area (same as domain LABEL_WIDTH)
}

const HEADER_H = 14;
const BAR_H = 10;
const BAR_GAP = 2;
const ROW_H = BAR_H + BAR_GAP;

// Compute which row each entry goes into (greedy non-overlapping packing)
function computeRows(entries: PDBEntry[]): PDBEntry[][] {
  const rows: Array<{ lastEnd: number; entries: PDBEntry[] }> = [];
  for (const entry of entries) {
    let placed = false;
    for (const row of rows) {
      if (entry.uniprotStart > row.lastEnd) {
        row.entries.push(entry);
        row.lastEnd = entry.uniprotEnd;
        placed = true;
        break;
      }
    }
    if (!placed) rows.push({ lastEnd: entry.uniprotEnd, entries: [entry] });
  }
  return rows.map((r) => r.entries);
}

export function pdbTrackHeight(entries: PDBEntry[]): number {
  if (entries.length === 0) return 0;
  const rows = computeRows(entries);
  return HEADER_H + rows.length * ROW_H;
}

export function PdbTrack({ entries, sequenceLength, svgWidth, yOffset, labelWidth }: PdbTrackProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const activePdbId = useStore((s) => s.activePdbId);
  const selectPdbEntry = useStore((s) => s.selectPdbEntry);
  const clearPdbSelection = useStore((s) => s.clearPdbSelection);

  const rows = computeRows(entries);

  function pos(residue: number) {
    return (residue / sequenceLength) * svgWidth;
  }

  function handleClick(entry: PDBEntry, e: React.MouseEvent) {
    e.stopPropagation();
    if (activePdbId === entry.pdbId) {
      clearPdbSelection();
    } else {
      selectPdbEntry(entry);
    }
  }

  return (
    <g transform={`translate(${labelWidth}, ${yOffset})`}>
      {/* Section label */}
      <text
        x={-labelWidth + 4}
        y={HEADER_H / 2 + 4}
        fontSize={9}
        fill="#94a3b8"
        fontFamily="monospace"
      >
        PDB
      </text>
      {/* Baseline */}
      <line x1={0} y1={HEADER_H / 2} x2={svgWidth} y2={HEADER_H / 2} stroke="#f1f5f9" strokeWidth={1} />

      {rows.map((rowEntries, rowIdx) =>
        rowEntries.map((entry) => {
          const x = pos(entry.uniprotStart);
          const w = Math.max(4, pos(entry.uniprotEnd) - pos(entry.uniprotStart));
          const y = HEADER_H + rowIdx * ROW_H;
          const isActive = activePdbId === entry.pdbId;
          const isHovered = hovered === entry.pdbId;
          const fill = isActive ? '#1d4ed8' : isHovered ? '#3b82f6' : '#64748b';
          const resLabel = entry.resolution != null ? ` ${entry.resolution.toFixed(1)}Å` : '';
          const label = `${entry.pdbId.toUpperCase()}${resLabel} (${entry.experimentalMethod})`;

          return (
            <g
              key={entry.pdbId}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHovered(entry.pdbId)}
              onMouseLeave={() => setHovered(null)}
              onClick={(e) => handleClick(entry, e)}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <title>{label} — chain {entry.chainId} — residues {entry.uniprotStart}–{entry.uniprotEnd}. Click to load.</title>
              <rect
                x={x}
                y={y}
                width={w}
                height={BAR_H}
                rx={2}
                fill={fill}
                fillOpacity={isActive ? 1 : 0.7}
                stroke={isActive ? '#1e40af' : 'none'}
                strokeWidth={isActive ? 1.5 : 0}
              />
              {w > 30 && (
                <text
                  x={x + w / 2}
                  y={y + BAR_H / 2 + 3}
                  textAnchor="middle"
                  fontSize={7}
                  fill="#fff"
                  fontWeight={600}
                  pointerEvents="none"
                  style={{ userSelect: 'none' }}
                >
                  {entry.pdbId.toUpperCase()}
                </text>
              )}
            </g>
          );
        }),
      )}
    </g>
  );
}
