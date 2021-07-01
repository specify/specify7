import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./utils.tsx before editing this file

const lifemapperText = createDictionary({
  noIssuesDetected: `
    Record was indexed successfully and no data quality issues were
    reported`,
  issuesDetected: 'The following data quality issues were reported:',
  nameStrCount: 'Number of occurrences of similar taxa records:',
  localOccurrencePoints: 'Local Occurrence Points',
  reportedCountTimes: (count: string): string => `(reported ${count} times)`,
  leafletDetailsErrorsTitle: 'Lifemapper Errors:',
  leafletDetailsInfoTitle: 'Projection Details:',
  speciesName: 'Species Name:',
  projectionNotFound: 'No Species Distribution Model available.',
  modelCreationData: 'Model Creation date:',
  aggregatorBadgeTitle: (aggregatorName: string): string =>
    `Record was indexed by ${aggregatorName}`,
  viewOccurrenceAt: (aggregatorName: string): string =>
    `View occurrence at ${aggregatorName}`,
  projection: 'Projection',
  occurrencePoints: 'Occurrence Points',
});

export default lifemapperText;
