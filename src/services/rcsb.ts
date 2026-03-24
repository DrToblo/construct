export interface RcsbStructure {
  cifUrl: string;
  pdbId: string;
  resolution: number | null;
}

const RCSB_GRAPHQL = 'https://data.rcsb.org/graphql';

export async function fetchRcsbByUniprot(uniprotId: string): Promise<RcsbStructure | null> {
  const query = `
    {
      polymer_entity_instances(
        instance_ids: []
      ) {
        rcsb_id
      }
    }
  `;

  // Use the RCSB search API to find structures by UniProt ID
  const searchUrl = `https://search.rcsb.org/rcsbsearch/v2/query`;
  const searchBody = {
    query: {
      type: 'terminal',
      service: 'text',
      parameters: {
        attribute: 'rcsb_polymer_entity_container_identifiers.reference_sequence_identifiers.database_accession',
        operator: 'exact_match',
        value: uniprotId,
      },
    },
    return_type: 'entry',
    request_options: {
      sort: [{ sort_by: 'rcsb_entry_info.resolution_combined', direction: 'asc' }],
      paginate: { start: 0, rows: 1 },
    },
  };

  const res = await fetch(searchUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(searchBody),
  });

  if (!res.ok) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json();
  const hits = data?.result_set ?? [];
  if (hits.length === 0) return null;

  const pdbId: string = hits[0].identifier;

  // Fetch resolution via GraphQL
  const gqlRes = await fetch(RCSB_GRAPHQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `{ entry(entry_id: "${pdbId}") { rcsb_entry_info { resolution_combined } } }`,
    }),
  });

  let resolution: number | null = null;
  if (gqlRes.ok) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gqlData: any = await gqlRes.json();
    resolution = gqlData?.data?.entry?.rcsb_entry_info?.resolution_combined?.[0] ?? null;
  }

  return {
    cifUrl: `https://files.rcsb.org/download/${pdbId}.cif`,
    pdbId,
    resolution,
  };
}
