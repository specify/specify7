import { act, renderHook, waitFor } from "@testing-library/react";

import { useMultipleAsyncState } from "../useAsyncState";
import { IR } from "../../utils/types";
import React from "react";
import { mount } from "../../tests/reactUtils";
import { LoadingContext } from "../../components/Core/Contexts";

describe("useMultipleAsyncState", () => {

    function TestLoading(
        { promises, callback, showLoading }:
            {
                readonly promises: IR<() => Promise<string>>,
                callback: (state: IR<string | undefined> | undefined) => void,
                showLoading: boolean
            }
    ) {
        const [state] = useMultipleAsyncState(promises, showLoading);
        React.useEffect(() => {
            callback(state);
        }, [state, callback]);
        return <></>
    }

    test("promise gets resolved and state set", async () => {

        const promises = {
            firstItem: () => Promise.resolve("First Promise"),
            secondItem: () => Promise.resolve("Second Promise")
        };

        const { result } = renderHook(() => useMultipleAsyncState(promises, false));

        await waitFor(() => {
            expect(result.current[0]?.firstItem).toBe("First Promise");
            expect(result.current[0]?.secondItem).toBe("Second Promise");
        });

    });

    test("Loading screen appears", async () => {

        const promises = {
            firstItem: () => Promise.resolve("First Promise"),
            secondItem: () => Promise.resolve("Second Promise")
        };

        const promiseHandler = jest.fn();
        const onStateSet = jest.fn();

        mount(<LoadingContext.Provider value={promiseHandler}><TestLoading promises={promises} callback={onStateSet} showLoading /></LoadingContext.Provider>)

        await waitFor(() => {
            expect(onStateSet.mock.calls.length).toBeGreaterThanOrEqual(1);
            const stateSet = onStateSet.mock.calls.at(-1).at(0);
            expect(stateSet).toEqual({
                firstItem: "First Promise",
                secondItem: "Second Promise"
            });
        });

        expect(promiseHandler).toBeCalled();

    });

    test.skip("state changes when promise changes", async () => {

        const firstPromise = Promise.resolve("First Promise");
        const secondPromise = Promise.resolve("Second Promise");
        const thirdPromise = Promise.resolve("Third Promise");

        let promises: IR<() => Promise<string>> = {
            firstItem: () => firstPromise,
            secondItem: () => secondPromise
        };

        const { result, rerender } = renderHook(() => useMultipleAsyncState(promises, false));

        await waitFor(() => {
            expect(result.current[0]?.firstItem).toBe("First Promise");
            expect(result.current[0]?.secondItem).toBe("Second Promise");
        });

        promises = { ...promises, thirdItem: () => thirdPromise };

        await act(rerender);

        await waitFor(() => {
            expect(result.current[0]?.firstItem).toBe("First Promise");
            expect(result.current[0]?.secondItem).toBe("Second Promise");
            expect(result.current[0]?.thirdItem).toBe("Third Promise");
        });

    });
});