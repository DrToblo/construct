import type { AnalysisPlugin, AnalysisResult } from '../../types/plugins';
import type { ProteinData } from '../../types/protein';
import type { ConstructSelection } from '../../types/construct';
import { RESIDUE_MASS, WATER_MASS } from '../../constants/aminoAcids';

interface MWData {
  monoisotopicMass: number;
  averageMass: number;
  residueCount: number;
}

// Average masses
const AVG_MASS: Record<string, number> = {
  A: 71.0788, R: 156.1875, N: 114.1038, D: 115.0886, C: 103.1388,
  E: 129.1155, Q: 128.1307, G: 57.0519, H: 137.1411, I: 113.1594,
  L: 113.1594, K: 128.1741, M: 131.1926, F: 147.1766, P: 97.1167,
  S: 87.0782, T: 101.1051, W: 186.2132, Y: 163.1760, V: 99.1326,
  U: 150.0379, O: 237.2982, X: 111.1,
};

export const mwPlugin: AnalysisPlugin = {
  id: 'mw',
  name: 'Molecular Weight',
  description: 'Calculates monoisotopic and average molecular weight',

  analyze(sequence: string, _metadata: ProteinData, _construct: ConstructSelection): AnalysisResult {
    let mono = WATER_MASS; // +H2O for termini
    let avg = 18.0153;

    for (const aa of sequence) {
      mono += RESIDUE_MASS[aa] ?? RESIDUE_MASS['X'];
      avg += AVG_MASS[aa] ?? AVG_MASS['X'];
    }

    return {
      pluginId: 'mw',
      data: {
        monoisotopicMass: mono,
        averageMass: avg,
        residueCount: sequence.length,
      } satisfies MWData,
    };
  },

  renderResult(result: AnalysisResult) {
    const d = result.data as MWData;
    return (
      <div style={{ padding: '10px 14px' }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <Stat label="Average MW" value={`${(d.averageMass / 1000).toFixed(2)} kDa`} />
          <Stat label="Monoisotopic MW" value={`${(d.monoisotopicMass / 1000).toFixed(2)} kDa`} />
          <Stat label="Residues" value={d.residueCount.toString()} />
        </div>
      </div>
    );
  },
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', fontFamily: 'monospace' }}>{value}</div>
    </div>
  );
}
