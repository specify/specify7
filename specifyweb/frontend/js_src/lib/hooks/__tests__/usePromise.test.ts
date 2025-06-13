import { renderHook, waitFor, act } from "@testing-library/react";
import { usePromise } from "../useAsyncState";

describe("usePromise", ()=>{

    test.skip("promise gets resolved and state set", async ()=>{

        const {result} = renderHook(()=>usePromise(Promise.resolve(10), false));

        waitFor(()=>{
            expect(result.current[0]).toBe(10);
        });

        await act(()=>result.current[1](11));

        expect(result.current[0]).toBe(11);

    });
});