import React from 'react';
import type { State } from 'typesafe-reducer';
import { generateReducer } from 'typesafe-reducer';

import { SN_SERVICES } from '../lifemapperconfig';
import type { Actions, MapInfo } from '../lifemapperreducer';
import type { IR } from '../types';
import { Badge, LifemapperMap } from './lifemappercomponents';
import { ModalDialog } from './modaldialog';

export type MainState = State<
  'MainState',
  {
    badges: IR<{
      readonly label: string;
      readonly isOpen: boolean;
      readonly isActive: boolean;
    }>;
    occurrenceName?: string;
    mapInfo: string | MapInfo;
  }
>;

export type States = MainState;

type StateWithParameters = States & {
  params: {
    dispatch: (action: Actions) => void;
  };
};

export const stateReducer = generateReducer<
  JSX.Element | null,
  StateWithParameters
>({
  MainState({
    action: {
      params: { dispatch },
      ...state
    },
  }): JSX.Element {
    return (
      <>
        {Object.entries(state.badges)
          .map(([name, badge]) => ({
            name,
            badge,
          }))
          .filter(({ name }) => name in SN_SERVICES)
          .map(({ name, badge }) => (
            <Badge
              name={name}
              title={badge.label}
              key={name}
              isEnabled={badge.isActive}
              onClick={(): void =>
                dispatch({
                  type: 'ToggleBadgeAction',
                  badgeName: name,
                })
              }
            />
          ))}
        {Object.entries(state.badges)
          .filter(([, { isOpen }]) => isOpen)
          .map(([badgeName, { label }]) => (
            <ModalDialog
              key={badgeName}
              properties={{
                title: label,
                modal: false,
                close: (): void =>
                  dispatch({
                    type: 'ToggleBadgeAction',
                    badgeName,
                  }),
                width: 950,
                height: 650,
              }}
            >
              {typeof state.mapInfo === 'string' ? (
                <p role="alert">{state.mapInfo}</p>
              ) : (
                <LifemapperMap mapInfo={state.mapInfo} />
              )}
            </ModalDialog>
          ))}
      </>
    );
  },
});
