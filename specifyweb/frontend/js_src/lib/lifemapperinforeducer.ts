import { MessageTypes } from './components/lifemapperinfo';
import { mainState, States } from './components/lifemapperinfostate';
import {
  AggregatorName,
  BADGE_NAMES,
  BadgeName,
  FullAggregatorInfo,
} from './lifemapperinfoutills';
import { Action, generateReducer } from './statemanagement';

type LoadedAction = Action<'LoadedAction'> & {
  aggregatorInfos: Record<AggregatorName, FullAggregatorInfo | undefined>;
};

type ToggleAggregatorVisibilityAction = Action<'ToggleAggregatorVisibilityAction'> & {
  badgeName: BadgeName;
};

export type OccurrenceCountRecord = {
  scientificName: string;
  count: string;
  url: string;
};

type OccurrenceCountLoadedAction = Action<'OccurrenceCountLoadedAction'> & {
  aggregatorName: AggregatorName;
  occurrenceCount: OccurrenceCountRecord[];
};

type SetRemoteOccurrenceNameAction = Action<'SetRemoteOccurrenceNameAction'> & {
  remoteOccurrenceName: string;
};

type SetLocalOccurrenceNameAction = Action<'SetLocalOccurrenceNameAction'> & {
  localOccurrenceName: string;
};

export interface LifemapperInfo {
  layers: any[];
  markers: any;
  messages: Record<MessageTypes, string[]>;
}

type MapLoadedAction = Action<'MapLoadedAction'> & LifemapperInfo;

export type Actions =
  | LoadedAction
  | ToggleAggregatorVisibilityAction
  | OccurrenceCountLoadedAction
  | MapLoadedAction
  | SetRemoteOccurrenceNameAction
  | SetLocalOccurrenceNameAction;

export const reducer = generateReducer<States, Actions>({
  LoadedAction: ({ action }) => ({
    type: 'MainState',
    aggregatorInfos: action.aggregatorInfos,
    badgeStatuses: Object.fromEntries(
      BADGE_NAMES.map((badgeName) => [
        badgeName,
        {
          isOpen: false,
        },
      ])
    ),
    localOccurrenceName: undefined,
    remoteOccurrenceName: undefined,
    lifemapperInfo: undefined,
  }),
  ToggleAggregatorVisibilityAction: ({ action, state }) => ({
    ...mainState(state),
    badgeStatuses: {
      ...mainState(state).badgeStatuses,
      [action.badgeName]: {
        ...mainState(state).badgeStatuses[action.badgeName],
        isOpen: !mainState(state).badgeStatuses[action.badgeName].isOpen,
      },
    },
  }),
  OccurrenceCountLoadedAction: ({ action, state }) => ({
    ...mainState(state),
    aggregatorInfos: {
      ...mainState(state).aggregatorInfos,
      [action.aggregatorName]: {
        ...mainState(state).aggregatorInfos[action.aggregatorName]!,
        occurrenceCount: action.occurrenceCount,
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
