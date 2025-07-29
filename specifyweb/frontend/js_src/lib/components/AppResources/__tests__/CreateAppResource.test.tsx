import { waitFor } from "@testing-library/react";
import React from "react";

import { clearIdStore } from "../../../hooks/useId";
import { requireContext } from "../../../tests/helpers";
import { mount } from "../../../tests/reactUtils";
import { TestComponentWrapperRouter } from "../../../tests/utils";
import { LoadingContext } from "../../Core/Contexts";
import { UnloadProtectsContext } from "../../Router/UnloadProtect";
import { CreateAppResource } from "../Create";
import { testAppResources } from "./testAppResources";

requireContext();

beforeEach(() => {
    // This makes the tests determinstic (otherwise, the run order will affect the IDs) 
    clearIdStore();
});

describe("CreateAppResource", () => {

    test("simple no type test", () => {

        const setter = jest.fn();

        const { getByRole } = mount(
            <TestComponentWrapperRouter
                context={{ getSet: [testAppResources, setter] }}
                initialEntries={["/resources/create/discipline_3"]}
                path="resources/create/:directoryKey"
            >
                <UnloadProtectsContext.Provider value={[]}>
                    <CreateAppResource />
                </UnloadProtectsContext.Provider>
            </TestComponentWrapperRouter>
        );

        expect(getByRole('dialog').textContent).toMatchInlineSnapshot(`"Select Resource TypeApp ResourceForm DefinitionCancel"`);
    });

    test("simple AppResource type (mimetype undefined)", async () => {

        const setter = jest.fn();

        const { getAllByRole, user, getByRole } = mount(
            <TestComponentWrapperRouter
                context={{ getSet: [testAppResources, setter] }}
                initialEntries={["/resources/create/discipline_3"]}
                path="resources/create/:directoryKey"
            >
                <UnloadProtectsContext.Provider value={[]}>
                    <CreateAppResource />
                </UnloadProtectsContext.Provider>
            </TestComponentWrapperRouter>
        );

        const appResourceButton = getAllByRole("button")[0];
        await user.click(appResourceButton);

        //  This is a lot more cleaner than the inner HTML
        expect(getByRole('dialog').textContent).toMatchInlineSnapshot(`"Select Resource TypeTypeDocumentationLabelDocumentation(opens in a new tab)ReportDocumentation(opens in a new tab)Default User PreferencesDocumentation(opens in a new tab)Leaflet LayersDocumentation(opens in a new tab)RSS Export FeedDocumentation(opens in a new tab)Express Search ConfigDocumentation(opens in a new tab)Type SearchesDocumentation(opens in a new tab)Web LinksDocumentation(opens in a new tab)Field FormattersDocumentation(opens in a new tab)Record FormattersDocumentation(opens in a new tab)Data Entry TablesDocumentation(opens in a new tab)Interactions TablesDocumentation(opens in a new tab)Other XML ResourceOther JSON ResourceOther Properties ResourceOther ResourceCancel"`);

    });

    test("simple Form type (mimetype undefined)", async () => {
        const setter = jest.fn();
        const promiseHandler = jest.fn();
        const { getAllByRole, user, getByRole, asFragment } = mount(
            <TestComponentWrapperRouter
                context={{ getSet: [testAppResources, setter] }}
                initialEntries={["/resources/create/discipline_3"]}
                path="resources/create/:directoryKey"
            >
                <UnloadProtectsContext.Provider value={[]}>
                    <LoadingContext.Provider value={promiseHandler}>
                        <CreateAppResource />
                    </LoadingContext.Provider>
                </UnloadProtectsContext.Provider>
            </TestComponentWrapperRouter >
        );

        const formButton = getAllByRole("button")[1];
        await user.click(formButton);

        try {
            await waitFor(() => {
                expect(asFragment).toThrowErrorMatchingSnapshot(`<DocumentFragment />`);
            })
        } catch {
            /*
             * This is hacky. Essentially, we want to wait till the dialog gets populated
             * since the useAsyncState won't resolve immediately.
             * 
             */
        }

        expect(getByRole('dialog').textContent).toMatchInlineSnapshot(`"Copy default formsHerpetologyHerpetology > Guest > HerpetologyHerpetology > Manager > HerpetologyBirdBird > Guest > BirdBird > Manager > BirdMammalMammal > Guest > MammalMammal > Manager > MammalVertpaleoVertpaleo > Guest > VertpaleoVertpaleo > Manager > VertpaleoFishFish > Guest > FishFish > Manager > FishInvertebrateInvertebrate > Guest > InvertebrateInvertebrate > Manager > InvertebrateInsect > EntoInsect > Guest > EntoInsect > Manager > EntoBotanyBotany > Guest > BotanyBotany > Manager > BotanyGeologyCommonBackstop > GlobalBackstop > SearchInvertpaleo > PaleoInvertpaleo > Guest > PaleoInvertpaleo > Manager > PaleoNew"`);

    });


});