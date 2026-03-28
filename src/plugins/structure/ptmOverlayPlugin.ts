import type { StructurePlugin, MolstarHandle } from '../../types/plugins';
import type { ProteinData } from '../../types/protein';
import type { ConstructSelection } from '../../types/construct';
import { PTMType } from '../../types/protein';
import { PTM_COLOR_RGB } from '../../constants/ptmColors';

const PTM_SEL_PREFIX = 'ptm-sel-';

export const ptmOverlayPlugin: StructurePlugin = {
  id: 'ptm-overlay',
  name: 'PTM Sites',
  description: 'Shows PTM sites as colored space-fill spheres',

  async apply(handle: MolstarHandle, protein: ProteinData, _construct: ConstructSelection) {
    const { plugin } = handle;
    if (!plugin || protein.ptms.length === 0) return;

    await this.remove(handle);

    try {
      const { MolScriptBuilder: MS } = await import('molstar/lib/mol-script/language/builder');
      const { StateTransforms } = await import('molstar/lib/mol-plugin-state/transforms');
      const { Color } = await import('molstar/lib/mol-util/color');

      // Group PTM positions by type
      const byType = new Map<PTMType, number[]>();
      for (const ptm of protein.ptms) {
        const positions = byType.get(ptm.type) ?? [];
        positions.push(ptm.position);
        byType.set(ptm.type, positions);
      }

      const structures = plugin.managers.structure.hierarchy.current.structures;
      if (!structures.length) return;

      let idx = 0;
      for (const struct of structures) {
        // Batch all PTM representations into a single commit per structure
        const update = plugin.state.data.build();

        for (const [type, positions] of byType) {
          const [r, g, b] = PTM_COLOR_RGB[type];
          const color = Color.fromRgb(r, g, b);

          for (const pos of positions) {
            const selRef = `${PTM_SEL_PREFIX}${idx++}`;
            const expression = MS.struct.generator.atomGroups({
              'residue-test': MS.core.rel.eq([MS.ammp('label_seq_id'), pos]),
            });

            update
              .to(struct.cell)
              .apply(
                StateTransforms.Model.StructureSelectionFromExpression,
                { label: `PTM ${type} @${pos}`, expression },
                { ref: selRef },
              )
              .apply(StateTransforms.Representation.StructureRepresentation3D, {
                type: { name: 'spacefill', params: {} },
                colorTheme: { name: 'uniform', params: { value: color } },
                sizeTheme: { name: 'physical', params: {} },
              });
          }
        }

        await update.commit({ revertOnError: true });
      }
    } catch (err) {
      console.warn('ptmOverlayPlugin.apply failed:', err);
    }
  },

  async remove(handle: MolstarHandle) {
    const { plugin } = handle;
    if (!plugin) return;
    try {
      const state = plugin.state.data;
      const toRemove: string[] = [];
      state.cells.forEach((_: unknown, ref: string) => {
        if (ref.startsWith(PTM_SEL_PREFIX)) toRemove.push(ref);
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
