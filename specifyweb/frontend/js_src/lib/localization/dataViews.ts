/**
 * Localization strings for the Data Views component
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const dataViewsText = createDictionary({
  dataViewsTitle: {
    comment: 'The name of the component',
    'en-us': 'Data Views',
  },
  tableRecords: {
    comment: 'Used as a dialog header within the Data Views component',
    'en-us': '{tableLabel:string} Records',
  },
  configureDataViews: {
    'en-us': 'Configure {dataViews:string} tables',
  },
  dataViewQueries: {
    comment: 'The name of the Data View query app resource type',
    'en-us': 'Data View Queries',
  },
  splitViewByDefault: {
    'en-us': 'Enable {splitView:string} by default',
  },
  configureQuery: {
    'en-us': 'Configure query',
  },
  splitViewDescription: {
    'en-us':
      '{splitView:string} displays query results alongside a record preview, allowing you to review records without leaving the results list.',
  },
  splitViewOrientation: {
    'en-us': 'Default {splitView:string} orientation',
  },
} as const);
