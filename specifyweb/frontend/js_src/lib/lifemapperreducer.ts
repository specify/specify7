import type { Action } from 'typesafe-reducer';
import { generateReducer } from 'typesafe-reducer';

import type { States } from './components/lifemapperstate';
import type { LayerConfig, MarkerGroups } from './leaflet';
import type { MessageTypes } from './lifemapperconfig';
import type { IR, RA, RR } from './types';

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

export type MapInfo = {
  readonly layers: RA<LayerConfig>;
  readonly markers: RA<MarkerGroups>;
  readonly messages: RR<MessageTypes, IR<string>>;
};

type MapLoadedAction = Action<'MapLoadedAction', { mapInfo: MapInfo | string }>;

export type Actions =
  | ToggleBadgeAction
  | DisableBadgeAction
  | MapLoadedAction
  | SetOccurrenceNameAction;

export const reducer = generateReducer<States, Actions>({
  DisableBadgeAction: ({ action, state }) => ({
    ...state,
    badges: {
      ...state.badges,
      [action.badgeName]: {
        ...state.badges[action.badgeName],
        isActive: false,
      },
    },
  }),
  ToggleBadgeAction: ({ action, state }) => ({
    ...state,
    badges: {
      ...state.badges,
      [action.badgeName]: {
        ...state.badges[action.badgeName],
        isOpen: !state.badges[action.badgeName].isOpen,
      },
    },
  }),
  MapLoadedAction: ({ action: { type: _, mapInfo }, state }) => ({
    ...state,
    mapInfo,
  }),
  SetOccurrenceNameAction: ({ action: { occurrenceName }, state }) => ({
    ...state,
    occurrenceName,
  }),
});
