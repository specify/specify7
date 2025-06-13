import { renderHook, act } from "@testing-library/react";
import { errorContext, useErrorContext } from "../useErrorContext";
import { mockTime } from "../../tests/helpers";

mockTime();

let errorContextCopy: typeof errorContext | undefined = undefined;

describe("useErrorContext", ()=>{

    // BeforeAll and AfterAll make sure the state is reverted back to orginal set.
    // Technically, if tests are parallelized this might break..
    beforeEach(()=>{
        // create a copy of the errorContext
        errorContextCopy = new Set(errorContext);
        errorContext.clear();
    });

    afterEach(()=>{
        errorContext.clear();
        errorContextCopy?.forEach((value)=>{
            errorContext.add(value)
        });
    });

    const makeErrorContextData = (name: string, payload: unknown)=>({
        timestamp: new Date().toJSON(),
        name,
        payload
        })
    
    const getValue = (set: Set<unknown>) => set.values().next().value;


    it("adds and removes value from the set", async ()=>{

        const name = "testname";
        const data = {
            varA: 20,
            strA: "this a test value"
        };

        expect(errorContext.size).toBe(0);

        const setObject = makeErrorContextData(name, data);
        const {unmount, rerender} = renderHook(()=>useErrorContext(name, data));

        expect(errorContext.size).toBe(1);

        expect(getValue(errorContext)).toEqual(setObject);

        await act(rerender);

        expect(errorContext.size).toBe(1);

        await act(unmount);

        expect(errorContext.size).toBe(0);

    });

    it("updates the context when name or data changes", async () =>{

        const initialName = "initialName";
        const changedName = "changedName";

        const initialData = {
            initKey: "initialData"
        };

        const changedData = {
            changedKey: "changedData"
        };

        const initialContent = makeErrorContextData(initialName, initialData);
        const intermediateContent = makeErrorContextData(changedName, initialData);
        const finalContent = makeErrorContextData(changedName, changedData);

        let name = initialName;
        let data: unknown = initialData;

        const {unmount, rerender} = renderHook(()=>useErrorContext(name, data));

        expect(errorContext.size).toBe(1);

        expect(getValue(errorContext)).toEqual(initialContent);

        name = changedName;

        await act(rerender);

        expect(errorContext.size).toBe(1);

        expect(getValue(errorContext)).toEqual(intermediateContent);

        data = changedData;

        await act(rerender);

        expect(errorContext.size).toBe(1);

        expect(getValue(errorContext)).toEqual(finalContent);

        await act(unmount);

        expect(errorContext.size).toBe(0);

    });
});