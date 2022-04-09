import { load } from './initialcontext';
import type { JavaType } from './specifyfield';
import type { IR, R, RA } from './types';
import type { Parser } from './uiparse';
import { formatter, parsers, parseValue } from './uiparse';
import { f } from './functools';

const preferences: R<string> = {};

export const fetchContext = load<string>(
  '/context/remoteprefs.properties',
  'text/plain'
).then((text) =>
  text
    .split('\n')
    .filter((line) => !line.startsWith('#'))
    .forEach((line) => {
      const match = /([^=]+)=(.+)/.exec(line);
      if (match) preferences[match[1]] = match[2];
    })
);

type Definitions = ReturnType<typeof remotePrefsDefinitions>;
type TypeOf<KEY extends keyof Definitions> =
  Definitions[KEY]['defaultValue'] extends string
    ? string
    : Definitions[KEY]['defaultValue'] extends number
    ? number
    : boolean;

export function getPref<KEY extends keyof Definitions>(key: KEY): TypeOf<KEY> {
  const value =
    typeof preferences[key] === 'string'
      ? ('formatter' in remotePrefsDefinitions()[key]
          ? (
              remotePrefsDefinitions()[key] as {
                readonly formatter: RA<(value: unknown) => unknown>;
              }
            ).formatter
          : []
        ).reduce<unknown>(
          (value, formatter) => formatter(value),
          preferences[key]
        )
      : undefined;
  const parsed =
    'parser' in remotePrefsDefinitions()[key] && typeof value !== 'undefined'
      ? parseValue(
          parsers()[
            (remotePrefsDefinitions()[key] as { readonly parser: JavaType })
              .parser
          ] as Parser,
          undefined,
          value as string
        )
      : undefined;
  return (
    parsed?.isValid === true
      ? parsed.parsed
      : remotePrefsDefinitions()[key].defaultValue
  ) as TypeOf<KEY>;
}

export const remotePrefs: IR<string> = preferences;

export const remotePrefsDefinitions = f.store(
  () =>
    ({
      'ui.formatting.scrdateformat': {
        description: 'Full Date format',
        defaultValue: 'YYYY-MM-DD',
        formatter: [formatter().trim, formatter().toUpperCase],
      },
      'ui.formatting.scrmonthformat': {
        description: 'Month Date format',
        defaultValue: 'MM/YYYY',
        formatter: [formatter().trim, formatter().toUpperCase],
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
      's2n.badges.enabled': {
        description: 'Whether to enable Specify Network Badge',
        defaultValue: true,
        parser: 'java.lang.Boolean',
      },
      'GeologicTimePeriod.treeview_sort_field': {
        description: 'Sort order for nodes in the tree viewer',
        defaultValue: 'name',
        formatter: [formatter().trim],
      },
      'Taxon.treeview_sort_field': {
        description: 'Sort order for nodes in the tree viewer',
        defaultValue: 'name',
        formatter: [formatter().trim],
      },
      'Geography.treeview_sort_field': {
        description: 'Sort order for nodes in the tree viewer',
        defaultValue: 'name',
        formatter: [formatter().trim],
      },
      'LithoStrat.treeview_sort_field': {
        description: 'Sort order for nodes in the tree viewer',
        defaultValue: 'name',
        formatter: [formatter().trim],
      },
      'Storage.treeview_sort_field': {
        description: 'Sort order for nodes in the tree viewer',
        defaultValue: 'name',
        formatter: [formatter().trim],
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

export const collectionPrefsDefinitions = {
  // Like CO_CREATE_COA_${collectionId}
  CO_CREATE_COA: {
    description:
      'Whether to create Collection Object Attributes when Collection Object is created',
    defaultValue: false,
    parser: 'java.lang.Boolean',
  },
  CO_CREATE_PREP: {
    description:
      'Whether to create Preparation when Collection Object is created',
    defaultValue: false,
    parser: 'java.lang.Boolean',
  },
  CO_CREATE_DET: {
    description:
      'Whether to create Determination when Collection Object is created',
    defaultValue: false,
    parser: 'java.lang.Boolean',
  },
} as const;

export const getCollectionPreference = (
  key: keyof typeof collectionPrefsDefinitions,
  collectionId: number
): boolean =>
  remotePrefs[`${key}_${collectionId}`]?.trim().toLowerCase() === 'true';
