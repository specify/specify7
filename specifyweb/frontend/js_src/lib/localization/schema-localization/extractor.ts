import fs from 'node:fs';
import path from 'node:path';

import { program } from 'commander';
import { XMLParser } from 'fast-xml-parser';

import type { RA } from '../../utils/types';
import { checkComponents } from '../utils/validateWeblate';
import { parseSchemaLocalization } from './parser';
import { schemaToPoFile } from './toPoFile';
import type { ParsedDom } from './utils';

program
  .name('Schema Localization Extractor')
  .description(
    'Extract data from schema localization files and emits *.po files for Weblate'
  )
  .requiredOption(
    '-s, --source-directory <string>',
    'Location of the "config" directory in Specify 6 repository',
    './'
  )
  .requiredOption(
    '-o, --output-directory <string>',
    'Directory where the outputs will be placed'
  );

program.parse();

const { sourceDirectory, outputDirectory } = program.opts<{
  readonly sourceDirectory: string;
  readonly outputDirectory: string;
}>();

const fileName = 'schema_localization.xml';

gatherLocalization().then(console.log).catch(console.error);

async function gatherLocalization(): Promise<void> {
  const originalPath = process.cwd();
  process.chdir(sourceDirectory);
  const filePaths = await searchFiles('./', fileName);

  if (filePaths.length === 0) {
    console.error(
      'Unable to find any localization files. Make sure you are running from ' +
        'specify6/config directory'
    );
    // eslint-disable-next-line require-atomic-updates
    process.exitCode = 1;
    return;
  }

  const parsed = await Promise.all(
    filePaths.map(
      async (filePath) =>
        [
          filePath,
          await readFile(filePath).then(parseSchemaLocalization),
        ] as const
    )
  );

  const output = path.join(originalPath, outputDirectory);
  await fs.promises.mkdir(output, { recursive: true });
  process.chdir(output);

  /*
   * Get list of all languages ever used. Thus, even if some file is missing
   * some language, the weblate file will be generated for it.
   */
  const languages = Array.from(
    new Set(
      parsed.flatMap(([_, parsed]) =>
        Object.values(parsed).flatMap(({ strings }) => Object.keys(strings))
      )
    )
  );

  const dictionaries = await Promise.all(
    parsed.map(async ([filePath, parsed]) =>
      schemaToPoFile(parsed, languages, filePath)
    )
  );

  const combinedDictionary = Object.fromEntries(
    dictionaries.map(
      (dictionary) => [dictionary.categoryName, dictionary] as const
    )
  );
  await checkComponents(combinedDictionary, 'schema');
}

/** Find all files with name "schema_localization.json" in this or children directories */
async function searchFiles(
  directory: string,
  fileName: string
): Promise<RA<string>> {
  const files = await fs.promises.readdir(directory, { withFileTypes: true });
  const fileNames = await Promise.all(
    files.map((file) => {
      const fullPath = path.join(directory, file.name);
      if (file.isDirectory()) return searchFiles(fullPath, fileName);
      else if (file.name === fileName) return [fullPath];
      else return [];
    })
  );
  return fileNames.flat();
}

async function readFile(filePath: string): Promise<ParsedDom> {
  const data = await fs.promises.readFile(filePath);
  const parser = new XMLParser({
    ignoreAttributes: false,
    isArray: () => true,
    preserveOrder: true,
    commentPropName: '#comment',
  });
  return parser.parse(data.toString());
}
