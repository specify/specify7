import { act, renderHook } from "@testing-library/react"
import { useStateForContext } from "../useStateForContext"

/**
 * The unit tests below are added chronologically.
 * That is, the first test below is added first.
 * Before each test, the total coverage report is added.
 * This is done for documentation purposes, and to verify that
 * each test does something useful.
 * Format is
 * File                          | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
 * */


/*
 * useStateForContext.tsx |     100 |      100 |     100 |     100 |
 */

test("Verify returned array stable", () => {
        const { result, rerender } = renderHook((defaultValue)=>useStateForContext(defaultValue), {
            initialProps: 'default state!'
        });

        const initialValue = result.current;

        act(()=>rerender());

        // No changes, even after rerender.
        expect(initialValue).toBe(result.current);

        act(()=>result.current[1]("new state!"));

        const newValue = result.current;

        // The changes occurred.
        expect(initialValue).not.toBe(newValue);

        act(()=>rerender());

        // No changes, even after rerender.
        expect(newValue).toBe(result.current);

    }
)

/**
 * Final coverage report:
 * useStateForContext.tsx |     100 |      100 |     100 |     100 |
 */