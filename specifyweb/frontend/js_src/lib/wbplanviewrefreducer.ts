import React from 'react';
import { minMappingViewHeight } from './components/wbplanviewmappercomponents';
import { Action, generateDispatch, State } from './statemanagement';
import * as cache from './wbplanviewcache';
import { WBPlanViewProps } from './components/wbplanview';
import { WBPlanViewActions } from './wbplanviewreducer';
import { WBPlanViewStates } from './components/wbplanviewstatereducer';

type RefUndefinedState = State<'RefUndefinedState'>;
export type AutoScrollTypes = 'listOfMappings' | 'mappingView';

export interface RefMappingState extends State<'RefMappingState'> {
  unloadProtectIsSet: boolean;
  mappingViewHeight: number;
  mappingViewHeightChangeTimeout: NodeJS.Timeout;
  autoscroll: Record<AutoScrollTypes, boolean>;
}

type RefStatesBase = RefUndefinedState | RefMappingState;
// make all properties optional, except for `type`
export type RefStates = Partial<RefStatesBase> & State<RefStatesBase['type']>;

export const refInitialState: RefUndefinedState = {
  type: 'RefUndefinedState',
};

export const refStatesMapper = {
  MappingState: 'RefMappingState',
} as const;
const flippedRefStatesMapper = Object.fromEntries(
  Object.entries(refStatesMapper).map(([k, v]) => [v, k])
);

type RefChangeStateAction = Action<'RefChangeStateAction'>;
type RefSetUnloadProtectAction = Action<'RefSetUnloadProtectAction'>;
type RefUnsetUnloadProtectAction = Action<'RefUnsetUnloadProtectAction'>;

interface MappingViewResizeAction extends Action<'MappingViewResizeAction'> {
  height: number;
}

interface AutoscrollStatusChangeAction
  extends Action<'AutoscrollStatusChangeAction'> {
  autoscrollType: AutoScrollTypes;
  status: boolean;
}

export type RefActions =
  | RefChangeStateAction
  | RefSetUnloadProtectAction
  | RefUnsetUnloadProtectAction
  | MappingViewResizeAction
  | AutoscrollStatusChangeAction;

type RefActionsWithPayload = RefActions & {
  payload: {
    refObject: React.MutableRefObject<RefStates>;
    state: WBPlanViewStates;
    stateDispatch: (action: WBPlanViewActions) => void;
    props: WBPlanViewProps;
  };
};

export function getRefMappingState(
  refObject: React.MutableRefObject<RefStates>,
  state: WBPlanViewStates,
  quiet = false
): React.MutableRefObject<RefMappingState> {
  const refWrongStateMessage =
    'Tried to change the refObject while' + 'in a wrong state';

  if (state.type !== flippedRefStatesMapper[refObject.current.type])
    if (quiet) console.error(refWrongStateMessage);
    else throw Error(refWrongStateMessage);

  return refObject as React.MutableRefObject<RefMappingState>;
}

export const refObjectDispatch = generateDispatch<RefActionsWithPayload>({
  RefChangeStateAction: ({ payload: { refObject, state } }) => {
    refObject.current = {
      type:
        refStatesMapper[state.type as keyof typeof refStatesMapper] ??
        'RefUndefinedState',
    };
  },
  RefSetUnloadProtectAction: ({ payload: { refObject, props, state } }) => {
    props.removeUnloadProtect();
    getRefMappingState(refObject, state).current.unloadProtectIsSet = false;
  },
  RefUnsetUnloadProtectAction: ({ payload: { refObject, props, state } }) => {
    props.removeUnloadProtect();
    getRefMappingState(refObject, state).current.unloadProtectIsSet = false;
  },
  MappingViewResizeAction: ({
    height: initialHeight,
    payload: { refObject, state, stateDispatch },
  }) => {
    const refMappingObject = getRefMappingState(refObject, state);

    if (refMappingObject.current.mappingViewHeightChangeTimeout)
      clearTimeout(refMappingObject.current.mappingViewHeightChangeTimeout);

    let height = initialHeight;
    if (initialHeight <= minMappingViewHeight) {
      height = minMappingViewHeight + 1;
      stateDispatch({
        type: 'ToggleMappingViewAction',
      });
    }

    refMappingObject.current.mappingViewHeight = height;
    refMappingObject.current.mappingViewHeightChangeTimeout = setTimeout(
      () =>
        cache.set('ui', 'mappingViewHeight', height, {
          overwrite: true,
          priorityCommit: true,
        }),
      150
    );
  },
  AutoscrollStatusChangeAction: ({
    autoscrollType,
    status,
    payload: { refObject, state },
  }) => {
    const refMappingObject = getRefMappingState(refObject, state);

    refMappingObject.current.autoscroll ??= {
      mappingView: false,
      listOfMappings: false,
    };
    refMappingObject.current.autoscroll[autoscrollType] = status;
  },
});
