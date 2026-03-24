import type { StructurePlugin } from '../../types/plugins';
import { constructHighlightPlugin } from './constructHighlightPlugin';
import { plddtColorPlugin } from './plddtColorPlugin';
import { ptmOverlayPlugin } from './ptmOverlayPlugin';

export const STRUCTURE_PLUGINS: StructurePlugin[] = [
  constructHighlightPlugin,
  plddtColorPlugin,
  ptmOverlayPlugin,
];
