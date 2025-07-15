import { program } from 'commander';

import { checkComponents } from '../utils/validateWeblate';
import { gatherSchemaLocalization } from './gatherLocalization';

program
  .name('Schema Localization Extractor')
  .description(
    'Extract data from schema localization files and emits *.po files for Weblate'
  )
  .requiredOption(
    '-w, --weblate-directory <string>',
    'Weblate source directory'
  )
  .requiredOption(
    '-c, --config-directory <string>',
    'Location of the "config" directory in Specify 6 repository'
  )
  .option(
    '-v, --validate',
    'Validate that current weblate config is correct',
    false
  );

program.parse();

const {
  weblateDirectory,
  configDirectory,
  validate = false,
} = program.opts<{
  readonly weblateDirectory: string;
  readonly configDirectory: string;
  readonly validate: boolean;
}>();

gatherSchemaLocalization(weblateDirectory, configDirectory)
  .then(async ({ dictionaries }) =>
    validate ? checkComponents(dictionaries, 'schema') : undefined
  )
  .catch(console.error);
