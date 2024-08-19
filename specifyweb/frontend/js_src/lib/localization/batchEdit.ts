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
    createDataSetInstructions: {
        'en-us': "Use the query builder to make a new batch edit dataset"
    }
} as const)