import '../../css/schemaconfig.css';

import React from 'react';

import commonText from '../localization/common';
import navigation from '../navigation';
import schema from '../schema';
import { LoadingScreen } from './modaldialog';
import createBackboneView from './reactbackboneextend';
import { SchemaConfig, SpLocaleItemStr } from './schemaconfig';
import type { IR, RA } from './wbplanview';
import { handlePromiseReject } from './wbplanview';

type ConstructorProps = IR<never>;
type Props = {
  readonly onClose: () => void;
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

export type WithDatamodelFields = {
  readonly dataModel: {
    readonly length: number | undefined;
    readonly readOnly: boolean;
    readonly relatedModelName: string | undefined;
    readonly isRequired: boolean;
    readonly canEditRequired: boolean;
  };
};

function SchemaConfigWrapper({
  onClose: handleClose,
  removeUnloadProtect,
  setUnloadProtect,
}: Props): JSX.Element {
  const [languages, setLanguages] = React.useState<RA<string> | undefined>(
    undefined
  );
  const [tables, setTables] = React.useState<IR<SpLocaleContainer> | undefined>(
    undefined
  );

  // Fetch languages
  React.useEffect(() => {
    const discipline = (
      schema.domainLevelIds as unknown as { readonly discipline: number }
    ).discipline;
    fetch(
      `/api/specify/splocalecontainer/?name=collectionobject&discipline_id=${discipline}&schematype=0`
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
    const discipline = (
      schema.domainLevelIds as unknown as { readonly discipline: number }
    ).discipline;

    fetch(
      `/api/specify/splocalecontainer/?limit=0&discipline_id=${discipline}&schematype=0`
    )
      .then<{ readonly objects: RA<SpLocaleContainer> }>((response) =>
        response.json()
      )
      .then(({ objects }) => {
        if (!destructorCalled)
          setTables(
            Object.fromEntries(objects.map((table) => [table.id, table]))
          );
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
      onClose={handleClose}
      removeUnloadProtect={removeUnloadProtect}
      setUnloadProtect={setUnloadProtect}
    />
  );
}

const setUnloadProtect = (self: Props): void =>
  navigation.addUnloadProtect(self, commonText('unsavedSchemaUnloadProtect'));

const removeUnloadProtect = (self: Props): void =>
  navigation.removeUnloadProtect(self);

export default createBackboneView<ConstructorProps, Props, Props>({
  moduleName: 'SchemaConfig',
  tagName: 'section',
  title: commonText('schemaConfig'),
  className: 'schema-config content-no-shadow',
  remove(self) {
    removeUnloadProtect(self);
  },
  Component: SchemaConfigWrapper,
  getComponentProps: (self) => ({
    onClose: (): void => navigation.go('/specify/'),
    removeUnloadProtect: (): void => removeUnloadProtect(self),
    setUnloadProtect: (): void => setUnloadProtect(self),
  }),
});
