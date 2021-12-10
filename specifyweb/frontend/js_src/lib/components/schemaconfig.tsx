import React from 'react';

import type { Schema } from '../legacytypes';
import schema from '../schema';
import { fetchStrings } from '../schemaconfighelper';
import { reducer } from '../schemaconfigreducer';
import { useId } from './common';
import { stateReducer } from './schemaconfigstate';
import type {
  CommonTableFields,
  SpLocaleContainer,
} from './schemaconfigwrapper';
import type { IR, RA } from './wbplanview';
import { handlePromiseReject } from './wbplanview';

export type SpLocaleItem = CommonTableFields & {
  readonly id: number;
  readonly format: null;
  readonly ishidden: boolean;
  readonly isrequired: boolean;
  readonly issystem: boolean;
  readonly isuiformatter: boolean;
  readonly name: string;
  readonly picklistname?: string;
  readonly type: null;
  readonly weblinkname: null;
  /*
   * Readonly container: string;
   * readonly spexportschemaitems: string;
   */
  readonly descs: string;
  readonly names: string;
};

export type SpLocaleItemStr = CommonTableFields & {
  readonly id: number;
  readonly country?: string;
  readonly language: string;
  readonly text: string;
  /*
   * Readonly variant: null;
   * readonly containerdesc?: string;
   * readonly contaninername?: string;
   * readonly itemdesc?: string;
   * readonly itemname?: string;
   */
};

export function SchemaConfig({
  languages,
  tables,
  onClose: handleClose,
  removeUnloadProtect,
  setUnloadProtect,
}: {
  readonly languages: RA<string>;
  readonly tables: IR<SpLocaleContainer>;
  readonly onClose: () => void;
  readonly removeUnloadProtect: () => void;
  readonly setUnloadProtect: () => void;
}): JSX.Element {
  const [state, dispatch] = React.useReducer(reducer, {
    type: 'ChooseLanguageState',
  });

  const id = useId('schema-config');

  // Fetch table items after table is selected
  const tableId = 'table' in state ? state.table.id : undefined;
  React.useEffect(() => {
    if (
      state.type !== 'FetchingTableItemsState' ||
      typeof tableId === 'undefined'
    )
      return undefined;

    const [language, country] = state.language.split('_');

    const fields = Object.fromEntries(
      Object.values((schema as unknown as Schema).models)
        .find(({name}) => name.toLowerCase() === state.table.name)
        ?.fields.map((field) => [
          field.name,
          {
            length: field.length,
            readOnly: field.readOnly,
            relatedModelName:
              'relatedModelName' in field ? field.relatedModelName : undefined,
            isRequired: field.isRequired,
            canEditRequired: !field.isRequired && !field.isRelationship,
          },
        ]) ?? []
    );

    if (Object.keys(fields).length === 0)
      throw new Error('Unable to find table fields');

    Promise.all([
      fetch(
        `/api/specify/splocalecontaineritem/?limit=0&container_id=${tableId}`
      )
        .then<{ readonly objects: RA<SpLocaleItem> }>(async (response) =>
          response.json()
        )
        .then(({ objects }) =>
          destructorCalled ? [] : fetchStrings(objects, language, country)
        )
        .then((items) =>
          items.map((item) => ({
            ...item,
            dataModel: fields[item.name] ?? {
              // This happened for "deaccession" in my db
              length: undefined,
              readOnly: false,
              relatedModelName: undefined,
            },
          }))
        ),
      fetchStrings([state.table], language, country),
    ])
      .then(([items, [table]]) => {
        if (destructorCalled) return;
        dispatch({
          type: 'FetchedTableStringsAction',
          items: Object.fromEntries(items.map((item) => [item.id, item])),
          table,
        });
      })
      .catch(handlePromiseReject);

    let destructorCalled = false;
    return (): void => {
      destructorCalled = true;
    };
  }, [state.type, tableId]);

  // Set unload protect after changes were made
  const changesMade =
    state.type === 'MainState'
      ? state.tableWasModified || state.modifiedItems.length > 0
      : false;
  React.useEffect(() => {
    if (changesMade) setUnloadProtect();
    return removeUnloadProtect;
  }, [changesMade]);

  // Save Changes
  React.useEffect(() => {
    if (state.type !== 'SavingState') return;
    removeUnloadProtect();
    // TODO: save changes
    console.log(state);
    alert('Saving');
  }, [state.type]);

  return stateReducer(<i />, {
    ...state,
    parameters: {
      languages,
      tables,
      dispatch,
      id,
      handleClose,
    },
  });
}
