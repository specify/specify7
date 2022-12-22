import gettextParser from 'gettext-parser';
import fs from 'node:fs';
import path from 'node:path';
import { f } from '../../utils/functools';
import { filterArray } from '../../utils/types';
import { camelToHuman } from '../../utils/utils';
import { whitespaceSensitive } from './index';
import type { DictionaryUsages } from './scanUsages';
import { languageCodeMapper, languages } from './config';

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

function formatComment(rawComment: string | undefined): string | undefined {
  if (rawComment === undefined) return undefined;
  const comment = whitespaceSensitive(rawComment);
  // Red emoji makes comment more prominent in Weblate's sidebar
  return `🟥${comment}${comment.endsWith('.') ? '' : '.'}`;
}

const trimPath = (filePath: string): string =>
  filePath.slice(filePath.indexOf('/lib/') + '/lib/'.length);

export async function syncStrings(
  localStrings: DictionaryUsages,
  emitPath: string
): Promise<void> {
  if (fs.existsSync(emitPath) && fs.readdirSync(emitPath).length > 0)
    throw new Error(`Can not run syncStrings on a non-empty directory`);

  return emitPoFiles(localStrings, emitPath).catch(console.error);
}

const emitPoFiles = async (
  localStrings: DictionaryUsages,
  emitPath: string
): Promise<void> =>
  Promise.all(
    Object.values(localStrings).flatMap(({ categoryName, strings }) => {
      const directoryPath = path.join(emitPath, categoryName);
      fs.mkdirSync(directoryPath, { recursive: true });

      languages.map(async (language) => {
        const po = gettextParser.po.compile({
          charset: 'utf8',
          headers: {},
          translations: {
            '': Object.fromEntries(
              Object.entries(strings).map(([key, { strings, usages }]) => [
                key,
                {
                  msgid: key,
                  msgstr: [
                    f.maybe(strings[language], whitespaceSensitive) ?? '',
                  ],
                  comments: {
                    extracted: filterArray([
                      formatComment(strings.comment),
                      `Used in: ${f
                        .unique(
                          usages.map(({ filePath }) => formatFilePath(filePath))
                        )
                        .join(' ⬤ ')}`,
                    ]).join(' '),
                    reference: usages
                      .map(
                        ({ filePath, lineNumber }) =>
                          `${trimPath(filePath)}:${lineNumber}`
                      )
                      .join('\n'),
                    translator: '',
                    flag: '',
                    previous: '',
                  },
                },
              ])
            ),
          },
        });

        return fs.promises.writeFile(
          path.join(
            directoryPath,
            `${languageCodeMapper[language]}${gettextExtension}`
          ),
          po
        );
      });
    })
  ).then(f.void);

export const gettextExtension = '.po';
