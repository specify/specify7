/*
* A helper to create a Context and Provider with no upfront default value, and without having to check for undefined all the time.
* Example Usage:
export const [useCurrentUserName, CurrentUserProvider] = useContext<string>('current_name');
function EnthusasticGreeting() {
  const currentUser = useCurrentUserName();
  return <div>HELLO {currentUser.toUpperCase()}!</div>;
}
function App() {
  return (
    <CurrentUserProvider value="Anders">
      <EnthusasticGreeting />
    </CurrentUserProvider>
  );
}
*
*/

'use strict';

import React from 'react';

type context_data<A> = readonly [
	(() => A),
	React.Provider<A | undefined>
]

interface contexts_store {
	[context_name:string]:context_data<any>
}

const contexts:contexts_store = {};

function createContext<A extends {} | null>():context_data<A> {
	const ctx = React.createContext<A | undefined>(undefined);

	function useContext() {
		const c = React.useContext(ctx);
		if (c === undefined)
			throw new Error('useContext must be inside a Provider with a value');
		return c;
	}

	return [useContext, ctx.Provider] as const; // 'as const' makes TypeScript infer a tuple
}

export default function<A extends {} | null>(context_name:string){
	if(!(context_name in contexts))
		contexts[context_name] = createContext<A>();
	return contexts[context_name] as context_data<A>;
}