import React from 'react';
import { fireEvent, render, waitFor } from "@testing-library/react";
import { clearIdStore } from "../../../hooks/useId";
import { LoadingContext } from "../../Core/Contexts";
import { f } from "../../../utils/functools";
import { AppResourceLoad } from '../EditorComponents';
import { mount } from '../../../tests/reactUtils';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';

beforeEach(() => {
    clearIdStore();
});


describe("AppResourceLoad", () => {

    test("simple render", () => {
        const handleLoaded = jest.fn();
        const { asFragment } = render(
            <LoadingContext.Provider value={f.void}>
                <AppResourceLoad onLoaded={handleLoaded} />
            </LoadingContext.Provider>
        );

        expect(handleLoaded).not.toHaveBeenCalled();
        expect(asFragment()).toMatchSnapshot();
    });

    test("load file", async () => {
        const handleLoaded = jest.fn();
        const { getByRole, user, asFragment, container } = mount(
            <UnloadProtectsContext.Provider value={[]}>
                <LoadingContext.Provider value={f.void}>
                    <AppResourceLoad onLoaded={handleLoaded} />
                </LoadingContext.Provider>
            </UnloadProtectsContext.Provider>
        );

        await user.click(getByRole('button'));

        await waitFor(() => {
            getByRole('dialog');
        });

        expect(getByRole('heading').textContent).toMatchInlineSnapshot(`"Load File"`);
        const input = (Array.from(getByRole('dialog').getElementsByTagName('input')))[0];

        const testFile = new File(['Some Text Contents'], "testName", {
            type: 'text/plain',
        });

        await user.upload(input, testFile);
        fireEvent.change(input, { target: { files: [testFile] } });

        await waitFor(() => {
            expect(handleLoaded).toBeCalledTimes(1);
            expect(handleLoaded).toBeCalledWith('Some Text Contents', 'text/plain');
        });

    })

})