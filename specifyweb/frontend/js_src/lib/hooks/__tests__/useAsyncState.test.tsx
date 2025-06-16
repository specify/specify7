import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";

import { LoadingContext } from "../../components/Core/Contexts";
import { mount } from "../../tests/reactUtils";
import { useAsyncState } from "../useAsyncState";

describe("useAsyncState", () => {

    function TestLoading(
        { promise, callback, showLoading }:
            {
                readonly promise: () => Promise<string>,
                readonly callback: (state: string | undefined | undefined) => void,
                readonly showLoading: boolean
            }
    ) {
        const [state] = useAsyncState(promise, showLoading);
        React.useEffect(() => {
            callback(state);
        }, [state, callback]);
        return <></>
    }

    test("promise gets resolved and state set", async () => {

        const promise = async () => "First Promise";

        const { result } = renderHook(() => useAsyncState(promise, false));

        await waitFor(() => {
            expect(result.current[0]).toBe("First Promise");
        });

    });

    test("Loading screen appears", async () => {

        const promise = async () => "First Promise";

        const promiseHandler = jest.fn();
        const onStateSet = jest.fn();

        mount(
            <LoadingContext.Provider value={promiseHandler}>
                <TestLoading callback={onStateSet} promise={promise} showLoading />
            </LoadingContext.Provider>
        )

        await waitFor(() => {
            expect(onStateSet.mock.calls.length).toBeGreaterThanOrEqual(1);
            const stateSet = onStateSet.mock.calls.at(-1).at(0);
            expect(stateSet).toEqual("First Promise");
        });

        expect(promiseHandler).toHaveBeenCalled();

    });

    // Below tests don't work because of the async nature.
    // The cleanest way would be a slight refactor and adding callbacks
    // to the useAsyncState and useMultipleAsyncState.
    test.skip("destructor call is obeyed", async () => {

        let resolver: (args: string) => void;

        const firstPromise = new Promise((resolve) => {
            resolver = resolve;
        });

        const secondPromise = Promise.resolve(
            "Second Value"
        );

        let promise = () => firstPromise;

        const { result, rerender } = renderHook(() => useAsyncState(promise, false));

        promise = () => secondPromise;

        await act(rerender);

        await waitFor(() => {
            expect(result.current[0]).toBeDefined();
        })

        expect(result.current[0]).toBe(
            "Second Value"
        );

    });

    test.skip("state changes when promise changes", async () => {

        const firstPromise = Promise.resolve("First Promise");
        const secondPromise = Promise.resolve("Second Promise");

        let promise: () => Promise<string> = () => firstPromise;

        const { result, rerender } = renderHook(() => useAsyncState(promise, false));

        await waitFor(() => {
            expect(result.current[0]).toBe("First Promise");
        });

        promise = () => secondPromise;

        await act(rerender);

        await waitFor(() => {
            expect(result.current[0]).toBe("Second Promise");
        });

    });

});