import type { StructurePlugin, MolstarHandle } from '../../types/plugins';
import type { ProteinData } from '../../types/protein';
import type { ConstructSelection } from '../../types/construct';

export const constructHighlightPlugin: StructurePlugin = {
  id: 'construct-highlight',
  name: 'Construct Range',
  description: 'Highlights selected construct range in orange',

  async apply(handle: MolstarHandle, _protein: ProteinData, construct: ConstructSelection) {
    const { plugin } = handle;
    if (!plugin) return;

    const { startResidue, endResidue } = construct;
    if (startResidue == null || endResidue == null) return;

    try {
      const { MolScriptBuilder: MS } = await import('molstar/lib/mol-script/language/builder');
      const { Script } = await import('molstar/lib/mol-script/script');
      const { StructureSelection } = await import('molstar/lib/mol-model/structure/query');
      const { Color } = await import('molstar/lib/mol-util/color');
      const { setStructureOverpaint } = await import('molstar/lib/mol-plugin-state/helpers/structure-overpaint');

      // Clear any previous overpaint first
      await this.remove(handle);

      const expression = MS.struct.modifier.union([
        MS.struct.generator.atomGroups({
          'residue-test': MS.core.rel.inRange([
            MS.ammp('label_seq_id'),
            startResidue,
            endResidue,
          ]),
        }),
      ]);

      const structures = plugin.managers.structure.hierarchy.current.structures;
      if (!structures.length) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allComponents = structures.flatMap((s: any) => s.components);

      await setStructureOverpaint(
        plugin,
        allComponents,
        Color.fromRgb(234, 88, 12), // orange, matching the sequence highlight
        async (structure) => {
          const sel = Script.getStructureSelection(expression, structure);
          return StructureSelection.toLociWithSourceUnits(sel);
        },
      );
    } catch (err) {
      console.warn('constructHighlightPlugin.apply failed:', err);
    }
  },

  async remove(handle: MolstarHandle) {
    const { plugin } = handle;
    if (!plugin) return;
    try {
      const { clearStructureOverpaint } = await import('molstar/lib/mol-plugin-state/helpers/structure-overpaint');
      const structures = plugin.managers.structure.hierarchy.current.structures;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allComponents = structures.flatMap((s: any) => s.components);
      await clearStructureOverpaint(plugin, allComponents);
    } catch (_) {
      // ignore — structure may have been cleared
    }
  },
};
