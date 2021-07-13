import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./utils.tsx before editing this file

const lifemapperText = createDictionary({
  specifyNetwork: 'Specify Network',
  speciesDistributionMap: 'Species Distribution Map',
  noIssuesDetected: `
    Record was indexed successfully and no data quality issues were
    reported`,
  issuesDetected: 'The following data quality issues were reported:',
  localOccurrencePoints: 'Your Database Occurrences',
  leafletDetailsHeader: 'Legend',
  leafletDetailsErrorsHeader: 'Status:',
  gbif: 'GBIF:',
  speciesName: 'Species:',
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
});

export default lifemapperText;
