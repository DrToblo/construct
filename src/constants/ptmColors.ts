import { PTMType } from '../types/protein';

/** Hex colors for CSS/SVG rendering */
export const PTM_COLOR_HEX: Record<PTMType, string> = {
  [PTMType.PHOSPHORYLATION]: '#dc2626', // red
  [PTMType.DISULFIDE]:       '#eab308', // yellow
  [PTMType.GLYCOSYLATION]:   '#9ca3af', // grey
  [PTMType.OTHER]:           '#8b5cf6', // purple
};

/** RGB tuples for Molstar Color.fromRgb() */
export const PTM_COLOR_RGB: Record<PTMType, [number, number, number]> = {
  [PTMType.PHOSPHORYLATION]: [220, 38, 38],
  [PTMType.DISULFIDE]:       [234, 179, 8],
  [PTMType.GLYCOSYLATION]:   [156, 163, 175],
  [PTMType.OTHER]:           [139, 92, 246],
};

