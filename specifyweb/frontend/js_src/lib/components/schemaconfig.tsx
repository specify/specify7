import React from 'react';
import { sortObjectsByKey } from '../schemaconfighelper';

import { reducer } from '../schemaconfigreducer';
import { useId } from './common';
import { stateReducer } from './schemaconfigstate';
import type {
  CommonTableFields,
  SpLocaleContainer,
} from './schemaconfigwrapper';
import { handlePromiseReject } from './wbplanview';
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
  removeUnloadProtect: _,
  setUnloadProtect: __,
}: {
  readonly languages: RA<string>;
  readonly tables: RA<SpLocaleContainer>;
  readonly removeUnloadProtect: () => void;
  readonly setUnloadProtect: () => void;
}): JSX.Element {
  const [state, dispatch] = React.useReducer(reducer, {
    type: 'DialogState',
  });

  const id = useId('schema-config');

  // Select first table by default
  React.useEffect(() => {
    if (state.type === 'MainState')
      dispatch({
        type: 'ChangeTableAction',
        tableId: tables[0]?.id,
      });
  }, [state.type, tables]);

  // Fetch table items on table change
  const tableId = 'tableId' in state ? state.tableId : undefined;
  React.useEffect(() => {
    if (typeof tableId === 'undefined') return undefined;
    fetch(`/api/specify/splocalecontaineritem/?limit=0&container_id=${tableId}`)
      .then<{ readonly objects: RA<SpLocaleItem> }>((response) =>
        response.json()
      )
      .then(({ objects }) => {
        if (!destructorCalled)
          dispatch({
            type: 'SetTableItemsAction',
            items: sortObjectsByKey(objects, 'name'),
          });
      })
      .catch(handlePromiseReject);

    let destructorCalled = false;
    return (): void => {
      destructorCalled = true;
    };
  }, [tableId]);

  return stateReducer(<i />, {
    ...state,
    parameters: {
      languages,
      tables,
      dispatch,
      id,
    },
  });
}
