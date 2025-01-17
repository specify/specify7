/**
 * Fetch remote prefs file (a global preferences file)
 */

import { ajax } from '../../utils/ajax';
import { f } from '../../utils/functools';
import { databaseDateFormat } from '../../utils/parser/dateConfig';
import type { Parser } from '../../utils/parser/definitions';
import { formatter, parsers } from '../../utils/parser/definitions';
import { parseValue } from '../../utils/parser/parse';
import type { IR, R, RA } from '../../utils/types';
import { defined } from '../../utils/types';
import type { JavaType } from '../DataModel/specifyField';
import { cachableUrl, contextUnlockedPromise } from './index';

const preferences: R<string> = {};

/*
 * Not using load() from initialContext here because remote prefs are needed
 * on the choose collection screen (intiail context is not unlocked for that
 * endpoint)
 */
export const fetchContext = contextUnlockedPromise.then(async (entrypoint) =>
  entrypoint === 'main'
    ? ajax(cachableUrl('/context/remoteprefs.properties'), {
        headers: { Accept: 'text/plain' },
      })
        .then(({ data: text }) =>
          text
            .split('\n')
            .filter((line) => !line.startsWith('#'))
            .forEach((line) => {
              const [key, value] = line.split('=');
              if (typeof value === 'string')
                preferences[key.trim()] = value.trim();
            })
        )
        .then(() => preferences)
    : undefined
);

type Definitions = ReturnType<typeof remotePrefsDefinitions>;
type CollectionDefinitions = typeof collectionPrefsDefinitions;
type Definition = {
  readonly defaultValue: boolean | number | string;
  readonly formatters?: RA<(value: unknown) => unknown>;
  readonly parser?: JavaType;
};
type TypeOf<DEFINITION extends Definition> =
  DEFINITION['defaultValue'] extends string
    ? string
    : DEFINITION['defaultValue'] extends number
      ? number
      : boolean;

type DefinitionOf<KEY extends keyof CollectionDefinitions | keyof Definitions> =
  KEY extends keyof Definitions
    ? Definitions[KEY]
    : KEY extends keyof CollectionDefinitions
      ? CollectionDefinitions[KEY]
      : never;

export const getPref = <KEY extends keyof Definitions>(
  key: KEY
): TypeOf<Definitions[KEY]> =>
  parsePref(
    preferences[key],
    defined(
      remotePrefsDefinitions()[key],
      `Trying to get unknown remote pref ${key}`
    )
  ) as TypeOf<Definitions[KEY]>;

export function getCollectionPref<KEY extends keyof CollectionDefinitions>(
  key: KEY,
  collectionId: number
): TypeOf<DefinitionOf<KEY>> {
  const fullKey = `${key}${collectionPrefsDefinitions[key].separator}${collectionId}`;
  return parsePref(
    preferences[fullKey],
    defined(
      collectionPrefsDefinitions[key],
      `Trying to get unknown collection-scoped remote pref ${key}`
    )
  ) as TypeOf<DefinitionOf<KEY>>;
}

function parsePref(
  rawValue: string | undefined,
  { defaultValue, formatters = [], parser }: Definition
): boolean | number | string {
  const value = f.maybe(rawValue, (rawValue) =>
    formatters.reduce<unknown>((value, formatter) => formatter(value), rawValue)
  );
  const parsed =
    typeof parser === 'string' && value !== undefined
      ? parseValue(parsers()[parser] as Parser, undefined, value as string)
      : undefined;
  return (
    typeof parsed === 'object'
      ? parsed.isValid
        ? parsed.parsed
        : defaultValue
      : (value ?? defaultValue)
  ) as boolean | number | string;
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
        defaultValue: databaseDateFormat,
        formatters: [formatter.trim, formatter.toUpperCase],
        // Indicates that this remote pref is shared with Specify 6
        isLegacy: true,
      },
      'ui.formatting.scrmonthformat': {
        description: 'Month Date format',
        defaultValue: 'MM/YYYY',
        formatters: [formatter.trim, formatter.toUpperCase],
      },
      'GeologicTimePeriod.treeview_sort_field': {
        description: 'Sort order for nodes in the tree viewer',
        defaultValue: 'name',
        formatters: [formatter.trim],
        isLegacy: true,
      },
      'Taxon.treeview_sort_field': {
        description: 'Sort order for nodes in the tree viewer',
        defaultValue: 'name',
        formatters: [formatter.trim],
        isLegacy: true,
      },
      'Geography.treeview_sort_field': {
        description: 'Sort order for nodes in the tree viewer',
        defaultValue: 'name',
        formatters: [formatter.trim],
        isLegacy: true,
      },
      'LithoStrat.treeview_sort_field': {
        description: 'Sort order for nodes in the tree viewer',
        defaultValue: 'name',
        formatters: [formatter.trim],
        isLegacy: true,
      },
      'Storage.treeview_sort_field': {
        description: 'Sort order for nodes in the tree viewer',
        defaultValue: 'name',
        formatters: [formatter.trim],
        isLegacy: true,
      },
      'TectonicUnit.treeview_sort_field': {
        description: 'Sort order for nodes in the tree viewer',
        defaultValue: 'name',
        formatters: [formatter.trim],
        isLegacy: false,
      },
      'Drainage.treeview_sort_field': {
        description: 'Sort order for nodes in the tree viewer',
        defaultValue: 'name',
        formatters: [formatter.trim],
        isLegacy: false,
      },
      'TreeEditor.Rank.Threshold.GeologicTimePeriod': {
        description:
          'Show Collection Object count only for nodes with RankID >= than this value',
        defaultValue: 99_999,
        parser: 'java.lang.Long',
        isLegacy: true,
      },
      'TreeEditor.Rank.Threshold.Taxon': {
        description:
          'Show Collection Object count only for nodes with RankID >= than this value',
        defaultValue: 99_999,
        parser: 'java.lang.Long',
        isLegacy: true,
      },
      'TreeEditor.Rank.Threshold.Geography': {
        description:
          'Show Collection Object count only for nodes with RankID >= than this value',
        defaultValue: 99_999,
        parser: 'java.lang.Long',
        isLegacy: true,
      },
      'TreeEditor.Rank.Threshold.LithoStrat': {
        description:
          'Show Collection Object count only for nodes with RankID >= than this value',
        defaultValue: 99_999,
        parser: 'java.lang.Long',
        isLegacy: true,
      },
      'TreeEditor.Rank.Threshold.Storage': {
        description:
          'Show Collection Object count only for nodes with RankID >= than this value',
        defaultValue: 99_999,
        parser: 'java.lang.Long',
        isLegacy: true,
      },
      'TreeEditor.Rank.Threshold.TectonicUnit': {
        description:
          'Show Collection Object count only for nodes with RankID >= than this value',
        defaultValue: 99_999,
        parser: 'java.lang.Long',
        isLegacy: true,
      },
      'TreeEditor.Rank.Threshold.Drainage': {
        description:
          'Show Collection Object count only for nodes with RankID >= than this value',
        defaultValue: 99_999,
        parser: 'java.lang.Long',
        isLegacy: true,
      },

      /*
       * This pref was implemented in Specify 7 in https://github.com/specify/specify7/pull/2818
       * and went through many iterations and changes.
       * See the Pull Request for the full context and implementation/design decision.
       */
      'TaxonTreeEditor.DisplayAuthor': {
        description:
          'Display Authors of Taxons next to nodes in the Tree Viewer',
        defaultValue: false,
        parser: 'java.lang.Boolean',
        isLegacy: true,
      },
      'attachment.is_public_default': {
        description: 'Whether new Attachments are public by default',
        defaultValue: true,
        parser: 'java.lang.Boolean',
        isLegacy: true,
      },
      'attachment.preview_size': {
        description: 'The size in px of the generated attachment thumbnails',
        defaultValue: 123,
        parser: 'java.lang.Long',
        isLegacy: true,
      },
      // These are used on the back end only:
      'auditing.do_audits': {
        description: 'Whether Audit Log is enabled',
        defaultValue: true,
        parser: 'java.lang.Boolean',
        isLegacy: true,
      },
      'auditing.audit_field_updates': {
        description: 'Whether Audit Log records field value changes',
        defaultValue: true,
        parser: 'java.lang.Boolean',
        isLegacy: true,
      },
      'form.definition.columnSource': {
        description: 'The platform to use as a source of columns',
        defaultValue: 'lnx',
        formatter: [formatter.trim],
        isLegacy: false,
      },
      'sp7.allow_adding_child_to_synonymized_parent.GeologicTimePeriod': {
        description:
          'Allowed to add children to synopsized Geologic Time Period records',
        defaultValue: false,
        parser: 'java.lang.Boolean',
        isLegacy: false,
      },
      'sp7.allow_adding_child_to_synonymized_parent.Taxon': {
        description: 'Allowed to add children to synopsized Taxon records',
        defaultValue: false,
        parser: 'java.lang.Boolean',
        isLegacy: false,
      },
      'sp7.allow_adding_child_to_synonymized_parent.Geography': {
        description: 'Allowed to add children to synopsized Geography records',
        defaultValue: false,
        parser: 'java.lang.Boolean',
        isLegacy: false,
      },
      'sp7.allow_adding_child_to_synonymized_parent.LithoStrat': {
        description: 'Allowed to add children to synopsized LithoStrat records',
        defaultValue: false,
        parser: 'java.lang.Boolean',
        isLegacy: false,
      },
      'sp7.allow_adding_child_to_synonymized_parent.Storage': {
        description: 'Allowed to add children to synopsized Storage records',
        defaultValue: false,
        parser: 'java.lang.Boolean',
        isLegacy: false,
      },
      'sp7.allow_adding_child_to_synonymized_parent.TectonicUnit': {
        description:
          'Allowed to add children to synopsized TectonicUnit records',
        defaultValue: false,
        parser: 'java.lang.Boolean',
        isLegacy: false,
      },
      'sp7.allow_adding_child_to_synonymized_parent.Drainage': {
        description:
          'Allowed to add children to synopsized Drainage records',
        defaultValue: false,
        parser: 'java.lang.Boolean',
        isLegacy: false,
      },
      // This is actually stored in Global Prefs:
      /*
       * 'AUDIT_LIFESPAN_MONTHS': {
       *   description: 'Number of month to store audit log entries for',
       *   defaultValue: 99999,
       *   parser: 'java.lang.Long',
       *   isLegacy: true,
       * },
       */
    }) as const
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
  sp7_scope_table_picklists: {
    separator: '_',
    description:
      "Whether to scope picklistitems for picklists of type 'Entire Table'",
    defaultValue: true,
    parser: 'java.lang.Boolean',
  },
} as const;
