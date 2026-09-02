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
    'en-us': 'Configure Data Views tables',
  },
  dataViewQueries: {
    comment: 'The name of the Data View query app resource type',
    'en-us': 'Data View queries',
  },
  configureQuery: {
    'en-us': 'Configure query',
  },
  splitViewByDefault: {
    'en-us': 'Enable split view by default',
  },
  splitViewDescription: {
    'en-us':
      'Split view displays query results alongside a record preview, allowing you to review records without leaving the results list.',
  },
  splitViewOrientation: {
    'en-us': 'Default split view orientation',
  },
} as const);
