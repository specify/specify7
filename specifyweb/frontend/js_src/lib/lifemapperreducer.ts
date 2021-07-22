import type { Action } from 'typesafe-reducer';
import { generateReducer } from 'typesafe-reducer';

import type { MainState, States } from './components/lifemapperstate';
import { mainState } from './components/lifemapperstate';
import type { IR, RA, RR } from './components/wbplanview';
import type { LayerConfig, MarkerGroups } from './leaflet';
import type { MessageTypes } from './lifemapperconfig';
import { SN_SERVICES } from './lifemapperconfig';
import commonText from './localization/common';

type LoadedAction = Action<
  'LoadedAction',
  {
    occurrenceData: IR<{
      readonly badge: MainState['badges'][string];
      readonly aggregator: MainState['aggregators'][string] | undefined;
    }>;
  }
>;

type ToggleBadgeAction = Action<
  'ToggleBadgeAction',
  {
    badgeName: string;
  }
>;

type DisableBadgeAction = Action<
  'DisableBadgeAction',
  {
    badgeName: string;
  }
>;

type SetOccurrenceNameAction = Action<
  'SetOccurrenceNameAction',
  {
    occurrenceName: string;
  }
>;

type SetSpeciesViewLinksAction = Action<
  'SetSpeciesViewLinksAction',
  {
    speciesViewLinks: IR<string>;
  }
>;

export type MapInfo = {
  readonly layers: RA<LayerConfig>;
  readonly markers: RA<MarkerGroups>;
  readonly messages: RR<MessageTypes, IR<string>>;
};

type MapLoadedAction = Action<'MapLoadedAction', { mapInfo: MapInfo | string }>;

export type Actions =
  | LoadedAction
  | ToggleBadgeAction
  | DisableBadgeAction
  | MapLoadedAction
  | SetOccurrenceNameAction
  | SetSpeciesViewLinksAction;

export const reducer = generateReducer<States, Actions>({
  LoadedAction: ({ action }) => ({
    type: 'MainState',
    badges: Object.fromEntries([
      ...Object.entries(action.occurrenceData).map(([name, { badge }]) => [
        name,
        badge,
      ]),
      ...Object.entries(SN_SERVICES).map(([name, label]) => [
        name,
        {
          label,
          isOpen: false,
          isActive: true,
        },
      ]),
    ]),
    aggregators: Object.fromEntries(
      Object.entries(action.occurrenceData)
        .filter(([_name, { aggregator }]) => typeof aggregator !== 'undefined')
        .map(([name, { aggregator }]) => [name, aggregator!])
    ),
    occurrenceName: undefined,
    mapInfo: commonText('loading'),
  }),
  DisableBadgeAction: ({ action, state }) => ({
    ...mainState(state),
    badges: {
      ...mainState(state).badges,
      [action.badgeName]: {
        ...mainState(state).badges[action.badgeName],
        isActive: false,
      },
    },
  }),
  ToggleBadgeAction: ({ action, state }) => ({
    ...mainState(state),
    badges: {
      ...mainState(state).badges,
      [action.badgeName]: {
        ...mainState(state).badges[action.badgeName],
        isOpen: !mainState(state).badges[action.badgeName].isOpen,
      },
    },
  }),
  MapLoadedAction: ({ action: { type: _, mapInfo }, state }) => ({
    ...mainState(state),
    mapInfo,
  }),
  SetOccurrenceNameAction: ({ action: { occurrenceName }, state }) => ({
    ...mainState(state),
    occurrenceName,
  }),
  SetSpeciesViewLinksAction: ({ action: { speciesViewLinks }, state }) => ({
    ...mainState(state),
    aggregators: Object.fromEntries(
      Object.entries(mainState(state).aggregators).map(
        ([aggregator, aggregatorData]) => [
          aggregator,
          {
            ...aggregatorData,
            ...(aggregator in speciesViewLinks
              ? {
                  speciesViewLink: speciesViewLinks[aggregator],
                }
              : {}),
          },
        ]
      )
    ),
  }),
});
