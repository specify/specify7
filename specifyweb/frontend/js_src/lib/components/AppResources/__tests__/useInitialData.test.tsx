import { renderHook, waitFor } from '@testing-library/react';
import { exportsForTests } from '../EditorWrapper';
import { staticAppResources } from './staticAppResources';
import { overrideAjax } from '../../../tests/ajax';
import { getResourceApiUrl } from '../../DataModel/resource';
import { requireContext } from '../../../tests/helpers';

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

    test("case: /static/config/", async () => {

        const templateFile = "icons_disciplines.xml";

        const { result } = renderHook(() => useInitialData(resource, undefined, templateFile));

        await waitFor(() => {
            // Eventually, it would return string.
            expect(typeof result.current).toBe("string");
            expect(result.current).not.toBe("");
        });

    });

});