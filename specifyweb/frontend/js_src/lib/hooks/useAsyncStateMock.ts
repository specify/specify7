// Like useAsyncState, but calls the callback function rather than updating the state.
// Actually, useAsyncState can be refactored to use this

import React from "react";


export function useAsyncStateMock<T>(
    callback: () => Promise<T | undefined> | undefined,
    onSetCallback: (value: T | undefined) => void,
    
){

    React.useLayoutEffect(()=>{
        Promise.resolve(callback()).then((newState)=>{
            destructorCalled ? undefined : onSetCallback(newState)
        });

        let destructorCalled = false;
        return ()=>{
            destructorCalled = true;
        }
    }, [callback]);

    return [undefined, undefined];
    
}