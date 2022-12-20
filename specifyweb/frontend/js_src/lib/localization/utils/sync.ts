import gettextParser from 'gettext-parser';
import fs from 'node:fs';
import { languages } from './index';
import { scanUsages } from './scanUsages';

syncStrings().catch(console.error);

async function syncStrings(): Promise<void> {
  const localStrings = await scanUsages();
  if (localStrings === undefined) return undefined;

  await Promise.all(
    Object.entries(localStrings).flatMap(([key, { strings }]) =>
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
                  msgstr: [strings[language] ?? ''],
                  comments: {
                    extracted: strings.comment ?? '',
                    reference: usages
                      .map(
                        ({ filePath, lineNumber }) =>
                          `${filePath}:${lineNumber}`
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

        return fs.promises.writeFile(`./tmp/${key}_${language}.po`, po);
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
  );*/
}
