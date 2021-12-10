import '../../css/schemaconfig.css';

import React from 'react';

import commonText from '../localization/common';
import { Schema } from '../legacytypes';
import navigation from '../navigation';
import schema from '../schema';
import { tableHasOverwrite } from '../wbplanviewmodelfetcher';
import { LoadingScreen } from './modaldialog';
import createBackboneView from './reactbackboneextend';
import type { SpLocaleItemStr } from './schemaconfig';
import { SchemaConfig } from './schemaconfig';
import type { IR, RA } from './wbplanview';
import { handlePromiseReject } from './wbplanview';
import UiFormatters from '../uiformatters';

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
  readonly timestampmodified?: string;
  readonly createdbyagent: string;
  readonly modifiedbyagent?: string;
  readonly version: string;
  readonly resource_uri: string;
};

export type SpLocaleContainer = CommonTableFields & {
  readonly id: number;
  readonly aggregator?: string;
  //readonly defaultui?: string;
  readonly format?: string;
  readonly ishidden: boolean;
  readonly issystem: boolean;
  // readonly isuiformatter: null;
  readonly name: string;
  readonly picklistname?: string;
  // readonly schematype: 0 | 1;
  // readonly items: string;
  readonly descs: string;
  readonly names: string;
};

export type WithFetchedStrings = {
  readonly strings: {
    readonly desc: SpLocaleItemStr;
    readonly name: SpLocaleItemStr;
  };
};

export type WithTableInfo = {
  readonly dataModel: {
    readonly pickLists: IR<string>;
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
  const [languages, setLanguages] = React.useState<RA<string> | undefined>(
    undefined
  );
  const [tables, setTables] = React.useState<IR<SpLocaleContainer> | undefined>(
    undefined
  );

  // Fetch languages
  React.useEffect(() => {
    fetch(
      '/api/specify/splocalecontainer/?name=collectionobject&domainfilter=true&schematype=0'
    )
      .then<{ readonly objects: Readonly<[{ readonly id: number }]> }>(
        async (response) => response.json()
      )
      .then(async ({ objects: [{ id }] }) =>
        fetch(
          `http://localhost/api/specify/splocaleitemstr/?containername=${id}&limit=0`
        )
      )
      .then<{
        readonly objects: RA<{
          readonly country: string | null;
          readonly language: string;
        }>;
      }>(async (response) => response.json())
      .then(({ objects }) => {
        if (destructorCalled) return;
        const languages = objects.map(
          ({ country, language }) =>
            `${language}${country === null ? '' : `_${country}`}`
        );
        // Sometimes languages are duplicated. Need to make the list unique
        setLanguages(Array.from(new Set(languages)));
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
            system || tableHasOverwrite(tableName.toLowerCase(), 'remove')
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
      defaultLanguage={
        languages.includes(defaultLanguage ?? '') ? defaultLanguage : undefined
      }
      defaultTable={Object.values(tables).find(
        ({ name }) => name === defaultTable
      )}
      formatters={Array.from(
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
  Component: SchemaConfigWrapper,
  getComponentProps: (self) => ({
    onClose: (): void => navigation.go('/specify/'),
    onSave: (language): void =>
      navigation.go(`/specify/task/schema-config/?language=${language}`),
    removeUnloadProtect: (): void => removeUnloadProtect(self),
    setUnloadProtect: (): void => setUnloadProtect(self),
    defaultLanguage: self.defaultLanguage,
    defaultTable: self.defaultTable,
  }),
});
