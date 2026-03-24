// Monoisotopic residue masses (Da) — subtract one water per peptide bond
// These are residue masses (amino acid - H2O)
export const RESIDUE_MASS: Record<string, number> = {
  A: 71.03711,
  R: 156.10111,
  N: 114.04293,
  D: 115.02694,
  C: 103.00919,
  E: 129.04259,
  Q: 128.05858,
  G: 57.02146,
  H: 137.05891,
  I: 113.08406,
  L: 113.08406,
  K: 128.09496,
  M: 131.04049,
  F: 147.06841,
  P: 97.05276,
  S: 87.03203,
  T: 101.04768,
  W: 186.07931,
  Y: 163.06333,
  V: 99.06841,
  U: 150.95363, // selenocysteine
  O: 237.14773, // pyrrolysine
  X: 110.0,     // unknown
};

export const WATER_MASS = 18.01056;

// pKa values (Henderson-Hasselbalch model)
// Sources: Lehninger / Sigma-Aldrich
export interface PKaEntry {
  residue: string;
  pKa: number;
  charge: -1 | 1; // charge of protonated form (relative to neutral)
  protonatedForm: 'positive' | 'negative'; // which form is protonated
}

// For each ionizable group:
// 'positive' means the protonated form is positive (K, R, H, N-term) — deprotonation removes + charge
// 'negative' means the protonated form is neutral (D, E, C, Y, C-term) — deprotonation adds - charge
export const PKA_VALUES = {
  D: 3.65,
  E: 4.25,
  C: 8.18,
  Y: 10.07,
  H: 6.00,
  K: 10.53,
  R: 12.48,
  N_TERM: 8.00,
  C_TERM: 3.10,
};

// Amino acid one-letter codes
export const ALL_AA = 'ACDEFGHIKLMNPQRSTVWY';
