import type { ProteinData, PTM } from '../types/protein';
import { PTMType } from '../types/protein';

export class UniprotNotFoundError extends Error {
  constructor(id: string) {
    super(`UniProt entry not found: ${id}`);
    this.name = 'UniprotNotFoundError';
  }
}

function parsePTMType(description: string): PTMType {
  const lower = description.toLowerCase();
  if (lower.includes('phospho')) return PTMType.PHOSPHORYLATION;
  if (lower.includes('glyco')) return PTMType.GLYCOSYLATION;
  if (lower.includes('disulfide')) return PTMType.DISULFIDE;
  return PTMType.OTHER;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractPTMs(features: any[]): PTM[] {
  const ptms: PTM[] = [];
  for (const f of features) {
    const type: string = f.type ?? '';
    if (type === 'Modified residue' || type === 'Disulfide bond' || type === 'Glycosylation') {
      const pos = f.location?.start?.value ?? f.location?.position?.value;
      if (pos == null) continue;
      const desc = f.description ?? type;
      ptms.push({
        type: parsePTMType(type === 'Disulfide bond' ? 'disulfide' : desc),
        position: Number(pos),
        description: desc,
      });
    }
  }
  return ptms;
}

export async function fetchUniprotEntry(id: string): Promise<ProteinData> {
  const url = `https://rest.uniprot.org/uniprotkb/${id}.json`;
  const res = await fetch(url);
  if (res.status === 404) throw new UniprotNotFoundError(id);
  if (!res.ok) throw new Error(`UniProt API error: ${res.status}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json();

  const seqValue: string = data.sequence?.value ?? '';
  const organism: string =
    data.organism?.commonName ??
    data.organism?.scientificName ??
    'Unknown organism';

  const name: string =
    data.proteinDescription?.recommendedName?.fullName?.value ??
    data.proteinDescription?.submissionNames?.[0]?.fullName?.value ??
    id;

  const features = data.features ?? [];
  const ptms = extractPTMs(features);

  return {
    uniprotId: id.toUpperCase(),
    name,
    organism,
    sequence: {
      value: seqValue,
      length: seqValue.length,
    },
    ptms,
  };
}
