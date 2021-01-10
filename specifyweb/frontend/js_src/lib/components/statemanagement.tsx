/*
*
* Generator of type safe-reducer and dispatches. Replaces the need for switch(){} statements
* This code is based on https://github.com/maxxxxxdlp/typesafe_reducer
*
* */

'use strict';

function assertExhaustive(case_type :never) :never {
	throw new Error('Non-exhaustive switch. Unhandled case:' + case_type);
}


export const generate_reducer = <STATE,
	ACTION extends Action<string>>(
	obj :generate_reducer_dictionary<STATE, ACTION>,
) :(state :STATE, key :ACTION) => STATE =>
	<Key2 extends keyof typeof obj>(
		state :STATE,
		action :Action<Key2>,
	) =>
		(
			obj != null && typeof obj[action['type']] === 'function'
		) ?
			// (()=>{console.log(state,action); return obj[action['type']](state,action as any)})() :
			obj[action['type']](state, action as any) :
			assertExhaustive(action['type'] as never);

export const generate_dispatch = <ACTION extends Action<string>>(
	obj :generate_dispatch_dictionary<ACTION>,
) :(key :ACTION) => void =>
	<Key2 extends keyof typeof obj>(
		action :Action<Key2>,
	) =>
		(
			obj != null && typeof obj[action['type']] === 'function'
		) ?
			obj[action['type']](action as any) :
			assertExhaustive(action['type'] as never);