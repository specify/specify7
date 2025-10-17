/**
 * Localization strings for the preferences menu (aggregated from modular sections).
 *
 * @module
 */
import { createDictionary } from './utils';
import { preferencesBehaviorDictionary } from './preferences.behavior';
import { preferencesContentDictionary } from './preferences.content';
import { preferencesGeneralDictionary } from './preferences.general';
// Refer to "Guidelines for Programmers" in ./README.md before editing this file
const preferencesDictionary = {
  ...preferencesGeneralDictionary,
  ...preferencesContentDictionary,
  ...preferencesBehaviorDictionary,
} as const;

export const preferencesText = createDictionary(preferencesDictionary);
