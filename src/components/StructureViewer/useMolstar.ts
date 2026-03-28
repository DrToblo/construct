import { useEffect, useRef, useCallback } from 'react';
import type { MolstarHandle } from '../../types/plugins';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MolPlugin = any;

/** Apply full transparency to all chains not in targetChainIds. */
async function hideNonTargetChains(plugin: MolPlugin, targetChainIds: string[]) {
  try {
    const { MolScriptBuilder: MS } = await import('molstar/lib/mol-script/language/builder');
    const { Script } = await import('molstar/lib/mol-script/script');
    const { StructureSelection } = await import('molstar/lib/mol-model/structure/query');
    const { setStructureTransparency } = await import(
      'molstar/lib/mol-plugin-state/helpers/structure-transparency'
    );

    const expression = MS.struct.generator.atomGroups({
      'chain-test': MS.core.logic.not([
        MS.core.set.has([MS.set(...targetChainIds), MS.ammp('auth_asym_id')]),
      ]),
    });

    const structures = plugin.managers.structure.hierarchy.current.structures;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allComponents = structures.flatMap((s: any) => s.components);
    if (!allComponents.length) return;

    await setStructureTransparency(plugin, allComponents, 1, async (structure: MolPlugin) => {
      const sel = Script.getStructureSelection(expression, structure);
      return StructureSelection.toLociWithSourceUnits(sel);
    });
  } catch (err) {
    console.warn('hideNonTargetChains failed:', err);
  }
}

export interface UseMolstarResult {
  handleRef: React.MutableRefObject<MolstarHandle | null>;
  loadStructure: (url: string, chainIds?: string[]) => Promise<void>;
}

export function useMolstar(
  containerRef: React.RefObject<HTMLDivElement | null>,
  onReady: (handle: MolstarHandle) => void,
  onDispose: () => void,
): UseMolstarResult {
  const pluginRef = useRef<MolPlugin>(null);
  const handleRef = useRef<MolstarHandle | null>(null);
  const onReadyRef = useRef(onReady);
  const onDisposeRef = useRef(onDispose);
  onReadyRef.current = onReady;
  onDisposeRef.current = onDispose;

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    let cancelled = false;

    async function init() {
      try {
        const { createPluginUI } = await import('molstar/lib/mol-plugin-ui');
        const { renderReact18 } = await import('molstar/lib/mol-plugin-ui/react18');
        const { DefaultPluginUISpec } = await import('molstar/lib/mol-plugin-ui/spec');
        if (cancelled) return;

        const spec = DefaultPluginUISpec();
        // Remove camera-focus-loci so clicking a residue doesn't auto-zoom the camera
        spec.behaviors = (spec.behaviors ?? []).filter(
          (b) => b?.transformer?.id !== 'camera-focus-loci',
        );
        spec.canvas3d = {
          cameraClipping: { far: false, radius: 100, minNear: 0.1 },
          sceneRadiusFactor: 2,
        };
        spec.layout = {
          initial: {
            isExpanded: false,
            showControls: false,
            regionState: {
              left: 'hidden',
              right: 'hidden',
              bottom: 'hidden',
              top: 'hidden',
            },
          },
        };

        const plugin = await createPluginUI({
          target: container,
          render: renderReact18,
          spec,
        });

        if (cancelled) {
          plugin.dispose();
          return;
        }

        pluginRef.current = plugin;
        handleRef.current = { plugin };
        onReadyRef.current({ plugin });
      } catch (err) {
        console.error('Mol* initialization failed:', err);
      }
    }

    init();

    return () => {
      cancelled = true;
      if (pluginRef.current) {
        try { pluginRef.current.dispose(); } catch (_) { /* ignore */ }
        pluginRef.current = null;
        handleRef.current = null;
        onDisposeRef.current();
      }
    };
  // We intentionally only run this once per container mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadStructure = useCallback(async (url: string, chainIds?: string[]) => {
    const plugin = pluginRef.current;
    if (!plugin) return;
    try {
      await plugin.clear();
      const { Asset } = await import('molstar/lib/mol-util/assets');
      const { PluginCommands } = await import('molstar/lib/mol-plugin/commands');

      const data = await plugin.builders.data.download(
        { url: Asset.Url(url), isBinary: false },
        { state: { isGhost: true } },
      );
      const trajectory = await plugin.builders.structure.parseTrajectory(data, 'mmcif');
      await plugin.builders.structure.hierarchy.applyPreset(trajectory, 'default');
      PluginCommands.Camera.Reset(plugin);

      if (chainIds && chainIds.length > 0) {
        await hideNonTargetChains(plugin, chainIds);
      }
    } catch (err) {
      console.error('Failed to load structure:', err);
    }
  }, []);

  return { handleRef, loadStructure };
}
