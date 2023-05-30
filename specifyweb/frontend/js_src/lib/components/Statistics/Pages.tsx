import { specifyNetworkText } from '../../localization/specifyNetwork';
import { SpecifyNetworkCollection } from '../SpecifyNetworkCollection';
import { IR } from '../../utils/types';

// FIXME: add these pages to the stats page side bar
export const extraStatsPages: IR<() => JSX.Element | null> = {
  [specifyNetworkText.specifyNetwork()]: SpecifyNetworkCollection,
};
