/*
*
* A generator of safe React contexts. Uses reducer and dispatches
*
* Sample usage:
const {
	Provider:CountProvider,
	useState:useCountState,
	useDispatch:useCountDispatch
} = ContextCreator(
	(state, action)=>{
		switch (action.type) {
			case 'increment': {
				return {count: state.count + 1};
			}
			case 'decrement': {
				return {count: state.count - 1};
			}
			default: {
				throw new Error(`Unhandled action type: ${action.type}`);
			}
		}
	},
	{count: 0}
);
function CountDisplay() {
  const {count} = useCountState()
  return <div>{`The current count is ${count}`}</div>
}
function Counter() {
  const dispatch = useCountDispatch()
  return (
    <button onClick={() => dispatch({type: 'increment'})}>
      Increment count
    </button>
  )
}
function App() {
  return (
    <CountProvider>
      <CountDisplay />
      <Counter />
    </CountProvider>
  )
}
*
* */

"use strict";

import React from 'react';


interface action {
	type :string,
}
type reducer = (state :object, action :action) => void;

function Provider(StateContext:Context, DispatchContext:Context, reducer:reducer, default_value:object, {children}) {
	const [state, dispatch] = React.useReducer(reducer, default_value);
	return (
		<StateContext.Provider value={state}>
			<DispatchContext.Provider value={dispatch}>
				{children}
			</DispatchContext.Provider>
		</StateContext.Provider>
	);
}

function useState(StateContext:Context) {
	const context = React.useContext(StateContext);
	if (typeof context === "undefined")
		throw new Error('`useState` must be used within a `Provider`');
	return context;
}

function useDispatch(DispatchContext:Context) {
	const context = React.useContext(DispatchContext);
	if (typeof context === "undefined")
		throw new Error('`useDispatch` must be used within a `Provider`');
	return context;
}

export = function(reducer:reducer, default_value:object={}){
	const StateContext = React.createContext();
	const DispatchContext = React.createContext();

	return {
		Provider: Provider.bind(null,StateContext,DispatchContext,reducer,default_value),
		useState: useState.bind(null,StateContext),
		useDispatch: useDispatch.bind(null,DispatchContext)
	}
};