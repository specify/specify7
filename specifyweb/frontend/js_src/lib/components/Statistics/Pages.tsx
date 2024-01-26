import { specifyNetworkText } from '../../localization/specifyNetwork';
import type { IR } from '../../utils/types';
import { SpecifyNetworkCollection } from '../SpecifyNetworkCollection';

// FIXME: add these pages to the stats page side bar
export const extraStatsPages: IR<() => JSX.Element | null> = {
  [specifyNetworkText.specifyNetwork()]: SpecifyNetworkCollection,
};
