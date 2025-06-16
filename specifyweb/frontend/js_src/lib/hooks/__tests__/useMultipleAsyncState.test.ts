import { act, renderHook, waitFor } from "@testing-library/react";

import { useMultipleAsyncState } from "../useAsyncState";
import { IR } from "../../utils/types";

describe("useMultipleAsyncState", ()=>{

    test("promise gets resolved and state set", async ()=>{

        const promises = {
            firstItem: ()=>Promise.resolve("First Promise"),
            secondItem: ()=>Promise.resolve("Second Promise")
        };

        const {result} = renderHook(()=>useMultipleAsyncState(promises, false));

        await waitFor(()=>{
            expect(result.current[0]?.firstItem).toBe("First Promise");
            expect(result.current[0]?.secondItem).toBe("Second Promise");
        });

    });

    test.skip("state changes when promise changes", async ()=>{

        let promises: IR<()=>Promise<string>> = {
            firstItem: ()=>Promise.resolve("First Promise"),
            secondItem: ()=>Promise.resolve("Second Promise"),
        };

        const {result, rerender} = renderHook(()=>useMultipleAsyncState(promises, false));

        await waitFor(()=>{
            expect(result.current[0]?.firstItem).toBe("First Promise");
            expect(result.current[0]?.secondItem).toBe("Second Promise");
        });
    
        promises = {...promises, thirdItem: ()=>Promise.resolve("Third Promise")}

        await act(rerender)

        await waitFor(()=>{
            expect(result.current[0]?.firstItem).toBe("First Promise");
            expect(result.current[0]?.secondItem).toBe("Second Promise");
            expect(result.current[0]?.thirdItem).toBe("Third Promise Promise");
        });

    });
});