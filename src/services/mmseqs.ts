import type { SolubilityHit } from '../types/protein';

export async function searchSolubility(sequence: string, uniprotId: string): Promise<SolubilityHit[]> {
  const res = await fetch('/api/mmseqs-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sequence, uniprotId }),
  });
  if (!res.ok) throw new Error(`mmseqs search failed: ${res.statusText}`);
  const data = await res.json();
  return data.hits as SolubilityHit[];
}
