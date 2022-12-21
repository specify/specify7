import { program } from 'commander';
import fs from 'node:fs';
import path from 'node:path';
import gettextParser from 'gettext-parser';
import prettier from 'prettier';

import {
  dictionaryExtension,
  ExtractedStrings,
  extractStrings,
} from '../utils/scanUsages';
import { testLogging } from './testLogging';
import { formatList } from '../../components/Atoms/Internationalization';
import { filterArray, IR, RA } from '../../utils/types';
import { LocalizationEntry, whitespaceSensitive } from './index';
import { languageCodeMapper } from './config';
import { gettextExtension } from './sync';
import { group } from '../../utils/utils';
import { f } from '../../utils/functools';

program
  .name('Pull localization')
  .description('Pull localization changes from Weblate')
  .requiredOption('--directory <string>', 'Weblate output directory');

program.parse();

const { directory } = program.opts<{
  readonly directory: string;
}>();

const { error, getErrorCount } = testLogging;

extractStrings()
  .then(async (dictionaries) => {
    const components = fs.readdirSync(directory);
    ensureConsistency(dictionaries, components);
    if (getErrorCount() > 0) return;
    const remoteDictionary = await parseDictionaries(components);
    const mergedDictionaries = mergeDictionaries(
      dictionaries,
      remoteDictionary
    );
    await updateLocalFiles(mergedDictionaries);
  })
  .catch(console.error);

function ensureConsistency(
  dictionaries: ExtractedStrings,
  components: RA<string>
): void {
  const missingLocalComponents = components.filter(
    (component) => !(component in dictionaries)
  );
  if (missingLocalComponents.length > 0)
    error(
      `Weblate has some components which are not defined ` +
        `locally: ${formatList(missingLocalComponents)}`
    );

  const missingRemoteComponents = Object.keys(dictionaries).filter(
    (component) => !components.includes(component)
  );
  if (missingRemoteComponents.length > 0)
    error(
      `Local repository has some components that are absent in ` +
        `Weblate: ${formatList(missingRemoteComponents)}`
    );
}

const parseDictionaries = (
  components: RA<string>
): Promise<IR<IR<LocalizationEntry>>> =>
  Promise.all(
    components.map(
      async (component) =>
        [component, await parseDictionary(component)] as const
    )
  ).then((dictionaries) => Object.fromEntries(dictionaries));

const reverseLanguageMapper = Object.fromEntries(
  Object.entries(languageCodeMapper).map(([key, value]) => [value, key])
);

async function parseDictionary(
  component: string
): Promise<IR<LocalizationEntry>> {
  const fullPath = path.join(directory, component);
  const languageFiles = fs.readdirSync(fullPath);

  const unknownLanguages = languageFiles.filter(
    (languageFile) =>
      !languageFile.endsWith(gettextExtension) ||
      !(languageFile.split('.')[0] in reverseLanguageMapper)
  );
  if (unknownLanguages.length > 0)
    error(
      `Weblate has some languages for "${component}" component which are ` +
        `not defined locally: ${formatList(unknownLanguages)}`
    );

  const presentLanguages = languageFiles.map(
    (fileName) => fileName.split('.')[0]
  );
  const missingLanguages = presentLanguages.filter(
    (language) => !(language in reverseLanguageMapper)
  );
  if (missingLanguages.length > 0)
    error(
      `Some defined languages for "${component}" component are missing ` +
        `in Weblate: ${formatList(missingLanguages)}`
    );

  const entries = await Promise.all(
    presentLanguages.map(
      async (language) =>
        [language, await parseLanguageFile(fullPath, language)] as const
    )
  );

  return Object.fromEntries(
    group(
      entries.flatMap(([language, strings]) =>
        Object.entries(strings).map(
          ([key, value]) => [key, [language, value]] as const
        )
      )
    ).map(([key, entries]) => [
      key,
      Object.fromEntries(
        entries.map(([language, string]) => [
          reverseLanguageMapper[language as keyof typeof reverseLanguageMapper],
          string,
        ])
      ),
    ])
  );
}

async function parseLanguageFile(
  componentPath: string,
  language: string
): Promise<IR<string>> {
  const file = await fs.promises.readFile(
    path.join(componentPath, `${language}${gettextExtension}`)
  );
  const content = file.toString();
  const { translations } = gettextParser.po.parse(content);
  const strings = translations[''];
  return Object.fromEntries(
    Object.entries(strings)
      .filter(([key]) => key !== '')
      .map(([key, { msgstr }]) => [key, msgstr[0]])
  );
}

const mergeDictionaries = (
  localDictionaries: ExtractedStrings,
  remoteDictionaries: IR<IR<LocalizationEntry>>
): ExtractedStrings =>
  Object.fromEntries(
    Object.entries(localDictionaries).map(
      ([component, { dictionaryName, strings }]) => [
        component,
        {
          dictionaryName,
          strings: mergeStrings(
            trimStrings(strings, true),
            trimStrings(remoteDictionaries[component], false)
          ),
        },
      ]
    )
  );

const trimStrings = (
  strings: IR<LocalizationEntry>,
  trimNewLine: boolean
): IR<LocalizationEntry> =>
  Object.fromEntries(
    Object.entries(strings).map(([key, values]) => [
      key,
      Object.fromEntries(
        Object.entries(values).map(([language, value]) => [
          language,
          whitespaceSensitive(
            trimNewLine ? value! : value!.replaceAll('\n', '\n\n')
          ).replaceAll('\n', '\n\n'),
        ])
      ),
    ])
  );

const mergeStrings = (
  local: IR<LocalizationEntry>,
  remote: IR<LocalizationEntry>
): IR<LocalizationEntry> => ({
  ...local,
  ...remote,
  ...Object.fromEntries(
    Object.entries(local).map(([key, localEntry]) => [
      key,
      {
        ...localEntry,
        ...remote[key],
      },
    ])
  ),
});

const updateLocalFiles = (merged: ExtractedStrings): Promise<void> =>
  Promise.all(
    Object.entries(merged).map(([component, { dictionaryName, strings }]) =>
      updateLocalFile(component, dictionaryName, strings)
    )
  ).then(f.void);

/**
 * Default print width in Prettier. Unfortunately, we can't access their
 * defaults directly as they are not exported
 */
const defaultPrintWidth = 80;

async function updateLocalFile(
  component: string,
  dictionaryName: string,
  strings: IR<LocalizationEntry>
): Promise<void> {
  const filePath = componentToFilePath(component);
  const originalFile = (await fs.promises.readFile(filePath)).toString();
  const re = new RegExp(
    `(?<pre>${dictionaryName}\\s*=\\s*createDictionary\\(\\s*)(?<content>\\{[\\s\\S]*\\})(?<post>\\s*as const\\s*\\);)`,
    'u'
  );

  if (re.exec(originalFile) === null)
    error(`Unable to find a "${dictionaryName}" dictionary in ${filePath}`);

  const newContent = originalFile.replace(
    re,
    `$<pre>${JSON.stringify(strings, null, 2)}$<post>`
  );
  const config = (await resolvePrettierConfig()) ?? {};
  const formatted = prettier.format(newContent, {
    ...config,
    parser: 'babel-ts',
  });
  const fixed = fixLongLines(formatted, config.printWidth ?? defaultPrintWidth);
  return fs.promises.writeFile(filePath, fixed);
}

const componentToFilePath = (component: string): string =>
  path.join(process.argv[1], '../..', `${component}${dictionaryExtension}`);

const resolvePrettierConfig = f.store(async () =>
  prettier.resolveConfig(process.cwd())
);

const reLongLine =
  /^(?<pre>(?<smallIndent>\s+)(?<lang>[\w'-]+):)\n(?<line>(?<indent>\s+)(?<qoute>["'])(?<content>.*)\k<qoute>,)$/gmu;
const fixLongLines = (formatted: string, printWidth: number): string =>
  formatted.replaceAll(reLongLine, (...args) =>
    fixLine(args[0], args.at(-1)!, printWidth)
  );

const fixLine = (
  original: string,
  {
    line,
    pre,
    smallIndent,
    indent,
    content,
  }: {
    readonly line: string;
    readonly pre: string;
    readonly smallIndent: number;
    readonly indent: string;
    readonly content: string;
  },
  printWidth: number
): string =>
  line.length < printWidth
    ? original
    : `${pre} \`\n${indent}${content
        .split('\\n')
        .map((part) => splitContent(part, indent, printWidth))
        .join(`\n${indent}`)}\n${smallIndent}\`,`;

// FIXME: look for places were can add comments
// FIXME: get rid of back-end localization

/*
 * This is like "/\b/gu" but also supports non-English letters
 * Also, it doesn't consider punctuation as a word boundary
 */
const reBoundary = /^|$|(?<=\p{L})(?=\s)|(?<=\s)(?=\p{L})/gu;

/** Split string by word boundaries to fit within line length */
const splitContent = (
  content: string,
  indent: string,
  printWidth: number
): string =>
  splitString(content, printWidth - indent.length).join(`\n${indent}`);

const splitString = (content: string, limit: number): RA<string> =>
  filterArray(Array.from(content.matchAll(reBoundary), ({ index }) => index))
    .map((splitIndex, itemIndex, array) =>
      content.slice(splitIndex, array[itemIndex + 1] ?? content.length)
    )
    .reduce(
      (strings, part) =>
        `${strings.at(-1)!}${part}`.length > limit
          ? [...strings, part]
          : [...strings.slice(0, -1), `${strings.at(-1)!}${part}`],
      ['']
    )
    .map(f.trim);
