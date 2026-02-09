/**
 * Localization strings for the Specify Configuration Setup.
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const setupToolText = createDictionary({
  guidedSetup: {
    'en-us': 'Guided Setup',
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

  creating: {
    'en-us': 'Creating the',
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
  /*
   * InstitutionIsSingleGeographyTree: {
   *   'en-us': 'Use Single Geography Tree',
   * },
   * institutionIsSingleGeographyTreeDescription: {
   *   'en-us':
   *     'A global geography tree is shared by all disciplines. Otherwise, geography trees are managed separately within each discipline.',
   * },
   */

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
    'en-us': 'Province/State',
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
  rank: {
    'en-us': 'Rank',
  },
  fullNameDirection: {
    'en-us': 'Full Name Direction',
  },
  preloadTree: {
    'en-us': 'Populate tree with default records',
  },
  preloadTreeDescription: {
    'en-us': 'Download default records for this tree.',
  },
  treeToPreload: {
    'en-us': 'Tree to download:',
  },
  selectATree: {
    'en-us': 'Select a tree',
  },
  include: {
    'en-us': 'Include',
  },
  includeDescription: {
    'en-us': 'Include places the Level in the tree definition.',
  },
  enforced: {
    'en-us': 'Enforced',
  },
  enforcedDescription: {
    'en-us':
      'Is Enforced ensures that the level can not be skipped when adding nodes lower down the tree.',
  },
  inFullName: {
    'en-us': 'In Full Name',
  },
  inFullNameDescription: {
    'en-us':
      'Is in Full Name includes the level when building a full name expression, which can be queried and used in reports.',
  },
  fullNameSeparator: {
    'en-us': 'Separator',
  },
  fullNameSeparatorDescription: {
    'en-us':
      'Separator refers to the character that separates the levels when displaying the full name.',
  },

  // Storage Tree
  storageTree: {
    'en-us': 'Storage Tree',
  },
  // Geography Tree
  geographyTree: {
    'en-us': 'Geography Tree',
  },
  // Taxon Tree
  taxonTree: {
    'en-us': 'Taxon Tree',
  },

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
  specifyUserFirstName: {
    'en-us': 'First Name',
  },
  specifyUserFirstNameDescription: {
    'en-us':
      'The first name of the agent associated with the account. Optional.',
  },
  specifyUserLastName: {
    'en-us': 'Last Name',
  },
  specifyUserLastNameDescription: {
    'en-us': 'The last name of the agent associated with the account.',
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
  hierarchyAddNew: {
    'en-us': 'Add',
  },
  hierarchyDiagram: {
    'en-us': 'Institutional Hierarchy',
  },
  emptyTaxonTree: {
    'en-us': 'An empty taxon tree will be created',
  },
  createEmptyTree: {
    'en-us': 'Create an empty tree',
  },
} as const);
