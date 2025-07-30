import { fireEvent, render, waitFor } from "@testing-library/react";
import React from 'react';

import { clearIdStore } from "../../../hooks/useId";
import { mount } from '../../../tests/reactUtils';
import { f } from "../../../utils/functools";
import { LoadingContext } from "../../Core/Contexts";
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import { AppResourceLoad } from '../EditorComponents';

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
        const { getByRole, user } = mount(
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
            expect(handleLoaded).toHaveBeenCalledTimes(1);
            expect(handleLoaded).toHaveBeenCalledWith('Some Text Contents', 'text/plain');
        });

    })

})