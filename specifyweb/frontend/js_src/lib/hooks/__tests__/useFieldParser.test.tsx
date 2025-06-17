import { renderHook } from "@testing-library/react";
import React from "react";
import { act } from "react-dom/test-utils";

import { Input } from "../../components/Atoms/Form";
import type { AnySchema } from "../../components/DataModel/helperTypes";
import type { SpecifyResource } from "../../components/DataModel/legacyTypes";
import { tables } from "../../components/DataModel/tables";
import { requireContext } from "../../tests/helpers";
import { mount } from "../../tests/reactUtils";
import type { Parser} from "../../utils/parser/definitions";
import { getValidationAttributes, parsers } from "../../utils/parser/definitions";
import { useFieldParser } from "../useFieldParser";

requireContext();

describe("useFieldParser", () => {

    const simpleTextParser: Parser = {
        type: 'text',
    };

    const complexTextParser: Parser = {
        ...simpleTextParser,
        pattern: new RegExp("^a$|^a[a-z]*a$", 'u')
    };

    const getCoField = (setValue: boolean = true) => {
        const collectionObject = new tables.CollectionObject.Resource(
            { id: 10, ...(setValue ? { text1: 'set value' } : {}) }
        );
        const textField = tables.CollectionObject.strictGetField("text1");
        return { collectionObject, textField }
    }

    const changed_value = "changed value";

    test("updates values from input correctly", () => {

        const { collectionObject, textField } = getCoField();

        // RefResult is a ref that stores another ref :)
        const { result: refResult } = renderHook(() => React.useRef<HTMLInputElement>(null));

        const onParse = jest.fn();

        const { result: fieldParserResult } = renderHook(() => useFieldParser(
            {
                resource: collectionObject,
                field: textField,
                inputRef: refResult.current,
                parser: simpleTextParser,
                onParse
            }
        ));

        mount(
            <Input.Generic
                forwardRef={refResult.current}
                value=""
            />
        );

        act(() => fieldParserResult.current[1](changed_value));

        expect(refResult.current.current?.value).toBe(changed_value);

        // This should have happened.
        expect(onParse).toHaveBeenCalledTimes(1);
        // Should have been called with one argument.
        expect(onParse.mock.calls.at(-1)).toEqual(
            [
                { value: changed_value, isValid: true, parsed: changed_value }
            ]
        );

        expect(collectionObject.get("text1")).toBe(changed_value);
        expect((fieldParserResult.current[0])).toBe(changed_value)

        // Need to make another check here (to nudge branch coverage)

        act(() => fieldParserResult.current[1](null));
        // The code doesn't change the ref's value.
        expect(refResult.current.current?.value).toBe(changed_value);


    });

    test("handles invalid values in onParse", () => {
        const { collectionObject, textField } = getCoField();
        const { result: refResult } = renderHook(() => React.useRef(null));
        const onParse = jest.fn();

        const { result: fieldParserResult } = renderHook(() => useFieldParser(
            {
                resource: collectionObject,
                field: textField,
                inputRef: refResult.current,
                parser: complexTextParser,
                onParse
            }
        ));

        const validationAttributes = getValidationAttributes(complexTextParser);

        mount(
            <Input.Generic
                forwardRef={refResult.current}
                value={(fieldParserResult.current[0])?.toString()}
                {...validationAttributes}
            />
        );

        act(() => fieldParserResult.current[1](changed_value));
        expect(onParse).toHaveBeenCalledTimes(1);
        expect(onParse.mock.calls.at(-1)).toEqual(
            [{ value: 'changed value', isValid: false, reason: 'Constraints not satisfied' }]
        );

    });

    /*
     * At this point, the hook has following code coverage:
     *   useFieldParser.tsx          |    95.8 |    31.57 |     100 |    95.8 | 97,99-100,103-105 
     * So, next unit tests are used to improve the branch coverage.
     */

    test("handles relationships", () => {
        const { collectionObject: resource } = getCoField();
        const field = tables.CollectionObject.strictGetRelationship("cataloger");
        const parser: Parser = {
            type: 'text',
            required: false
        };

        const { result: refResult } = renderHook(() => React.useRef(null));

        const onParse = jest.fn();

        const { result: fieldParserResult } = renderHook(() => useFieldParser(
            {
                resource,
                parser,
                field,
                inputRef: refResult.current,
                onParse
            }
        ));

        act(() => fieldParserResult.current[1](""));

        expect(onParse.mock.calls).toEqual(
            [[{ value: '', isValid: true, parsed: null }]]
        );

    });

    /*
     * At this point, the hook has following code coverage:
     *   useFieldParser.tsx          |    96.5 |    60.86 |     100 |    96.5 | 99-100,103-105 
     */

    test('handles numeric fields', () => {

        const resource = new tables.CollectionObject.Resource({
            id: 5,
            integer1: 15
        });

        const field = tables.CollectionObject.strictGetField(
            "integer1"
        );

        const rawParser = parsers()['java.lang.Integer'] as Parser;

        const parser: Parser = {
            ...rawParser,
            step: 3
        };

        const onParse = jest.fn();

        const { result: refResult } = renderHook(() => React.useRef(null));

        const { result: fieldParserResult } = renderHook(() => useFieldParser(
            {
                resource,
                parser,
                field,
                inputRef: refResult.current,
                onParse
            }
        ));

        act(() => fieldParserResult.current[1]("text!"));
        expect(onParse.mock.calls).toEqual(
            [
                [
                    {
                        value: 'text!',
                        isValid: false,
                        reason: 'Value must be a number'
                    }
                ]
            ]
        );
        expect(fieldParserResult.current[0]).toBe("text!");
        expect(resource.get("integer1")).toBe("text!");

        onParse.mockClear();

        act(() => fieldParserResult.current[1]("13"));

        expect(onParse.mock.calls).toEqual(
            [[{ value: '13', isValid: true, parsed: 13 }]]
        );

        expect(fieldParserResult.current[0]).toBe(12);
        expect(resource.get("integer1")).toBe(13);

    });

    /*
     * At this point, the hook has following code coverage:
     *   useFieldParser.tsx          |    98.6 |    69.23 |     100 |    98.6 | 99-100    
     */

    test("handles boolean fields", () => {

        const { collectionObject: resource } = getCoField();

        const field = tables.CollectionObject.strictGetField(
            "yesNo1"
        );

        const parser = parsers()['java.lang.Boolean'] as Parser;

        const onParse = jest.fn();

        const { result: refResult } = renderHook(() => React.useRef(null));

        const { result: fieldParserResult } = renderHook(() => useFieldParser(

            {
                resource,
                parser,
                field,
                inputRef: refResult.current,
                onParse
            }
        ));

        act(() => fieldParserResult.current[1]("invalid_value"));

        expect(onParse.mock.calls).toEqual(
            [[{ value: 'invalid_value', isValid: true, parsed: false }]]
        );

        expect(fieldParserResult.current[0]).toBe(false);
        expect(resource.get("yesNo1")).toBe(false);

        onParse.mockClear();

        act(() => fieldParserResult.current[1]("yes"));

        expect(onParse.mock.calls).toEqual(
            [[{ value: 'yes', isValid: true, parsed: true }]]
        );

        expect(fieldParserResult.current[0]).toBe(true);
        expect(resource.get("yesNo1")).toBe(true);

    });


    // This test is added to nudge branch coverage
    test("handle undefined parser type, and resource, and field", () => {
        let parser: Parser = {};
        const { result: refResult } = renderHook(() => React.useRef(null));
        const onParse = jest.fn();

        let resource: SpecifyResource<AnySchema> | undefined = undefined;

        const { result: fieldParserResult, rerender } = renderHook(() => useFieldParser(

            {
                resource,
                parser,
                field: undefined,
                inputRef: refResult.current,
                onParse
            }
        ));

        expect(fieldParserResult.current[0]).toBeUndefined();

        act(() => fieldParserResult.current[1](changed_value));

        expect(fieldParserResult.current[0]).toBeUndefined();

        const { collectionObject } = getCoField();

        resource = collectionObject;

        act(rerender);

        act(() => fieldParserResult.current[1](changed_value));

        expect(fieldParserResult.current[0]).toBeUndefined();

        parser = { type: "text" }

        act(rerender);

        act(() => fieldParserResult.current[1](changed_value));

        expect(fieldParserResult.current[0]).toBe(changed_value);

    });


})