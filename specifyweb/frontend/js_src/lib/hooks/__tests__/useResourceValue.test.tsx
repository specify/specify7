import React from "react";

import { tables } from "../../components/DataModel/tables";
import { requireContext } from "../../tests/helpers";
import { mount } from "../../tests/reactUtils";
import { Input } from '../../components/Atoms/Form'
import { getValidationAttributes, Parser } from "../../utils/parser/definitions";
import { act, renderHook } from "@testing-library/react";
import { useResourceValue } from "../useResourceValue";
import { getFieldBlockers } from "../../components/DataModel/saveBlockers";
import { RA } from "../../utils/types";
import { formsText } from "../../localization/forms";

requireContext();

const CONSTRAINTS_NOT_SATISFIED = ['Constraints not satisfied']
const SHOULD_BE_MULTIPLE_OF_TWO = "Should be multiple of two"

describe("useResourceValue", () => {

    // TODO: make this part of utils?
    const expectArrayEqual = (base: RA<unknown>, compare: RA<unknown>) => {
        expect(base.length).toBe(compare.length);
        base.forEach((baseElement, index) => expect(baseElement).toBe(compare[index]));
    }

    it("sets saveblockers on incorrect values (regex)", async () => {
        const collectionObject = new tables.CollectionObject.Resource({
            id: 5
        });

        const textField = tables.CollectionObject.strictGetField("text1");

        // This parser only allows the value of anything that begins and ends with "a", including "a"
        const defaultParser: Parser = {
            type: 'text',
            pattern: new RegExp("^a$|^a[a-z]*a$", 'u')
        };

        const { result } = renderHook((props) => useResourceValue(props.resource, props.field, props.defaultParser),
            {
                initialProps: {
                    resource: collectionObject,
                    field: textField,
                    defaultParser
                }
            }
        );

        const validationAttributes = getValidationAttributes(result.current.parser);

        const { getByRole, user } = mount(
            <Input.Text {...validationAttributes}
                value={result.current.value?.toString()}
                forwardRef={result.current.validationRef}
                onValueChange={(value) => result.current.updateValue(value, false)}
                onChange={(event): void => result.current.updateValue(event.target.value, false)}
            />
        );

        const text = getByRole("textbox") as HTMLTextAreaElement;

        await user.type(text, "a");

        expect(collectionObject.get("text1")).toBe("a");

        expectArrayEqual(getFieldBlockers(collectionObject, textField), []);

        await user.type(text, "b");

        expect(collectionObject.get("text1")).toBe("ab");

        expectArrayEqual(getFieldBlockers(collectionObject, textField), CONSTRAINTS_NOT_SATISFIED);

        await user.type(text, "a");

        expect(collectionObject.get("text1")).toBe("aba");

        expectArrayEqual(getFieldBlockers(collectionObject, textField), []);

    });

    it("sets saveblockers on incorrect values (integer)", async () => {
        const collectionObject = new tables.CollectionObject.Resource({
            id: 5
        });

        const integerField = tables.CollectionObject.strictGetField("integer1");

        // This parser only allows the value of anything that begins and ends with "a", including "a"
        const defaultParser: Parser = {
            type: 'number',
            min: 5,
            max: 8,
            value: 6,
            required: true
        };

        const { result } = renderHook((props) => useResourceValue(props.resource, props.field, props.defaultParser),
            {
                initialProps: {
                    resource: collectionObject,
                    field: integerField,
                    defaultParser
                }
            }
        );

        const validationAttributes = getValidationAttributes(result.current.parser);

        const { getByRole, user } = mount(
            <Input.Integer
                {...validationAttributes}
                value={result.current.value?.toString()}
                forwardRef={result.current.validationRef}
                onValueChange={(value) => result.current.updateValue(value, false)}
                onChange={(event): void => result.current.updateValue(event.target.value, false)}
            />
        );

        const numeric = getByRole("spinbutton") as HTMLInputElement;

        await user.type(numeric, "9");

        expectArrayEqual(getFieldBlockers(collectionObject, integerField), CONSTRAINTS_NOT_SATISFIED);

        await user.clear(numeric);

        expectArrayEqual(getFieldBlockers(collectionObject, integerField), [formsText.requiredField()]);

        await user.type(numeric, "7");

        expectArrayEqual(getFieldBlockers(collectionObject, integerField), []);
        expect(collectionObject.get("integer1")).toBe('7');
    });

    it("updates value on backbone set events", async () => {

        const collectionObject = new tables.CollectionObject.Resource({
            id: 5
        });

        const integerField = tables.CollectionObject.strictGetField("integer1");

        // This parser only allows the value of anything that begins and ends with "a", including "a"
        const defaultParser: Parser = {
            type: 'number',
            min: 5,
            max: 8,
            value: 6,
            required: true,
            validators: [(value: unknown) => (typeof value === 'number' && ((value % 2) == 0)) ? undefined : SHOULD_BE_MULTIPLE_OF_TWO]
        };

        renderHook((props) => useResourceValue(props.resource, props.field, props.defaultParser),
            {
                initialProps: {
                    resource: collectionObject,
                    field: integerField,
                    defaultParser
                }
            }
        );

        await act(() => {
            // This is done instead of set() because it has typechecks (which is the point of this test)
            collectionObject.bulkSet({ "integer1": "this is not a number" })
        });

        expectArrayEqual(getFieldBlockers(collectionObject, integerField), [formsText.inputTypeNumber()]);

        await act(() => {
            collectionObject.set("integer1", null);
        });

        expectArrayEqual(getFieldBlockers(collectionObject, integerField), [formsText.requiredField()]);

        await act(() => {
            collectionObject.set("integer1", 3);
        });

        expectArrayEqual(getFieldBlockers(collectionObject, integerField), [SHOULD_BE_MULTIPLE_OF_TWO]);

        await act(() => {
            collectionObject.set("integer1", 6);
        });

        expectArrayEqual(getFieldBlockers(collectionObject, integerField), []);
    });



});
