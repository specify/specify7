import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./utils.tsx before editing this file

const lifemapperText = createDictionary({
  specifyNetwork: 'Specify Network',
  lifemapper: 'Lifemapper',
  noIssuesDetected: `
    Record was indexed successfully and no data quality issues were
    reported`,
  issuesDetected: 'The following data quality issues were reported:',
  localOccurrencePoints: 'Local Occurrence Points',
  leafletDetailsHeader: 'Lifemapper',
  leafletDetailsErrorsHeader: 'Status:',
  leafletDetailsInfoHeader: 'Details:',
  speciesName: 'Species Name:',
  projectionNotFound: 'No Species Distribution Model available.',
  modelCreationData: 'Model Creation date:',
  aggregatorBadgeTitle: (aggregatorName: string): string =>
    `Record was indexed by ${aggregatorName}`,
  viewOccurrenceAt: (aggregatorName: string): string =>
    `View occurrence at ${aggregatorName}`,
  projection: 'Projection',
  occurrencePoints: 'Occurrence Points',
  moreDetails: 'More Details',
  overLimitMessage: (limit: number) =>
    `Only the first ${limit} specimens are shown`,
});

export default lifemapperText;
