'use strict';

export function assertExhaustive(x :never) :never {
	throw new Error('Non-exhaustive switch. Unhandled case:' + x);
}


export const generate_dispatch = <
	STATE extends State<string>,
	ACTION extends Action<string>
>() :generate_dispatch<STATE, ACTION> =>
	<NEW_STATE extends State<string>>(obj :generate_reducer_dictionary<STATE, ACTION, NEW_STATE>)=>
		<Key2 extends keyof typeof obj>(state:STATE, action :Action<Key2>) =>
			(obj != null && typeof obj[action['type']] === 'function') ?
				obj[action['type']](state,action as any) :
				assertExhaustive(action['type'] as never);


export const generate_reducer = <
	STATE extends State<string>,
	ACTION extends Action<string>
>(set_state_callback: (new_state:State<string>)=>void) :generate_reducer<STATE, ACTION> =>
	<NEW_STATE extends State<string>>(obj :generate_reducer_dictionary<STATE, ACTION, NEW_STATE>)=>
		<Key2 extends keyof typeof obj>(state:STATE, action :Action<Key2>) =>
			(obj != null && typeof obj[action['type']] === 'function') ?
				set_state_callback(obj[action['type']](state,action as any)) :
				assertExhaustive(action['type'] as never);

export const generate_mutable_reducer = <
	ACTION extends Action<string>
>() :generate_mutable_reducer<ACTION> =>
	(obj :generate_mutable_reducer_dictionary<ACTION>)=>
		<Key2 extends keyof typeof obj>(action :Action<Key2>) =>
			(obj != null && typeof obj[action['type']] === 'function') ?
				obj[action['type']](action as any) :
				assertExhaustive(action['type'] as never);


/*
//Example Usage
interface Action<action_name extends string> {
	type :action_name
}

interface State<state_name extends string> {
	type :state_name
}

interface Action1 extends Action<'Action1'>{
	field: string,
}
interface Action2 extends Action<'Action2'>{
	is: boolean,
}
type actions = Action1|Action2;

interface State1 extends State<'State1'>{
	field: string,
}
interface State2 extends State<'State2'>{
	is: boolean,
}
type states = State1|State2;

const reducer = generate_reducer<states, actions>(
	<STATE_KEY extends string,>(new_state:State<STATE_KEY>)=>console.log(new_state)
)({
	'Action1':(state,action)=>{
		console.log(action);
		return state;
	},
	'Action2':(state,action)=>{
		console.log(action);
		return state;
	}
});
const s1:State1 = {
	type:'State1',
	field: 'qw',
}
const s2:State2 = {
	type:'State2',
	is: false,
}
const a1:Action1 = {
	type: 'Action1',
	field: 'qwerty',
}
const a2:Action2 = {
	type: 'Action2',
	is: true,
}
reducer(s1,a1);
reducer(s1,a2);

//or with a reducer that mutates external state:
let state = {};
const mutable_reducer = generate_mutable_reducer<actions>()({
	'Action1':(action)=>{
		state=s1;
		console.log(state,action);
	},
	'Action2':(action)=>{
		state=s2;
		console.log(state,action);
	}
});
mutable_reducer(a1);
mutable_reducer(a2);
*/