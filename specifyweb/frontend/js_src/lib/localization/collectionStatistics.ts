/**
 * Localization strings used by the Collection Statistics home page widget
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const collectionStatisticsText = createDictionary({
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
  loadingError: {
    'en-us': 'Unable to load collection statistics. Please try again.',
  },
  refresh: {
    'en-us': 'Refresh',
  },
});
