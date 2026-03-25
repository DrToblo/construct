import { create } from 'zustand';
import { createProteinSlice, type ProteinSlice } from './slices/proteinSlice';
import { createConstructSlice, type ConstructSlice } from './slices/constructSlice';
import { createPluginSlice, type PluginSlice } from './slices/pluginSlice';

export type AppStore = ProteinSlice & ConstructSlice & PluginSlice;

export const useStore = create<AppStore>()((...a) => ({
  ...createProteinSlice(...a),
  ...createConstructSlice(...a),
  ...createPluginSlice(...a),
}));

// Convenience typed selectors
export const useProteinStore = () =>
  useStore((s) => ({
    uniprotId: s.uniprotId,
    proteinData: s.proteinData,
    domains: s.domains,
    selectedDomainSources: s.selectedDomainSources,
    setSelectedDomainSources: s.setSelectedDomainSources,
    structureUrl: s.structureUrl,
    structureSource: s.structureSource,
    status: s.status,
    error: s.error,
    loadProtein: s.loadProtein,
    clearProtein: s.clearProtein,
  }));

export const useConstructStore = () =>
  useStore((s) => ({
    startResidue: s.startResidue,
    endResidue: s.endResidue,
    selectionStep: s.selectionStep,
    setStartResidue: s.setStartResidue,
    setEndResidue: s.setEndResidue,
    setRange: s.setRange,
    resetSelection: s.resetSelection,
    beginSelection: s.beginSelection,
  }));

export const usePluginStore = () =>
  useStore((s) => ({
    activeStructurePluginIds: s.activeStructurePluginIds,
    activeAnalysisPluginIds: s.activeAnalysisPluginIds,
    toggleStructurePlugin: s.toggleStructurePlugin,
    toggleAnalysisPlugin: s.toggleAnalysisPlugin,
  }));
