import { renderHook } from "@testing-library/react";
import { useLiveState } from "../useLiveState";
import { act } from "react-dom/test-utils";

describe("useLiveState", ()=>{

    it("does not recalculate state when function does not change", async ()=>{

        const stateCreator = jest.fn().mockReturnValueOnce(50);

        const { result, rerender } = renderHook(()=>useLiveState(stateCreator));

        expect(result.current[0]).toBe(50);
        expect(stateCreator).toBeCalledTimes(1);

        await act(rerender);

        expect(result.current[0]).toBe(50);
        expect(stateCreator).toBeCalledTimes(1);

    });

    it("recalculates state when function changes", async ()=>{

        // Here, the function gets changed later.
        let volatileStateCreator = jest.fn().mockReturnValue(10);

        const { result, rerender } = renderHook(()=>useLiveState(volatileStateCreator));

        expect(result.current[0]).toBe(10);
        expect(volatileStateCreator).toBeCalledTimes(1);

        const originalCreator = volatileStateCreator;

        volatileStateCreator = jest.fn().mockReturnValue(50);

        await act(rerender);

        expect(result.current[0]).toBe(50);
        expect(volatileStateCreator).toBeCalledTimes(1);
        expect(originalCreator).toBeCalledTimes(1);

    })
});