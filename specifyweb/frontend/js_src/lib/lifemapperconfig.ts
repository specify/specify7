import type { IR, RA, RR } from './components/wbplanview';
import lifemapperText from './localization/lifemapper';

const IS_DEVELOPMENT = false;

const defaultGuid = [
  '2c1becd5-e641-4e83-b3f5-76a55206539a',
  'dcb298f9-1ed3-11e3-bfac-90b11c41863e',
  '8eb23b1e-582e-4943-9dd9-e3a36ceeb498',
][0];
const defaultOccurrenceNames: Readonly<[string, string]> = [
  'Phlox longifolia Nutt.',
  'Phlox longifolia Nutt.',
] as const;

export const resolveGuid = (originalGuid: string) =>
  IS_DEVELOPMENT ? defaultGuid : originalGuid;
export const resolveOccurrenceNames = (
  occurrenceNames: Readonly<[string, string]>
) => (IS_DEVELOPMENT ? defaultOccurrenceNames : occurrenceNames);

export const snServer = 'https://broker-dev.spcoco.org';
export const snFrontendServer = 'https://broker.spcoco.org';

export const SN_SERVICES: IR<string> = {
  sn: lifemapperText('specifyNetwork'),
  lm: lifemapperText('lifemapper'),
};
export const ignoredAggregators: RA<string> = ['specify'];
export type MessageTypes = 'errorDetails' | 'infoSection';

export const lifemapperMessagesMeta: RR<
  MessageTypes,
  {
    className: string;
    title: string;
  }
> = {
  errorDetails: {
    className: 'error-details',
    title: lifemapperText('leafletDetailsErrorsHeader'),
  },
  infoSection: {
    className: 'info-section',
    title: lifemapperText('leafletDetailsInfoHeader'),
  },
} as const;
