import { renderHook, waitFor } from '@testing-library/react';
import { exportsForTests } from '../EditorWrapper';
import { staticAppResources } from './staticAppResources';
import { overrideAjax } from '../../../tests/ajax';
import { getResourceApiUrl } from '../../DataModel/resource';
import { requireContext } from '../../../tests/helpers';
import { appResourceSubTypes } from '../types';
import { tables } from '../../DataModel/tables';
import { serializeResource } from '../../DataModel/serializers';

requireContext();


const { useInitialData } = exportsForTests;

describe("useInitialData", () => {

    const resource = staticAppResources.appResources[0];
    const spAppResourceDataId = 1;
    const spAppResourceData = {
        id: 1,
        data: "This is sp app resource data",
        _tableName: "spappresourcedata"
    };

    overrideAjax(getResourceApiUrl("SpAppResourceData", spAppResourceDataId), spAppResourceData);

    test("case: spAppResourceData", async () => {

        const { result } = renderHook(() => useInitialData(resource, spAppResourceDataId, undefined));

        await waitFor(() => {
            expect(result.current).toBe(spAppResourceData.data);
        });

    });

    test("case: using static template file", async () => {

        const templateFile = "icons_disciplines.xml";

        const { result } = renderHook(() => useInitialData(resource, undefined, templateFile));

        await waitFor(() => {
            // Eventually, it would return string.
            expect(typeof result.current).toBe("string");
            expect(result.current).not.toBe("");
        });

    });

    test("case: not using template", async () => {

        // We use this below assumption
        expect(appResourceSubTypes.userPreferences.useTemplate).toBe(false);

        const preferenceResource = new tables.SpAppResource.Resource({
            id: 5,
            name: "UserPreferences",
            mimeType: undefined
        });

        const { result } = renderHook(() => useInitialData(
            serializeResource(preferenceResource),
            undefined,
            undefined
        )
        );

        await waitFor(() => {
            expect(result.current).toBe(false);
        });

    });


    test("case: using template", async () => {
        const { result } = renderHook(() => useInitialData(
            staticAppResources.appResources[2],
            undefined,
            undefined
        )
        );

        await waitFor(() => {
            expect(typeof result.current).toBe("string");
        });

    });

});