import type { IR, RA } from './components/wbplanview';
import lifemapperText from './localization/lifemapper';

export const snServer = 'https://broker-dev.spcoco.org';
export const snFrontendServer = 'https://broker.spcoco.org';

export const SN_SERVICES: IR<string> = {
  lm: lifemapperText('speciesDistributionMap'),
  specify: lifemapperText('specifyNetwork'),
};
export const ignoredAggregators: RA<string> = ['specify'];
export type MessageTypes = 'errorDetails' | 'infoSection';

export const defaultProjectionMapOpacity = 90;
