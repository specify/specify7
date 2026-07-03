/**
 * Localization strings for the home page Collection Statistics dialog
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const collectionStatsText = createDictionary({
  collectionStatistics: {
    'en-us': 'Collection Statistics',
  },
  collectionName: {
    'en-us': 'Collection Name',
  },
  numberOfSpecimens: {
    'en-us': 'Number of Specimens',
  },
  collectionType: {
    'en-us': 'Collection Type',
  },
  noStatistics: {
    'en-us': 'No collection statistics are available.',
  },
  unableToLoad: {
    'en-us': 'Unable to load collection statistics. Please try again.',
  },
} as const);
