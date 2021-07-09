import type { Action } from 'typesafe-reducer';
import { generateReducer } from 'typesafe-reducer';

import type { MainState, States } from './components/lifemapperinfostate';
import { mainState } from './components/lifemapperinfostate';
import type { IR, RA, RR } from './components/wbplanview';
import type { LayerConfig, MarkerGroups } from './leaflet';
import type { MessageTypes } from './lifemapperconfig';
import { SN_SERVICES } from './lifemapperconfig';

type LoadedAction = Action<
  'LoadedAction',
  {
    occurrenceData: IR<{
      readonly badge: MainState['badges'][string];
      readonly aggregator: MainState['aggregators'][string] | undefined;
    }>;
  }
>;

type ToggleAggregatorVisibilityAction = Action<
  'ToggleAggregatorVisibilityAction',
  {
    badgeName: string;
  }
>;

type SetRemoteOccurrenceNameAction = Action<
  'SetRemoteOccurrenceNameAction',
  {
    remoteOccurrenceName: string;
  }
>;

type SetLocalOccurrenceNameAction = Action<
  'SetLocalOccurrenceNameAction',
  {
    localOccurrenceName: string;
  }
>;

export type LifemapperInfo = {
  readonly layers: RA<LayerConfig>;
  readonly markers: RA<MarkerGroups>;
  readonly messages: RR<MessageTypes, RA<string>>;
};

type MapLoadedAction = Action<'MapLoadedAction', LifemapperInfo>;

export type Actions =
  | LoadedAction
  | ToggleAggregatorVisibilityAction
  | MapLoadedAction
  | SetRemoteOccurrenceNameAction
  | SetLocalOccurrenceNameAction;

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
    localOccurrenceName: undefined,
    remoteOccurrenceName: undefined,
    lifemapperInfo: undefined,
  }),
  ToggleAggregatorVisibilityAction: ({ action, state }) => ({
    ...mainState(state),
    badges: {
      ...mainState(state).badges,
      [action.badgeName]: {
        ...mainState(state).badges[action.badgeName],
        isOpen: !mainState(state).badges[action.badgeName].isOpen,
      },
    },
  }),
  MapLoadedAction: ({ action: { type: _, ...lifemapperInfo }, state }) => ({
    ...mainState(state),
    lifemapperInfo,
  }),
  SetRemoteOccurrenceNameAction: ({
    action: { remoteOccurrenceName },
    state,
  }) => ({
    ...mainState(state),
    remoteOccurrenceName,
  }),
  SetLocalOccurrenceNameAction: ({
    action: { localOccurrenceName },
    state,
  }) => ({
    ...mainState(state),
    localOccurrenceName,
  }),
});
