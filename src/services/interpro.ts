import type { Domain } from '../types/protein';

const INCLUDED_TYPES = new Set(['domain', 'family', 'homologous_superfamily', 'repeat']);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseEntries(results: any[]): Domain[] {
  const domains: Domain[] = [];
  for (const result of results) {
    const meta = result.metadata ?? {};
    const entryType: string = (meta.type ?? '').toLowerCase();
    if (!INCLUDED_TYPES.has(entryType)) continue;

    const locations = result.proteins?.[0]?.entry_protein_locations ?? [];
    for (const loc of locations) {
      for (const frag of loc.fragments ?? []) {
        domains.push({
          accession: meta.accession ?? '',
          name: meta.name ?? meta.accession ?? '',
          sourceDatabase: meta.source_database ?? '',
          entryType,
          start: Number(frag.start),
          end: Number(frag.end),
        });
      }
    }
  }
  return domains;
}

export async function fetchInterproDomains(uniprotId: string): Promise<Domain[]> {
  const allDomains: Domain[] = [];
  let url: string | null =
    `https://www.ebi.ac.uk/interpro/api/entry/all/protein/uniprot/${uniprotId}/?format=json&page_size=50`;

  while (url) {
    const res = await fetch(url);
    if (res.status === 404) break; // no InterPro data for this protein
    if (!res.ok) throw new Error(`InterPro API error: ${res.status}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();
    const results = data.results ?? [];
    allDomains.push(...parseEntries(results));
    url = data.next ?? null;
  }

  return allDomains;
}
