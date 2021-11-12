import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

const lifemapperText = createDictionary({
  specifyNetwork: {
    'en-us': 'Specify Network (opens in new tab)',
  },
  speciesDistributionMap: {
    'en-us': 'Species Distribution Map',
  },
  markerLayerLabel: {
    'en-us': 'Your Database Pins',
  },
  polygonLayerLabel: {
    'en-us': 'Your Database Polygons',
  },
  polygonBoundaryLayerLabel: {
    'en-us': 'Your Database Polygon Boundaries',
  },
  leafletDetailsHeader: {
    'en-us': 'Legend',
  },
  leafletDetailsErrorsHeader: {
    'en-us': 'Lifemapper:',
  },
  gbif: {
    'en-us': 'GBIF:',
  },
  projectionNotFound: {
    'en-us': 'No Distribution Model available.',
  },
  modelCreationData: {
    'en-us': 'Model Created:',
  },
  projection: {
    'en-us': 'Lifemapper Distribution Model',
  },
  occurrencePoints: {
    'en-us': 'GBIF Occurrence Points',
  },
  overLimitMessage: {
    'en-us': (limit: number) => `Only the first ${limit} specimens are shown`,
  },
  errorsOccurred: {
    'en-us': 'The following errors occurred while trying to display the map:',
  },
  noMap: {
    'en-us': 'Failed to find a projection map',
  },
});

export default lifemapperText;
