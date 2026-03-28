import type { StructurePlugin, MolstarHandle } from '../../types/plugins';
import type { ProteinData } from '../../types/protein';
import type { ConstructSelection } from '../../types/construct';

export const plddtColorPlugin: StructurePlugin = {
  id: 'plddt-color',
  name: 'pLDDT Confidence',
  description: 'Colors structure by AlphaFold pLDDT confidence score',

  async apply(handle: MolstarHandle, _protein: ProteinData, _construct: ConstructSelection) {
    const { plugin } = handle;
    if (!plugin) return;

    try {
      const { StateTransforms } = await import('molstar/lib/mol-plugin-state/transforms');
      for (const s of plugin.managers.structure.hierarchy.current.structures) {
        const update = plugin.state.data.build();
        for (const c of s.components) {
          for (const r of c.representations) {
            update.to(r.cell).update(
              StateTransforms.Representation.StructureRepresentation3D,
              (old: Record<string, unknown>) => ({
                ...old,
                colorTheme: { name: 'plddt-confidence', params: {} },
              }),
            );
          }
        }
        await update.commit({ revertOnError: true });
      }
    } catch (err) {
      console.warn('plddtColorPlugin.apply failed:', err);
    }
  },

  async remove(handle: MolstarHandle) {
    const { plugin } = handle;
    if (!plugin) return;
    try {
      const { StateTransforms } = await import('molstar/lib/mol-plugin-state/transforms');
      for (const s of plugin.managers.structure.hierarchy.current.structures) {
        const update = plugin.state.data.build();
        for (const c of s.components) {
          for (const r of c.representations) {
            update.to(r.cell).update(
              StateTransforms.Representation.StructureRepresentation3D,
              (old: Record<string, unknown>) => ({
                ...old,
                colorTheme: { name: 'chain-id', params: {} },
              }),
            );
          }
        }
        await update.commit({ revertOnError: true });
      }
    } catch (_) {
      // ignore
    }
  },
};
