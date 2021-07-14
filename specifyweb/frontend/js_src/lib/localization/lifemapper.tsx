import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./utils.tsx before editing this file

const lifemapperText = createDictionary({
  specifyNetwork: 'Specify Network',
  speciesDistributionMap: 'Species Distribution Map',
  noIssuesDetected: `
    Record was indexed successfully and no data quality issues were
    reported`,
  issuesDetected: 'The following data quality issues were reported:',
  localOccurrencePoints: 'Your Database Points',
  markerLayerLabel: 'Your Database Pins',
  polygonLayerLabel: 'Your Database Polygons',
  polygonBoundaryLayerLabel: 'Your Database Polygon Boundaries',
  leafletDetailsHeader: 'Legend',
  leafletDetailsErrorsHeader: 'Lifemapper:',
  gbif: 'GBIF:',
  projectionNotFound: 'No Distribution Model available.',
  modelCreationData: 'Model Created:',
  aggregatorBadgeTitle: (aggregatorName: string): string =>
    `Record was indexed by ${aggregatorName}`,
  viewOccurrenceAt: (aggregatorName: string): string =>
    `View occurrence at ${aggregatorName}`,
  projection: 'Lifemapper Distribution Model',
  occurrencePoints: 'GBIF Occurrence Points',
  moreDetails: 'More Details',
  overLimitMessage: (limit: number) =>
    `Only the first ${limit} specimens are shown`,
  errorsOccurred:
    'The following errors occurred while trying to display the map:',
  noMap: 'Failed to find a projection map',
});

export default lifemapperText;
