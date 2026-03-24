import type { StructurePlugin, MolstarHandle } from '../../types/plugins';
import type { ProteinData } from '../../types/protein';
import type { ConstructSelection } from '../../types/construct';
import { PTMType } from '../../types/protein';

const PTM_COLORS: Record<PTMType, { r: number; g: number; b: number }> = {
  [PTMType.PHOSPHORYLATION]: { r: 249, g: 115, b: 22 },  // orange
  [PTMType.DISULFIDE]: { r: 239, g: 68, b: 68 },          // red
  [PTMType.GLYCOSYLATION]: { r: 59, g: 130, b: 246 },     // blue
  [PTMType.OTHER]: { r: 139, g: 92, b: 246 },             // purple
};

const PTM_TAG_PREFIX = 'ptm-overlay-';

export const ptmOverlayPlugin: StructurePlugin = {
  id: 'ptm-overlay',
  name: 'PTM Sites',
  description: 'Highlights post-translational modification sites as spheres',

  async apply(handle: MolstarHandle, protein: ProteinData, _construct: ConstructSelection) {
    const { plugin } = handle;
    if (!plugin || protein.ptms.length === 0) return;

    await this.remove(handle);

    try {
      const { MolScriptBuilder: MS } = await import('molstar/lib/mol-script/language/builder');

      for (const ptm of protein.ptms) {
        const color = PTM_COLORS[ptm.type];
        const expression = MS.struct.modifier.union([
          MS.struct.generator.atomGroups({
            'residue-test': MS.core.rel.eq([
              MS.ammp('label_seq_id'),
              ptm.position,
            ]),
          }),
        ]);

        await plugin.managers.structure.component.add({
          selection: { kind: 'expression', expression },
          representation: 'spacefill',
          options: {
            label: `${PTM_TAG_PREFIX}${ptm.position}`,
            colorTheme: { name: 'uniform', params: { value: color } },
            sizeTheme: { name: 'uniform', params: { value: 0.6 } },
          },
        } as Parameters<typeof plugin.managers.structure.component.add>[0]);
      }
    } catch (err) {
      console.warn('ptmOverlayPlugin.apply failed:', err);
    }
  },

  async remove(handle: MolstarHandle) {
    const { plugin } = handle;
    if (!plugin) return;
    try {
      for (const struct of plugin.managers.structure.hierarchy.current.structures) {
        for (const comp of struct.components) {
          const label = (comp.cell.transform.params as { label?: string })?.label ?? '';
          if (label.startsWith(PTM_TAG_PREFIX)) {
            await plugin.managers.structure.component.remove(comp.cell.transform.ref);
          }
        }
      }
    } catch (_) {
      // ignore
    }
  },
};
