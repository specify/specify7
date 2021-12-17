import type { IR } from './types';
import lifemapperText from './localization/lifemapper';

export const snServer = 'https://broker.spcoco.org';
export const snFrontendServer = 'https://broker.spcoco.org';

export const SN_SERVICES: IR<string> = {
  lm: lifemapperText('speciesDistributionMap'),
};
export type MessageTypes = 'errorDetails' | 'infoSection';

export const defaultProjectionMapOpacity = 90;
