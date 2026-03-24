import type { PTM } from '../../types/protein';
import { PTMType } from '../../types/protein';

const PTM_COLORS: Record<PTMType, string> = {
  [PTMType.PHOSPHORYLATION]: '#f97316',
  [PTMType.DISULFIDE]: '#ef4444',
  [PTMType.GLYCOSYLATION]: '#3b82f6',
  [PTMType.OTHER]: '#8b5cf6',
};

const PTM_LABELS: Record<PTMType, string> = {
  [PTMType.PHOSPHORYLATION]: 'P',
  [PTMType.DISULFIDE]: 'S',
  [PTMType.GLYCOSYLATION]: 'G',
  [PTMType.OTHER]: '?',
};

interface PTMMarkerProps {
  ptm: PTM;
}

export function PTMMarker({ ptm }: PTMMarkerProps) {
  const color = PTM_COLORS[ptm.type];
  const label = PTM_LABELS[ptm.type];

  return (
    <span
      title={ptm.description}
      style={{
        position: 'absolute',
        top: -6,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 10,
        height: 10,
        borderRadius: '50%',
        background: color,
        fontSize: 7,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        zIndex: 2,
        cursor: 'help',
      }}
    >
      {label}
    </span>
  );
}
