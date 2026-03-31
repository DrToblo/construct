export const ProcessingType = {
  SIGNAL: 'Signal',
  TRANSIT: 'Transit',
  PROPEPTIDE: 'Propeptide',
  CHAIN: 'Chain',
  PEPTIDE: 'Peptide',
} as const;
export type ProcessingType = typeof ProcessingType[keyof typeof ProcessingType];

export interface ProcessingRegion {
  type: ProcessingType;
  name: string;
  start: number; // 1-based UniProt residue
  end: number;   // 1-based UniProt residue
  description: string;
}

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

export interface ProteinInteraction {
  partnerAccession: string;
  partnerGeneName: string | null;
  numberOfExperiments: number;
  isSelf: boolean;          // same accession → homodimer / oligomer
  isXenoInteraction: boolean; // different organism
}

export interface ProteinData {
  uniprotId: string;
  name: string;
  organism: string;
  sequence: ProteinSequence;
  ptms: PTM[];
  tmRegions: TransmembraneRegion[];
  processingRegions: ProcessingRegion[];
  interactions: ProteinInteraction[];
  subunitText: string | null;
}

export interface Domain {
  accession: string;
  name: string;
  sourceDatabase: string;
  entryType: string;
  start: number; // 1-based
  end: number;   // 1-based
}

export interface SolubilityHit {
  target: string;      // fragment name from sol.fasta
  identity: number;    // 0–100 percentage
  queryStart: number;  // 1-based position in query protein
  queryEnd: number;    // 1-based position in query protein
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
