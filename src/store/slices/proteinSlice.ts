import type { StateCreator } from 'zustand';
import type { ProteinData, Domain, PDBEntry } from '../../types/protein';
import { fetchUniprotEntry } from '../../services/uniprot';
import { fetchInterproDomains } from '../../services/interpro';
import { fetchAlphaFoldStructure, AlphaFoldNotFoundError } from '../../services/alphafold';
import { fetchRcsbByUniprot } from '../../services/rcsb';
import { fetchPdbEntries } from '../../services/pdbe';

export type LoadStatus = 'idle' | 'loading' | 'error' | 'ready';
export type StructureSource = 'alphafold' | 'rcsb' | null;

export interface ProteinSlice {
  uniprotId: string | null;
  proteinData: ProteinData | null;
  domains: Domain[];
  selectedDomainSources: string[];
  structureUrl: string | null;
  structureSource: StructureSource;
  // Default structure (AlphaFold or RCSB fallback) preserved for reverting PDB selection
  defaultStructureUrl: string | null;
  defaultStructureSource: StructureSource;
  // PDB structures
  pdbEntries: PDBEntry[];
  showPdbTracks: boolean;
  activePdbId: string | null;
  status: LoadStatus;
  error: string | null;
  loadProtein: (id: string) => Promise<void>;
  clearProtein: () => void;
  setSelectedDomainSources: (sources: string[]) => void;
  setShowPdbTracks: (show: boolean) => void;
  selectPdbEntry: (entry: PDBEntry) => void;
  clearPdbSelection: () => void;
}

export const createProteinSlice: StateCreator<ProteinSlice> = (set) => ({
  uniprotId: null,
  proteinData: null,
  domains: [],
  selectedDomainSources: ['Pfam'],
  structureUrl: null,
  structureSource: null,
  defaultStructureUrl: null,
  defaultStructureSource: null,
  pdbEntries: [],
  showPdbTracks: false,
  activePdbId: null,
  status: 'idle',
  error: null,

  clearProtein: () =>
    set({
      uniprotId: null,
      proteinData: null,
      domains: [],
      selectedDomainSources: ['Pfam'],
      structureUrl: null,
      structureSource: null,
      defaultStructureUrl: null,
      defaultStructureSource: null,
      pdbEntries: [],
      showPdbTracks: false,
      activePdbId: null,
      status: 'idle',
      error: null,
    }),

  setSelectedDomainSources: (sources) => set({ selectedDomainSources: sources }),

  setShowPdbTracks: (show) => set({ showPdbTracks: show }),

  selectPdbEntry: (entry) =>
    set({
      activePdbId: entry.pdbId,
      structureUrl: entry.cifUrl,
      structureSource: 'rcsb',
    }),

  clearPdbSelection: () =>
    set((state) => ({
      activePdbId: null,
      structureUrl: state.defaultStructureUrl,
      structureSource: state.defaultStructureSource,
    })),

  loadProtein: async (id: string) => {
    const cleanId = id.trim().toUpperCase();
    set({
      status: 'loading',
      error: null,
      uniprotId: cleanId,
      activePdbId: null,
      pdbEntries: [],
      showPdbTracks: false,
    });

    const [uniprotResult, interproResult, structureResult, pdbResult] = await Promise.allSettled([
      fetchUniprotEntry(cleanId),
      fetchInterproDomains(cleanId),
      (async () => {
        try {
          const af = await fetchAlphaFoldStructure(cleanId);
          return { url: af.cifUrl, source: 'alphafold' as const };
        } catch (err) {
          if (err instanceof AlphaFoldNotFoundError) {
            const rcsb = await fetchRcsbByUniprot(cleanId);
            if (rcsb) return { url: rcsb.cifUrl, source: 'rcsb' as const };
          }
          throw err;
        }
      })(),
      fetchPdbEntries(cleanId),
    ]);

    if (uniprotResult.status === 'rejected') {
      set({ status: 'error', error: uniprotResult.reason?.message ?? 'UniProt lookup failed' });
      return;
    }

    const proteinData = uniprotResult.value;
    const domains = interproResult.status === 'fulfilled' ? interproResult.value : [];
    const structureUrl =
      structureResult.status === 'fulfilled' ? structureResult.value.url : null;
    const structureSource =
      structureResult.status === 'fulfilled' ? structureResult.value.source : null;
    const pdbEntries = pdbResult.status === 'fulfilled' ? pdbResult.value : [];

    set({
      proteinData,
      domains,
      structureUrl,
      structureSource,
      defaultStructureUrl: structureUrl,
      defaultStructureSource: structureSource,
      pdbEntries,
      status: 'ready',
      error: null,
    });
  },
});
