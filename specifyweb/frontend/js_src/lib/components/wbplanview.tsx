/*
 *
 * Workbench plan mapper
 *
 *
 */

'use strict';

import React from 'react';
import '../../css/wbplanview.css';
import type { JqueryPromise } from '../legacytypes';
import type { UploadPlan } from '../uploadplantomappingstree';
import type { OpenMappingScreenAction } from '../wbplanviewreducer';
import { reducer } from '../wbplanviewreducer';
import type { RefActions, RefStates } from '../wbplanviewrefreducer';
import {
  refInitialState,
  refObjectDispatch,
  refStatesMapper,
} from '../wbplanviewrefreducer';
import {
  getInitialWBPlanViewState,
  stateReducer,
} from './wbplanviewstatereducer';

// General definitions
export type DatasetBrief = {
  id: number;
  name: string;
  uploaderstatus: IR<unknown> | null;
  uploadresult: {
    success: boolean;
    timestamp: string;
  } | null;
};

export type Dataset = DatasetBrief & {
  columns: string[];
  rows: string[][];
  uploadplan: UploadPlan | null;
};

export interface SpecifyResource {
  readonly id: number;
  readonly get: (query: string) => SpecifyResource | any;
  readonly rget: (query: string) => JqueryPromise<SpecifyResource | any>;
  readonly set: (query: string, value: any) => void;
  readonly save: () => void;
}

// Record
export type R<T> = Record<string, T>;
// Immutable record
export type IR<T> = Readonly<R<T>>;

export interface WBPlanViewProps
  extends WBPlanViewWrapperProps,
    PublicWBPlanViewProps {
  readonly uploadPlan: UploadPlan | null;
  readonly headers: string[];
  readonly setUnloadProtect: () => void;
  readonly readonly: boolean;
}

export interface PartialWBPlanViewProps {
  readonly removeUnloadProtect: () => void;
}

export interface WBPlanViewWrapperProps
  extends PartialWBPlanViewProps,
    PublicWBPlanViewProps {
  mappingIsTemplated: boolean;
  readonly setUnloadProtect: () => void;
}

export interface PublicWBPlanViewProps {
  dataset: Dataset;
}

export function WBPlanView(props: WBPlanViewProps): JSX.Element {
  const [state, dispatch] = React.useReducer(
    reducer,
    {
      uploadPlan: props.uploadPlan,
      headers: props.headers,
      mappingIsTemplated: props.mappingIsTemplated,
    } as OpenMappingScreenAction,
    getInitialWBPlanViewState
  );

  // `refObject` is like `state`, but does not cause re-render on change
  const refObject = React.useRef<RefStates>(refInitialState);
  const refObjectDispatchCurried = (action: RefActions): void =>
    refObjectDispatch({
      ...action,
      payload: {
        refObject,
        state,
        props,
        stateDispatch: dispatch,
      },
    });

  // Reset refObject on state change
  if (
    refObject.current.type !==
    // @ts-expect-error
    (refStatesMapper[state.type] ?? 'RefUndefinedState')
  )
    refObjectDispatchCurried({
      type: 'RefChangeStateAction',
    });

  // Set/unset unload protect
  React.useEffect(() => {
    const changesMade = 'changesMade' in state ? state.changesMade : false;

    if (
      state.type === 'LoadingState' ||
      refObject.current.type !== 'RefMappingState'
    )
      return;

    if (refObject.current.unloadProtectIsSet && !changesMade)
      refObjectDispatchCurried({
        type: 'RefUnsetUnloadProtectAction',
      });
    else if (!refObject.current.unloadProtectIsSet && changesMade)
      refObjectDispatchCurried({
        type: 'RefSetUnloadProtectAction',
      });
  }, ['changesMade' in state ? state.changesMade : false]);

  // Wait for automapper suggestions to fetch
  React.useEffect(() => {
    if (!('automapperSuggestionsPromise' in state)) return;

    state.automapperSuggestionsPromise
      ?.then((automapperSuggestions) =>
        dispatch({
          type: 'AutomapperSuggestionsLoadedAction',
          automapperSuggestions,
        })
      )
      .catch(console.error);
  }, [
    'automapperSuggestionsPromise' in state
      ? state.automapperSuggestionsPromise
      : undefined,
  ]);

  return stateReducer(<i />, {
    ...state,
    props,
    dispatch,
    refObject,
    refObjectDispatch: refObjectDispatchCurried,
  });
}
