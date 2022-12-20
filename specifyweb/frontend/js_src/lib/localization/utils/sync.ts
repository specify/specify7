import gettextParser from 'gettext-parser';
import fs from 'node:fs';
import path from 'node:path';
import { languages, whitespaceSensitive } from './index';
import { camelToHuman } from '../../utils/utils';
import { filterArray } from '../../utils/types';
import { f } from '../../utils/functools';
import { DictionaryUsages } from './scanUsages';

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
  return `🟥${comment}${comment.endsWith('.') ? '' : '.'}`;
}

const trimPath = (filePath: string): string =>
  filePath.slice(filePath.indexOf('/lib/') + '/lib/'.length);

export async function syncStrings(
  localStrings: DictionaryUsages,
  emitPath: string
): Promise<void> {
  if (fs.existsSync(emitPath)) {
    if (fs.readdirSync(emitPath).length > 0)
      throw new Error(`Can not run syncStrings on a non-empty directory`);
  } else fs.mkdirSync(emitPath, { recursive: true });

  await Promise.all(
    Object.entries(localStrings).flatMap(([key, { strings }]) =>
      languages.map(async (language) => {
        const po = gettextParser.po.compile({
          charset: 'utf-8',
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
          path.join(emitPath, `${key}_${language}.po`),
          po
        );
      })
    )
  );

  /*
  const localProjects = Object.values(localStrings).map(({categoryName})=>categoryName);


  const weblateProjects = await fetch(
    'https://hosted.weblate.org/api/projects/specify-7/components/',
    {
      headers: { Authorization: key },
    }
  )
    .then((response) => response.json())
    .then(
      ({ results }) =>
        new Set(
          (results as RA<{ readonly name: string }>).map(({ name }) => name)
        )
    );

  const missingProjects = localProjects.filter(
    (name) => !weblateProjects.has(name)
  );
  missingProjects.forEach((name) => {
    throw new Error(
      `Weblate does not have a project for the "${name}" dictionary file. Please create it.`
    );
  });

  const ignoredProjects = new Set(['glossary']);
  const unusedProjects = Object.keys(weblateProjects).filter(
    (name) => !(name in localStrings) && !ignoredProjects.has(name)
  );
  unusedProjects.forEach((name) =>
    console.log(
      `Found a project ${name} in the remote, but it's not present on the current branch`
    )
  );
*/
}
