import type { StructurePlugin, MolstarHandle } from '../../types/plugins';
import type { ProteinData } from '../../types/protein';
import type { ConstructSelection } from '../../types/construct';

const REPR_TAG = 'construct-highlight-repr';

export const constructHighlightPlugin: StructurePlugin = {
  id: 'construct-highlight',
  name: 'Construct Range',
  description: 'Highlights selected construct range in green',

  async apply(handle: MolstarHandle, _protein: ProteinData, construct: ConstructSelection) {
    const { plugin } = handle;
    if (!plugin) return;

    const { startResidue, endResidue } = construct;
    if (startResidue == null || endResidue == null) return;

    try {
      const { MolScriptBuilder: MS } = await import('molstar/lib/mol-script/language/builder');

      // Remove previous highlight repr
      await this.remove(handle);

      // Build a selection expression for residues in range
      const expression = MS.struct.modifier.union([
        MS.struct.generator.atomGroups({
          'residue-test': MS.core.rel.inRange([
            MS.ammp('label_seq_id'),
            startResidue,
            endResidue,
          ]),
        }),
      ]);

      // Create a representation component for persistent green coloring
      await plugin.managers.structure.component.add(
        {
          selection: { kind: 'expression', expression },
          representation: 'ball-and-stick',
          options: {
            label: REPR_TAG,
            colorTheme: { name: 'uniform', params: { value: { r: 0, g: 200, b: 0 } } },
          },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      );
    } catch (err) {
      console.warn('constructHighlightPlugin.apply failed:', err);
    }
  },

  async remove(handle: MolstarHandle) {
    const { plugin } = handle;
    if (!plugin) return;
    try {
      plugin.managers.interactivity.lociHighlights.clearHighlights();
      // Remove any previously added component with our tag
      for (const struct of plugin.managers.structure.hierarchy.current.structures) {
        for (const comp of struct.components) {
          if ((comp.cell.transform.params as { label?: string })?.label === REPR_TAG) {
            await plugin.managers.structure.component.remove(comp.cell.transform.ref);
          }
        }
      }
    } catch (_) {
      // ignore — structure may have been cleared
    }
  },
};
