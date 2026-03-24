import type { StateCreator } from 'zustand';
import type { ProteinData, Domain } from '../../types/protein';
import { fetchUniprotEntry } from '../../services/uniprot';
import { fetchInterproDomains } from '../../services/interpro';
import { fetchAlphaFoldStructure, AlphaFoldNotFoundError } from '../../services/alphafold';
import { fetchRcsbByUniprot } from '../../services/rcsb';

export type LoadStatus = 'idle' | 'loading' | 'error' | 'ready';
export type StructureSource = 'alphafold' | 'rcsb' | null;

export interface ProteinSlice {
  uniprotId: string | null;
  proteinData: ProteinData | null;
  domains: Domain[];
  structureUrl: string | null;
  structureSource: StructureSource;
  status: LoadStatus;
  error: string | null;
  loadProtein: (id: string) => Promise<void>;
  clearProtein: () => void;
}

export const createProteinSlice: StateCreator<ProteinSlice> = (set) => ({
  uniprotId: null,
  proteinData: null,
  domains: [],
  structureUrl: null,
  structureSource: null,
  status: 'idle',
  error: null,

  clearProtein: () =>
    set({
      uniprotId: null,
      proteinData: null,
      domains: [],
      structureUrl: null,
      structureSource: null,
      status: 'idle',
      error: null,
    }),

  loadProtein: async (id: string) => {
    const cleanId = id.trim().toUpperCase();
    set({ status: 'loading', error: null, uniprotId: cleanId });

    const [uniprotResult, interproResult, structureResult] = await Promise.allSettled([
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

    set({ proteinData, domains, structureUrl, structureSource, status: 'ready', error: null });
  },
});
