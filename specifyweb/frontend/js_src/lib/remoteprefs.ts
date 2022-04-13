/**
 * Fetch remote prefs file (a global preferences file)
 */

import { ajax } from './ajax';
import { f } from './functools';
import { cachableUrl } from './initialcontext';
import type { JavaType } from './specifyfield';
import type { IR, R, RA } from './types';
import { defined } from './types';
import type { Parser } from './uiparse';
import { formatter, parsers, parseValue } from './uiparse';

const preferences: R<string> = {};

/*
 * Not using load() from initialContext here because remote prefs are needed
 * on the choose collection screen (intiai lcontext is not unlocked for that
 * endpoint)
 */
export const fetchContext = ajax(
  cachableUrl('/context/remoteprefs.properties'),
  { headers: { Accept: 'text/plain' } }
).then(({ data: text }) =>
  text
    .split('\n')
    .filter((line) => !line.startsWith('#'))
    .forEach((line) => {
      const match = /([^=]+)=(.+)/.exec(line);
      if (match) preferences[match[1]] = match[2];
    })
);

type Definitions = ReturnType<typeof remotePrefsDefinitions>;
type CollectionDefinitions = typeof collectionPrefsDefinitions;
type Definition = {
  readonly defaultValue: boolean | string | number;
  readonly formatters?: RA<(value: unknown) => unknown>;
  readonly parser?: JavaType;
};
type TypeOf<DEFINITION extends Definition> =
  DEFINITION['defaultValue'] extends string
    ? string
    : DEFINITION['defaultValue'] extends number
    ? number
    : boolean;

type DefinitionOf<KEY extends keyof Definitions | keyof CollectionDefinitions> =
  KEY extends keyof Definitions
    ? Definitions[KEY]
    : KEY extends keyof CollectionDefinitions
    ? CollectionDefinitions[KEY]
    : never;

export const getPref = <KEY extends keyof Definitions>(
  key: KEY
): TypeOf<Definitions[KEY]> =>
  parsePref(preferences[key], defined(remotePrefsDefinitions()[key])) as TypeOf<
    Definitions[KEY]
  >;

export function getCollectionPref<KEY extends keyof CollectionDefinitions>(
  key: KEY,
  collectionId: number
): TypeOf<DefinitionOf<KEY>> {
  const fullKey = `${key}${collectionPrefsDefinitions[key].separator}${collectionId}`;
  return parsePref(
    preferences[fullKey],
    defined(collectionPrefsDefinitions[key])
  ) as TypeOf<DefinitionOf<KEY>>;
}

function parsePref(
  rawValue: string | undefined,
  { defaultValue, formatters, parser }: Definition
): string | boolean | number {
  const value = f.maybe(rawValue, (rawValue) =>
    (formatters ?? []).reduce<unknown>(
      (value, formatter) => formatter(value),
      rawValue
    )
  );
  const parsed =
    typeof parser === 'string' && typeof value !== 'undefined'
      ? parseValue(parsers()[parser] as Parser, undefined, value as string)
      : undefined;
  return (parsed?.isValid === true ? parsed.parsed : defaultValue) as
    | string
    | number
    | boolean;
}

export const remotePrefs: IR<string> = preferences;

/**
 * A list of remote prefs that Specify 7 recognizes.
 * There are many more that are Specify 6 specific.
 */
export const remotePrefsDefinitions = f.store(
  () =>
    ({
      'ui.formatting.scrdateformat': {
        description: 'Full Date format',
        defaultValue: 'YYYY-MM-DD',
        formatters: [formatter().trim, formatter().toUpperCase],
      },
      'ui.formatting.scrmonthformat': {
        description: 'Month Date format',
        defaultValue: 'MM/YYYY',
        formatters: [formatter().trim, formatter().toUpperCase],
      },
      'ui.formatting.accessible_date_input': {
        description:
          'If false, date picker would be replaced with a simple text input',
        defaultValue: true,
        parser: 'java.lang.Boolean',
      },
      'ui.formatting.accessible_month_input': {
        description:
          'If false, month picker would be replaced with a simple text input',
        defaultValue: true,
        parser: 'java.lang.Boolean',
      },
      'GeologicTimePeriod.treeview_sort_field': {
        description: 'Sort order for nodes in the tree viewer',
        defaultValue: 'name',
        formatters: [formatter().trim],
      },
      'Taxon.treeview_sort_field': {
        description: 'Sort order for nodes in the tree viewer',
        defaultValue: 'name',
        formatters: [formatter().trim],
      },
      'Geography.treeview_sort_field': {
        description: 'Sort order for nodes in the tree viewer',
        defaultValue: 'name',
        formatters: [formatter().trim],
      },
      'LithoStrat.treeview_sort_field': {
        description: 'Sort order for nodes in the tree viewer',
        defaultValue: 'name',
        formatters: [formatter().trim],
      },
      'Storage.treeview_sort_field': {
        description: 'Sort order for nodes in the tree viewer',
        defaultValue: 'name',
        formatters: [formatter().trim],
      },
      'TreeEditor.Rank.Threshold.GeologicTimePeriod': {
        description:
          'Show Collection Object count only for nodes with RankID >= than this value',
        defaultValue: 99_999,
        parser: 'java.lang.Long',
      },
      'TreeEditor.Rank.Threshold.Taxon': {
        description:
          'Show Collection Object count only for nodes with RankID >= than this value',
        defaultValue: 99_999,
        parser: 'java.lang.Long',
      },
      'TreeEditor.Rank.Threshold.Geography': {
        description:
          'Show Collection Object count only for nodes with RankID >= than this value',
        defaultValue: 99_999,
        parser: 'java.lang.Long',
      },
      'TreeEditor.Rank.Threshold.LithoStrat': {
        description:
          'Show Collection Object count only for nodes with RankID >= than this value',
        defaultValue: 99_999,
        parser: 'java.lang.Long',
      },
      'TreeEditor.Rank.Threshold.Storage': {
        description:
          'Show Collection Object count only for nodes with RankID >= than this value',
        defaultValue: 99_999,
        parser: 'java.lang.Long',
      },
      'sp7.doTaxonTiles': {
        description: 'Whether to display Taxon Tiles on the welcome page',
        defaultValue: false,
        parser: 'java.lang.Boolean',
      },
      'sp7.welcomeScreenUrl': {
        description:
          'Image or webpage URL to display on the home page. See ' +
          'https://github.com/specify/specify7/wiki/Customizing-the-splash-screen',
        defaultValue: '/static/img/icons_as_background_splash.png',
        formatter: [formatter().trim],
      },
      'attachment.is_public_default': {
        description: 'Whether new Attachments are public by default',
        defaultValue: true,
        parser: 'java.lang.Boolean',
      },
      'ALWAYS.ASK.COLL': {
        description:
          'Whether to always ask which collection to use on the sign in screen',
        defaultValue: true,
        parser: 'java.lang.Boolean',
      },
      // These are used on back end only
      'auditing.do_audits': {
        description: 'Whether Audit Log is enabled',
        defaultValue: true,
        parser: 'java.lang.Boolean',
      },
      'auditing.audit_field_updates': {
        description: 'Whether Audit Log records field value changes',
        defaultValue: true,
        parser: 'java.lang.Boolean',
      },
      // This is actually stored in Global Prefs:
      /*
       * 'AUDIT_LIFESPAN_MONTHS': {
       *   description: 'Number of month to store audit log entries for',
       *   defaultValue: 99999,
       *   parser: 'java.lang.Long',
       * },
       */
    } as const)
);

/**
 * Remote prefs that are scoped to a collection
 */
export const collectionPrefsDefinitions = {
  // Like CO_CREATE_COA_${collectionId}
  CO_CREATE_COA: {
    separator: '_',
    description:
      'Whether to create Collection Object Attributes when Collection Object is created',
    defaultValue: false,
    parser: 'java.lang.Boolean',
  },
  CO_CREATE_PREP: {
    separator: '_',
    description:
      'Whether to create Preparation when Collection Object is created',
    defaultValue: false,
    parser: 'java.lang.Boolean',
  },
  CO_CREATE_DET: {
    separator: '_',
    description:
      'Whether to create Determination when Collection Object is created',
    defaultValue: false,
    parser: 'java.lang.Boolean',
  },
  'S2n.S2nOn': {
    separator: '.',
    description: 'Whether to enable Specify Network Badge',
    defaultValue: true,
    parser: 'java.lang.Boolean',
  },
} as const;
