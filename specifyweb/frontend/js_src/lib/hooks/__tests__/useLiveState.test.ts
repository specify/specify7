import { renderHook } from "@testing-library/react";
import { act } from "react-dom/test-utils";

import { useLiveState } from "../useLiveState";

describe("useLiveState", ()=>{

    test("does not recalculate state when function does not change", async ()=>{

        const stateCreator = jest.fn().mockReturnValueOnce(50);

        const { result, rerender } = renderHook(()=>useLiveState(stateCreator));

        expect(result.current[0]).toBe(50);
        expect(stateCreator).toHaveBeenCalledTimes(1);

        await act(rerender);

        expect(result.current[0]).toBe(50);
        expect(stateCreator).toHaveBeenCalledTimes(1);

    });

    test("recalculates state when function changes", async ()=>{

        // Here, the function gets changed later.
        let volatileStateCreator = jest.fn().mockReturnValue(10);

        const { result, rerender } = renderHook(()=>useLiveState(volatileStateCreator));

        expect(result.current[0]).toBe(10);
        expect(volatileStateCreator).toHaveBeenCalledTimes(1);

        const originalCreator = volatileStateCreator;

        volatileStateCreator = jest.fn().mockReturnValue(50);

        await act(rerender);

        expect(result.current[0]).toBe(50);
        expect(volatileStateCreator).toHaveBeenCalledTimes(1);
        expect(originalCreator).toHaveBeenCalledTimes(1);

    })
});