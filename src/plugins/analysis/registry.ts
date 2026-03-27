import type { AnalysisPlugin } from '../../types/plugins';
import { mwPlugin } from './mwPlugin';
import { piPlugin } from './piPlugin';

export const ANALYSIS_PLUGINS: AnalysisPlugin[] = [
  mwPlugin,
  piPlugin,
];
