/**
 * This is run by github action on the weblate-localization branch
 */

import { program } from 'commander';

import { f } from '../../utils/functools';
import { languageCodeMapper } from './config';
import { extractStrings } from './scanUsages';
import { updateLocalizationFiles } from './updateFile';
import { weblatePull } from './weblatePull';

program
  .name('Pull localization')
  .description('Pull localization changes from Weblate')
  .requiredOption('--directory <string>', 'Weblate source directory');

program.parse();

const { directory } = program.opts<{
  readonly directory: string;
}>();

const reverseLanguageMapper = Object.fromEntries(
  Object.entries(languageCodeMapper).map(([key, value]) => [value, key])
);

extractStrings()
  .then(async (dictionaries) =>
    weblatePull(directory, dictionaries, 'userInterface', reverseLanguageMapper)
  )
  .then(async (merged) => f.maybe(merged, updateLocalizationFiles))
  .catch(console.error);

// REFACTOR: get rid of back-end localization (so that all strings are in one place)
