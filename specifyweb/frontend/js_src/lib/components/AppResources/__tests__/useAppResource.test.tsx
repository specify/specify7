import React from "react";
import { SerializedResource } from "../../DataModel/helperTypes";
import { SpAppResource, SpViewSetObj } from "../../DataModel/types";
import { exportsForTests } from "../EditorWrapper";
import { AppResourceMode } from "../helpers";
import { AppResources } from "../hooks";
import { render, waitFor } from "@testing-library/react";
import * as Router from 'react-router-dom';
import { requireContext } from "../../../tests/helpers";
import { tables } from "../../DataModel/tables";
import { staticAppResources } from "./staticAppResources"
import { serializeResource } from "../../DataModel/serializers";
import { WritableArray } from "../../../utils/types";
import { removeKey } from "../../../utils/utils";


requireContext();

const { useAppResource } = exportsForTests;


function TestComponent({ newResource, resources, mode, onResultSet: handleResultSet }: {
    readonly newResource: SerializedResource<SpAppResource | SpViewSetObj>,
    readonly resources: AppResources,
    readonly mode: AppResourceMode
    readonly onResultSet: (value: SerializedResource<SpAppResource | SpViewSetObj>) => void;
}): JSX.Element {
    const result = useAppResource(newResource, resources, mode);
    React.useEffect(() => {
        handleResultSet(result);
    }, [result]);
    return <></>
}

function TestComponentWrapper(
    props: Parameters<typeof TestComponent>[0] & { readonly initialEntries: WritableArray<string> }
): JSX.Element {
    return <Router.MemoryRouter initialEntries={props.initialEntries}>
        <Router.Routes>
            <Router.Route element={
                <TestComponent
                    {...removeKey(props, "initialEntries")}
                />
            }
                path=":id" />
        </Router.Routes>
    </Router.MemoryRouter >
}

describe("useAppResource", () => {

    test("appResource mode (existing resorurce)", async () => {

        const spAppResource = new tables.SpAppResource.Resource({ name: "Brand New Resource" });
        const serializedNewResource = serializeResource(spAppResource);

        const onResultSet = jest.fn();
        const appResourceToUse = staticAppResources.appResources[0];

        render(
            <TestComponentWrapper
                initialEntries={[`/${appResourceToUse.id}`]}
                newResource={serializedNewResource}
                resources={
                    staticAppResources as unknown as AppResources
                }
                mode="appResources"
                onResultSet={onResultSet}
            />
        )

        await waitFor(() => {
            expect(onResultSet).toBeCalledTimes(1);
            expect(onResultSet).toBeCalledWith(appResourceToUse);
        });
    });

    test("appResource mode (new resorurce)", async () => {

        const spAppResource = new tables.SpAppResource.Resource({ name: "Brand New Resource" });
        const serializedNewResource = serializeResource(spAppResource);

        const onResultSet = jest.fn();

        render(
            <TestComponentWrapper
                initialEntries={[`/2048`]}
                newResource={serializedNewResource}
                resources={
                    staticAppResources as unknown as AppResources
                }
                mode="appResources"
                onResultSet={onResultSet}
            />
        );

        await waitFor(() => {
            expect(onResultSet).toBeCalledTimes(1);
            expect(onResultSet).toBeCalledWith(serializedNewResource);
        });
    });


    test("viewSets mode (existing resorurce)", async () => {

        const spViewSetResource = new tables.SpViewSetObj.Resource({ name: "Brand New ViewSet Resource" });
        const serializedNewResource = serializeResource(spViewSetResource);

        const onResultSet = jest.fn();
        const viewSetToUse = staticAppResources.viewSets[0];

        render(
            <TestComponentWrapper
                initialEntries={[`/${viewSetToUse.id}`]}
                newResource={serializedNewResource}
                resources={
                    staticAppResources as unknown as AppResources
                }
                mode="viewSets"
                onResultSet={onResultSet}
            />
        );

        await waitFor(() => {
            expect(onResultSet).toBeCalledTimes(1);
            expect(onResultSet).toBeCalledWith(viewSetToUse);
        });
    });

    test("viewSets mode (new resorurce)", async () => {

        const spViewSetResource = new tables.SpViewSetObj.Resource({ name: "Brand New ViewSet Resource" });
        const serializedNewResource = serializeResource(spViewSetResource);

        const onResultSet = jest.fn();

        render(
            <TestComponentWrapper
                initialEntries={[`/2048`]}
                newResource={serializedNewResource}
                resources={
                    staticAppResources as unknown as AppResources
                }
                mode="viewSets"
                onResultSet={onResultSet}
            />
        );

        await waitFor(() => {
            expect(onResultSet).toBeCalledTimes(1);
            expect(onResultSet).toBeCalledWith(serializedNewResource);
        });
    });
});