import React from 'react';

import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import { ping } from '../../utils/ajax/ping';
import { eventListener } from '../../utils/events';
import { f } from '../../utils/functools';
import { mergeParsers, parserFromType } from '../../utils/parser/definitions';
import { parseValue } from '../../utils/parser/parse';
import type { GetOrSet, RA } from '../../utils/types';
import { filterArray, setDevelopmentGlobal } from '../../utils/types';
import { keysToLowerCase, replaceKey } from '../../utils/utils';
import { MILLISECONDS } from '../Atoms/Internationalization';
import { softFail } from '../Errors/Crash';
import {
  cachableUrl,
  contextUnlockedPromise,
  foreverFetch,
} from '../InitialContext';
import { formatUrl } from '../Router/queryString';
import type { GenericPreferences, PreferenceItem } from './UserDefinitions';

/* eslint-disable functional/no-this-expression */
// TESTS: add tests for user preferences

// eslint-disable-next-line functional/no-class
export class BasePreferences<DEFINITIONS extends GenericPreferences> {
  public readonly events = eventListener<{
    readonly update:
      | {
          readonly category: string;
          readonly subcategory: string;
          readonly item: string;
          readonly definition: PreferenceItem<unknown>;
        }
      | undefined;
  }>();

  /*
   * This allows to overwrite where preferences are stored
   * Used when editing preferences for another user in AppResources
   */
  public readonly Context = React.createContext<
    BasePreferences<DEFINITIONS> | undefined
    /*
     * Default is undefined rather than "this" so that there is esay way to
     * detect if preferences are being redirected
     */
  >(undefined);

  // eslint-disable-next-line functional/prefer-readonly-type
  private defaults: PartialPreferences<DEFINITIONS> = {};

  // eslint-disable-next-line functional/prefer-readonly-type
  private values: PartialPreferences<DEFINITIONS> = {};

  // eslint-disable-next-line functional/prefer-readonly-type
  private resourcePromise: Promise<ResourceWithData> | undefined = undefined;

  // eslint-disable-next-line functional/prefer-readonly-type
  private syncPromise: Promise<void> | undefined;

  // eslint-disable-next-line functional/prefer-readonly-type
  private isSyncPending = false;

  // eslint-disable-next-line functional/prefer-readonly-type
  private syncTimeoutInstance: ReturnType<typeof setTimeout> | undefined =
    undefined;

  public constructor(
    private readonly options: {
      readonly definitions: DEFINITIONS;
      readonly values: {
        readonly fetchUrl: string;
        readonly resourceName: string;
      };
      readonly defaultValues:
        | {
            readonly fetchUrl: string;
            readonly resourceName: string;
          }
        | undefined;
      readonly developmentGlobal: string;
      readonly syncChanges?: boolean;
    }
  ) {}

  /**
   * Fetch preferences from back-end and update local cache with fetched values
   */
  async fetch(): Promise<ResourceWithData> {
    const entryPoint = await contextUnlockedPromise;
    if (entryPoint === 'main') {
      if (typeof this.resourcePromise === 'object') return this.resourcePromise;

      const { values, defaultValues } = this.options;

      const valuesResource = fetchResourceId(
        values.fetchUrl,
        values.resourceName
      ).then(async (appResourceId) =>
        typeof appResourceId === 'number'
          ? fetchResourceData(values.fetchUrl, appResourceId)
          : createResource(values.fetchUrl, values.resourceName)
      );

      const defaultValuesResource =
        defaultValues === undefined
          ? undefined
          : fetchDefaultResourceData(
              defaultValues.fetchUrl,
              defaultValues.resourceName
            ).then((data) => {
              this.defaults = data ?? this.defaults;
            });

      this.resourcePromise = f
        .all({ valuesResource, defaultValuesResource })
        .then(({ valuesResource }) => {
          this.setRaw(JSON.parse(valuesResource.data ?? '{}'));
          return valuesResource;
        });

      return this.resourcePromise;
    } else return foreverFetch();
  }

  public getRaw(): PartialPreferences<DEFINITIONS> {
    return this.values;
  }

  public setRaw(values: PartialPreferences<DEFINITIONS>): void {
    const hasChanged = JSON.stringify(values) !== JSON.stringify(this.values);
    this.values = values;
    if (hasChanged) this.events.trigger('update', undefined);
    setDevelopmentGlobal(this.options.developmentGlobal, this.values);
  }

  public getDefaults(): PartialPreferences<DEFINITIONS> {
    return this.defaults;
  }

  public setDefaults(values: PartialPreferences<DEFINITIONS>): void {
    const hasChanged = JSON.stringify(values) !== JSON.stringify(this.defaults);
    this.defaults = values;
    if (hasChanged) this.events.trigger('update', undefined);
  }

  /**
   * Get preference item definition with resolved default value
   */
  public definition<
    CATEGORY extends string & keyof DEFINITIONS,
    SUBCATEGORY extends CATEGORY extends keyof DEFINITIONS
      ? string & keyof DEFINITIONS[CATEGORY]['subCategories']
      : never,
    ITEM extends string &
      keyof DEFINITIONS[CATEGORY]['subCategories'][SUBCATEGORY]['items']
  >(
    category: CATEGORY,
    subcategory: SUBCATEGORY,
    item: ITEM
  ): DEFINITIONS[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM] {
    const definition =
      this.options.definitions[category].subCategories[subcategory].items[item];

    const defaultValue = this.defaults[category]?.[subcategory]?.[item];
    const resolvedDefinition =
      defaultValue === undefined
        ? definition
        : replaceKey(definition, 'defaultValue', defaultValue);
    return resolvedDefinition as DEFINITIONS[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM];
  }

  /**
   * Get preference value
   */
  public get<
    CATEGORY extends string & keyof DEFINITIONS,
    SUBCATEGORY extends CATEGORY extends keyof DEFINITIONS
      ? string & keyof DEFINITIONS[CATEGORY]['subCategories']
      : never,
    ITEM extends string &
      keyof DEFINITIONS[CATEGORY]['subCategories'][SUBCATEGORY]['items']
  >(
    category: CATEGORY,
    subcategory: SUBCATEGORY,
    item: ITEM
  ): DEFINITIONS[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue'] {
    return (
      this.values[category]?.[subcategory]?.[item] ??
      this.defaults[category]?.[subcategory]?.[item] ??
      this.definition(category, subcategory, item).defaultValue
    );
  }

  /**
   * Set preference value
   */
  set<
    CATEGORY extends string & keyof DEFINITIONS,
    SUBCATEGORY extends CATEGORY extends keyof DEFINITIONS
      ? string & keyof DEFINITIONS[CATEGORY]['subCategories']
      : never,
    ITEM extends string &
      keyof DEFINITIONS[CATEGORY]['subCategories'][SUBCATEGORY]['items']
  >(
    category: CATEGORY,
    subcategory: SUBCATEGORY,
    item: ITEM,
    value: DEFINITIONS[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue']
  ): DEFINITIONS[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue'] {
    const definition = this.definition(category, subcategory, item);
    let parsed;
    if ('type' in definition) {
      const baseParser = parserFromType(definition.type);
      const parser =
        typeof definition.parser === 'object'
          ? mergeParsers(baseParser, definition.parser)
          : baseParser;
      const parseResult = parseValue(
        parser,
        undefined,
        value.toString(),
        parser.type !== 'text'
      );
      if (parseResult.isValid) parsed = parseResult.parsed;
      else {
        console.error(`Failed parsing pref value`, {
          category,
          subcategory,
          item,
          definition,
          parseResult,
        });
        parsed = definition.defaultValue;
      }
    } else if ('values' in definition) {
      if (definition.values.some((item) => item.value === value))
        parsed = value;
      else {
        console.error(`Failed parsing pref value`, {
          category,
          subcategory,
          item,
          value,
          definition,
        });
        parsed = definition.defaultValue;
      }
    } else parsed = value;

    if (
      parsed ===
      (this.values[category]?.[subcategory]?.[item] ?? definition.defaultValue)
    )
      return parsed;

    const values = this.values as PartialPreferences<GenericPreferences>;
    values[category] ??= {};
    values[category]![subcategory] ??= {};
    values[category]![subcategory]![item] = parsed;

    if (this.options.syncChanges !== false) {
      /*
       * Unset default values
       * This reduces the size of the downloaded file, but mainly, it allows for
       * future Specify 7 versions to change the default value.
       */
      if (parsed === definition.defaultValue) {
        values[category]![subcategory]![item] = undefined;
        // Clean up empty objects
        if (
          filterArray(Object.values(values[category]![subcategory]!)).length ===
          0
        )
          values[category]![subcategory] = undefined;
        if (filterArray(Object.values(values[category]!)).length === 0)
          values[category] = undefined;
      }

      this.requestSync();
    }

    this.events.trigger('update', {
      category,
      subcategory,
      item,
      definition,
    });
    return parsed;
  }

  /** Update back-end with front-end changes in a throttled manner */
  private requestSync() {
    if (this.syncPromise === undefined) {
      if (typeof this.syncTimeoutInstance === 'number')
        globalThis.clearTimeout(this.syncTimeoutInstance);
      this.syncTimeoutInstance = globalThis.setTimeout(
        (): void => void this.sync().catch(softFail),
        syncTimeout
      );
    } else {
      this.isSyncPending = true;
    }
  }

  /**
   * Send updates prefs to back-end
   */
  private async sync(): Promise<void> {
    this.isSyncPending = false;

    this.syncPromise =
      // This won't do fetch again if already fetched
      this.fetch()
        .then(async (resource) =>
          ping(
            `${this.options.values.fetchUrl}${resource.id}/`,
            {
              method: 'PUT',
              body: keysToLowerCase({
                name: this.options.values.resourceName,
                mimeType: 'application/json',
                metaData: '',
                data: JSON.stringify(this.values),
              }),
            },
            {
              expectedResponseCodes: [Http.NO_CONTENT],
            }
          )
        )
        .then(() => {
          this.syncPromise = undefined;
          // If there were additional changes while syncing
          if (this.isSyncPending) this.sync().catch(softFail);
        });
    return this.syncPromise;
  }

  /**
   * Wait for preferences to be synchronized (if needed)
   */
  public async awaitSynced(): Promise<void> {
    if (typeof this.syncTimeoutInstance === 'number') {
      globalThis.clearTimeout(this.syncTimeoutInstance);
      this.syncTimeoutInstance = undefined;
      return this.sync();
    }

    return this.syncPromise;
  }

  /**
   * React Hook to listen to preferences changes
   * (this allows to change UI preferences without restarting the application)
   */
  public use<
    CATEGORY extends string & keyof DEFINITIONS,
    SUBCATEGORY extends CATEGORY extends keyof DEFINITIONS
      ? string & keyof DEFINITIONS[CATEGORY]['subCategories']
      : never,
    ITEM extends string &
      keyof DEFINITIONS[CATEGORY]['subCategories'][SUBCATEGORY]['items']
  >(
    category: CATEGORY,
    subcategory: SUBCATEGORY,
    item: ITEM
  ): GetOrSet<
    DEFINITIONS[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue']
  > {
    const preferences = React.useContext(this.Context) ?? this;

    const [localValue, setLocalValue] = React.useState<
      DEFINITIONS[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue']
    >(() => preferences.get(category, subcategory, item));

    React.useEffect(
      () =>
        preferences.events.on('update', (payload) => {
          if (
            // Don't ignore cases when preferences are reloaded from back-end
            payload === undefined ||
            // But ignore local changes to other prefs
            (payload.category === category &&
              payload.subcategory === subcategory &&
              payload.item === item)
          )
            setLocalValue(preferences.get(category, subcategory, item));
        }),
      [category, subcategory, item, preferences]
    );

    const updatePref = React.useCallback(
      (
        newPref:
          | DEFINITIONS[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue']
          | ((
              oldPref: DEFINITIONS[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue']
            ) => DEFINITIONS[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue'])
      ): void => {
        const oldValue = preferences.get(category, subcategory, item);
        const newValueRaw =
          typeof newPref === 'function'
            ? (
                newPref as (
                  oldPref: DEFINITIONS[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue']
                ) => DEFINITIONS[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue']
              )(oldValue)
            : newPref;

        setLocalValue(
          preferences.set(category, subcategory, item, newValueRaw)
        );
      },
      [category, subcategory, item, preferences]
    );

    return [localValue, updatePref] as const;
  }
}

/* eslint-enable functional/no-this-expression */

// Sync with back-end at most every 5s
const syncTimeout = 5 * MILLISECONDS;
const mimeType = 'application/json';

/**
 * Fetch ID of app resource containing preferences
 */
const fetchResourceId = async (
  fetchUrl: string,
  resourceName: string
): Promise<number | undefined> =>
  ajax<RA<UserResource>>(cachableUrl(fetchUrl), {
    headers: { Accept: mimeType },
  }).then(
    ({ data }) =>
      data.find(
        ({ name, mimetype }) => name === resourceName && mimetype === mimeType
      )?.id
  );

/**
 * Fetch contents of a given app resource
 */
const fetchResourceData = async (
  fetchUrl: string,
  appResourceId: number
): Promise<ResourceWithData> =>
  ajax<ResourceWithData>(cachableUrl(`${fetchUrl}${appResourceId}/`), {
    headers: { Accept: mimeType },
  }).then(({ data }) => data);

/**
 * Fetch default values overrides, if exist
 */
const fetchDefaultResourceData = async (
  fetchUrl: string,
  defaultResourceName: string
): Promise<ResourceWithData> =>
  ajax(
    formatUrl(fetchUrl, {
      name: defaultResourceName,
      quiet: '',
    }),
    {
      headers: { Accept: 'text/plain' },
    },
    {
      expectedResponseCodes: [Http.NO_CONTENT, Http.OK],
      strict: false,
    }
  )
    .then(({ data, status }) => (status === Http.OK ? JSON.parse(data) : {}))
    .catch((error) => {
      softFail(error);
      return {};
    });

/**
 * Create app resource to hold preferences if it doesn't yet exist
 */
const createResource = async (
  fetchUrl: string,
  resourceName: string
): Promise<ResourceWithData> =>
  ajax<ResourceWithData>(
    fetchUrl,
    {
      headers: { Accept: mimeType },
      method: 'POST',
      body: keysToLowerCase({
        name: resourceName,
        mimeType,
        metaData: '',
        data: '{}',
      }),
    },
    { expectedResponseCodes: [Http.CREATED] }
  ).then(({ data }) => data);

type UserResource = {
  readonly id: number;
  readonly metadata: string | null;
  readonly name: string;
  readonly mimetype: string | null;
};

type ResourceWithData = UserResource & {
  readonly data: string;
};

/**
 * Represents a JSON structure that is actually storing the preferences
 */
// eslint-disable-next-line functional/prefer-readonly-type
export type PartialPreferences<DEFINITIONS extends GenericPreferences> = {
  // eslint-disable-next-line functional/prefer-readonly-type
  [CATEGORY in string & keyof DEFINITIONS]?: {
    // eslint-disable-next-line functional/prefer-readonly-type
    [SUBCATEGORY in string & keyof DEFINITIONS[CATEGORY]['subCategories']]?: {
      [ITEM in string &
        keyof DEFINITIONS[CATEGORY]['subCategories'][SUBCATEGORY]['items']]?: DEFINITIONS[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue'];
    };
  };
};
