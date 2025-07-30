import React from "react";
import { render } from "@testing-library/react";
import { LoadingContext } from "../../Core/Contexts";
import { f } from "../../../utils/functools";
import { AppResourceDownload } from "../EditorComponents";
import { testAppResources } from "./testAppResources";
import { mount } from "../../../tests/reactUtils";
import * as FilePickerModule from "../../Molecules/FilePicker";

const mockDownload = jest.fn();

jest.spyOn(FilePickerModule, 'downloadFile').mockImplementation(mockDownload);

beforeEach(() => {
    mockDownload.mockClear();
});

describe("AppResourceDownload", () => {

    const resource = testAppResources.appResources[0];
    const testData = "testString";

    test("simple render", () => {
        const { asFragment } = render(
            <LoadingContext.Provider value={f.void}>
                <AppResourceDownload resource={resource} data={testData} />
            </LoadingContext.Provider>
        );
        expect(asFragment()).toMatchSnapshot();
    });

    test('download file', async () => {
        const { getByRole, user } = mount(
            <LoadingContext.Provider value={f.void}>
                <AppResourceDownload resource={resource} data={testData} />
            </LoadingContext.Provider>
        );
        const button = getByRole('button');
        await user.click(button);
        expect(mockDownload).toBeCalledTimes(1);
        expect(mockDownload).toHaveBeenCalledWith("preferences.properties", "testString")
    });


});