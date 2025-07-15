import fs from 'node:fs';
import path from 'node:path';

import { program } from 'commander';

import { f } from '../../utils/functools';
import type { IR } from '../../utils/types';
import type { LocalizationEntry } from '../utils';
import type { DictionaryUsages, ExtractedStrings } from '../utils/scanUsages';
import { weblatePull } from '../utils/weblatePull';
import { gatherSchemaLocalization } from './gatherLocalization';
import { rootSchemaLanguage, trimSchemaKey } from './parser';
import { componentNameToSchemaPath } from './toPoFile';
import { traverseSchema } from './traversal';
import type { ParsedDom } from './xml';
import { nodeParseXml, nodeUnparseXml } from './xml';

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

const { weblateDirectory, configDirectory } = program.opts<{
  readonly weblateDirectory: string;
  readonly configDirectory: string;
}>();

gatherSchemaLocalization(undefined, configDirectory)
  .then(async ({ dictionaries, languages }) =>
    weblatePull(
      weblateDirectory,
      usagesToStrings(dictionaries),
      'schema',
      Object.fromEntries(languages.map((code) => [code, code] as const))
    )
  )
  .then(async (merged) =>
    merged === undefined ? undefined : updateLocalFiles(configDirectory, merged)
  )
  .catch(console.error);

const usagesToStrings = (usages: DictionaryUsages): ExtractedStrings =>
  Object.fromEntries(
    Object.entries(usages).map(
      ([key, { categoryName, strings }]) =>
        [
          key,
          {
            dictionaryName: categoryName,
            strings: Object.fromEntries(
              Object.entries(strings).map(
                ([key, { strings }]) => [key, strings] as const
              )
            ),
          },
        ] as const
    )
  );

const updateLocalFiles = async (
  configDirectory: string,
  dictionary: ExtractedStrings
): Promise<void> =>
  Promise.all(
    Object.values(dictionary).map(async ({ dictionaryName, strings }) => {
      const filePath = componentNameToSchemaPath(dictionaryName);
      const fullPath = path.join(configDirectory, filePath);
      const xmlString = await fs.promises.readFile(fullPath);
      const dom = nodeParseXml(xmlString.toString());
      const updatedDom = updateSchemaLocalization(dom, strings);
      const updatedXmlString = nodeUnparseXml(updatedDom);
      return fs.promises.writeFile(fullPath, updatedXmlString);
    })
  ).then(f.void);

/**
 * Update schema localization XML with new strings from Weblate
 */
const updateSchemaLocalization = (
  dom: ParsedDom,
  strings: IR<LocalizationEntry>
): ParsedDom =>
  traverseSchema(dom, (_location, oldStrings) => {
    const rawKey = oldStrings[rootSchemaLanguage];
    if (rawKey === undefined) return oldStrings;
    const key = trimSchemaKey(rawKey);
    const cutPart = rawKey.slice(key.length);

    const translation = strings[key];
    if (translation === undefined) return oldStrings;

    return Object.fromEntries(
      Object.entries(translation)
        .map(
          ([code, translation]) =>
            [code, translation ?? oldStrings[code] ?? ''] as const
        )
        .filter(([, translation]) => translation !== '')
        .map(
          ([code, translation]) => [code, `${translation}${cutPart}`] as const
        )
    );
  });
