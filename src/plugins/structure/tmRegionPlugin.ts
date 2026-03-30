import type { StructurePlugin, MolstarHandle } from '../../types/plugins';
import type { ProteinData } from '../../types/protein';
import type { ConstructSelection } from '../../types/construct';

const TM_SEL_PREFIX = 'tm-sel-';

export const tmRegionPlugin: StructurePlugin = {
  id: 'tm-region',
  name: 'Transmembrane Regions',
  description: 'Highlights transmembrane regions in black',

  async apply(handle: MolstarHandle, protein: ProteinData, _construct: ConstructSelection) {
    const { plugin } = handle;
    if (!plugin || !protein.tmRegions || protein.tmRegions.length === 0) return;

    await this.remove(handle);

    try {
      const { MolScriptBuilder: MS } = await import('molstar/lib/mol-script/language/builder');
      const { StateTransforms } = await import('molstar/lib/mol-plugin-state/transforms');
      const { Color } = await import('molstar/lib/mol-util/color');

      const structures = plugin.managers.structure.hierarchy.current.structures;
      if (!structures.length) return;

      const black = Color.fromRgb(0, 0, 0);

      let idx = 0;
      for (const struct of structures) {
        const update = plugin.state.data.build();

        for (const region of protein.tmRegions) {
          const selRef = `${TM_SEL_PREFIX}${idx++}`;

          const expression = MS.struct.modifier.union([
            MS.struct.generator.atomGroups({
              'residue-test': MS.core.rel.inRange([
                MS.ammp('label_seq_id'),
                region.start,
                region.end,
              ]),
            }),
          ]);

          update
            .to(struct.cell)
            .apply(
              StateTransforms.Model.StructureSelectionFromExpression,
              { label: `TM: ${region.description} (${region.start}–${region.end})`, expression },
              { ref: selRef },
            )
            .apply(StateTransforms.Representation.StructureRepresentation3D, {
              type: { name: 'cartoon', params: {} },
              colorTheme: { name: 'uniform', params: { value: black } },
              sizeTheme: { name: 'uniform', params: { value: 1 } },
            });
        }

        await update.commit({ revertOnError: true });
      }
    } catch (err) {
      console.warn('tmRegionPlugin.apply failed:', err);
    }
  },

  async remove(handle: MolstarHandle) {
    const { plugin } = handle;
    if (!plugin) return;
    try {
      const state = plugin.state.data;
      const toRemove: string[] = [];
      state.cells.forEach((_: unknown, ref: string) => {
        if (ref.startsWith(TM_SEL_PREFIX)) toRemove.push(ref);
      });
      if (toRemove.length > 0) {
        const update = state.build();
        for (const ref of toRemove) {
          if (state.cells.has(ref)) update.delete(ref);
        }
        await update.commit();
      }
    } catch (_) {
      // ignore — structure may have been cleared
    }
  },
};
