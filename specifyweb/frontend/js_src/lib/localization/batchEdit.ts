/**
 * Localization strings used for displaying Attachments
 *
 * @module
 */

import { createDictionary } from './utils';

export const batchEditText = createDictionary({
  batchEdit: {
    'en-us': 'Batch Edit',
  },
  numberOfRecords: {
    'en-us': 'Number of records selected from the query',
  },
  removeField: {
    'en-us':
      'Field not supported for batch edit. Either remove the field, or make it hidden.',
  },
  addTreeRank: {
    'en-us': 'Please add the following missing rank to the query',
  },
  datasetName: {
    'en-us': '{queryName:string} {datePart:string}',
  },
  errorInQuery: {
    'en-us': 'Following errors were found in the query',
  },
  createUpdateDataSetInstructions: {
    'en-us': 'Use the query builder to make a new batch edit dataset',
  },
  showRollback: {
    'en-us': 'Show revert button',
  },
  showRollbackDescription: {
    'en-us':
      'Revert is currently an experimental feature. This preference will hide the button',
  },
  commit: {
    'en-us': 'Commit',
  },
  startCommitDescription: {
    'en-us':
      'Commiting the Data Set will update, add, and delete the data from the spreadsheet to the  Specify database.',
  },
  startRevertDescription: {
    'en-us':
      'Rolling back the dataset will re-update the values, delete created records, and create new records',
  },
  commitSuccessfulDescription: {
    'en-us': `Click on the "Results" button to see the number of records affected in each database table`,
  },
  dateSetRevertDescription: {
    'en-us': `This Rolledback Data Set is saved, however, it cannot be edit. Please re-run the query`,
  },
  committing: {
    'en-us': 'Committing',
  },
  beStatusCommit: {
    'en-us': 'Data Set Commit Status',
  },
  startCommit: {
    'en-us': 'Begin Data Set Commit?',
  },
  commitErrors: {
    'en-us': 'Commit Failed due to Error Cells',
  },
  commitErrorsDescription: {
    'en-us': 'The Commit failed due to one or more cell value errors.',
  },
  commitCancelled: {
    'en-us': 'Commit Cancelled',
  },
  commitCancelledDescription: {
    'en-us': 'Commit Cancelled Description',
  },
  commitSuccessful: {
    'en-us': 'Commit Completed with No Errors',
  },
  batchEditRecordSetName: {
    'en-us': 'BE commit of "{dataSet:string}"',
  },
  deferForMatch: {
    'en-us': 'Use only visible fields for match',
  },
  deferForMatchDescription: {
    'en-us':
      'If true, invisible database fields will not be used for matching. Default value is {default:boolean}',
  },
  deferForNullCheck: {
    'en-us': 'Use only visible fields for empty record check',
  },
  deferForNullCheckDescription: {
    'en-us':
      'If true, invisible database fields will not be used for determining whether the record is empty or not. Default value is {default: boolean}',
  },
  batchEditPrefs: {
    'en-us': 'Batch Edit Prefs',
  },
} as const);
