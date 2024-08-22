/**
 * Localization strings used for displaying Attachments
 *
 * @module
 */

import { createDictionary } from "./utils";

export const batchEditText = createDictionary({
    batchEdit: {
        'en-us': "Batch Edit"
    },
    numberOfRecords: {
        'en-us': "Number of records selected from the query"
    },
    removeField: {
        'en-us': "Field not supported for batch edit. Either remove the field, or make it hidden."
    },
    addTreeRank: {
        'en-us': "Please add the following missing rank to the query",
    },
    datasetName: {
        'en-us': "{queryName:string} {datePart:string}"
    },
    errorInQuery: {
        'en-us': "Following errors were found in the query"
    },
    createUpdateDataSetInstructions: {
        'en-us': "Use the query builder to make a new batch edit dataset"
    },
    showRollback: {
        'en-us': "Show revert button"
    },
    showRollbackDescription: {
        'en-us': "Revert is currently an experimental feature. This preference will hide the button"
    },
    commit: {
        'en-us': 'Commit'
    },
    startCommitDescription: {
        'en-us': 'Commiting the Data Set will update, add, and delete the data from the spreadsheet to the  Specify database.',
    },
    startRevertDescription: {
        'en-us': "Rolling back the dataset will re-update the values, delete created records, and create new records"
    },
    commitSuccessfulDescription: {
        'en-us': `Click on the "Results" button to see the number of records affected in each database table`,
    },
    dateSetRevertDescription: {
        'en-us': `This Rolledback Data Set is saved, however, it cannot be edit. Please re-run the query`
    },
    committing: {
        'en-us': 'Committing'
    },
    
} as const)