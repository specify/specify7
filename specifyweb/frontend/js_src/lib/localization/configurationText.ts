/**
 * Localization strings for the configuration tool
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const configurationText = createDictionary({
  configurationTool: {
    'en-us': 'Configuration Tool',
  },
  specifySetUp: {
    'en-us': 'Specify Setup',
  },
} as const);
