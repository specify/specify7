import '../../css/lifemapper.css';

import React from 'react';

import { ignoredAggregators } from '../lifemapperconfig';
import { prepareLifemapperProjectionMap } from '../lifemappermap';
import { reducer } from '../lifemapperreducer';
import {
  fetchLocalScientificName,
  formatNameDataRequest,
  formatOccurrenceDataRequest,
} from '../lifemapperutills';
import lifemapperText from '../localization/lifemapper';
import type { LoadingState } from './lifemapperstate';
import { stateReducer } from './lifemapperstate';
import type { ComponentProps } from './lifemapperwrapper';
import type { IR, RA } from './wbplanview';

type AggregatorResponseBase = {
  readonly provider: {
    readonly code: string;
    readonly label: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
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
      // eslint-disable-next-line @typescript-eslint/naming-convention
      readonly 's2n:view_url': string;
    }
  ];
};

export function Lifemapper({
  model,
  guid,
}: ComponentProps): JSX.Element | null {
  const [state, dispatch] = React.useReducer(reducer, {
    type: 'LoadingState',
  } as LoadingState);

  // Fetch occurrence data
  React.useEffect(() => {
    if (typeof guid === 'undefined') return;

    const HTTP_OK = 200;
    fetch(formatOccurrenceDataRequest(guid), {
      mode: 'cors',
    })
      .then(async (response) => response.json())
      .then(
        (response: {
          readonly records: RA<
            AggregatorResponseWithoutData | AggregatorResponseWithData
          >;
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
                        provider.status_code === HTTP_OK &&
                        typeof records[0] !== 'undefined',
                    },
                    aggregator:
                      provider.status_code === HTTP_OK &&
                      typeof records[0] !== 'undefined'
                        ? {
                            issues: records[0]['s2n:issues'],
                            occurrenceName: records[0]['dwc:scientificName'],
                            occurrenceViewLink: records[0]['s2n:view_url'],
                          }
                        : undefined,
                  },
                ])
            ),
          })
      )
      .catch((error) => {
        console.error(error);
        dispatch({ type: 'LoadedAction', occurrenceData: {} });
      });
  }, [guid]);

  // Fetch occurrence name
  const aggregators =
    state.type === 'MainState' ? state.aggregators : undefined;
  React.useEffect(() => {
    if (state.type !== 'MainState' || typeof aggregators === 'undefined')
      return;

    const remoteOccurrence =
      Object.values(aggregators)
        .filter((aggregatorInfo) => aggregatorInfo)
        .map((aggregatorInfo) => aggregatorInfo?.occurrenceName)
        .find((occurrenceName) => occurrenceName) ?? '';

    new Promise<string>((resolve) => {
      resolve(
        remoteOccurrence === ''
          ? fetchLocalScientificName(model).then(async (localOccurrence) =>
              fetch(formatNameDataRequest(localOccurrence), {
                mode: 'cors',
              })
                .then(async (response) => response.json())
                .then(
                  (response: {
                    readonly records: RA<{ readonly count: number }>;
                  }) =>
                    response.records.some(({ count }) => count !== 0)
                      ? localOccurrence
                      : ''
                )
            )
          : remoteOccurrence
      );
    })
      .catch((error) => {
        console.error(error);
        return '';
      })
      .then((occurrenceName) =>
        dispatch({
          type: 'SetOccurrenceNameAction',
          occurrenceName,
        })
      )
      .catch(console.error);
  }, [state.type, aggregators, model]);

  /*
   * Fetch related CO records
   * Fetch projection map
   */
  const isOpen =
    state.type === 'MainState' ? state.badges.lm.isOpen : undefined;
  const mapInfo = state.type === 'MainState' ? state.mapInfo : undefined;
  const occurrenceName =
    state.type === 'MainState' ? state.occurrenceName : undefined;
  React.useEffect(() => {
    if (
      !Boolean(isOpen) ||
      typeof occurrenceName === 'undefined' ||
      typeof mapInfo === 'object'
    )
      return;

    if (!occurrenceName) {
      dispatch({ type: 'DisableBadgeAction', badgeName: 'lm' });
      dispatch({
        type: 'MapLoadedAction',
        mapInfo: `
          <h2>${lifemapperText('errorsOccurred')}</h2><br>
          ${lifemapperText('noMap')}`,
      });
      return;
    }

    prepareLifemapperProjectionMap(occurrenceName, model)
      .then((mapInfo) =>
        dispatch({
          type: 'MapLoadedAction',
          mapInfo:
            mapInfo.layers.length === 0 && mapInfo.markers.length === 0
              ? `<h2>${lifemapperText('errorsOccurred')}</h2>
                </br>
                ${
                  Object.keys(mapInfo.messages.errorDetails).length === 0
                    ? Object.values(mapInfo.messages.errorDetails).join('<br>')
                    : lifemapperText('noMap')
                }`
              : mapInfo,
        })
      )
      .catch(() => dispatch({ type: 'DisableBadgeAction', badgeName: 'lm' }));
  }, [occurrenceName, mapInfo, isOpen, model]);

  // eslint-disable-next-line unicorn/no-null
  return stateReducer(null, {
    ...state,
    params: {
      dispatch,
      guid,
    },
  });
}
