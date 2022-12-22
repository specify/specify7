import { program } from 'commander';

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
  .then((usages) =>
    typeof usages === 'object' && typeof emit === 'string'
      ? syncStrings(usages, emit)
      : undefined
  )
  .catch(console.error);
