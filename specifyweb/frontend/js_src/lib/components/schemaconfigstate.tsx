import React from 'react';
import type { State } from 'typesafe-reducer';
import { generateReducer } from 'typesafe-reducer';

import commonText from '../localization/common';
import type { Actions } from '../schemaconfigreducer';
import { ModalDialog } from './modaldialog';
import type { RA } from './wbplanview';

type DialogState = State<'DialogState'>;

type MainState = State<
  'MainState',
  {
    language: string;
  }
>;

export type States = DialogState | MainState;

type StateWithParameters = States & {
  readonly parameters: {
    readonly languages: RA<string>;
    readonly dispatch: (action: Actions) => void;
  };
};

export const stateReducer = generateReducer<JSX.Element, StateWithParameters>({
  DialogState({
    action: {
      parameters: { languages },
    },
  }) {
    return (
      <ModalDialog properties={{ title: commonText('schemaConfig') }}>
        {languages.join(' ')}
      </ModalDialog>
    );
  },
  MainState() {
    return <b>MainState</b>;
  },
});
