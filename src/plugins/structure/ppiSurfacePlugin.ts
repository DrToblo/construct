import type { StructurePlugin, MolstarHandle } from '../../types/plugins';
import type { ProteinData } from '../../types/protein';
import type { ConstructSelection } from '../../types/construct';
import { PPI_COLOR_RGB } from '../../constants/ptmColors';

const PPI_SEL_PREFIX = 'ppi-sel-';

export const ppiSurfacePlugin: StructurePlugin = {
  id: 'ppi-surface',
  name: 'PPI Surfaces',
  description: 'Highlights protein-protein interaction surface residues',

  async apply(handle: MolstarHandle, protein: ProteinData, _construct: ConstructSelection) {
    const { plugin } = handle;
    if (!plugin || !protein.ppiSurfaces || protein.ppiSurfaces.length === 0) return;

    await this.remove(handle);

    try {
      const { MolScriptBuilder: MS } = await import('molstar/lib/mol-script/language/builder');
      const { StateTransforms } = await import('molstar/lib/mol-plugin-state/transforms');
      const { Color } = await import('molstar/lib/mol-util/color');

      const structures = plugin.managers.structure.hierarchy.current.structures;
      if (!structures.length) return;

      const [r, g, b] = PPI_COLOR_RGB;
      const color = Color.fromRgb(r, g, b);

      let idx = 0;
      for (const struct of structures) {
        for (const surface of protein.ppiSurfaces) {
          const selRef = `${PPI_SEL_PREFIX}${idx++}`;

          const expression = MS.struct.modifier.union([
            MS.struct.generator.atomGroups({
              'residue-test': MS.core.rel.inRange([
                MS.ammp('label_seq_id'),
                surface.start,
                surface.end,
              ]),
            }),
          ]);

          const update = plugin.state.data.build();
          update
            .to(struct.cell)
            .apply(
              StateTransforms.Model.StructureSelectionFromExpression,
              { label: `PPI: ${surface.description}`, expression },
              { ref: selRef },
            )
            .apply(StateTransforms.Representation.StructureRepresentation3D, {
              type: { name: 'spacefill', params: {} },
              colorTheme: { name: 'uniform', params: { value: color } },
              sizeTheme: { name: 'physical', params: {} },
            });

          await update.commit({ revertOnError: true });
        }
      }
    } catch (err) {
      console.warn('ppiSurfacePlugin.apply failed:', err);
    }
  },

  async remove(handle: MolstarHandle) {
    const { plugin } = handle;
    if (!plugin) return;
    try {
      const state = plugin.state.data;
      const toRemove: string[] = [];
      state.cells.forEach((_: unknown, ref: string) => {
        if (ref.startsWith(PPI_SEL_PREFIX)) toRemove.push(ref);
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
