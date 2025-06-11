import React from "react";

import { tables } from "../../components/DataModel/tables";
import { requireContext } from "../../tests/helpers";
import { mount } from "../../tests/reactUtils";
import { Input } from '../../components/Atoms/Form'
import { getValidationAttributes, Parser } from "../../utils/parser/definitions";
import { renderHook } from "@testing-library/react";
import { useResourceValue } from "../useResourceValue";
import { getFieldBlockers } from "../../components/DataModel/saveBlockers";
import { RA } from "../../utils/types";

requireContext();

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

        const textField = collectionObject.specifyTable.strictGetField("text1");

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

        expectArrayEqual(getFieldBlockers(collectionObject, textField), ['Constraints not satisfied']);

        await user.type(text, "a");

        expect(collectionObject.get("text1")).toBe("aba");

        expectArrayEqual(getFieldBlockers(collectionObject, textField), []);

    });

});
