/*
*
* Generator of type safe-reducer and dispatches. Replaces the need for
* switch(){} statements
* This code is based on https://github.com/maxxxxxdlp/typesafe_reducer
*
* */

'use strict';

export interface Action<ACTION_NAME extends string> {
  type: ACTION_NAME
}

export interface State<STATE_NAME extends string> {
  type: STATE_NAME
}


type GenerateReducerDictionary<STATE,
  ACTION extends Action<string>> = {
  [ACTION_TYPE in ACTION['type']]:
  (props: {
    state: STATE,
    action: Extract<ACTION, Action<ACTION_TYPE>>
  }) => STATE
}

type GenerateDispatchDictionary<ACTION extends Action<string>> = {
  [ACTION_TYPE in ACTION['type']]: (
    action: Extract<ACTION, Action<ACTION_TYPE>>,
  ) => void
}

function assertExhaustive(
  caseType: never,
): never {
  throw new Error(
    `Non-exhaustive switch. Unhandled case:${caseType as string}`,
  );
}

// assignees names to components so that they easier to identify in the
// inspector and profiler
export function namedComponent<T>(
  componentName: string,
  componentFunction: T,
): T {
  // @ts-ignore
  componentFunction.displayName = componentName;
  return componentFunction;
}

export const generateReducer = <STATE,
  ACTION extends Action<string>>(
  obj: GenerateReducerDictionary<STATE, ACTION>,
): (state: STATE, key: ACTION) => STATE =>
  <Key2 extends keyof typeof obj>(
    state: STATE,
    action: Action<Key2>,
  ) =>
    (
      obj != null && typeof obj[action['type']] === 'function'
    ) ?
      obj[action['type']]({state, action: action as any}) :
      assertExhaustive(action['type'] as never);

export const generateDispatch = <ACTION extends Action<string>>(
  obj: GenerateDispatchDictionary<ACTION>,
): (key: ACTION) => void =>
  <Key2 extends keyof typeof obj>(
    action: Action<Key2>,
  ) =>
    (
      obj != null && typeof obj[action['type']] === 'function'
    ) ?
      obj[action['type']](action as any) :
      assertExhaustive(action['type'] as never);