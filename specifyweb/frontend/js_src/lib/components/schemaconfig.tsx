import React from 'react';

import { reducer } from '../schemaconfigreducer';
import { useId } from './common';
import { stateReducer } from './schemaconfigstate';
import type {
  CommonTableFields,
  SpLocaleContainer,
} from './schemaconfigwrapper';
import { handlePromiseReject, IR } from './wbplanview';
import type { RA } from './wbplanview';

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
  //readonly container: string;
  //readonly spexportschemaitems: string;
  //readonly descs: string;
  //readonly names: string;
};

export type SpLocaleItemStr = CommonTableFields & {
  readonly id: number;
  readonly country?: string;
  readonly language: string;
  readonly text: string;
  //readonly variant: null;
  //readonly containerdesc?: string;
  //readonly contaninername?: string;
  //readonly itemdesc?: string;
  //readonly itemname?: string;
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

  // Fetch table after table is selected
  const tableId = 'table' in state ? state.table.id : undefined;
  React.useEffect(() => {
    if (
      state.type !== 'FetchingTableItemsState' ||
      typeof tableId === 'undefined'
    )
      return undefined;
    fetch(`/api/specify/splocalecontaineritem/?limit=0&container_id=${tableId}`)
      .then<{ readonly objects: RA<SpLocaleItem> }>((response) =>
        response.json()
      )
      .then(({ objects }) => {
        if (!destructorCalled)
          dispatch({
            type: 'SetTableItemsAction',
            items: Object.fromEntries(objects.map((item) => [item.id, item])),
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
