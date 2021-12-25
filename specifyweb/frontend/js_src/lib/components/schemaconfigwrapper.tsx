import '../../css/schemaconfig.css';

import React from 'react';

import DataObjectFormatters from '../dataobjformatters';
import type { Schema } from '../legacytypes';
import commonText from '../localization/common';
import navigation from '../navigation';
import schema from '../schema';
import { formatAggregators } from '../schemaconfighelper';
import UiFormatters from '../uiformatters';
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
import type { IR, RA } from './wbplanview';
import { handlePromiseReject } from './wbplanview';

type ConstructorProps = IR<never>;
type BackboneProps = {
  defaultLanguage: string | undefined;
  defaultTable: string | undefined;
};
type Props = Readonly<BackboneProps> & {
  readonly onClose: () => void;
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
    fetch('/context/schema/language/')
      .then<{
        readonly data: RA<{
          readonly country: string | null;
          readonly language: string;
        }>;
      }>(async (response) => response.json())
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
        Promise.all(
          languages.map(async (language) =>
            fetch(`/context/language/${language.replace('_', '-')}/`)
              .then<
                { readonly data: { readonly name_local: string } } | undefined
              >(async (response) =>
                response.status === 200 ? response.json() : undefined
              )
              .then((response) => [
                language,
                typeof response === 'undefined'
                  ? language
                  : `${response.data.name_local}${
                      language.split('_')[1]
                        ? ` (${language.split('_')[1]})`
                        : ''
                    }`,
              ])
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
      Object.entries((schema as unknown as Schema).models)
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
      dataObjFormatters={formatAggregators(
        DataObjectFormatters.getFormatters() as RA<Element>
      )}
      dataObjAggregators={formatAggregators(
        DataObjectFormatters.getAggregators() as RA<Element>
      )}
      onClose={handleClose}
      onSave={handleSave}
      removeUnloadProtect={removeUnloadProtect}
      setUnloadProtect={setUnloadProtect}
    />
  );
}

const setUnloadProtect = (self: BackboneProps): void =>
  navigation.addUnloadProtect(self, commonText('unsavedSchemaUnloadProtect'));

const removeUnloadProtect = (self: BackboneProps): void =>
  navigation.removeUnloadProtect(self);

export default createBackboneView<ConstructorProps, BackboneProps, Props>({
  moduleName: 'SchemaConfig',
  tagName: 'section',
  title: commonText('schemaConfig'),
  className: 'schema-config content',
  initialize(self) {
    const urlSearchParameters = new URLSearchParams(window.location.search);
    const parameters = Object.fromEntries(urlSearchParameters.entries());
    self.defaultLanguage = parameters.language;
    self.defaultTable = parameters.table;
  },
  remove(self) {
    removeUnloadProtect(self);
  },
  component: SchemaConfigWrapper,
  getComponentProps: (self) => ({
    onClose: (): void => navigation.go('/specify/'),
    onSave: (language): void => {
      // Reload the page after schema changes
      window.location.href = `/specify/task/schema-config/?language=${language}`;
    },
    removeUnloadProtect: (): void => removeUnloadProtect(self),
    setUnloadProtect: (): void => setUnloadProtect(self),
    defaultLanguage: self.defaultLanguage,
    defaultTable: self.defaultTable,
  }),
});
