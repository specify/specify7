import type { RR } from './types';
import { snFrontendServer, snServer } from './lifemapperconfig';
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
  speciesName: string
): string =>
  `${snFrontendServer}/api/v1/frontend/?occid=${occurrenceGuid}&namestr=${speciesName}`;

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
  { layerLabel: string; transparent: boolean; opacity?: number }
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
