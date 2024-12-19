import fs from 'node:fs';
import path from 'node:path';

import prettier from 'prettier';

import { f } from '../../utils/functools';
import type { IR, RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import type { LocalizationEntry } from './index';
import type { ExtractedStrings } from './scanUsages';
import { dictionaryExtension } from './scanUsages';
import { testLogging } from './testLogging';

export async function updateLocalizationFiles(
  merged: ExtractedStrings
): Promise<void> {
  await Promise.all(
    Object.entries(merged).map(
      async ([component, { dictionaryName, strings }]) =>
        updateLocalFile(component, dictionaryName, strings)
    )
  );
}

const { error } = testLogging;

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
  const formatted = await prettier.format(newContent, {
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
    : `${pre} \`\n${content
        .split('\\n')
        .map((part) =>
          part === ''
            ? ''
            : `${indent}${splitContent(part, indent, printWidth)}`
        )
        .join(`\n`)}\n${smallIndent}\`,`;

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
