/**
 * Localization strings used in the Schema Config and data model viewer
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const setupToolText = createDictionary({
  specifyConfigurationSetup: {
    'en-us': 'Specify Configuration Setup'
  },

  saveAndContinue: {
    'en-us': 'Save & Continue'
  }
} as const);
