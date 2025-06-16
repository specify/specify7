import { act, renderHook, waitFor } from "@testing-library/react";

import { usePromise } from "../useAsyncState";

describe("usePromise", ()=>{

    test("promise gets resolved and state set", async ()=>{

        const {result} = renderHook(()=>usePromise(Promise.resolve(10), false));

        waitFor(()=>{
            expect(result.current[0]).toBe(10);
        });

        // TODO: Investigate why the below crashes the environment.
        // I think the it is related to a previous bug in useMultipleAsyncState
        // await act(()=>result.current[1](11));

        // expect(result.current[0]).toBe(11);

    });

    test("state changes when promise changes", async ()=>{

        let promise = Promise.resolve(10);

        const {result, rerender} = renderHook(()=>usePromise(promise, false));

        waitFor(()=>{
            expect(result.current[0]).toBe(10);
        });

        promise = Promise.resolve(11);
        act(rerender);

        waitFor(()=>{
            expect(result.current[0]).toBe(11);
        });

    });
});