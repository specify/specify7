// The idea is to "build up" tests to useResourceValue

import { renderHook } from '@testing-library/react';
import React from 'react';

import { Input } from '../../components/Atoms/Form'
import { InFormEditorContext } from '../../components/FormEditor/Context';
import { mount } from '../../tests/reactUtils';
import type { RA } from '../../utils/types';
import { useValidation } from '../useValidation';

/**
 * The unit tests below are added chronologically.
 * That is, the first test below is added first.
 * Before each test, the total coverage report is added.
 * This is done for documentation purposes, and to verify that
 * each test does something useful.
 * Format is
 * File                          | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s       
 */


/*
 *UseValidation.tsx           |   87.12 |       60 |     100 |   87.12 | 48-55,62-63,76-82 
 */
test("custom validation and hook use (simple errors)", async () => {
    // TODO: Make a better wrapper around renderhook
    const customError = "Input must be multiple of two!";
    const { result } = renderHook(() => useValidation(customError));
    const initialValue = "";
    const { getByRole, user } = mount(
        <Input.Text forwardRef={result.current.validationRef} value={initialValue} onChange={(event) => {
            event.preventDefault();
            if (event.target.value === "") return;
            const value = Number.parseInt(event.target.value);
            if ((value % 2) == 0) {
                result.current.setValidation("");
            } else {
                result.current.setValidation(customError);
            }
        }} />
    );

    result.current.setValidation("");

    const numeric = getByRole("textbox") as HTMLTextAreaElement;

    await user.type(numeric, "5");
    expect(numeric.validationMessage).toBe(customError);
    expect(numeric.validity.valid).toBe(false);

    await user.type(numeric, "2");
    expect(numeric.validationMessage).toBe("");
    expect(numeric.validity.valid).toBe(true);

    await user.type(numeric, "3");
    expect(numeric.validationMessage).toBe(customError);
    expect(numeric.validity.valid).toBe(false);

});

test("custom validation and hook use (complex errors)", async () => {
    // TODO: Make a better wrapper around renderhook
    const customErrorOnTwo = "Input must be multiple of two!";
    const customErrorOnThree = "Input must be multiple of three!";

    const joined = [customErrorOnTwo, customErrorOnThree].join("\n");

    const { result } = renderHook(() => useValidation());
    const initialValue = "";
    const { getByRole, user } = mount(
        <Input.Text forwardRef={result.current.validationRef} value={initialValue} onValueChange={(rawValue) => {
            if (rawValue === "") return;
            const value = Number.parseInt(rawValue);
            let errors: RA<string> = [];

            if ((value % 2) != 0) {
                errors = [...errors, customErrorOnTwo];
            }
            if ((value % 3) != 0) {
                errors = [...errors, customErrorOnThree];
            }
            if (errors.length > 0) {
                result.current.setValidation(errors);
            }
            else {
                result.current.setValidation("");
            }
        }} />
    );

    result.current.setValidation("");

    const numeric = getByRole("textbox") as HTMLTextAreaElement;

    // Number is 5
    await user.type(numeric, "5");
    expect(numeric.validationMessage).toBe(joined);
    expect(numeric.validity.valid).toBe(false);

    // Number is 2
    await user.type(numeric, "2");
    expect(numeric.validationMessage).toBe(customErrorOnThree);
    expect(numeric.validity.valid).toBe(false);

    // Number is 6
    await user.type(numeric, "6");
    expect(numeric.validationMessage).toBe("");
    expect(numeric.validity.valid).toBe(true);

});

test.skip("custom validation in form editor context", async () => {
    const customError = "the value should be a!";
    const { result } = renderHook(() => useValidation());
    const initialValue = "";

    const { getByRole, user } = mount(
        <InFormEditorContext.Provider value>
            <Input.Text forwardRef={result.current.validationRef} value={initialValue} onValueChange={(rawValue) => {
                if (rawValue === "a") result.current.setValidation("");
                result.current.setValidation(customError);
            }} />
        </InFormEditorContext.Provider>
    );

    const textbox = getByRole("textbox") as HTMLTextAreaElement;

    // Since the form editor context is being used, the set validation won't do anything.

    await user.type(textbox, "b");

    expect(textbox.validationMessage).toBe("");
    expect(textbox.validity.valid).toBe(true);

})