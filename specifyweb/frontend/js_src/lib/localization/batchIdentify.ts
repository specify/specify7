/**
 * Localization strings used in Batch Identify tool
 *
 * @module
 */

import { createDictionary } from './utils';

export const batchIdentifyText = createDictionary({
  batchIdentify: {
    'en-us': 'Batch Identify',
  },
  instructions: {
    'en-us':
      'Enter catalog numbers using any non-numeric delimiters (commas, spaces, text prefixes, etc.). Use a dash to declare numeric ranges like 0001 - 0150.',
  },
  catalogNumbersNotFound: {
    'en-us': 'Catalog Numbers Not Found',
  },
  identify: {
    'en-us': 'Identify',
  },
  successMessage: {
    'en-us': 'All records were identified to the specified taxon.',
  },
  updatedRecordSet: {
    'en-us': 'Batch Identify Updated Records',
  },
  noCatalogNumbersParsed: {
    'en-us': 'Enter at least one numeric catalog number.',
  },
  validatingCatalogNumbers: {
    'en-us': 'Validating catalog numbers...',
  },
  placeholder: {
    'en-us': '0001\n0002\n0003 - 0150',
  },
  previewQueryName: {
    'en-us': 'Batch Identify Preview',
  },
});
