import type { StateCreator } from 'zustand';
import { PTMType } from '../../types/protein';

export interface PluginSlice {
  activeStructurePluginIds: string[];
  activeAnalysisPluginIds: string[];
  activePtmTypes: PTMType[];
  showTmRegions: boolean;
  toggleStructurePlugin: (id: string) => void;
  toggleAnalysisPlugin: (id: string) => void;
  setActiveStructurePlugins: (ids: string[]) => void;
  setActiveAnalysisPlugins: (ids: string[]) => void;
  togglePtmType: (type: PTMType) => void;
  toggleTmRegions: () => void;
}

export const createPluginSlice: StateCreator<PluginSlice> = (set) => ({
  activeStructurePluginIds: ['construct-highlight', 'plddt-color'],
  activeAnalysisPluginIds: ['mw', 'pi', 'composition', 'charge'],
  activePtmTypes: [PTMType.PHOSPHORYLATION, PTMType.DISULFIDE, PTMType.GLYCOSYLATION, PTMType.OTHER],
  showTmRegions: true,

  toggleStructurePlugin: (id) =>
    set((state) => ({
      activeStructurePluginIds: state.activeStructurePluginIds.includes(id)
        ? state.activeStructurePluginIds.filter((x) => x !== id)
        : [...state.activeStructurePluginIds, id],
    })),

  toggleAnalysisPlugin: (id) =>
    set((state) => ({
      activeAnalysisPluginIds: state.activeAnalysisPluginIds.includes(id)
        ? state.activeAnalysisPluginIds.filter((x) => x !== id)
        : [...state.activeAnalysisPluginIds, id],
    })),

  setActiveStructurePlugins: (ids) => set({ activeStructurePluginIds: ids }),
  setActiveAnalysisPlugins: (ids) => set({ activeAnalysisPluginIds: ids }),

  togglePtmType: (type) =>
    set((state) => ({
      activePtmTypes: state.activePtmTypes.includes(type)
        ? state.activePtmTypes.filter((t) => t !== type)
        : [...state.activePtmTypes, type],
    })),

  toggleTmRegions: () =>
    set((state) => ({ showTmRegions: !state.showTmRegions })),
});
