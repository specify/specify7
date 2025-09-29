/**
 * Localization strings for the Specify Configuration Setup.
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const setupToolText = createDictionary({
  specifyConfigurationSetup: {
    'en-us': 'Specify Configuration Setup',
  },

  saveAndContinue: {
    'en-us': 'Save & Continue',
  },

  institution: {
    'en-us': 'Institution',
  },
  institutionName: {
    'en-us': 'Name',
  },
  institutionNameDescription: {
    'en-us': 'The full, official name of the institution (e.g., "University of Kansas Biodiversity Institute").',
  },
  institutionCode: {
    'en-us': 'Code',
  },
  institutionCodeDescription: {
    'en-us': 'A short, unique code or acronym for the institution (e.g., "KUBI").',
  },
  institutionAddress: {
    'en-us': 'Address',
  },
  institutionAddressDescription: {
    'en-us': 'The address of the institution. Optional.',
  }
} as const);
