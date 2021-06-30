import type { IR, RA, RR } from './components/wbplanview';
import type { OccurrenceCountRecord } from './lifemapperinforeducer';

const s2nServer = 'https://broker.spcoco.org';

export const fetchLocalScientificName = async (
  model: any,
  defaultValue = ''
): Promise<string> =>
  new Promise((resolve) => {
    model
      .rget('determinations')
      .done(({ models: determinations }: any) =>
        determinations.length === 0
          ? resolve(defaultValue)
          : determinations[0]
              .rget('preferredTaxon.fullname')
              .done((scientificName: string) =>
                resolve(scientificName === null ? defaultValue : scientificName)
              )
      );
  });

export const formatOccurrenceDataRequest = (occurrenceGuid: string): string =>
  `${s2nServer}/api/v1/occ/${occurrenceGuid}?count_only=0`;

export const formatOccurrenceCountRequest = (
  dataAggregatorName: string,
  occurrenceScientificName: string
): string =>
  `${s2nServer}/api/v1/name/${encodeURIComponent(
    occurrenceScientificName
  )}?provider=${dataAggregatorName}&count_only=1`;

const ICON_NAMES: RR<BadgeName, string> = {
  gbif: 'gbif',
  idigbio: 'idb',
  morphosource: 'mopho',
  lifemapper: 'lm',
};

export const formatIconRequest = (
  providerName: BadgeName,
  icon_status: 'active' | 'inactive' | 'hover'
): string =>
  `${s2nServer}/api/v1/badge?provider=${ICON_NAMES[providerName]}&icon_status=${icon_status}`;

export const formatOccurrenceMapRequest = (
  occurrenceScientificName: string
): string =>
  `${s2nServer}/api/v1/map/${encodeURIComponent(
    occurrenceScientificName
  )}?provider=lm`;

export const AGGREGATOR_NAMES: RA<string> = [
  'gbif',
  'idigbio',
  'morphosource',
] as const;
export const BADGE_NAMES: RA<string> = [
  ...AGGREGATOR_NAMES,
  'lifemapper',
] as const;

export type AggregatorName = typeof AGGREGATOR_NAMES[number];
export type BadgeName = typeof BADGE_NAMES[number];

export const sourceLabels: RR<BadgeName, string> = {
  gbif: 'GBIF',
  idigbio: 'iDigBio',
  morphosource: 'MorphoSource',
  lifemapper: 'Lifemapper Map',
} as const;

type AggregatorInfo = {
  issues: IR<string>;
  occurrenceName: string;
  occurrenceViewLink: string;
};

export type FullAggregatorInfo = AggregatorInfo & {
  count: number;
  occurrenceCount?: RA<OccurrenceCountRecord>;
};

export type LifemapperLayerTypes = 'vector' | 'raster';

export const lifemapperLayerVariations: RR<
  LifemapperLayerTypes,
  { layerLabel: string; transparent: boolean }
> = {
  raster: {
    layerLabel: 'Projection',
    transparent: true,
  },
  vector: {
    layerLabel: 'Occurrence Points',
    transparent: true,
  },
};

export const extractElement = (
  elements: Readonly<[string | undefined, string | undefined]>,
  preferredElement: 0 | 1
): string =>
  (!elements[preferredElement]
    ? elements[(preferredElement + 1) % elements.length]
    : elements[preferredElement]) ?? '';
