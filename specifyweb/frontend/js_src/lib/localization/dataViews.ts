/**
 * Localization strings for the Data Views component
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const dataViewsText = createDictionary({
  dataViewsTitle: {
    'comment': "The name of the component",
    "en-us": "Data Views"
  },
  tableRecords: {
    'comment': "Used as a dialog header within the Data Views component",
    "en-us": "{tableLabel:string} Records"
  },
  configureDataViews: {
    "en-us": "Configure Data Views tables"
  }
});
