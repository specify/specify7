import type { GetTextTranslations } from 'gettext-parser';
import gettextParser from 'gettext-parser';
import fs from 'node:fs';
import path from 'node:path';
import type { LocalizedString } from 'typesafe-i18n';

import { f } from '../../utils/functools';
import { filterArray } from '../../utils/types';
import { camelToHuman } from '../../utils/utils';
import { languageCodeMapper, languages } from './config';
import { whitespaceSensitive } from './index';
import type { DictionaryUsages } from './scanUsages';

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
  const comment = whitespaceSensitive(rawComment as LocalizedString);
  // Red emoji makes comment more prominent in Weblate's sidebar
  return `🟥${comment}${comment.endsWith('.') ? '' : '.'}`;
}

const trimPath = (filePath: string): string =>
  filePath.slice(filePath.indexOf('/lib/') + '/lib/'.length);

export const syncStrings = async (
  localStrings: DictionaryUsages,
  emitPath: string
): Promise<void> =>
  Promise.all(
    Object.values(localStrings).flatMap(({ categoryName, strings }) => {
      const directoryPath = path.join(emitPath, categoryName);
      fs.mkdirSync(directoryPath, { recursive: true });

      languages.map(async (language) => {
        const spec = {
          charset: 'utf8',
          headers: {},
          translations: {
            '': Object.fromEntries(
              Object.entries(strings).map(([key, { strings, usages }]) => [
                key,
                {
                  msgid: key,
                  msgstr: [
                    f.maybe(
                      strings[language] as LocalizedString | undefined,
                      whitespaceSensitive
                    ) ?? '',
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
        };

        const fileName = path.join(
          directoryPath,
          `${languageCodeMapper[language]}${gettextExtension}`
        );
        const merged = await mergePoSpec(spec, fileName);
        const po = gettextParser.po.compile(merged);
        return fs.promises.writeFile(fileName, po);
      });
    })
  )
    .then(f.void)
    .catch(console.error);

export const gettextExtension = '.po';

async function mergePoSpec(
  po: GetTextTranslations,
  fileName: string
): Promise<GetTextTranslations> {
  const weblatePo = await fs.promises
    .readFile(fileName)
    .then((file) => file.toString())
    .then((content) => gettextParser.po.parse(content))
    .catch(() => undefined);
  if (weblatePo === undefined) {
    console.warn(
      `Unable to find an existing PO file for ${fileName}, thus ` +
        `merging won't be performed. This warning can be ignored if you are` +
        `creating a new component.`
    );
    return po;
  } else return mergeSpecs(po, weblatePo);
}

/**
 * Weblate might have added a "fuzzy" flag or comments from translators.
 * For the rest, local values should dominate.
 */
const mergeSpecs = (
  po: GetTextTranslations,
  weblatePo: GetTextTranslations
): GetTextTranslations => ({
  ...po,
  ...weblatePo,
  translations: {
    // Exclude strings that are in weblate but not local (as they were removed)
    '': Object.fromEntries(
      Object.entries(po.translations[''] ?? {}).map(([key, local]) => {
        const weblate = weblatePo.translations['']?.[key];
        return [
          key,
          {
            ...weblate,
            ...local,
            comments: Object.fromEntries(
              Object.keys({
                // Important that weblate goes first so that it dictates the order
                ...weblate?.comments,
                ...local.comments,
              }).map((key) => [
                key as keyof typeof local.comments,
                local.comments?.[key as 'flag'] ||
                  weblate?.comments?.[key as 'flag'] ||
                  '',
              ])
            ) as typeof local['comments'],
          },
        ];
      })
    ),
  },
});
