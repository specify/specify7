import React from 'react';
import type { State } from 'typesafe-reducer';
import { generateReducer } from 'typesafe-reducer';

import { SN_SERVICES } from '../lifemapperconfig';
import type { Actions, MapInfo } from '../lifemapperreducer';
import { formatLifemapperViewPageRequest } from '../lifemapperutills';
import commonText from '../localization/common';
import lifemapperText from '../localization/lifemapper';
import { Aggregator, Badge, LifemapperMap } from './lifemappercomponents';
import { closeDialog, ModalDialog } from './modaldialog';
import type { IR } from './wbplanview';

export type LoadingState = State<'LoadingState'>;

export type MainState = State<
  'MainState',
  {
    badges: IR<{
      readonly label: string;
      readonly isOpen: boolean;
      readonly isActive: boolean;
    }>;
    aggregators: IR<{
      readonly issues: IR<string>;
      readonly occurrenceName: string;
      readonly occurrenceViewLink: string;
    }>;
    occurrenceName?: string;
    mapInfo: string | MapInfo;
  }
>;

export type States = LoadingState | MainState;

export function mainState(state: States): MainState {
  if (state.type !== 'MainState') throw new Error('Wrong state');
  return state;
}

type StateWithParameters = States & {
  params: {
    dispatch: (action: Actions) => void;
    guid: string;
  };
};

export const stateReducer = generateReducer<
  JSX.Element | null,
  StateWithParameters
>({
  // eslint-disable-next-line unicorn/no-null
  LoadingState: () => null,
  MainState({
    action: {
      params: { dispatch, guid },
      ...state
    },
  }): JSX.Element {
    return (
      <>
        {Object.entries(state.badges)
          .map(([name, badge]) => ({
            name,
            badge,
            aggregator: state.aggregators[name],
          }))
          .map(({ name, badge, aggregator }) =>
            name in SN_SERVICES &&
            !Boolean(state.occurrenceName) ? undefined : (
              <Badge
                name={name}
                title={badge.label}
                key={name}
                isEnabled={badge.isActive}
                hasError={
                  typeof aggregator !== 'undefined' &&
                  Object.keys(aggregator.issues).length > 0
                }
                onClick={(): void =>
                  name === 'specify'
                    ? void window.open(
                        formatLifemapperViewPageRequest(
                          guid,
                          state.occurrenceName ?? '',
                          ''
                        ),
                        '_blank'
                      )
                    : dispatch({
                        type: 'ToggleBadgeAction',
                        badgeName: name,
                      })
                }
              />
            )
          )}
        {Object.entries(state.badges)
          .filter(([, { isOpen }]) => isOpen)
          .map(([badgeName, { label }]) => (
            <ModalDialog
              key={badgeName}
              properties={{
                title:
                  typeof state.aggregators[badgeName] === 'undefined'
                    ? label
                    : lifemapperText('aggregatorBadgeTitle')(label),
                modal: false,
                close: (): void =>
                  dispatch({
                    type: 'ToggleBadgeAction',
                    badgeName,
                  }),
                ...(typeof state.aggregators[badgeName] === 'undefined'
                  ? {
                      width: 950,
                      height: 600,
                    }
                  : state.aggregators[badgeName]?.occurrenceViewLink
                  ? {
                      buttons: [
                        {
                          text: commonText('close'),
                          click: closeDialog,
                        },
                        {
                          text: lifemapperText('moreDetails'),
                          click: (): void =>
                            void window.open(
                              formatLifemapperViewPageRequest(
                                guid,
                                state.occurrenceName ?? '',
                                badgeName
                              ),
                              '_blank'
                            ),
                        },
                        {
                          text: lifemapperText('viewOccurrenceAt')(label),
                          click: (): void =>
                            void window.open(
                              state.aggregators[badgeName].occurrenceViewLink,
                              '_blank'
                            ),
                        },
                      ],
                      width: 400,
                    }
                  : {}),
              }}
            >
              {typeof state.aggregators[badgeName] === 'undefined' ? (
                typeof state.mapInfo === 'string' ? (
                  <p>{state.mapInfo}</p>
                ) : (
                  <LifemapperMap mapInfo={state.mapInfo} />
                )
              ) : (
                <Aggregator data={state.aggregators[badgeName]} />
              )}
            </ModalDialog>
          ))}
      </>
    );
  },
});
