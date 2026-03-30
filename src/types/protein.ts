// Use const object instead of enum (required for erasableSyntaxOnly)
export const PTMType = {
  PHOSPHORYLATION: 'phosphorylation',
  DISULFIDE: 'disulfide',
  GLYCOSYLATION: 'glycosylation',
  OTHER: 'other',
} as const;
export type PTMType = typeof PTMType[keyof typeof PTMType];

export interface PTM {
  type: PTMType;
  position: number; // 1-based UniProt numbering
  description: string;
}

export interface ProteinSequence {
  value: string;
  length: number;
}

export interface TransmembraneRegion {
  start: number;   // 1-based UniProt residue
  end: number;     // 1-based UniProt residue
  description: string;
}

export interface ProteinData {
  uniprotId: string;
  name: string;
  organism: string;
  sequence: ProteinSequence;
  ptms: PTM[];
  tmRegions: TransmembraneRegion[];
}

export interface Domain {
  accession: string;
  name: string;
  sourceDatabase: string;
  entryType: string;
  start: number; // 1-based
  end: number;   // 1-based
}

export interface PDBEntry {
  pdbId: string;
  chainId: string;
  uniprotStart: number;  // 1-based, UniProt residue numbering
  uniprotEnd: number;
  resolution: number | null;
  experimentalMethod: string;
  cifUrl: string;
}
