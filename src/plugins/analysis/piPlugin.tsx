import type { AnalysisPlugin, AnalysisResult } from '../../types/plugins';
import type { ProteinData } from '../../types/protein';
import type { ConstructSelection } from '../../types/construct';
import { PKA_VALUES } from '../../constants/aminoAcids';

interface PIData {
  pI: number;
  chargeAtPh7: number;
}

function chargeAtPH(seq: string, pH: number): number {
  let charge = 0;

  // N-terminus (positive when protonated)
  charge += 1 / (1 + Math.pow(10, pH - PKA_VALUES.N_TERM));

  // C-terminus (negative when deprotonated)
  charge -= 1 / (1 + Math.pow(10, PKA_VALUES.C_TERM - pH));

  for (const aa of seq) {
    switch (aa) {
      case 'D': charge -= 1 / (1 + Math.pow(10, PKA_VALUES.D - pH)); break;
      case 'E': charge -= 1 / (1 + Math.pow(10, PKA_VALUES.E - pH)); break;
      case 'C': charge -= 1 / (1 + Math.pow(10, PKA_VALUES.C - pH)); break;
      case 'Y': charge -= 1 / (1 + Math.pow(10, PKA_VALUES.Y - pH)); break;
      case 'H': charge += 1 / (1 + Math.pow(10, pH - PKA_VALUES.H)); break;
      case 'K': charge += 1 / (1 + Math.pow(10, pH - PKA_VALUES.K)); break;
      case 'R': charge += 1 / (1 + Math.pow(10, pH - PKA_VALUES.R)); break;
    }
  }
  return charge;
}

function computePI(seq: string): number {
  let lo = 0, hi = 14;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (chargeAtPH(seq, mid) > 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export const piPlugin: AnalysisPlugin = {
  id: 'pi',
  name: 'Isoelectric Point',
  description: 'Calculates isoelectric point and charge at pH 7',

  analyze(sequence: string, _metadata: ProteinData, _construct: ConstructSelection): AnalysisResult {
    const pI = computePI(sequence);
    const chargeAtPh7 = chargeAtPH(sequence, 7.4);
    return { pluginId: 'pi', data: { pI, chargeAtPh7 } satisfies PIData };
  },

  renderResult(result: AnalysisResult) {
    const d = result.data as PIData;
    const charge = d.chargeAtPh7;
    const chargeStr = charge >= 0 ? `+${charge.toFixed(1)}` : charge.toFixed(1);
    return (
      <div style={{ padding: '10px 14px', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <Stat label="Isoelectric Point (pI)" value={d.pI.toFixed(2)} />
        <Stat label="Charge at pH 7.4" value={chargeStr} color={charge >= 0 ? '#86efac' : '#fca5a5'} />
      </div>
    );
  },
};

function Stat({ label, value, color = '#e2e8f0' }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color, fontFamily: 'monospace' }}>{value}</div>
    </div>
  );
}
