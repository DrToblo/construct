import type { ReactNode } from 'react';
import type { ProteinData } from './protein';
import type { ConstructSelection } from './construct';

// Opaque handle to the Mol* plugin instance.
// Typed loosely here; StructureViewer internals use concrete Mol* types.
export interface MolstarHandle {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugin: any;
}

export interface StructurePlugin {
  id: string;
  name: string;
  description: string;
  apply(handle: MolstarHandle, protein: ProteinData, construct: ConstructSelection): Promise<void>;
  remove(handle: MolstarHandle): Promise<void>;
}

export interface AnalysisResult {
  pluginId: string;
  // Plugin-specific payload; typed internally per plugin
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

export interface AnalysisPlugin {
  id: string;
  name: string;
  description: string;
  analyze(sequence: string, metadata: ProteinData, construct: ConstructSelection): AnalysisResult;
  renderResult(result: AnalysisResult): ReactNode;
}
