import { Tabs } from "../Tabs";
import React from "react";
import { mount } from "../../../tests/reactUtils";
import { clearIdStore } from "../../../hooks/useId";

beforeEach(() => {
    clearIdStore();
});


describe("Tabs", () => {

    test("simple no tabs", () => {

        const handleChange = jest.fn();

        const { asFragment } = mount(<Tabs tabs={{}} index={[0, handleChange]} />)
        expect(asFragment()).toMatchSnapshot();
    });

    test('first tab selected, and then second', async () => {

        const handleChange = jest.fn();

        const tabs = {
            'tab1': <h1>Tab1</h1>,
            'tab2': <h1>Tab2</h1>
        };

        const { asFragment, getAllByRole, user } = mount(<Tabs tabs={tabs} index={[0, handleChange]} />);
        expect(asFragment()).toMatchSnapshot();
        expect(handleChange).not.toHaveBeenCalled();

        const tabElements = getAllByRole('tab');
        await user.click(tabElements[1]);

        expect(handleChange).toHaveBeenCalled();
        expect(handleChange).toBeCalledWith(1);
        expect(asFragment()).toMatchSnapshot();
    });
});