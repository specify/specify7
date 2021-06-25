import type React from 'react';
import type { Action, State } from 'typesafe-reducer';
import { generateDispatch } from 'typesafe-reducer';

import * as cache from './cache';
import type { WBPlanViewProps } from './components/wbplanview';
import type { WBPlanViewStates } from './components/wbplanviewstatereducer';
import type { WBPlanViewActions } from './wbplanviewreducer';

type RefUndefinedState = State<'RefUndefinedState'>;
export type AutoScrollTypes =
  // Scroll down to the last line in the list of mappings
  'listOfMappings';

export interface RefMappingState extends State<'RefMappingState'> {
  unloadProtectIsSet: boolean;
  mappingViewHeight: number;
  mappingViewHeightChangeTimeout: NodeJS.Timeout;
  autoScroll: Record<AutoScrollTypes, boolean>;
  hideEmptyDataSetDialog: boolean;
}

type RefStatesBase = RefUndefinedState | RefMappingState;
// Make all properties optional, except for `type`
export type RefStates = State<RefStatesBase['type']> & Partial<RefStatesBase>;

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
type RefHideEmptyDataSetDialogAction =
  Action<'RefHideEmptyDataSetDialogAction'>;

type MappingViewResizeAction = Action<
  'MappingViewResizeAction',
  {
    height: number;
  }
>;

type AutoScrollStatusChangeAction = Action<
  'AutoScrollStatusChangeAction',
  {
    autoScrollType: AutoScrollTypes;
    status: boolean;
  }
>;

type TemplateSelectedAction = Action<
  'TemplateSelectedAction',
  {
    id: number;
  }
>;

export type RefActions =
  | RefChangeStateAction
  | RefSetUnloadProtectAction
  | RefUnsetUnloadProtectAction
  | MappingViewResizeAction
  | AutoScrollStatusChangeAction
  | TemplateSelectedAction
  | RefHideEmptyDataSetDialogAction;

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
  MappingViewResizeAction: ({ height, payload: { refObject, state } }) => {
    const refMappingObject = getRefMappingState(refObject, state);

    if (refMappingObject.current.mappingViewHeightChangeTimeout)
      clearTimeout(refMappingObject.current.mappingViewHeightChangeTimeout);

    refMappingObject.current.mappingViewHeight = height;
    refMappingObject.current.mappingViewHeightChangeTimeout = setTimeout(
      () =>
        cache.set('wbplanview-ui', 'mappingViewHeight', height, {
          overwrite: true,
          priorityCommit: true,
        }),
      MAPPING_VIEW_RESIZE_TIMEOUT
    );
  },
  AutoScrollStatusChangeAction: ({
    autoScrollType,
    status,
    payload: { refObject, state },
  }) => {
    const refMappingObject = getRefMappingState(refObject, state);

    refMappingObject.current.autoScroll ??= {
      listOfMappings: false,
    };
    refMappingObject.current.autoScroll[autoScrollType] = status;
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
          changesMade: true,
        })
      )
      .catch((error) => {
        throw error;
      }),
  RefHideEmptyDataSetDialogAction: ({ payload: { refObject, state } }) => {
    const refMappingObject = getRefMappingState(refObject, state);
    refMappingObject.current.hideEmptyDataSetDialog = true;
  },
});
