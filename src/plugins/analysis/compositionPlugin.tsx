import type { AnalysisPlugin, AnalysisResult } from '../../types/plugins';
import type { ProteinData } from '../../types/protein';
import type { ConstructSelection } from '../../types/construct';
import { ALL_AA } from '../../constants/aminoAcids';

interface CompositionData {
  counts: Record<string, number>;
  total: number;
}

export const compositionPlugin: AnalysisPlugin = {
  id: 'composition',
  name: 'Amino Acid Composition',
  description: 'Shows amino acid frequency',

  analyze(sequence: string, _metadata: ProteinData, _construct: ConstructSelection): AnalysisResult {
    const counts: Record<string, number> = {};
    for (const aa of ALL_AA) counts[aa] = 0;
    for (const aa of sequence) {
      if (counts[aa] !== undefined) counts[aa]++;
    }
    return { pluginId: 'composition', data: { counts, total: sequence.length } satisfies CompositionData };
  },

  renderResult(result: AnalysisResult) {
    const d = result.data as CompositionData;
    const sorted = Object.entries(d.counts)
      .filter(([, v]) => v > 0)
      .sort(([, a], [, b]) => b - a);

    const maxPct = sorted.length > 0 ? ((sorted[0][1] / d.total) * 100) : 1;

    return (
      <div style={{ padding: '8px 14px', overflowY: 'auto', maxHeight: 180 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '4px 8px' }}>
          {sorted.map(([aa, count]) => {
            const pct = (count / d.total) * 100;
            const barW = (pct / maxPct) * 100;
            return (
              <div key={aa} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 14, fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#e2e8f0', flexShrink: 0 }}>{aa}</span>
                <div style={{ flex: 1, height: 10, background: '#1f2937', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${barW}%`, height: '100%', background: '#3b82f6', borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 10, color: '#9ca3af', width: 36, textAlign: 'right', fontFamily: 'monospace', flexShrink: 0 }}>
                  {pct.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
};
