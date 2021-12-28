import '../../css/schemaconfig.css';

import React from 'react';

import { getAggregators, getFormatters } from '../dataobjformatters';
import commonText from '../localization/common';
import * as navigation from '../navigation';
import schema from '../schema';
import { formatAggregators } from '../schemaconfighelper';
import type { IR, RA } from '../types';
import * as UiFormatters from '../uiformatters';
import { fetchingParameters } from '../wbplanviewmodelconfig';
import { tableHasOverwrite } from '../wbplanviewmodelfetcher';
import { webLinksDefs } from '../weblinkbutton';
import { LoadingScreen } from './modaldialog';
import createBackboneView from './reactbackboneextend';
import type {
  NewSpLocaleItemStr as NewSpLocaleItemString,
  SpLocaleItemStr as SpLocaleItemString,
} from './schemaconfig';
import { SchemaConfig } from './schemaconfig';
import { handlePromiseReject } from './wbplanview';
import ajax from '../ajax';

type ConstructorProps = {
  readonly onClose: () => void;
};

type Props = ConstructorProps & {
  readonly defaultLanguage: string | undefined;
  readonly defaultTable: string | undefined;
  readonly onSave: (language: string) => void;
  readonly removeUnloadProtect: () => void;
  readonly setUnloadProtect: () => void;
};

export type CommonTableFields = {
  readonly timestampcreated: string;
  readonly timestampmodified: string | null;
  readonly createdbyagent: string;
  readonly modifiedbyagent: string | null;
  readonly version: string;
  readonly resource_uri: string;
};

export type SpLocaleContainer = CommonTableFields & {
  readonly id: number;
  readonly aggregator: string | null;
  // Readonly defaultui?: string;
  readonly format: string | null;
  readonly ishidden: boolean;
  readonly issystem: boolean;
  // Readonly isuiformatter: null;
  readonly name: string;
  readonly picklistname: string | null;
  /*
   * Readonly schematype: 0 | 1;
   * readonly items: string;
   */
  readonly descs: string;
  readonly names: string;
};

export type WithFetchedStrings = {
  readonly strings: {
    readonly desc: SpLocaleItemString | NewSpLocaleItemString;
    readonly name: SpLocaleItemString | NewSpLocaleItemString;
  };
};

export type WithTableInfo = {
  readonly dataModel: {
    readonly pickLists: IR<{
      readonly name: string;
      readonly isSystem: boolean;
    }>;
  };
};

export type WithFieldInfo = {
  readonly dataModel: {
    readonly length: number | undefined;
    readonly readOnly: boolean;
    readonly relatedModelName: string | undefined;
    readonly isRequired: boolean;
    readonly isRelationship: boolean;
    readonly type: string;
    readonly canChangeIsRequired: boolean;
  };
};

function SchemaConfigWrapper({
  onClose: handleClose,
  onSave: handleSave,
  removeUnloadProtect,
  setUnloadProtect,
  defaultLanguage,
  defaultTable,
}: Props): JSX.Element {
  const [languages, setLanguages] = React.useState<IR<string> | undefined>(
    undefined
  );
  const [tables, setTables] = React.useState<IR<SpLocaleContainer> | undefined>(
    undefined
  );

  // Fetch languages
  React.useEffect(() => {
    ajax<
      RA<{
        readonly country: string | null;
        readonly language: string;
      }>
    >('/context/schema/language/', { headers: { Accept: 'application/json' } })
      .then(({ data }) =>
        // Sometimes languages are duplicated. Need to make the list unique
        Array.from(
          new Set(
            data.map(
              ({ country, language }) =>
                `${language}${
                  country === null || country === '' ? '' : `_${country}`
                }`
            )
          )
        )
      )
      .then(async (languages) =>
        // Get translated language names
        Promise.all(
          languages.map(async (language) =>
            ajax<{ readonly name_local: string }>(
              `/context/language/${language.replace('_', '-')}/`,
              { headers: { Accept: 'application/json' } },
              { strict: false }
            )
              .then(({ data }) => [
                language,
                `${data.name_local}${
                  language.split('_')[1] ? ` (${language.split('_')[1]})` : ''
                }`,
              ])
              .catch(() => [language, language])
          )
        )
      )
      .then((languages) => {
        if (destructorCalled) return;
        setLanguages(Object.fromEntries(languages));
      })
      .catch(handlePromiseReject);

    let destructorCalled = false;
    return (): void => {
      destructorCalled = true;
    };
  }, []);

  // Fetch tables
  React.useEffect(() => {
    const excludedTables = new Set(
      Object.entries(schema.models)
        .filter(
          ([tableName, { system }]) =>
            system ||
            tableHasOverwrite(tableName.toLowerCase(), 'remove') ||
            (fetchingParameters.tableOverwrites[tableName] !== 'hidden' &&
              tableHasOverwrite(tableName.toLowerCase(), 'hidden'))
        )
        .map(([tableName]) => tableName.toLowerCase())
    );

    fetch(
      '/api/specify/splocalecontainer/?limit=0&domainfilter=true&schematype=0'
    )
      .then<{ readonly objects: RA<SpLocaleContainer> }>(async (response) =>
        response.json()
      )
      .then(({ objects }) =>
        // Exclude system tables
        objects.filter(({ name }) => !excludedTables.has(name))
      )
      .then((tables) =>
        // Index by ID
        Object.fromEntries(tables.map((table) => [table.id, table]))
      )
      .then((tables) => {
        if (!destructorCalled) setTables(tables);
      })
      .catch(handlePromiseReject);

    let destructorCalled = false;
    return (): void => {
      destructorCalled = true;
    };
  }, []);

  return typeof languages === 'undefined' || typeof tables === 'undefined' ? (
    <LoadingScreen />
  ) : (
    <SchemaConfig
      languages={languages}
      tables={tables}
      defaultLanguage={defaultLanguage}
      defaultTable={Object.values(tables).find(
        ({ name }) => name === defaultTable
      )}
      webLinks={Object.keys(webLinksDefs)}
      uiFormatters={Array.from(
        (UiFormatters.getAll() as Document).getElementsByTagName('format'),
        (format) => ({
          name: format.getAttribute('name') ?? '',
          isSystem: format.getAttribute('system') === 'true',
          isDefault: format.getAttribute('default') === 'true',
          value: UiFormatters.getByName(
            format.getAttribute('name') ?? ''
          )?.value() as string,
        })
      ).filter(({ value }) => value)}
      dataObjFormatters={formatAggregators(getFormatters() as RA<Element>)}
      dataObjAggregators={formatAggregators(getAggregators() as RA<Element>)}
      onClose={handleClose}
      onSave={handleSave}
      removeUnloadProtect={removeUnloadProtect}
      setUnloadProtect={setUnloadProtect}
    />
  );
}

const setUnloadProtect = (self: unknown): void =>
  navigation.addUnloadProtect(self, commonText('unsavedSchemaUnloadProtect'));

const removeUnloadProtect = (self: unknown): void =>
  navigation.removeUnloadProtect(self);

export default createBackboneView<Props, ConstructorProps>({
  moduleName: 'SchemaConfig',
  tagName: 'section',
  title: commonText('schemaConfig'),
  className: 'schema-config-container schema-config content',
  component: SchemaConfigWrapper,
  getComponentProps: (self) => {
    const urlSearchParameters = new URLSearchParams(window.location.search);
    const parameters = Object.fromEntries(urlSearchParameters.entries());
    return {
      onClose: self.options.onClose,
      onSave: (language): void => {
        removeUnloadProtect(self);
        // Reload the page after schema changes
        window.location.href = `/specify/task/schema-config/?language=${language}`;
      },
      removeUnloadProtect: (): void => removeUnloadProtect(self),
      setUnloadProtect: (): void => setUnloadProtect(self),
      defaultLanguage: parameters.language,
      defaultTable: parameters.table,
    };
  },
});
