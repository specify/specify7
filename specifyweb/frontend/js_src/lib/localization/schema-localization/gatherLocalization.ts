import fs from 'node:fs';
import path from 'node:path';

import type { RA } from '../../utils/types';
import type { DictionaryUsages } from '../utils/scanUsages';
import { parseSchemaLocalization } from './parser';
import { schemaToPoFile } from './toPoFile';
import { nodeParseXml } from './xml';

export const schemaLocalizationFile = 'schema_localization.xml';

export async function gatherSchemaLocalization(
  // If undefined, won't emit files
  weblateDirectory: string | undefined,
  configDirectory: string
): Promise<{
  readonly dictionaries: DictionaryUsages;
  readonly languages: RA<string>;
}> {
  const originalPath = process.cwd();
  /**
   * Not sure if that's a good practice, but changing current path so that
   * readdir returns relative paths
   */
  const filePaths = await searchFiles(configDirectory, schemaLocalizationFile);

  if (filePaths.length === 0) {
    console.error(
      'Unable to find any localization files. Make sure you are running from ' +
        'specify6/config directory'
    );
    // eslint-disable-next-line require-atomic-updates
    process.exitCode = 1;
    process.chdir(originalPath);
    return { dictionaries: {}, languages: [] };
  }

  const parsed = await Promise.all(
    filePaths.map(
      async (filePath) =>
        [
          filePath,
          parseSchemaLocalization(
            nodeParseXml(
              (
                await fs.promises.readFile(path.join(configDirectory, filePath))
              ).toString()
            )
          ),
        ] as const
    )
  );

  if (typeof weblateDirectory === 'string')
    await fs.promises.mkdir(weblateDirectory, { recursive: true });

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
      schemaToPoFile(parsed, languages, weblateDirectory, filePath)
    )
  );

  return {
    dictionaries: Object.fromEntries(
      dictionaries.map(
        (dictionary) => [dictionary.categoryName, dictionary] as const
      )
    ),
    languages,
  };
}

/** Find all files with name "schema_localization.json" in this or children directories */
async function searchFiles(
  directory: string,
  fileName: string,
  originalDirectory = directory
): Promise<RA<string>> {
  const files = await fs.promises.readdir(directory, { withFileTypes: true });
  const fileNames = await Promise.all(
    files.map(async (file) => {
      const fullPath = path.join(directory, file.name);
      if (file.isDirectory())
        return searchFiles(fullPath, fileName, originalDirectory);
      else if (file.name === fileName)
        return [path.relative(originalDirectory, fullPath)];
      else return [];
    })
  );
  return fileNames.flat();
}
