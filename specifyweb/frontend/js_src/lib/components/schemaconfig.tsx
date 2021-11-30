import React from 'react';

import { reducer } from '../schemaconfigreducer';
import { stateReducer } from './schemaconfigstate';
import type { RA } from './wbplanview';

export function SchemaConfig({
  languages,
  removeUnloadProtect: _,
  setUnloadProtect: __,
}: {
  readonly languages: RA<string>;
  readonly removeUnloadProtect: () => void;
  readonly setUnloadProtect: () => void;
}): JSX.Element {
  const [state, dispatch] = React.useReducer(reducer, {
    type: 'DialogState',
  });

  return stateReducer(<i />, {
    ...state,
    parameters: {
      languages,
      dispatch,
    },
  });
}
