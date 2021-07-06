import { snFrontendServer, snServer } from './components/lifemapperinfo';
import type { RR } from './components/wbplanview';
import lifemapperText from './localization/lifemapper';

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

export const formatLifemapperViewPageRequest = (
  occurrenceGuid: string,
  speciesName: string,
  badgeName?: string
): string =>
  `${snFrontendServer}/api/v1/frontend/?occid=${occurrenceGuid}&namestr=${speciesName}${
    typeof badgeName === 'undefined' ? '' : `#occ_${badgeName}`
  }`;

export const formatOccurrenceDataRequest = (occurrenceGuid: string): string =>
  `${snServer}/api/v1/occ/${occurrenceGuid}?count_only=0`;

export const formatIconRequest = (
  providerName: string,
  icon_status: 'active' | 'inactive' | 'hover'
): string =>
  `${snServer}/api/v1/badge?provider=${providerName}&icon_status=${icon_status}`;

export const formatOccurrenceMapRequest = (
  occurrenceScientificName: string
): string =>
  `${snServer}/api/v1/map/${encodeURIComponent(
    occurrenceScientificName
  )}?provider=lm`;

export type LifemapperLayerTypes = 'vector' | 'raster';

export const lifemapperLayerVariations: RR<
  LifemapperLayerTypes,
  { layerLabel: string; transparent: boolean }
> = {
  raster: {
    layerLabel: lifemapperText('projection'),
    transparent: true,
  },
  vector: {
    layerLabel: lifemapperText('occurrencePoints'),
    transparent: true,
  },
};

export const extractElement = (
  elements: Readonly<[string | undefined, string | undefined]>,
  preferredElement: 0 | 1
): string =>
  (Boolean(elements[preferredElement])
    ? elements[preferredElement]
    : elements[(preferredElement + 1) % elements.length]) ?? '';
