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

  setupComplete: {
    'en-us': '🎉 All resources have been created successfully!',
  },

  overview: {
    'en-us': 'Overview',
  },

  institution: {
    'en-us': 'Institution',
  },
  institutionDescription: {
    'en-us': 'Enter Institution Information.',
  },
  institutionName: {
    'en-us': 'Name',
  },
  institutionNameDescription: {
    'en-us':
      'The full, official name of the institution (e.g., "University of Kansas Biodiversity Institute").',
  },
  institutionCode: {
    'en-us': 'Code',
  },
  institutionCodeDescription: {
    'en-us':
      'A short, unique code or acronym for the institution (e.g., "KUBI").',
  },
  institutionAddress: {
    'en-us': 'Address',
  },
  institutionAddressDescription: {
    'en-us': 'The address of the institution. Optional.',
  },

  storageTree: {
    'en-us': 'Storage Tree',
  },

  geographyTree: {
    'en-us': 'Geography Tree',
  },

  division: {
    'en-us': 'Division',
  },

  discipline: {
    'en-us': 'Discipline',
  },

  taxonTree: {
    'en-us': 'Taxon Tree',
  },

  collection: {
    'en-us': 'Collection',
  },

  specifyUser: {
    'en-us': 'Specify User',
  },
} as const);
