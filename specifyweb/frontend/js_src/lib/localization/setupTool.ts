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

  setupProgress: {
    'en-us': 'Progress:',
  },

  overview: {
    'en-us': 'Overview',
  },

  settingUp: {
    'en-us': 'Setting up the database...',
  },

  setupError: {
    'en-us': 'An error occurred during the last setup attempt.',
  },

  /**
   * Field Captions.
   * These must be defined here because schema captions don't exist during the setup.
   */
  // Institution
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
  institutionIsAccessionGlobal: {
    'en-us': 'Define Accession Globally',
  },
  institutionIsAccessionGlobalDescription: {
    'en-us':
      'Global scope allows you to share Accessions between all divisions. Divisional scope ensures Accessions are specific to each division.',
  },
  institutionIsSingleGeographyTree: {
    'en-us': 'Use Single Geography Tree',
  },
  institutionIsSingleGeographyTreeDescription: {
    'en-us':
      'A global geography tree is shared by all disciplines. Otherwise, geography trees are managed separately within each discipline.',
  },

  // Address
  address: {
    'en-us': 'Address',
  },
  addressDescription: {
    'en-us': 'The street address of the institution.',
  },
  addressCity: {
    'en-us': 'City',
  },
  addressCityDescription: {
    'en-us': 'The city where the institution is located.',
  },
  addressState: {
    'en-us': 'State',
  },
  addressStateDescription: {
    'en-us': 'The state or province.',
  },
  addressCountry: {
    'en-us': 'Country',
  },
  addressCountryDescription: {
    'en-us': 'The country.',
  },
  addressPostalCode: {
    'en-us': 'Zip/Postal Code',
  },
  addressPostalCodeDescription: {
    'en-us': 'The postal code.',
  },
  addressPhone1: {
    'en-us': 'Phone',
  },
  addressPhone1Description: {
    'en-us': 'A contact phone number.',
  },

  // Trees
  treeRanks: {
    'en-us': 'Tree Ranks',
  },
  fullNameDirection: {
    'en-us': 'Full Name Direction',
  },

  // Storage Tree
  storageTree: {
    'en-us': 'Storage Tree',
  },
  // Geography Tree
  globalGeographyTree: {
    'en-us': 'Global Geography Tree',
  },
  geographyTree: {
    'en-us': 'Geography Tree',
  },
  // Taxon Tree
  taxonTree: {
    'en-us': 'Taxon Tree',
  },
  /*
   * DefaultTree: {
   *   'en-us': 'Pre-load Default Tree'
   * },
   */

  // Division
  division: {
    'en-us': 'Division',
  },
  divisionName: {
    'en-us': 'Name',
  },
  divisionAbbrev: {
    'en-us': 'Abbreviation',
  },

  // Discipline
  discipline: {
    'en-us': 'Discipline',
  },
  disciplineName: {
    'en-us': 'Name',
  },
  disciplineType: {
    'en-us': 'Type',
  },

  // Collection
  collection: {
    'en-us': 'Collection',
  },
  collectionName: {
    'en-us': 'Collection Name',
  },
  collectionCode: {
    'en-us': 'Code',
  },
  collectionCatalogNumFormatName: {
    'en-us': 'Catalog Number Format',
  },

  // Specify User
  specifyUser: {
    'en-us': 'Specify User',
  },
  specifyUserName: {
    'en-us': 'Username',
  },
  specifyUserNameDescription: {
    'en-us': 'The username for the primary administrator account.',
  },
  specifyUserPassword: {
    'en-us': 'Password',
  },
  specifyUserPasswordDescription: {
    'en-us': 'The password for the account.',
  },
  specifyUserConfirmPassword: {
    'en-us': 'Confirm Password',
  },
  specifyUserConfirmPasswordDescription: {
    'en-us': 'Must match the password entered above.',
  },
  taxonTreeSetUp: {
    'en-us': 'Set up taxon tree',
  },
  geoTreeSetUp: {
    'en-us': 'Set up geo tree',
  },
  addNewGeographyTree: {
    'en-us': 'Add new Geography Tree',
  },
  addNewTaxonTree: {
    'en-us': 'Add new Taxon Tree',
  },

  // System Configuration Tool - Hierarchy diagram
  hierarchyStructureTitle: {
    'en-us': 'View the Institutional Hierarchy',
  },
  hierarchyStructureHint: {
    'en-us': 'Click any block to open its edit form.',
  },
  hierarchySwitchToHorizontal: {
    'en-us': 'Switch to horizontal',
  },
  hierarchySwitchToVertical: {
    'en-us': 'Switch to vertical',
  },
  hierarchyCollections: {
    'en-us': 'Collections',
  },
  hierarchyAddNew: {
    'en-us': 'Add',
  },
  hierarchyDiagram: {
    'en-us': 'Institutional Hierarchy',
  },
} as const);
