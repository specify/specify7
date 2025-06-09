import fs from 'node:fs';
import path from 'node:path';

import gettextParser from 'gettext-parser';

import { formatConjunction } from '../../components/Atoms/Internationalization';
import type { IR, RA } from '../../utils/types';
import { filterArray, localized } from '../../utils/types';
import { group } from '../../utils/utils';
import type { LocalizationEntry } from './index';
import { whitespaceSensitive } from './index';
import type { ExtractedStrings } from './scanUsages';
import { gettextExtension } from './sync';
import { testLogging } from './testLogging';
import type { localizationKinds } from './validateWeblate';
import { getComponentKind } from './validateWeblate';

const { warn, error, getErrorCount } = testLogging;

export async function weblatePull(
  directory: string,
  dictionaries: ExtractedStrings,
  kind: keyof typeof localizationKinds,
  reverseLanguageMapper: IR<string>
): Promise<ExtractedStrings | undefined> {
  const components = fs
    .readdirSync(directory)
    .filter((name) => getComponentKind(name) === kind);
  ensureConsistency(dictionaries, components);
  if (getErrorCount() > 0) return undefined;
  const remoteDictionary = await parseDictionaries(
    directory,
    components,
    reverseLanguageMapper,
    kind
  );
  return mergeDictionaries(dictionaries, remoteDictionary);
}

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
        `locally: ${formatConjunction(missingLocalComponents.map(localized))}`
    );

  const missingRemoteComponents = Object.keys(dictionaries).filter(
    (component) => !components.includes(component)
  );
  if (missingRemoteComponents.length > 0)
    error(
      `Local repository has some components that are absent in ` +
        `Weblate: ${formatConjunction(missingRemoteComponents.map(localized))}`
    );
}

const parseDictionaries = async (
  directory: string,
  components: RA<string>,
  reverseLanguageMapper: IR<string>,
  kind: keyof typeof localizationKinds
): Promise<IR<IR<LocalizationEntry>>> =>
  Promise.all(
    components.map(
      async (component) =>
        [
          component,
          await parseDictionary(
            directory,
            component,
            reverseLanguageMapper,
            kind
          ),
        ] as const
    )
  ).then((dictionaries) => Object.fromEntries(dictionaries));

async function parseDictionary(
  directory: string,
  component: string,
  reverseLanguageMapper: IR<string>,
  kind: keyof typeof localizationKinds
): Promise<IR<LocalizationEntry>> {
  const fullPath = path.join(directory, component);
  const languageFiles = fs.readdirSync(fullPath);

  const unknownLanguages = languageFiles.filter(
    (languageFile) =>
      !languageFile.endsWith(gettextExtension) ||
      !(languageFile.split('.')[0] in reverseLanguageMapper)
  );
  if (unknownLanguages.length > 0)
    (kind === 'schema' ? warn : error)(
      `Weblate has some languages for "${component}" component which are ` +
        `not defined locally: ${formatConjunction(
          unknownLanguages.map(localized)
        )}.${
          kind === 'userInterface'
            ? '\nIf you indented to add a new language to Specify 7, see ' +
              'documentation: ' +
              'https://github.com/specify/specify7/tree/main/specifyweb/' +
              'frontend/js_src/lib/localization#front-end-localization'
            : ''
        }`
    );

  const presentLanguages = languageFiles.map(
    (fileName) => fileName.split('.')[0]
  );
  const missingLanguages = Object.keys(reverseLanguageMapper).filter(
    (language) => !presentLanguages.includes(language)
  );
  if (missingLanguages.length > 0)
    error(
      `Some defined languages for "${component}" component are missing ` +
        `in Weblate: ${formatConjunction(missingLanguages.map(localized))}`
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
        filterArray(
          entries.map(([language, string]) =>
            language in reverseLanguageMapper || kind === 'schema'
              ? [reverseLanguageMapper[language] ?? language, string]
              : undefined
          )
        )
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
            localized(trimNewLine ? value! : value!.replaceAll('\n', '\n\n'))
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
