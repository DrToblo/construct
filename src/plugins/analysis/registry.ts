import type { AnalysisPlugin } from '../../types/plugins';
import { mwPlugin } from './mwPlugin';
import { piPlugin } from './piPlugin';
import { compositionPlugin } from './compositionPlugin';
import { chargePlugin } from './chargePlugin';

export const ANALYSIS_PLUGINS: AnalysisPlugin[] = [
  mwPlugin,
  piPlugin,
  compositionPlugin,
  chargePlugin,
];
