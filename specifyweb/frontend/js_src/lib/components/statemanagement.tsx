/*
*
* Generator of type safe-reducer and dispatches. Replaces the need for switch(){} statements
* This code is based on https://github.com/maxxxxxdlp/typesafe_reducer
*
* */

'use strict';

export interface Action<action_name extends string> {
	type: action_name
}

export interface State<state_name extends string> {
	type: state_name
}

type GenerateReducerDictionary<STATE, ACTION extends Action<string>> = {
	[action_type in ACTION['type']]: (state: STATE, action: Extract<ACTION, Action<action_type>>) => STATE
}

type GenerateDispatchDictionary<ACTION extends Action<string>> = {
	[action_type in ACTION['type']]: (action: Extract<ACTION, Action<action_type>>) => void
}

function assertExhaustive(case_type: never): never {
	throw new Error(`Non-exhaustive switch. Unhandled case:${case_type as string}`);
}


// assignees names to components so that they easier to identify in the inspector and profiler
export function named_component<T>(component_function: T, component_name: string): T {
	// @ts-ignore
	component_function.displayName = component_name;
	return component_function;
}

export const generate_reducer = <STATE,
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
			// (()=>{console.log(state,action); return obj[action['type']](state,action as any)})() :
			obj[action['type']](state, action as any) :
			assertExhaustive(action['type'] as never);

export const generate_dispatch = <ACTION extends Action<string>>(
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