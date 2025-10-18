/**
 * Localization strings for the preferences menu (aggregated from modular sections).
 *
 * @module
 */
import { preferencesBehaviorDictionary } from './preferences.behavior';
import { preferencesContentDictionary } from './preferences.content';
import { preferencesGeneralDictionary } from './preferences.general';
import { createDictionary } from './utils';
// Refer to "Guidelines for Programmers" in ./README.md before editing this file
const preferencesDictionary = {
  ...preferencesGeneralDictionary,
  ...preferencesContentDictionary,
  ...preferencesBehaviorDictionary,
} as const;

export const preferencesText = createDictionary(preferencesDictionary);
