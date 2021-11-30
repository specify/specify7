import type { Action } from 'typesafe-reducer';
import { generateReducer } from 'typesafe-reducer';

import type { States } from './components/schemaconfigstate';

type ChooseLanguageAction = Action<
  'ChooseLanguageAction',
  {
    language: string;
  }
>;

export type Actions = ChooseLanguageAction;

export const reducer = generateReducer<States, Actions>({
  ChooseLanguageAction: ({ action: { language } }) => ({
    type: 'MainState',
    language,
  }),
});
