import { useEffect } from 'react';
import type { MolstarHandle } from '../../types/plugins';
import type { SelectionStep } from '../../types/construct';

interface UseResidueSelectionOptions {
  handle: MolstarHandle | null;
  selectionStep: SelectionStep;
  onResidueClick: (seqId: number) => void;
}

export function useResidueSelection({
  handle,
  selectionStep,
  onResidueClick,
}: UseResidueSelectionOptions) {
  useEffect(() => {
    if (!handle?.plugin) return;
    const plugin = handle.plugin;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sub = plugin.behaviors.interaction.click.subscribe(async (_event: any) => {
      if (selectionStep === 'none' || selectionStep === 'complete') return;

      // Give Mol* time to update its selection state
      await new Promise<void>((r) => setTimeout(r, 50));

      try {
        const { StructureProperties } = await import('molstar/lib/mol-model/structure');
        const { Structure } = await import('molstar/lib/mol-model/structure');

        // Iterate over current selection to find the clicked residue
        const sel = plugin.managers.structure.selection;
        let found: number | null = null;

        for (const [, entry] of sel.entries) {
          if (found !== null) break;
          const struct = entry.structure;
          if (!struct) continue;

          Structure.eachAtomicHierarchyElement(struct, {
            residue: (loc) => {
              if (found !== null) return;
              const seqId = StructureProperties.residue.label_seq_id(loc);
              if (seqId > 0) {
                found = seqId;
              }
            },
          });
        }

        if (found !== null) {
          onResidueClick(found);
        }
      } catch (err) {
        console.warn('Residue selection extraction failed:', err);
      }
    });

    return () => sub.unsubscribe();
  }, [handle, selectionStep, onResidueClick]);
}
