import React from "react";
import { mount } from "../../../tests/reactUtils";
import { f } from "../../../utils/functools";
import { localized } from "../../../utils/types";
import { deserializeResource } from "../../DataModel/serializers";
import { AppResourcesTab } from "../Tabs";
import { testAppResources } from "./testAppResources";
import { requireContext } from "../../../tests/helpers";
import { Button } from "../../Atoms/Button";
import { AppResourceTabProps } from "../TabDefinitions";
import { UnloadProtectsContext } from "../../Router/UnloadProtect";
import { clearIdStore } from "../../../hooks/useId";


beforeEach(() => {
    clearIdStore();
});

requireContext();

function Component(props: AppResourceTabProps) {
    return <h1>Data: {props.data}</h1>
}

describe("AppResourcesTab", () => {

    test("simple render", () => {

        const { asFragment } = mount(<AppResourcesTab
            tab={Component}
            label={localized("test")}
            appResource={deserializeResource(testAppResources.appResources[0])}
            resource={testAppResources.appResources[0]}
            directory={testAppResources.directories[0]}
            data={"TestData"}
            isFullScreen={[false, f.void]}
            onChange={f.void}
            onSetCleanup={f.void}
            footer={<h3>TestFooter</h3>}
            headerButtons={<Button.Info onClick={f.void} />}
        />);

        expect(asFragment()).toMatchSnapshot();
    });

    test("dialog render", () => {

        const { getByRole } = mount(
            <UnloadProtectsContext.Provider value={[]}>
                <AppResourcesTab
                    tab={Component}
                    label={localized("test")}
                    appResource={deserializeResource(testAppResources.appResources[0])}
                    resource={testAppResources.appResources[0]}
                    directory={testAppResources.directories[0]}
                    data={"TestData"}
                    isFullScreen={[true, f.void]}
                    onChange={f.void}
                    onSetCleanup={f.void}
                    footer={<h3>TestFooter</h3>}
                    headerButtons={<Button.Info onClick={f.void} />}
                />
            </UnloadProtectsContext.Provider>
        );

        const dialog = getByRole('dialog');
        expect(dialog).toMatchSnapshot();
    });
});