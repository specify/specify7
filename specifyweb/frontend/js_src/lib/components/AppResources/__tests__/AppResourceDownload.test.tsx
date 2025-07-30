import { render } from '@testing-library/react';
import React from 'react';

import { mount } from "../../../tests/reactUtils";
import { f } from "../../../utils/functools";
import { LoadingContext } from "../../Core/Contexts";
import * as FilePickerModule from "../../Molecules/FilePicker";
import { AppResourceDownload } from "../EditorComponents";
import { testAppResources } from "./testAppResources";

const mockDownload = jest.fn();

jest.spyOn(FilePickerModule, 'downloadFile').mockImplementation(mockDownload);

beforeEach(() => {
    mockDownload.mockClear();
});

describe('AppResourceDownload', () => {
    const resource = testAppResources.appResources[0];
    const testData = 'testString';

    test('simple render', () => {
        const { asFragment } = render(
            <LoadingContext.Provider value={f.void}>
                <AppResourceDownload data={testData} resource={resource} />
            </LoadingContext.Provider>
        );
        expect(asFragment()).toMatchSnapshot();
    });

    test('download file', async () => {
        const { getByRole, user } = mount(
            <LoadingContext.Provider value={f.void}>
                <AppResourceDownload data={testData} resource={resource} />
            </LoadingContext.Provider>
        );
        const button = getByRole('button');
        await user.click(button);
        expect(mockDownload).toHaveBeenCalled();
        expect(mockDownload.mock.lastCall).toEqual([
            'preferences.properties',
            'testString',
        ]);
    });
});
