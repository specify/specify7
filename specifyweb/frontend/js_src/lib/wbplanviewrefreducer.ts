import type React from 'react';
import type { WBPlanViewProps } from './components/wbplanview';
import { minMappingViewHeight } from './components/wbplanviewmappercomponents';
import type { WBPlanViewStates } from './components/wbplanviewstatereducer';
import type { Action, State } from './statemanagement';
import { generateDispatch } from './statemanagement';
import * as cache from './wbplanviewcache';
import type { WBPlanViewActions } from './wbplanviewreducer';

type RefUndefinedState = State<'RefUndefinedState'>;
export type AutoScrollTypes =
  // Scroll down to the last line in the list of mappings
  | 'listOfMappings'
  // Scroll to the left in the mapping view
  | 'mappingView';

export interface RefMappingState extends State<'RefMappingState'> {
  unloadProtectIsSet: boolean;
  mappingViewHeight: number;
  mappingViewHeightChangeTimeout: NodeJS.Timeout;
  autoscroll: Record<AutoScrollTypes, boolean>;
}

type RefStatesBase = RefUndefinedState | RefMappingState;
// Make all properties optional, except for `type`
export type RefStates = Partial<RefStatesBase> & State<RefStatesBase['type']>;

export const refInitialState: RefUndefinedState = {
  type: 'RefUndefinedState',
};

export const refStatesMapper = {
  MappingState: 'RefMappingState',
} as const;
const flippedRefStatesMapper = Object.fromEntries(
  Object.entries(refStatesMapper).map(([key, value]) => [value, key])
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

interface TemplateSelectedAction extends Action<'TemplateSelectedAction'> {
  id: number;
}

export type RefActions =
  | RefChangeStateAction
  | RefSetUnloadProtectAction
  | RefUnsetUnloadProtectAction
  | MappingViewResizeAction
  | AutoscrollStatusChangeAction
  | TemplateSelectedAction;

type RefActionsWithPayload = RefActions & {
  payload: {
    refObject: React.MutableRefObject<RefStates>;
    state: WBPlanViewStates;
    stateDispatch: (action: WBPlanViewActions) => void;
    props: WBPlanViewProps;
  };
};

const MAPPING_VIEW_RESIZE_TIMEOUT = 150;

export function getRefMappingState(
  refObject: React.MutableRefObject<RefStates>,
  state: WBPlanViewStates,
  quiet = false
): React.MutableRefObject<RefMappingState> {
  const refWrongStateMessage =
    'Tried to change the refObject while in a wrong state';

  if (state.type !== flippedRefStatesMapper[refObject.current.type])
    if (quiet) console.error(refWrongStateMessage);
    else throw new Error(refWrongStateMessage);

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
        isVisible: false,
      });
    }

    refMappingObject.current.mappingViewHeight = height;
    refMappingObject.current.mappingViewHeightChangeTimeout = setTimeout(
      () =>
        cache.set('ui', 'mappingViewHeight', height, {
          overwrite: true,
          priorityCommit: true,
        }),
      MAPPING_VIEW_RESIZE_TIMEOUT
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
  TemplateSelectedAction: async ({ id, payload: { props, stateDispatch } }) =>
    fetch(`/api/workbench/dataset/${id}`)
      .then(async (response) => response.json())
      .then(({ uploadplan }) =>
        stateDispatch({
          type: 'OpenMappingScreenAction',
          mappingIsTemplated: props.mappingIsTemplated,
          uploadPlan: uploadplan,
          headers: props.headers,
        })
      )
      .catch((error) => {
        throw error;
      }),
});
