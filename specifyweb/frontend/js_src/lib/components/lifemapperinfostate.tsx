import React from 'react';
import type { State } from 'typesafe-reducer';
import { generateReducer } from 'typesafe-reducer';

import type { Actions, LifemapperInfo } from '../lifemapperinforeducer';
import {
  extractElement,
  formatLifemapperViewPageRequest,
} from '../lifemapperinfoutills';
import commonText from '../localization/common';
import lifemapperText from '../localization/lifemapper';
import { Aggregator, Badge, LifemapperMap } from './lifemappercomponents';
import { SN_SERVICES } from './lifemapperinfo';
import { closeDialog, ModalDialog } from './modaldialog';
import type { IR } from './wbplanview';

type LoadingState = State<'LoadingState'>;

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
    localOccurrenceName?: string;
    remoteOccurrenceName?: string;
    lifemapperInfo?: LifemapperInfo;
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

export const stateReducer = generateReducer<JSX.Element, StateWithParameters>({
  LoadingState: () => <></>,
  MainState: ({
    action: {
      params: { dispatch, guid },
      ...state
    },
  }) => (
    <>
      {Object.entries(state.badges)
        .map(([name, badge]) => ({
          name,
          badge,
          aggregator: state.aggregators[name],
        }))
        .map(({ name, badge, aggregator }) => (
          <Badge
            name={name}
            title={badge.label}
            key={name}
            isEnabled={name in SN_SERVICES || typeof aggregator !== 'undefined'}
            hasError={
              typeof aggregator !== 'undefined' &&
              Object.keys(aggregator.issues).length > 0
            }
            onClick={(): void =>
              name === 'sn'
                ? void window.open(
                    formatLifemapperViewPageRequest(
                      guid,
                      extractElement(
                        [state.localOccurrenceName, state.remoteOccurrenceName],
                        1
                      ),
                      ''
                    ),
                    '_blank'
                  )
                : dispatch({
                    type: 'ToggleAggregatorVisibilityAction',
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
              title:
                typeof state.aggregators[badgeName] === 'undefined'
                  ? label
                  : lifemapperText('aggregatorBadgeTitle')(label),
              modal: false,
              close: (): void =>
                dispatch({
                  type: 'ToggleAggregatorVisibilityAction',
                  badgeName,
                }),
              ...(typeof state.aggregators[badgeName] === 'undefined'
                ? {
                    width: 950,
                    height: 500,
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
                              extractElement(
                                [
                                  state.localOccurrenceName,
                                  state.remoteOccurrenceName,
                                ],
                                1
                              ),
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
              typeof state.lifemapperInfo === 'undefined' ? (
                <p>{commonText('loading')}</p>
              ) : (
                <LifemapperMap lifemapperInfo={state.lifemapperInfo} />
              )
            ) : (
              <Aggregator data={state.aggregators[badgeName]} />
            )}
          </ModalDialog>
        ))}
    </>
  ),
});
