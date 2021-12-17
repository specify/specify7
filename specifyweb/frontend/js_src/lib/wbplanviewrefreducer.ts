import type React from 'react';
import type { Action, State } from 'typesafe-reducer';
import { generateDispatch } from 'typesafe-reducer';

import * as cache from './cache';
import type { Dataset, WbPlanViewProps } from './components/wbplanview';
import type { WbPlanViewStates } from './components/wbplanviewstate';
import type { WbPlanViewActions } from './wbplanviewreducer';

type RefUndefinedState = State<'RefUndefinedState'>;
export type AutoScrollTypes =
  // Scroll down to the last line in the list of mappings
  'listOfMappings';

export interface RefMappingState extends State<'RefMappingState'> {
  unloadProtectIsSet: boolean;
  mappingViewHeight: number;
  autoScroll: Record<AutoScrollTypes, boolean>;
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
type RefMappingViewResizeAction = Action<
  'RefMappingViewResizeAction',
  {
    height: number;
  }
>;

type RefAutoScrollStatusChangeAction = Action<
  'RefAutoScrollStatusChangeAction',
  {
    autoScrollType: AutoScrollTypes;
    status: boolean;
  }
>;

type RefTemplateSelectedAction = Action<
  'RefTemplateSelectedAction',
  {
    id: number;
  }
>;

export type RefActions =
  | RefChangeStateAction
  | RefSetUnloadProtectAction
  | RefUnsetUnloadProtectAction
  | RefMappingViewResizeAction
  | RefAutoScrollStatusChangeAction
  | RefTemplateSelectedAction;

type RefActionsWithPayload = RefActions & {
  payload: {
    refObject: React.MutableRefObject<RefStates>;
    state: WbPlanViewStates;
    stateDispatch: (action: WbPlanViewActions) => void;
    props: WbPlanViewProps;
  };
};

export function getRefMappingState(
  refObject: React.MutableRefObject<RefStates>,
  state: WbPlanViewStates,
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
    props.setUnloadProtect();
    getRefMappingState(refObject, state).current.unloadProtectIsSet = false;
  },
  RefUnsetUnloadProtectAction: ({ payload: { refObject, props, state } }) => {
    props.removeUnloadProtect();
    getRefMappingState(refObject, state).current.unloadProtectIsSet = false;
  },
  RefMappingViewResizeAction: ({ height, payload: { refObject, state } }) => {
    const refMappingObject = getRefMappingState(refObject, state);

    refMappingObject.current.mappingViewHeight = height;
    cache.set('wbPlanViewUi', 'mappingViewHeight', height, {
      overwrite: true,
    });
  },
  RefAutoScrollStatusChangeAction: ({
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
  RefTemplateSelectedAction: async ({
    id,
    payload: { props, stateDispatch },
  }) =>
    fetch(`/api/workbench/dataset/${id}`)
      .then(async (response) => response.json())
      .then(({ uploadplan, columns, visualorder }: Dataset) =>
        stateDispatch({
          type: 'OpenMappingScreenAction',
          uploadPlan: uploadplan,
          headers:
            props.headers.length === 0 && Array.isArray(visualorder)
              ? visualorder.map((visualCol) => columns[visualCol])
              : props.headers,
          changesMade: true,
        })
      )
      .catch((error) => {
        throw error;
      }),
});
