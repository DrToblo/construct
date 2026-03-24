export type SelectionStep = 'none' | 'selectingStart' | 'selectingEnd' | 'complete';

export interface ConstructSelection {
  startResidue: number | null;
  endResidue: number | null;
  selectionStep: SelectionStep;
}

export interface ResidueRange {
  start: number;
  end: number;
}
