import { useEffect } from 'react';
import { skip } from 'rxjs';
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

    // skip(1) avoids replaying the BehaviorSubject's last value on re-subscribe
    // (which would immediately re-fire the previous click when selectionStep changes to 'selectingEnd')
    const sub = plugin.behaviors.interaction.click.pipe(skip(1)).subscribe(async (event: any) => {
      if (selectionStep === 'none' || selectionStep === 'complete') return;

      const loci = event?.current?.loci;
      if (!loci) return;

      // Capture camera state immediately — before Molstar's focus animation starts
      const cameraSnapshot = plugin.canvas3d?.camera.getSnapshot();

      try {
        const { StructureElement, StructureProperties } = await import('molstar/lib/mol-model/structure');
        const { OrderedSet } = await import('molstar/lib/mol-data/int');

        if (!StructureElement.Loci.is(loci)) return;

        const loc = StructureElement.Location.create(loci.structure);
        let found: number | null = null;

        for (const e of loci.elements) {
          if (found !== null) break;
          OrderedSet.forEach(e.indices, (i: number) => {
            if (found !== null) return;
            loc.unit = e.unit;
            loc.element = e.unit.elements[i];
            const seqId = StructureProperties.residue.label_seq_id(loc);
            if (seqId > 0) found = seqId;
          });
        }

        if (found !== null) {
          onResidueClick(found);

          // Prevent Molstar from zooming in and showing side chains:
          // 1. Restore camera to pre-click position (cancels focus animation)
          if (cameraSnapshot && plugin.canvas3d) {
            plugin.canvas3d.camera.setState(cameraSnapshot, 0);
          }
          // 2. Clear Molstar's internal focus (which triggers side chain display)
          plugin.managers.structure.focus.clear();
          // 3. Clear highlight so residue doesn't stay visually selected
          plugin.managers.interactivity.lociHighlights.clearHighlights();
        }
      } catch (err) {
        console.warn('Residue selection extraction failed:', err);
      }
    });

    return () => sub.unsubscribe();
  }, [handle, selectionStep, onResidueClick]);
}
