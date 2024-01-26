import { program } from 'commander';

import { f } from '../../utils/functools';
import { filterArray } from '../../utils/types';
import { camelToHuman } from '../../utils/utils';
import type { Language } from '../utils/config';
import { languageCodeMapper, languages } from '../utils/config';
import { scanUsages } from '../utils/scanUsages';
import { syncStrings } from '../utils/sync';

program
  .name('Localization Test')
  .description(
    'Tests usages of localization strings and emits *.po files for Weblate'
  )
  .option('--verbose', 'Verbose output', false)
  .option('--emit <string>', 'Directory to emit *.po files to');

program.parse();

const { verbose, emit } = program.opts<{
  readonly verbose: boolean;
  readonly emit?: string;
}>();

scanUsages(verbose ? 'verbose' : 'normal')
  .then(async (usages) =>
    typeof usages === 'object' && typeof emit === 'string'
      ? syncStrings(
          Object.values(usages),
          languages,
          {
            languageCode: (code) => languageCodeMapper[code as Language],
            usage: ({ filePath }) =>
              filePath === '__tests__' ? 'Tests' : formatFilePath(filePath),
            reference: ({ filePath, lineNumber }) =>
              `${trimPath(filePath)}:${lineNumber}`,
          },
          emit
        )
      : undefined
  )
  .catch(console.error);

function formatFilePath(filePath: string): string {
  const parts = filePath.split('/');
  const fileName = parts.at(-1)?.split('.')[0];
  const componentName = parts.at(-2)?.split('.')[0];
  const directoryName = parts.at(-3)?.split('.')[0];
  return filterArray([
    f.maybe(directoryName, camelToHuman),
    f.maybe(componentName, camelToHuman),
    f.maybe(fileName, camelToHuman),
  ]).join(' > ');
}

const trimPath = (filePath: string): string =>
  filePath.slice(filePath.indexOf('/lib/') + '/lib/'.length);
