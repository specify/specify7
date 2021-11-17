import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

const lifemapperText = createDictionary({
  specifyNetwork: {
    'en-us': 'Specify Network (opens in new tab)',
    'ru-ru': 'Specify Network (opens in new tab)',
  },
  speciesDistributionMap: {
    'en-us': 'Species Distribution Map',
    'ru-ru': 'Species Distribution Map',
  },
  markerLayerLabel: {
    'en-us': 'Your Database Pins',
    'ru-ru': 'Your Database Pins',
  },
  polygonLayerLabel: {
    'en-us': 'Your Database Polygons',
    'ru-ru': 'Your Database Polygons',
  },
  polygonBoundaryLayerLabel: {
    'en-us': 'Your Database Polygon Boundaries',
    'ru-ru': 'Your Database Polygon Boundaries',
  },
  leafletDetailsHeader: {
    'en-us': 'Legend',
    'ru-ru': 'Legend',
  },
  leafletDetailsErrorsHeader: {
    'en-us': 'Lifemapper:',
    'ru-ru': 'Lifemapper:',
  },
  gbif: {
    'en-us': 'GBIF:',
    'ru-ru': 'GBIF:',
  },
  projectionNotFound: {
    'en-us': 'No Distribution Model available.',
    'ru-ru': 'No Distribution Model available.',
  },
  modelCreationData: {
    'en-us': 'Model Created:',
    'ru-ru': 'Model Created:',
  },
  projection: {
    'en-us': 'Lifemapper Distribution Model',
    'ru-ru': 'Lifemapper Distribution Model',
  },
  occurrencePoints: {
    'en-us': 'GBIF Occurrence Points',
    'ru-ru': 'GBIF Occurrence Points',
  },
  overLimitMessage: {
    'en-us': (limit: number) => `Only the first ${limit} specimens are shown`,
    'ru-ru': (limit: number) => `Only the first ${limit} specimens are shown`,
  },
  errorsOccurred: {
    'en-us': 'The following errors occurred while trying to display the map:',
    'ru-ru': 'The following errors occurred while trying to display the map:',
  },
  noMap: {
    'en-us': 'Failed to find a projection map',
    'ru-ru': 'Failed to find a projection map',
  },
});

export default lifemapperText;
