import type { RA } from '../components/wbplanview';
import { createDictionary, createHeader } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

const queryText = createDictionary({
  queryBoxDescription: {
    'en-us': (fieldNames: RA<string>) => `Searches: ${fieldNames.join(', ')}`,
    'ru-ru': (fieldNames: RA<string>) => `Searches: ${fieldNames.join(', ')}`,
  },
  selectFields: {
    'en-us': 'Select Field...',
    'ru-ru': 'Select Field...',
  },
  treeRankAuthor: {
    'en-us': (rankName: string) => `${rankName} Author`,
    'ru-ru': (rankName: string) => `${rankName} Author`,
  },
  selectOp: {
    'en-us': 'Select Op...',
    'ru-ru': 'Select Op...',
  },
  any: {
    'en-us': 'any',
    'ru-ru': 'any',
  },
  startValue: {
    'en-us': 'Start Value',
    'ru-ru': 'Start Value',
  },
  endValue: {
    'en-us': 'End Value',
    'ru-ru': 'End Value',
  },
  addValuesHint: {
    'en-us': 'Add values one by one, or as comma-separated list:',
    'ru-ru': 'Add values one by one, or as comma-separated list:',
  },
  saveQueryDialogTitle: {
    'en-us': 'Save query as...',
    'ru-ru': 'Save query as...',
  },
  savingQueryDialogTitle: {
    'en-us': 'Save Query',
    'ru-ru': 'Save Query',
  },
  saveQueryDialogHeader: {
    'en-us': createHeader('Save Query'),
    'ru-ru': createHeader('Save Query'),
  },
  saveQueryDialogMessage: {
    'en-us': 'Enter a name for the new query.',
    'ru-ru': 'Enter a name for the new query.',
  },
  saveClonedQueryDialogHeader: {
    'en-us': createHeader('Clone Query'),
    'ru-ru': createHeader('Clone Query'),
  },
  saveClonedQueryDialogMessage: {
    'en-us': `
      The query will be saved with a new name leaving the current query
      unchanged.`,
    'ru-ru': `
      The query will be saved with a new name leaving the current query
      unchanged.`,
  },
  queryName: {
    'en-us': 'Query Name:',
    'ru-ru': 'Query Name:',
  },
  queryDeleteIncompleteDialogTitle: {
    'en-us': 'Incomplete fields',
    'ru-ru': 'Incomplete fields',
  },
  queryDeleteIncompleteDialogHeader: {
    'en-us': createHeader('Query definition contains incomplete fields'),
    'ru-ru': createHeader('Query definition contains incomplete fields'),
  },
  queryDeleteIncompleteDialogMessage: {
    'en-us': `
      There are uncompleted fields in the query definition. Do you want to
      remove them?`,
    'ru-ru': `
      There are uncompleted fields in the query definition. Do you want to
      remove them?`,
  },
  queryUnloadProtectDialogMessage: {
    'en-us': 'This query definition has not been saved.',
    'ru-ru': 'This query definition has not been saved.',
  },
  recordSetToQueryDialogTitle: {
    'en-us': 'Record Set',
    'ru-ru': 'Record Set',
  },
  recordSetToQueryDialogHeader: {
    'en-us': createHeader('Creating a Record Set from Query'),
    'ru-ru': createHeader('Creating a Record Set from Query'),
  },
  recordSetToQueryDialogMessage: {
    'en-us': 'Generating Record Set...',
    'ru-ru': 'Generating Record Set...',
  },
  recordSetCreatedDialogTitle: {
    'en-us': 'Record Set Created',
    'ru-ru': 'Record Set Created',
  },
  recordSetCreatedDialogHeader: {
    'en-us': createHeader('Open newly created record set now?'),
    'ru-ru': createHeader('Open newly created record set now?'),
  },
  recordSetCreatedDialogMessage: {
    'en-us': 'Open newly created record set now?',
    'ru-ru': 'Open newly created record set now?',
  },
  unableToExportAsKmlDialogTitle: {
    'en-us': 'KML Export',
    'ru-ru': 'KML Export',
  },
  unableToExportAsKmlDialogHeader: {
    'en-us': createHeader('Unable to export to KML'),
    'ru-ru': createHeader('Unable to export to KML'),
  },
  unableToExportAsKmlDialogMessage: {
    'en-us': 'Please add latitude and longitude fields to the query.',
    'ru-ru': 'Please add latitude and longitude fields to the query.',
  },
  queryExportStartedDialogTitle: {
    'en-us': 'Export Query',
    'ru-ru': 'Export Query',
  },
  queryExportStartedDialogHeader: {
    'en-us': createHeader('Query Export started'),
    'ru-ru': createHeader('Query Export started'),
  },
  queryExportStartedDialogMessage: {
    'en-us': (exportFileType: string) => `
      The query has begun executing. You will receive a notification when the
      results ${exportFileType} file is ready for download.`,
    'ru-ru': (exportFileType: string) => `
      The query has begun executing. You will receive a notification when the
      results ${exportFileType} file is ready for download.`,
  },
  invalidPicklistValue: {
    'en-us': (value: string) => `${value} (current, invalid value)`,
    'ru-ru': (value: string) => `${value} (current, invalid value)`,
  },
  missingRequiredPicklistValue: {
    'en-us': 'Invalid null selection',
    'ru-ru': 'Invalid null selection',
  },
  // QueryTask
  queryTaskTitle: {
    'en-us': (queryName: string) => `Query: ${queryName}`,
    'ru-ru': (queryName: string) => `Query: ${queryName}`,
  },
  queryRecordSetTitle: {
    'en-us': (queryName: string, recordSetName: string) =>
      `Query on ${recordSetName}: ${queryName}`,
    'ru-ru': (queryName: string, recordSetName: string) =>
      `Query on ${recordSetName}: ${queryName}`,
  },
  newButtonDescription: {
    'en-us': 'New Field',
    'ru-ru': 'New Field',
  },
  countOnly: {
    'en-us': 'Count',
    'ru-ru': 'Count',
  },
  distinct: {
    'en-us': 'Distinct',
    'ru-ru': 'Distinct',
  },
  format: {
    'en-us': 'Format',
    'ru-ru': 'Format',
  },
  createCsv: {
    'en-us': 'Create CSV',
    'ru-ru': 'Create CSV',
  },
  createKml: {
    'en-us': 'Create KML',
    'ru-ru': 'Create KML',
  },
  makeRecordSet: {
    'en-us': 'Make Record Set',
    'ru-ru': 'Make Record Set',
  },
  abandonChanges: {
    'en-us': 'Abandon Changes',
    'ru-ru': 'Abandon Changes',
  },
  saveAs: {
    'en-us': 'Save As',
    'ru-ru': 'Save As',
  },
  // QueryField
  expandButtonDescription: {
    'en-us': 'Field is valid and will be saved. Click to expand',
    'ru-ru': 'Field is valid and will be saved. Click to expand',
  },
  anyInline: {
    'en-us': '(any)',
    'ru-ru': '(any)',
  },
  sort: {
    'en-us': 'Sort',
    'ru-ru': 'Sort',
  },
  negate: {
    'en-us': 'Negate',
    'ru-ru': 'Negate',
  },
  moveUp: {
    'en-us': 'Move up',
    'ru-ru': 'Move up',
  },
  moveDown: {
    'en-us': 'Move down',
    'ru-ru': 'Move down',
  },
  showButtonDescription: {
    'en-us': 'Show in results',
    'ru-ru': 'Show in results',
  },
  treeRanks: {
    'en-us': 'Tree Ranks',
  },
  month: {
    'en-us': 'Month',
  },
  day: {
    'en-us': 'Day',
  },
  extract: {
    'en-us': 'Extract...',
    'ru-ru': 'Extract...',
  },
  // QueryResultsTable
  results: {
    'en-us': (count: number | string) => `Results: ${count}`,
    'ru-ru': (count: number | string) => `Results: ${count}`,
  },
});

export default queryText;
