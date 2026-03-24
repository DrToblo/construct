export interface AlphaFoldStructure {
  cifUrl: string;
  pdbUrl: string;
  entryId: string;
  fractionPlddtVeryHigh: number;
}

export class AlphaFoldNotFoundError extends Error {
  constructor(id: string) {
    super(`AlphaFold entry not found: ${id}`);
    this.name = 'AlphaFoldNotFoundError';
  }
}

export async function fetchAlphaFoldStructure(uniprotId: string): Promise<AlphaFoldStructure> {
  const url = `https://alphafold.ebi.ac.uk/api/prediction/${uniprotId}`;
  const res = await fetch(url);
  if (res.status === 404) throw new AlphaFoldNotFoundError(uniprotId);
  if (!res.ok) throw new Error(`AlphaFold API error: ${res.status}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any[] = await res.json();
  if (!data || data.length === 0) throw new AlphaFoldNotFoundError(uniprotId);

  const entry = data[0];
  return {
    cifUrl: entry.cifUrl ?? entry.mmcifUrl ?? '',
    pdbUrl: entry.pdbUrl ?? '',
    entryId: entry.entryId ?? '',
    fractionPlddtVeryHigh: entry.fractionPlddtVeryHigh ?? 0,
  };
}
