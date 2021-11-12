import type { RA } from '../components/wbplanview';
import { createDictionary, createHeader } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

const queryText = createDictionary({
  queryBoxDescription: {
    'en-us': (fieldNames: RA<string>) => `Searches: ${fieldNames.join(', ')}`,
  },
  selectFields: {
    'en-us': 'Select Field...',
  },
  treeRankAuthor: {
    'en-us': (rankName: string) => `${rankName} Author`,
  },
  selectOp: {
    'en-us': 'Select Op...',
  },
  any: {
    'en-us': 'any',
  },
  startValue: {
    'en-us': 'Start Value',
  },
  endValue: {
    'en-us': 'End Value',
  },
  addValuesHint: {
    'en-us': 'Add values one by one, or as comma-separated list:',
  },
  saveQueryDialogTitle: {
    'en-us': 'Save query as...',
  },
  savingQueryDialogTitle: {
    'en-us': 'Save Query',
  },
  saveQueryDialogHeader: {
    'en-us': createHeader('Save Query'),
  },
  saveQueryDialogMessage: {
    'en-us': 'Enter a name for the new query.',
  },
  saveClonedQueryDialogHeader: {
    'en-us': createHeader('Clone Query'),
  },
  saveClonedQueryDialogMessage: {
    'en-us': `
      The query will be saved with a new name leaving the current query
      unchanged.`,
  },
  queryName: {
    'en-us': 'Query Name:',
  },
  queryDeleteIncompleteDialogTitle: {
    'en-us': 'Incomplete fields',
  },
  queryDeleteIncompleteDialogHeader: {
    'en-us': createHeader('Query definition contains incomplete fields'),
  },
  queryDeleteIncompleteDialogMessage: {
    'en-us': `
      There are uncompleted fields in the query definition. Do you want to
      remove them?`,
  },
  queryUnloadProtectDialogMessage: {
    'en-us': 'This query definition has not been saved.',
  },
  recordSetToQueryDialogTitle: {
    'en-us': 'Record Set',
  },
  recordSetToQueryDialogHeader: {
    'en-us': createHeader('Creating a Record Set from Query'),
  },
  recordSetToQueryDialogMessage: {
    'en-us': 'Generating Record Set...',
  },
  recordSetCreatedDialogTitle: {
    'en-us': 'Record Set Created',
  },
  recordSetCreatedDialogHeader: {
    'en-us': createHeader('Open newly created record set now?'),
  },
  recordSetCreatedDialogMessage: {
    'en-us': 'Open newly created record set now?',
  },
  unableToExportAsKmlDialogTitle: {
    'en-us': 'KML Export',
  },
  unableToExportAsKmlDialogHeader: {
    'en-us': createHeader('Unable to export to KML'),
  },
  unableToExportAsKmlDialogMessage: {
    'en-us': 'Please add latitude and longitude fields to the query.',
  },
  queryExportStartedDialogTitle: {
    'en-us': 'Export Query',
  },
  queryExportStartedDialogHeader: {
    'en-us': createHeader('Query Export started'),
  },
  queryExportStartedDialogMessage: {
    'en-us': (exportFileType: string) => `
      The query has begun executing. You will receive a notification when the
      results ${exportFileType} file is ready for download.`,
  },
  invalidPicklistValue: {
    'en-us': (value: string) => `${value} (current, invalid value)`,
  },
  missingRequiredPicklistValue: {
    'en-us': 'Invalid null selection',
  },
  // QueryTask
  queryTaskTitle: {
    'en-us': (queryName: string) => `Query: ${queryName}`,
  },
  queryRecordSetTitle: {
    'en-us': (queryName: string, recordSetName: string) =>
      `Query on ${recordSetName}: ${queryName}`,
  },
  newButtonDescription: {
    'en-us': 'New Field',
  },
  countOnly: {
    'en-us': 'Count',
  },
  distinct: {
    'en-us': 'Distinct',
  },
  format: {
    'en-us': 'Format',
  },
  createCsv: {
    'en-us': 'Create CSV',
  },
  createKml: {
    'en-us': 'Create KML',
  },
  makeRecordSet: {
    'en-us': 'Make Record Set',
  },
  abandonChanges: {
    'en-us': 'Abandon Changes',
  },
  saveAs: {
    'en-us': 'Save As',
  },
  // QueryField
  expandButtonDescription: {
    'en-us': 'Field is valid and will be saved. Click to expand',
  },
  anyInline: {
    'en-us': '(any)',
  },
  sort: {
    'en-us': 'Sort',
  },
  negate: {
    'en-us': 'Negate',
  },
  moveUp: {
    'en-us': 'Move up',
  },
  moveDown: {
    'en-us': 'Move down',
  },
  showButtonDescription: {
    'en-us': 'Show in results',
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
  },
  // QueryResultsTable
  results: {
    'en-us': (count: number | string) => `Results: ${count}`,
  },
});

export default queryText;
