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
    containsNestedToMany: {
        'en-us': "The query contains non-hidden nested-to-many relationships. Either remove the field, or make the field hidden."
    },
    missingRanks: {
        'en-us': "The following tree ranks need to be added to the query: {rankJoined:string}"
    },
    datasetName: {
        'en-us': "{queryName:string} {datePart:string}"
    },
    errorInQuery: {
        'en-us': "Following errors were found in the query"
    }
} as const)