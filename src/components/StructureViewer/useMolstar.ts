import { useEffect, useRef, useCallback } from 'react';
import type { MolstarHandle } from '../../types/plugins';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MolPlugin = any;

export interface UseMolstarResult {
  handleRef: React.MutableRefObject<MolstarHandle | null>;
  loadStructure: (url: string) => Promise<void>;
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

  const loadStructure = useCallback(async (url: string) => {
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
    } catch (err) {
      console.error('Failed to load structure:', err);
    }
  }, []);

  return { handleRef, loadStructure };
}
