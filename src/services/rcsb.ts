export interface RcsbStructure {
  cifUrl: string;
  pdbId: string;
  resolution: number | null;
  chainIds: string[];
}

const RCSB_GRAPHQL = 'https://data.rcsb.org/graphql';

/** Returns all auth_asym_ids in a PDB entry that map to the given UniProt accession. */
export async function fetchChainIdsForUniprotInPdb(
  pdbId: string,
  uniprotId: string,
): Promise<string[]> {
  const res = await fetch(RCSB_GRAPHQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `{
        entry(entry_id: "${pdbId}") {
          polymer_entities {
            rcsb_polymer_entity_container_identifiers {
              auth_asym_ids
              reference_sequence_identifiers {
                database_accession
                database_name
              }
            }
          }
        }
      }`,
    }),
  });
  if (!res.ok) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json();
  const entities = data?.data?.entry?.polymer_entities ?? [];
  const chainIds: string[] = [];
  for (const entity of entities) {
    const ids = entity?.rcsb_polymer_entity_container_identifiers;
    const refs: { database_name: string; database_accession: string }[] =
      ids?.reference_sequence_identifiers ?? [];
    const matchesUniprot = refs.some(
      (r) => r.database_name === 'UniProt' && r.database_accession === uniprotId,
    );
    if (matchesUniprot) {
      chainIds.push(...(ids?.auth_asym_ids ?? []));
    }
  }
  return chainIds;
}

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

  const chainIds = await fetchChainIdsForUniprotInPdb(pdbId, uniprotId);

  return {
    cifUrl: `https://files.rcsb.org/download/${pdbId}.cif`,
    pdbId,
    resolution,
    chainIds,
  };
}
