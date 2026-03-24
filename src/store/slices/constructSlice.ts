import type { StateCreator } from 'zustand';
import type { SelectionStep } from '../../types/construct';

export interface ConstructSlice {
  startResidue: number | null;
  endResidue: number | null;
  selectionStep: SelectionStep;
  setStartResidue: (n: number) => void;
  setEndResidue: (n: number) => void;
  setRange: (start: number, end: number) => void;
  resetSelection: () => void;
  beginSelection: () => void;
}

export const createConstructSlice: StateCreator<ConstructSlice> = (set) => ({
  startResidue: null,
  endResidue: null,
  selectionStep: 'none',

  setStartResidue: (n) =>
    set({ startResidue: n, endResidue: null, selectionStep: 'selectingEnd' }),

  setEndResidue: (n) =>
    set((state) => ({
      endResidue: n,
      // Normalize so start <= end
      startResidue: state.startResidue != null ? Math.min(state.startResidue, n) : n,
      selectionStep: 'complete',
    })),

  setRange: (start, end) =>
    set({
      startResidue: Math.min(start, end),
      endResidue: Math.max(start, end),
      selectionStep: 'complete',
    }),

  resetSelection: () =>
    set({ startResidue: null, endResidue: null, selectionStep: 'none' }),

  beginSelection: () =>
    set({ startResidue: null, endResidue: null, selectionStep: 'selectingStart' }),
});
