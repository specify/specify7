/*
 *
 * Walks through front-end files in search of invalid usages of localization
 * keys.
 *
 * Accepts optional `--verbose` argument to enable verbose output
 *
 */

import fs from 'fs';
import path from 'path';

if (typeof process.argv[1] === 'undefined')
  throw new Error('Unable to find the path of the current directory');

// CONFIGURATION
/*
 * When tests are build, this scrip would get executed from
 * `js_src/testBuild/tests/testlocalization.js`. We need to go up two
 * levels to get to the `js_src` directory.
 * */
const jsSrcDirectory = path.dirname(path.dirname(process.argv[1]));
const libDirectory = path.join(path.dirname(jsSrcDirectory), 'lib');

// Directory that contains the localization script
const localizationDirectory = path.join(libDirectory, 'localization');

// Directories that contain front-end source code (non-recursively)
const directoriesToScan = ['./', './components', './templates'];

// Decide whether verbose mode should be turned on
const verbose = process.argv[2] === '--verbose';

const log = console.log;
let warningsCount = 0;
function warn(value: string): void {
  warningsCount += 1;
  console.warn(`\u001B[33m${value}\u001B[0m\n`);
}
let errorsCount = 0;
function error(value: string): void {
  errorsCount += 1;
  process.exitCode = 1;
  console.warn(`\u001B[31m${value}\u001B[0m\n\n`);
}

log(`Looking for localization dictionaries in ${localizationDirectory}`);

const reFindDictionary =
  /const (?<dictionaryName>[a-z][A-Za-z]+Text) = createDictionary/;
const reFindKeys = /^\s*(?<keyName>\w+):\s*(?<keyType>["'([`f](?:\s*<)?)/gm;
const lookAroundLength = 40;

type Key = {
  readonly expectsArguments: boolean;
  useCount: number;
};

type Dictionary = Readonly<Record<string, Key>>;

const localizationFiles = fs.readdirSync(localizationDirectory);
const dictionaries = Object.fromEntries(
  localizationFiles
    .map<undefined | [string, Dictionary]>((fileName) => {
      log(`Looking for a dictionary in ${fileName}`);
      const fileContent = fs
        .readFileSync(path.join(localizationDirectory, fileName))
        .toString();
      const regexMatch = reFindDictionary.exec(fileContent);
      reFindDictionary.lastIndex = 0;
      if (regexMatch === null || typeof regexMatch.groups === 'undefined') {
        warn(`Unable to find a dictionary in ${fileName}`);
        return undefined;
      }
      const dictionaryName = regexMatch.groups.dictionaryName;
      const trimmedDictionary = fileContent.slice(regexMatch.index);
      const keys = Object.fromEntries(
        Array.from(trimmedDictionary.matchAll(reFindKeys), ({ groups }) =>
          typeof groups === 'undefined'
            ? undefined
            : [
                groups.keyName,
                {
                  expectsArguments:
                    (groups.keyType === '(' && groups.keyType.length === 1) ||
                    groups.keyType === 'f',
                  useCount: 0,
                },
              ]
        ).filter(
          (content): content is [string, Key] => typeof content !== 'undefined'
        )
      );

      if (Object.keys(keys).length === 0) {
        error(`Unable to find any keys in the ${dictionaryName} dictionary`);
        return undefined;
      }

      return [dictionaryName, keys];
    })
    .filter(
      (content): content is [string, Dictionary] =>
        typeof content !== 'undefined'
    )
);

if (Object.keys(dictionaries).length === 0)
  error('Unable to find any localization dictionaries');

const sourceFiles = directoriesToScan
  .flatMap((directoryName) =>
    fs
      .readdirSync(path.join(libDirectory, directoryName))
      .map((fileName) => path.join(directoryName, fileName))
  )
  .filter((fileName) =>
    ['js', 'jsx', 'ts', 'tsx', 'html'].includes(
      fileName.split('.').slice(-1)[0]
    )
  );

sourceFiles.forEach((fileName) => {
  if (verbose) log(`Looking for language string usages in ${fileName}`);

  const fileContent = fs
    .readFileSync(path.join(libDirectory, fileName))
    .toString();
  let foundUsages = false;

  Object.entries(dictionaries).forEach(([dictionaryName, keys]) => {
    const regex = new RegExp(
      `${dictionaryName}\\s*\\(\\s*["'\`](?<keyName>\\w+)["'\`]\\s*\\)\\s*(?<hasArguments>\\()?`,
      'g'
    );

    Array.from(fileContent.matchAll(regex)).forEach(({ groups, index }) => {
      if (typeof groups === 'undefined' || typeof index === 'undefined') return;

      const keyName = groups.keyName;
      const hasArguments = typeof groups.hasArguments !== 'undefined';

      const position = fileContent.slice(
        index - lookAroundLength,
        index + lookAroundLength + dictionaryName.length + keyName.length
      );
      const lineNumber = (fileContent.slice(0, index).match(/\n/g) ?? [])
        .length;

      if (!(keyName in keys)) {
        error(
          [
            `Found unknown key ${dictionaryName}.${keyName} in ${fileName}\n`,
            `\n`,
            `On line ${lineNumber}:\n`,
            `${position}`,
          ].join('')
        );
        return;
      }

      if (keys[keyName].expectsArguments !== hasArguments) {
        if (hasArguments)
          error(
            [
              `${fileName} provides arguments to ${dictionaryName}.${keyName} `,
              `but it is not supposed to.\n`,
              `\n`,
              `On line ${lineNumber}:\n`,
              `${position}`,
            ].join('')
          );
        else
          error(
            [
              `${fileName} does not provide arguments to `,
              `${dictionaryName}.${keyName} but it is supposed to.\n`,
              `\n`,
              `On line ${lineNumber}:\n`,
              `${position}`,
            ].join('')
          );
      }

      keys[keyName].useCount += 1;
      foundUsages = true;
    });
  });

  if (!foundUsages && verbose) log(`Didn't find any usages in ${fileName}`);
});

Object.entries(dictionaries).forEach(([dictionaryName, keys]) =>
  Object.entries(keys)
    .filter(([_keyName, { useCount }]) => useCount === 0)
    .forEach(([keyName]) =>
      error(`No usages of ${dictionaryName}.${keyName} found`)
    )
);

if (verbose) {
  log(dictionaries);
  Object.entries(dictionaries).forEach(([dictionaryName, keys]) =>
    log(
      `${dictionaryName} has ${
        Object.keys(keys).length
      } keys with a total use count of ${Object.values(keys)
        .map(({ useCount }) => useCount)
        .reduce((total, useCount) => total + useCount, 0)}`
    )
  );
}
warn(`Warnings: ${warningsCount}`);
warn(`Errors: ${errorsCount}`);
