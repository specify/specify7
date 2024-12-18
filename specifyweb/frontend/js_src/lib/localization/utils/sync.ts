import fs from 'node:fs';
import path from 'node:path';

import type { GetTextTranslations } from 'gettext-parser';
import gettextParser from 'gettext-parser';

import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { filterArray, localized } from '../../utils/types';
import type { Language } from './config';
import { whitespaceSensitive } from './index';
import type { DictionaryUsages } from './scanUsages';

function formatComment(rawComment: string | undefined): string | undefined {
  if (rawComment === undefined) return undefined;
  const comment = whitespaceSensitive(localized(rawComment));
  // Red emoji makes comment more prominent in Weblate's sidebar
  return localized(`🟥${comment}${comment.endsWith('.') ? '' : '.'}`);
}

/**
 * Create new .po file based on updated local strings and optionally based on
 * existing .po file (from Weblate)
 */
export const syncStrings = async (
  localStrings: RA<DictionaryUsages[string]>,
  languages: RA<Language>,
  mappers: {
    readonly languageCode: (language: string) => string;
    readonly usage: (location: {
      readonly filePath: string;
      readonly lineNumber: number;
    }) => string | undefined;
    readonly reference: (location: {
      readonly filePath: string;
      readonly lineNumber: number;
    }) => string | undefined;
  },
  emitPath: string
): Promise<void> =>
  Promise.all(
    localStrings.flatMap(({ categoryName, strings }) => {
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
                      localized(strings[language]),
                      whitespaceSensitive
                    ) ?? '',
                  ],
                  comments: {
                    extracted: filterArray([
                      formatComment(strings.comment),
                      `Used in: ${f
                        .unique(filterArray(usages.map(mappers.usage)))
                        .join(' ⬤ ')}`,
                    ]).join(' '),
                    reference: f
                      .unique(filterArray(usages.map(mappers.reference)))
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
          `${mappers.languageCode(language)}${gettextExtension}`
        );
        const merged = await mergePoSpec(spec, fileName);
        const po = gettextParser.po.compile(merged);
        await fs.promises.writeFile(fileName, po);
        console.log(fileName);
      });
    })
  ).then(f.void);

export const gettextExtension = '.po';

/**
 * Merge new specify .po file and the .po file that is in Weblate
 */
export async function mergePoSpec(
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
        `merging won't be performed. This warning can be ignored if you are ` +
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
            ) as (typeof local)['comments'],
          },
        ];
      })
    ),
  },
});
