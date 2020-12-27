/*
* A helper to create a Context and Provider with no upfront default value, and without having to check for undefined all the time.
* Example Usage:
export const [useCurrentUserName, CurrentUserProvider] = createCtx<string>();

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

"use strict";

import React from 'react';

function createCtx<A extends {} | null>() {
  const ctx = React.createContext<A | undefined>(undefined);
  function useCtx() {
    const c = React.useContext(ctx);
    if (c === undefined)
      throw new Error("useCtx must be inside a Provider with a value");
    return c;
  }
  return [useCtx, ctx.Provider] as const; // 'as const' makes TypeScript infer a tuple
}

export = createCtx;