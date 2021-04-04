/*
*
* Workbench plan mapper
*
* */

'use strict';

import React from 'react';
import '../../css/wbplanview.css';
import { JqueryPromise } from '../legacytypes';
import { UploadPlan } from '../uploadplantomappingstree';
import { OpenMappingScreenAction, reducer } from '../wbplanviewreducer';
import {
  RefActions,
  refInitialState,
  refObjectDispatch,
  RefStates, refStatesMapper,
} from '../wbplanviewrefreducer';
import {
  getInitialWBPlanViewState,
  stateReducer,
} from './wbplanviewstatereducer';

// general definitions
export type Dataset = {
  id: number,
  name: string,
  columns: string[],
  rows: string[][],
  uploadplan: UploadPlan | null,
  uploaderstatus: R<unknown> | null,
  uploadresult: {
    success: boolean,
    timestamp: string,
  } | null,
}

export interface SpecifyResource {
  readonly id: number;
  readonly get: (query: string) => SpecifyResource | any,
  readonly rget: (query: string) =>
    JqueryPromise<SpecifyResource | any>,
  readonly set: (query: string, value: any) => void,
  readonly save: () => void,
}

export type R<T> = Record<string, T>;


export interface WBPlanViewProps extends WBPlanViewWrapperProps,
  PublicWBPlanViewProps {
  readonly uploadPlan: UploadPlan | null,
  readonly headers: string[],
  readonly setUnloadProtect: () => void,
  readonly readonly: boolean,
}

export interface PartialWBPlanViewProps {
  readonly removeUnloadProtect: () => void,
}

export interface WBPlanViewWrapperProps extends PartialWBPlanViewProps,
  PublicWBPlanViewProps {
  mappingIsTemplated: boolean,
  readonly setUnloadProtect: () => void,
}

export interface PublicWBPlanViewProps {
  dataset: Dataset,
}

export function WBPlanView(props: WBPlanViewProps):JSX.Element {

  const [state, dispatch] = React.useReducer(
    reducer,
    {
      uploadPlan: props.uploadPlan,
      headers: props.headers,
      mappingIsTemplated: props.mappingIsTemplated,
    } as OpenMappingScreenAction,
    getInitialWBPlanViewState,
  );

  // `refObject` is like `state`, but does not cause re-render on change
  const refObject = React.useRef<RefStates>(refInitialState);
  const refObjectDispatchCurried = (action: RefActions) =>
    refObjectDispatch({
      ...action,
      payload: {
        refObject,
        state,
        props,
        stateDispatch: dispatch,
      },
    });

  // reset refObject on state change
  if (
    refObject.current.type !== (
      // @ts-ignore
      refStatesMapper[state.type] ?? 'RefUndefinedState'
    )
  )
    refObjectDispatchCurried({
      type: 'RefChangeStateAction',
    });

  // set/unset unload protect
  React.useEffect(() => {
    const changesMade = 'changesMade' in state ?
      state.changesMade :
      false;

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

  }, [
    'changesMade' in state ?
      state.changesMade :
      false,
  ]);

  // wait for automapper suggestions to fetch
  React.useEffect(() => {

    if (!(
      'automapperSuggestionsPromise' in state
    ))
      return;

    state.automapperSuggestionsPromise?.then(automapperSuggestions =>
      dispatch({
        type: 'AutomapperSuggestionsLoadedAction',
        automapperSuggestions,
      }),
    ).catch(console.error);

  }, [
    'automapperSuggestionsPromise' in state ?
      state.automapperSuggestionsPromise :
      undefined,
  ]);

  return stateReducer(<i />, {
    ...state,
    props,
    dispatch,
    refObject,
    refObjectDispatch: refObjectDispatchCurried,
  });

}
