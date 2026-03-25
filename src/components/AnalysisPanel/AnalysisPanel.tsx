import { useMemo } from 'react';
import { useStore } from '../../store';
import type { ProteinData } from '../../types/protein';
import { ANALYSIS_PLUGINS } from '../../plugins/analysis/registry';

interface AnalysisPanelProps {
  protein: ProteinData;
}

export function AnalysisPanel({ protein }: AnalysisPanelProps) {
  const startResidue = useStore((s) => s.startResidue);
  const endResidue = useStore((s) => s.endResidue);
  const activeIds = useStore((s) => s.activeAnalysisPluginIds);

  const constructSequence = useMemo(() => {
    if (startResidue != null && endResidue != null) {
      return protein.sequence.value.slice(startResidue - 1, endResidue);
    }
    return protein.sequence.value;
  }, [protein, startResidue, endResidue]);

  const construct = { startResidue, endResidue, selectionStep: startResidue != null ? 'complete' as const : 'none' as const };

  const activePlugins = ANALYSIS_PLUGINS.filter((p) => activeIds.includes(p.id));

  return (
    <div style={{ width: '100%', height: '100%', overflowY: 'auto', background: '#ffffff' }}>
      {startResidue != null && endResidue != null && (
        <div style={{
          padding: '6px 14px',
          background: '#eff6ff',
          borderBottom: '1px solid #dbeafe',
          fontSize: 12,
          color: '#2563eb',
          fontWeight: 600,
        }}>
          Analyzing construct residues {startResidue}–{endResidue} ({constructSequence.length} aa)
        </div>
      )}
      {activePlugins.map((plugin) => {
        const result = plugin.analyze(constructSequence, protein, construct);
        return (
          <div key={plugin.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
            <div style={{
              padding: '6px 14px 4px',
              fontSize: 11,
              fontWeight: 700,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}>
              {plugin.name}
            </div>
            {plugin.renderResult(result)}
          </div>
        );
      })}
    </div>
  );
}
