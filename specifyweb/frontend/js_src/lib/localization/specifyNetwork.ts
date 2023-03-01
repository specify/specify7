/**
 * Localization strings for the Specify Network integration
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const specifyNetworkText = createDictionary({
  specifyNetwork: {
    'en-us': 'Specify Network',
    'ru-ru': 'Specify Network',
    'es-es': 'Specify red',
    'fr-fr': 'Réseau Specify',
    'uk-ua': 'Вкажіть мережу',
  },
  specifyNetworkMap: {
    'en-us': 'Specify Network Map',
    'ru-ru': 'Specify Network Карта',
    'es-es': 'Specify Network Mapa',
    'fr-fr': 'Specify Network Carte',
    'uk-ua': 'Specify Network Карта',
  },
  occurrenceOrGuidRequired: {
    'en-us': 'Species Name or GUID must be provided to display this page',
  },
  noDataError: { 'en-us': 'Unable to find any data for this request' },
  noDataErrorDescription: {
    'en-us': 'Please try searching for a different record',
  },
  extendingSpecimen: {
    'en-us': 'Extending the Specimen...',
  },
  dataQuality: { 'en-us': 'Data Quality' },
  reportedBy: { 'en-us': 'Reported by {provider:string}' },
  collectionDate: { 'en-us': 'Collection Date' },
} as const);
