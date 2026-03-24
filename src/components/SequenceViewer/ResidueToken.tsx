import type { PTM } from '../../types/protein';
import { PTMMarker } from './PTMMarker';

interface ResidueTokenProps {
  residue: string;
  position: number; // 1-based
  isInConstruct: boolean;
  ptms: PTM[];
}

export function ResidueToken({ residue, position, isInConstruct, ptms }: ResidueTokenProps) {
  return (
    <span
      id={`residue-${position}`}
      title={`${residue}${position}`}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 16,
        height: 20,
        fontFamily: 'monospace',
        fontSize: 13,
        fontWeight: isInConstruct ? 700 : 400,
        color: isInConstruct ? '#86efac' : '#94a3b8',
        background: isInConstruct ? 'rgba(22, 163, 74, 0.15)' : 'transparent',
        borderRadius: 2,
        cursor: 'default',
        flexShrink: 0,
        marginTop: ptms.length > 0 ? 8 : 0,
      }}
    >
      {ptms.map((ptm, i) => (
        <PTMMarker key={i} ptm={ptm} />
      ))}
      {residue}
    </span>
  );
}
