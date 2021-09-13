import type { IR } from './components/wbplanview';
import lifemapperText from './localization/lifemapper';

export const snServer = 'https://broker-dev.spcoco.org';
export const snFrontendServer = 'https://broker.spcoco.org';

export const SN_SERVICES: IR<string> = {
  lm: lifemapperText('speciesDistributionMap'),
  specify: lifemapperText('specifyNetwork'),
};
export type MessageTypes = 'errorDetails' | 'infoSection';

export const defaultProjectionMapOpacity = 90;
