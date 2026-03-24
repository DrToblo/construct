import { useEffect, useMemo, useRef } from 'react';
import type { ProteinData } from '../../types/protein';
import { useStore } from '../../store';
import { ResidueToken } from './ResidueToken';

interface SequenceViewerProps {
  protein: ProteinData;
}

const RESIDUES_PER_ROW = 50;
const CHUNK = 10; // spacing between position labels

export function SequenceViewer({ protein }: SequenceViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startResidue = useStore((s) => s.startResidue);
  const endResidue = useStore((s) => s.endResidue);

  const { sequence, ptms } = protein;

  // Build a PTM lookup: position → PTM[]
  const ptmMap = useMemo(() => {
    const map = new Map<number, typeof ptms>();
    for (const ptm of ptms) {
      if (!map.has(ptm.position)) map.set(ptm.position, []);
      map.get(ptm.position)!.push(ptm);
    }
    return map;
  }, [ptms]);

  // Auto-scroll to start residue when construct selection completes
  useEffect(() => {
    if (startResidue == null) return;
    const el = document.getElementById(`residue-${startResidue}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [startResidue]);

  const rows: number[][] = [];
  for (let i = 0; i < sequence.length; i += RESIDUES_PER_ROW) {
    rows.push(
      Array.from({ length: Math.min(RESIDUES_PER_ROW, sequence.length - i) }, (_, j) => i + j),
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        padding: '8px 12px',
        fontFamily: 'monospace',
      }}
    >
      {rows.map((row, rowIdx) => {
        const rowStart = rowIdx * RESIDUES_PER_ROW; // 0-based index of first residue in row
        return (
          <div key={rowIdx} style={{ display: 'flex', alignItems: 'flex-end', marginBottom: 4, flexWrap: 'wrap' }}>
            {/* Row groups of CHUNK */}
            {Array.from({ length: Math.ceil(row.length / CHUNK) }, (_, gi) => {
              const groupStart = gi * CHUNK;
              const groupIndices = row.slice(groupStart, groupStart + CHUNK);
              const firstPos = rowStart + groupStart + 1; // 1-based

              return (
                <div key={gi} style={{ display: 'flex', flexDirection: 'column', marginRight: 8, marginBottom: 4 }}>
                  {/* Position label */}
                  <span
                    style={{
                      fontSize: 9,
                      color: '#6b7280',
                      marginBottom: 1,
                      minWidth: groupIndices.length * 16,
                    }}
                  >
                    {firstPos}
                  </span>
                  {/* Residues */}
                  <div style={{ display: 'flex' }}>
                    {groupIndices.map((idx) => {
                      const pos = idx + 1; // 1-based
                      const residue = sequence.value[idx];
                      const inConstruct =
                        startResidue != null &&
                        endResidue != null &&
                        pos >= startResidue &&
                        pos <= endResidue;
                      const residuePtms = ptmMap.get(pos) ?? [];
                      return (
                        <ResidueToken
                          key={pos}
                          residue={residue}
                          position={pos}
                          isInConstruct={inConstruct}
                          ptms={residuePtms}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* PTM legend */}
      {protein.ptms.length > 0 && (
        <div style={{ marginTop: 12, paddingTop: 8, borderTop: '1px solid #374151', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, color: '#6b7280' }}>PTMs:</span>
          <span style={{ fontSize: 10, color: '#f97316' }}>● Phosphorylation</span>
          <span style={{ fontSize: 10, color: '#ef4444' }}>● Disulfide</span>
          <span style={{ fontSize: 10, color: '#3b82f6' }}>● Glycosylation</span>
        </div>
      )}
    </div>
  );
}
