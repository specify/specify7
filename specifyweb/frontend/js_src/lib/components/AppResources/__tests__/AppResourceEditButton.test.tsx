import React from "react";
import { mount } from "../../../tests/reactUtils";
import { localized } from "../../../utils/types";
import { tables } from "../../DataModel/tables";
import { AppResourceEditButton } from "../EditorComponents";
import { testAppResources } from "./testAppResources";
import { f } from "../../../utils/functools";
import { requireContext } from "../../../tests/helpers";
import { clearIdStore } from "../../../hooks/useId";
import { UnloadProtectsContext } from "../../Router/UnloadProtect";
import { waitFor } from "@testing-library/react";
import { overrideAjax } from "../../../tests/ajax";
import { Http } from "../../../utils/ajax/definitions";
import { LoadingContext } from "../../Core/Contexts";

requireContext();

beforeEach(() => {
    clearIdStore();
});

jest.setTimeout(1000 * 60 * 60 * 24);

describe("AppResourceEditButton", () => {

    test("simple render", () => {

        const resource = new tables.SpAppResource.Resource({
            name: "TestName",
            spAppResourceDir: testAppResources.directories[0].resource_uri
        });

        const { asFragment } = mount(
            <AppResourceEditButton
                title={localized("TestTitle")}
                appResource={resource}
                onDeleted={f.void}
            ><></>
            </AppResourceEditButton>
        );

        expect(asFragment()).toMatchSnapshot();

    });

    test("edit click test", async () => {
        const resource = new tables.SpAppResource.Resource({
            name: "TestName",
            spAppResourceDir: testAppResources.directories[0].resource_uri
        });
        const handleDeleted = jest.fn();

        const { getByRole, user } = mount(
            <UnloadProtectsContext.Provider value={[]}>
                <AppResourceEditButton
                    title={localized("TestTitle")}
                    appResource={resource}
                    onDeleted={handleDeleted}
                ><></>
                </AppResourceEditButton>
            </UnloadProtectsContext.Provider>
        );

        const button = getByRole("button");
        await user.click(button);

        await waitFor(() => {
            getByRole("dialog");
        });

        const dialog = getByRole('dialog');
        expect(dialog.innerHTML).toMatchInlineSnapshot(`
"<div class=\\"
          flex items-center gap-2 md:gap-4
          -m-4 cursor-move p-4
          flex-wrap
        \\" id=\\"modal-0-handle\\"><div class=\\"flex items-center gap-2\\"><h2 class=\\"font-semibold text-black dark:text-white text-xl\\" id=\\"modal-0-header\\">TestTitle</h2></div></div><div class=\\"
            dark:text-neutral-350 -mx-1 flex-1 overflow-y-auto px-1 py-4
            text-gray-700 flex flex-col gap-2
          \\" id=\\"modal-0-content\\"></div><div class=\\"flex gap-2 justify-end\\"><span class=\\"-ml-2 flex-1\\"></span><button class=\\"button rounded cursor-pointer active:brightness-80 px-4 py-2
    disabled:bg-gray-200 disabled:dark:ring-neutral-500 disabled:ring-gray-400 disabled:text-gray-500 
    dark:disabled:!bg-neutral-700 gap-2 inline-flex items-center capitalize justify-center shadow-sm button hover:brightness-90 dark:hover:brightness-125 bg-[color:var(--secondary-button-color)] text-gray-800 shadow-sm
dark:text-gray-100\\" type=\\"button\\">Close</button></div>"
`);

        expect(handleDeleted).not.toHaveBeenCalled();
    });

    overrideAjax(`/api/delete_blockers/spappresource/3/`, []);
    overrideAjax(`/api/specify/spappresource/3/`, {
        id: 3,
        name: "TestName",
        spAppResourceDir: testAppResources.directories[0].resource_uri,
    });
    overrideAjax(`/api/specify/spappresource/3/`, '', {
        method: 'DELETE',
        responseCode: Http.NO_CONTENT,
    });

    test("delete resource test", async () => {
        const resource = new tables.SpAppResource.Resource({
            id: 3
        });

        const handleDeleted = jest.fn();
        const promiseHandler = jest.fn();

        const { getAllByRole, user, getByRole } = mount(
            <UnloadProtectsContext.Provider value={[]}>
                <LoadingContext.Provider value={promiseHandler}>
                    <AppResourceEditButton
                        title={localized("TestTitle")}
                        appResource={resource}
                        onDeleted={handleDeleted}
                    ><></>
                    </AppResourceEditButton>
                </LoadingContext.Provider>
            </UnloadProtectsContext.Provider>
        );

        const button = getByRole("button")
        await user.click(button);

        await waitFor(() => {
            getByRole("dialog");
        });

        await user.click(getAllByRole('button')[1]);

        await user.click(getAllByRole('button')[3]);

        expect(handleDeleted).toBeCalledTimes(1);

    })
});