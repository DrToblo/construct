import type { PDBEntry } from '../types/protein';

const MAX_ENTRIES = 30;

export async function fetchPdbEntries(uniprotId: string): Promise<PDBEntry[]> {
  const url = `https://www.ebi.ac.uk/pdbe/api/mappings/best_structures/${uniprotId}`;
  const res = await fetch(url);
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`PDBe request failed: ${res.status}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json();
  const entries: PDBEntry[] = [];

  const list = data[uniprotId] ?? data[uniprotId.toLowerCase()] ?? [];
  for (const item of list.slice(0, MAX_ENTRIES)) {
    entries.push({
      pdbId: item.pdb_id,
      chainId: item.chain_id,
      uniprotStart: item.unp_start,
      uniprotEnd: item.unp_end,
      resolution: item.resolution ?? null,
      experimentalMethod: item.experimental_method ?? 'Unknown',
      cifUrl: `https://files.rcsb.org/download/${item.pdb_id}.cif`,
    });
  }
  return entries;
}
