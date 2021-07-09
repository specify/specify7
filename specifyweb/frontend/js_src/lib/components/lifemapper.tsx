import '../../css/lifemapper.css';

import React from 'react';

import {
  ignoredAggregators,
  resolveGuid,
  resolveOccurrenceNames,
} from '../lifemapperconfig';
import { prepareLifemapperProjectionMap } from '../lifemappermap';
import { reducer } from '../lifemapperreducer';
import {
  extractElement,
  fetchLocalScientificName,
  formatOccurrenceDataRequest,
} from '../lifemapperutills';
import { stateReducer } from './lifemapperstate';
import type { ComponentProps } from './lifemapperwrapper';
import type { IR } from './wbplanview';
import type { LoadingState } from './wbplanviewstate';

type AggregatorResponseBase = {
  readonly provider: {
    readonly code: string;
    readonly label: string;
    readonly status_code: number;
  };
};

type AggregatorResponseWithoutData = AggregatorResponseBase & {
  readonly records: [];
};

type AggregatorResponseWithData = AggregatorResponseBase & {
  readonly records: [
    {
      readonly 's2n:issues'?: IR<string>;
      readonly 'dwc:scientificName': string;
      readonly 's2n:view_url': string;
    }
  ];
};

export function Lifemapper({
  model,
  guid: originalGuid,
  handleOccurrenceNameFetch,
}: ComponentProps & {
  readonly handleOccurrenceNameFetch: (occurrenceName: string) => void;
}): JSX.Element {
  const guid = resolveGuid(originalGuid);

  const [state, dispatch] = React.useReducer(reducer, {
    type: 'LoadingState',
  } as LoadingState);

  // Fetch occurrence data
  React.useEffect(() => {
    if (typeof guid === 'undefined') return;

    fetch(formatOccurrenceDataRequest(guid), {
      mode: 'cors',
    })
      .then(async (response) => response.json())
      .then(
        (response: {
          readonly records: (
            | AggregatorResponseWithoutData
            | AggregatorResponseWithData
          )[];
        }) =>
          dispatch({
            type: 'LoadedAction',
            occurrenceData: Object.fromEntries(
              response.records
                .filter(
                  ({ provider }) => !ignoredAggregators.includes(provider.code)
                )
                .map(({ provider, records }) => [
                  provider.code,
                  {
                    badge: {
                      label: provider.label,
                      isOpen: false,
                      isActive:
                        provider.status_code === 200 &&
                        typeof records[0] !== 'undefined',
                    },
                    aggregator:
                      provider.status_code === 200 &&
                      typeof records[0] !== 'undefined'
                        ? {
                            issues: records[0]['s2n:issues'] ?? {},
                            occurrenceName: records[0]['dwc:scientificName'],
                            occurrenceViewLink: records[0]['s2n:view_url'],
                          }
                        : undefined,
                  },
                ])
            ),
          })
      );
  }, []);

  // Set remoteOccurrenceName
  React.useEffect(() => {
    if (
      state.type !== 'MainState' ||
      typeof state.localOccurrenceName !== 'undefined'
    )
      return;

    const occurrenceName =
      Object.values(state.aggregators)
        .filter((aggregatorInfo) => aggregatorInfo)
        .map((aggregatorInfo) => aggregatorInfo?.occurrenceName)
        .find((occurrenceName) => occurrenceName) ?? '';

    dispatch({
      type: 'SetRemoteOccurrenceNameAction',
      remoteOccurrenceName: resolveOccurrenceNames(['', occurrenceName])[1],
    });

    handleOccurrenceNameFetch(
      extractElement([state.localOccurrenceName, occurrenceName], 1)
    );
  }, [
    state.type,
    state.type === 'MainState' ? state.localOccurrenceName : undefined,
  ]);

  // Set localOccurrenceName
  React.useEffect(() => {
    if (
      state.type !== 'MainState' ||
      typeof state.localOccurrenceName !== 'undefined'
    )
      return;
    void fetchLocalScientificName(model).then((localOccurrenceName) => {
      dispatch({
        type: 'SetLocalOccurrenceNameAction',
        localOccurrenceName: resolveOccurrenceNames([
          localOccurrenceName,
          '',
        ])[0],
      });
      if (typeof state.remoteOccurrenceName === 'undefined')
        handleOccurrenceNameFetch(localOccurrenceName);
    });
  }, [
    state.type,
    state.type === 'MainState' ? state.remoteOccurrenceName : undefined,
    state.type === 'MainState' ? state.localOccurrenceName : undefined,
  ]);

  /*
   * Fetch related CO records
   * Fetch projection map
   */
  React.useEffect(
    () => {
      if (
        state.type !== 'MainState' ||
        !state.badges.lm.isOpen ||
        typeof state.remoteOccurrenceName === 'undefined' ||
        typeof state.localOccurrenceName === 'undefined' ||
        typeof state.lifemapper !== 'undefined'
      )
        return;

      const getOccurrenceName = (index: 0 | 1): string =>
        extractElement(
          [state.localOccurrenceName, state.remoteOccurrenceName],
          index
        );
      if (!getOccurrenceName(1)) return;

      prepareLifemapperProjectionMap(getOccurrenceName, model).then(
        (lifemapper) =>
          dispatch({
            type: 'MapLoadedAction',
            ...lifemapper,
          })
      );
    },
    state.type === 'MainState'
      ? [
          state.localOccurrenceName,
          state.remoteOccurrenceName,
          state.badges.lm.isOpen,
          state.lifemapper,
        ]
      : [undefined, undefined, undefined, undefined]
  );

  return stateReducer(<></>, {
    ...state,
    params: {
      dispatch,
      guid,
    },
  });
}
