/**
 * Localization strings used by the Darwin Core editor
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const dwcaText = createDictionary({
  dwcaDefinition: {
    'en-us': 'Darwin Core definition',
  },
  dwcaTerm: {
    'en-us': 'Term',
  },
  dwcaVocabulary: {
    'en-us': 'Vocabulary',
  },
  dwcaGroup: {
    'en-us': 'Group',
  },
  dwcaNoGroupSpecified: {
    'en-us': 'No group specified.',
  },
  dwcaUnspecifiedGroup: {
    'en-us': 'Unspecified group',
  },
  dwcaIri: {
    'en-us': 'IRI',
  },
  dwcaRequired: {
    'en-us': 'Required',
  },
  dwcaDescription: {
    'en-us': 'Description',
  },
  dwcaNoDescriptionAvailable: {
    'en-us': 'No description is available.',
  },
  dwcaExtension: {
    'en-us': 'Extension',
  },
  dwcaRowType: {
    'en-us': 'Row type',
  },
  dwcaFileNamesMustBeUnique: {
    'en-us': 'File names must be unique.',
  },
  dwcaStartFromScratch: {
    'en-us': 'Start from scratch',
  },
  dwcaChoose: {
    'en-us': 'Choose a {item:string}',
  },
  dwcaSelect: {
    'en-us': 'Select a {item:string}',
  },
  dwcaNoDefaultOrSaved: {
    'en-us':
      'No {default:string} or saved {query:string} is available for this {extension:string}.',
  },
  dwcaSeedFromSaved: {
    'en-us': 'Seed from {query:string}',
  },
  dwcaStartFromTemplate: {
    'en-us': 'Start from template',
  },
  dwcaChooseATemplate: {
    'en-us': 'Choose a template',
  },
  dwcaNoTemplatesAvailable: {
    'en-us': 'No templates available',
  },
  dwcaAddField: {
    'en-us': 'Add a {query:string} field to begin mapping.',
  },
  dwcaOccurrenceId: {
    'en-us': 'Occurrence ID (occurrenceID)',
  },
  dwcaRequiredTerm: {
    'en-us': '{title:string} ({name:string})',
  },
  dwcaTermWithQualifier: {
    'en-us': '{title:string} ({qualifier:string})',
  },
  dwcaMapRequiredTerms: {
    'en-us':
      'Map all required extension terms before saving: {terms:string}',
  },
  dwcaCore: {
    'en-us': 'Core',
  },
} as const);
