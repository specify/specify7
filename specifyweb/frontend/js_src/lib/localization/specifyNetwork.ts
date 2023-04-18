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
  occurrenceOrGuidRequired: {
    'en-us': 'Species Name or GUID must be provided to display this page',
  },
  noDataError: { 'en-us': 'Unable to find any data for this request' },
  noDataErrorDescription: {
    'en-us': 'Please try searching for a different record',
  },
  dataQuality: { 'en-us': 'Data Quality' },
  reportedBy: { 'en-us': 'Reported by {provider:string}' },
  collectionDate: { 'en-us': 'Collection Date' },
  mapDetails: {
    'en-us': 'Details',
  },
  mapDescription: {
    'en-us':
      'This map shows all occurrences of this taxon from iDigBio and GBIF.',
  },
  iDigBioDescription: {
    'en-us': `
      iDigBio points are represented as green dots on the map. Of those,
      the occurrences published to iDigBio from the current collection are red.
    `,
  },
  gbifDescription: {
    'en-us': `
      For GBIF data, individual points and clusters of points are shown as
      hexagons of different shading ranging from yellow to orange to red
      with the dark red hexagons corresponding to densest distributions of
      points.
    `,
  },
  connectToGbif: {
    'en-us': 'Connect to GBIF',
  },
  searchForInstitution: {
    'en-us': 'Search for your institution:',
  },
  institutionDistributionMap: {
    'en-us': `
      Distribution map of all of the digitized specimens curated in your
      Institution
    `,
  },
  collectionDistributionMap: {
    'en-us': `
      Distribution map of all of the digitized specimens curated in your
      Collection
    `,
  },
} as const);
