import type { AnalysisPlugin, AnalysisResult } from '../../types/plugins';
import type { ProteinData } from '../../types/protein';
import type { ConstructSelection } from '../../types/construct';
import { PKA_VALUES } from '../../constants/aminoAcids';

interface ChargeData {
  points: { pH: number; charge: number }[];
  pI: number;
}

function chargeAtPH(seq: string, pH: number): number {
  let charge = 0;
  charge += 1 / (1 + Math.pow(10, pH - PKA_VALUES.N_TERM));
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

export const chargePlugin: AnalysisPlugin = {
  id: 'charge',
  name: 'Charge vs pH',
  description: 'Plots net charge from pH 0–14',

  analyze(sequence: string, _metadata: ProteinData, _construct: ConstructSelection): AnalysisResult {
    const points: { pH: number; charge: number }[] = [];
    for (let pH = 0; pH <= 14; pH += 0.2) {
      points.push({ pH: +pH.toFixed(1), charge: chargeAtPH(sequence, pH) });
    }
    // Find pI
    let lo = 0, hi = 14;
    for (let i = 0; i < 200; i++) {
      const mid = (lo + hi) / 2;
      if (chargeAtPH(sequence, mid) > 0) lo = mid;
      else hi = mid;
    }
    return { pluginId: 'charge', data: { points, pI: (lo + hi) / 2 } satisfies ChargeData };
  },

  renderResult(result: AnalysisResult) {
    const d = result.data as ChargeData;
    const { points, pI } = d;

    const W = 280, H = 100;
    const PAD = { l: 30, r: 8, t: 8, b: 20 };
    const chartW = W - PAD.l - PAD.r;
    const chartH = H - PAD.t - PAD.b;

    const charges = points.map((p) => p.charge);
    const maxCharge = Math.max(...charges, 1);
    const minCharge = Math.min(...charges, -1);
    const range = maxCharge - minCharge;

    function px(pH: number) { return PAD.l + (pH / 14) * chartW; }
    function py(charge: number) { return PAD.t + ((maxCharge - charge) / range) * chartH; }

    const pathD = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${px(p.pH).toFixed(1)},${py(p.charge).toFixed(1)}`)
      .join(' ');

    const zeroY = py(0);
    const pIX = px(pI);

    return (
      <div style={{ padding: '8px 14px' }}>
        <svg width={W} height={H} style={{ display: 'block' }}>
          {/* Zero line */}
          <line x1={PAD.l} y1={zeroY} x2={PAD.l + chartW} y2={zeroY} stroke="#374151" strokeWidth={1} strokeDasharray="3,3" />

          {/* pI line */}
          <line x1={pIX} y1={PAD.t} x2={pIX} y2={PAD.t + chartH} stroke="#16a34a" strokeWidth={1} strokeDasharray="2,2" />
          <text x={pIX + 2} y={PAD.t + 9} fontSize={8} fill="#16a34a">pI={pI.toFixed(1)}</text>

          {/* pH 7.4 line */}
          <line x1={px(7.4)} y1={PAD.t} x2={px(7.4)} y2={PAD.t + chartH} stroke="#6b7280" strokeWidth={1} strokeDasharray="2,4" />

          {/* Curve */}
          <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth={2} />

          {/* Y axis */}
          <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={PAD.t + chartH} stroke="#4b5563" strokeWidth={1} />
          <text x={PAD.l - 4} y={PAD.t + 4} textAnchor="end" fontSize={8} fill="#6b7280">{maxCharge.toFixed(0)}</text>
          <text x={PAD.l - 4} y={PAD.t + chartH + 4} textAnchor="end" fontSize={8} fill="#6b7280">{minCharge.toFixed(0)}</text>

          {/* X axis */}
          <line x1={PAD.l} y1={PAD.t + chartH} x2={PAD.l + chartW} y2={PAD.t + chartH} stroke="#4b5563" strokeWidth={1} />
          {[0, 2, 4, 6, 8, 10, 12, 14].map((t) => (
            <text key={t} x={px(t)} y={PAD.t + chartH + 11} textAnchor="middle" fontSize={8} fill="#6b7280">{t}</text>
          ))}
        </svg>
      </div>
    );
  },
};
