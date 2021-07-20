import type { RA } from '../components/wbplanview';
import { createDictionary, createHeader } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

const queryText = createDictionary({
  queryBoxDescription: (fieldNames: RA<string>) =>
    `Searches: ${fieldNames.join(', ')}`,
  fieldIsRequired: 'Field is required',
  selectFields: 'Select Field...',
  treeRankAuthor: (rankName: string) => `${rankName} Author`,
  selectOp: 'Select Op...',
  any: 'any',
  addValuesHint: 'Add values one by one, or as comma-separated list:',
  saveQueryDialogTitle: 'Save query as...',
  savingQueryDialogTitle: 'Save Query',
  saveQueryDialogHeader: createHeader('Save Query'),
  saveQueryDialogMessage: 'Enter a name for the new query.',
  saveClonedQueryDialogHeader: createHeader('Clone Query'),
  saveClonedQueryDialogMessage: `
    The query will be saved with a new name leaving the current query
    unchanged.`,
  queryName: 'Query Name:',
  queryDeleteIncompleteDialogTitle: 'Incomplete fields',
  queryDeleteIncompleteDialogHeader: createHeader(
    'Query definition contains incomplete fields'
  ),
  queryDeleteIncompleteDialogMessage: `
    There are uncompleted fields in the query definition. Do you want to
    remove them?`,
  queryUnloadProtectDialogMessage: 'This query definition has not been saved.',
  recordSetToQueryDialogTitle: 'Record Set',
  recordSetToQueryDialogHeader: createHeader(
    'Creating a Record Set from Query'
  ),
  recordSetToQueryDialogMessage: 'Generating Record Set...',
  recordSetCreatedDialogTitle: 'Record Set Created',
  recordSetCreatedDialogHeader: createHeader(
    'Open newly created record set now?'
  ),
  recordSetCreatedDialogMessage: 'Open newly created record set now?',
  unableToExportAsKmlDialogTitle: 'KML Export',
  unableToExportAsKmlDialogHeader: createHeader('Unable to export to KML'),
  unableToExportAsKmlDialogMessage:
    'Please add latitude and longitude fields to the query.',
  queryExportStartedDialogTitle: 'Export Query',
  queryExportStartedDialogHeader: createHeader('Query Export started'),
  queryExportStartedDialogMessage: (exportFileType: string) => `
    The query has begun executing. You will receive a notification when the
    results ${exportFileType} file is ready for download.`,
  invalidPicklistValue: (value: string) => `${value} (current, invalid value)`,
  missingRequiredPicklistValue: 'Invalid null selection',

  // QueryTask
  queryTaskTitle: (queryName: string) => `Query: ${queryName}`,
  new: 'New',
  newButtonDescription: 'New Field',
  countOnly: 'Count',
  distinct: 'Distinct',
  format: 'Format',
  createCsv: 'Create CSV',
  createKml: 'Create KML',
  makeRecordSet: 'Make Record Set',
  abandonChanges: 'Abandon Changes',
  saveAs: 'Save As',

  // QueryField
  expand: 'Expand',
  expandButtonDescription: 'Field is valid and will be saved. Click to expand',
  sort: 'Sort',
  negate: 'Negate',
  moveUp: 'Move up',
  moveDown: 'Move down',
  showButtonDescription: 'Show in results',
  treeRanks: 'Tree Ranks',

  // QueryResultsTable
  results: 'Results:',
});

export default queryText;
