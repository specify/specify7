import React from 'react';
import { Actions, LifemapperInfo } from '../lifemapperinforeducer';
import {
  AGGREGATOR_NAMES,
  AggregatorName,
  BadgeName,
  FullAggregatorInfo,
  sourceLabels,
} from '../lifemapperinfoutills';
import { generateReducer, State } from '../statemanagement';
import { Aggregator, Badge, LifemapperMap } from './lifemappercomponents';
import { ModalDialog } from './modaldialog';

type LoadingState = State<'LoadingState'>;

export type MainState = State<'MainState'> & {
  aggregatorInfos: Record<AggregatorName, FullAggregatorInfo | undefined>;
  badgeStatuses: Record<
    BadgeName,
    {
      isOpen: boolean;
    }
  >;
  localOccurrenceName?: string;
  remoteOccurrenceName?: string;
  lifemapperInfo?: LifemapperInfo;
};

export type States = LoadingState | MainState;

export function mainState(state: States): MainState {
  if (state.type !== 'MainState') throw new Error('Wrong state');
  return state;
}

type StateWithParams = States & {
  params: {
    dispatch: (action: Actions) => void;
  };
};

export const stateReducer = generateReducer<JSX.Element, StateWithParams>({
  LoadingState: () => <></>,
  MainState: ({
    action: {
      params: { dispatch },
      ...state
    },
  }) => (
    <>
      {Object.entries(state.aggregatorInfos).map(([name, data]) => (
        <Badge
          name={name}
          key={name}
          isEnabled={typeof data !== 'undefined'}
          hasError={
            typeof data !== 'undefined' &&
            (data.listOfIssues.length !== 0 || data.count > 1)
          }
          onClick={
            typeof data === 'undefined'
              ? undefined
              : () =>
                  dispatch({
                    type: 'ToggleAggregatorVisibilityAction',
                    badgeName: name,
                  })
          }
        />
      ))}
      <Badge
        name={'lifemapper'}
        isEnabled={true}
        hasError={false}
        onClick={() =>
          dispatch({
            type: 'ToggleAggregatorVisibilityAction',
            badgeName: 'lifemapper',
          })
        }
      />
      {Object.entries(state.badgeStatuses)
        .filter(([, { isOpen }]) => isOpen)
        .map(([badgeName]) => ({
          badgeName,
          isAggregator: AGGREGATOR_NAMES.indexOf(badgeName) !== -1,
        }))
        .map(({ badgeName, isAggregator }) => (
          <ModalDialog
            key={badgeName}
            properties={{
              title: isAggregator
                ? `Record was indexed by ${sourceLabels[badgeName]}`
                : sourceLabels[badgeName],
              close: () =>
                dispatch({
                  type: 'ToggleAggregatorVisibilityAction',
                  badgeName,
                }),
              ...(isAggregator
                ? state.aggregatorInfos[badgeName]?.occurrenceViewLink
                  ? {
                      buttons: [
                        {
                          text: `Close`,
                          click: () =>
                            dispatch({
                              type: 'ToggleAggregatorVisibilityAction',
                              badgeName,
                            }),
                        },
                        {
                          text: `View occurrence at ${sourceLabels[badgeName]}`,
                          click: () =>
                            window.open(
                              state.aggregatorInfos[badgeName]!
                                .occurrenceViewLink,
                              '_blank'
                            ),
                        },
                      ],
                      width: 400,
                    }
                  : {}
                : {
                    width: 950,
                    height: 500,
                  }),
            }}
          >
            {isAggregator ? (
              <Aggregator
                name={badgeName}
                data={state.aggregatorInfos[badgeName]!}
              />
            ) : typeof state.lifemapperInfo === 'undefined' ? (
              <p>Loading...</p>
            ) : (
              <LifemapperMap
                badgeName={badgeName}
                lifemapperInfo={state.lifemapperInfo}
              />
            )}
          </ModalDialog>
        ))}
    </>
  ),
});
