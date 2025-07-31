import React from "react";

import { mount } from "../../../tests/reactUtils";
import { getCache, setCache } from "../../../utils/cache";
import { UnloadProtectsContext } from "../../Router/UnloadProtect";
import { AppResourcesFilters } from "../Filters";
import { testAppResources } from "./testAppResources";

beforeEach(() => {
    setCache('appResources', 'filters', { appResources: [], viewSets: false }, false);
})

describe("AppResourcesFilters", () => {

    test("simple render", () => {

        const { asFragment } = mount(
            <AppResourcesFilters initialResources={testAppResources} />
        );

        expect(asFragment()).toMatchSnapshot();
    })

    test("selecting viewsets", async () => {

        const { getAllByRole, user } = mount(
            <AppResourcesFilters initialResources={testAppResources} />
        );

        const button = getAllByRole('button')[0];

        await user.click(button);

        const filters = getCache('appResources', 'filters');
        expect(filters).toEqual({
            'appResources': [],
            'viewSets': true
        });


    });

    test("selecting app resources", async () => {

        const { getAllByRole, user } = mount(
            <AppResourcesFilters initialResources={testAppResources} />
        );

        const button = getAllByRole('button')[1];

        await user.click(button);

        const filters = getCache('appResources', 'filters');
        expect(filters).toEqual(
            {
                viewSets: false,
                appResources: [
                    'collectionPreferences',
                    'dataEntryTables',
                    'dataObjectFormatters',
                    'defaultUserPreferences',
                    'expressSearchConfig',
                    'interactionsTables',
                    'label',
                    'leafletLayers',
                    'otherAppResources',
                    'otherJsonResource',
                    'otherPropertiesResource',
                    'otherXmlResource',
                    'report',
                    'rssExportFeed',
                    'typeSearches',
                    'uiFormatters',
                    'userPreferences',
                    'webLinks'
                ]
            }
        );

    });

    test("custom app resource filter", async () => {

        const { user, getAllByRole } = mount(
            <UnloadProtectsContext.Provider value={[]}>
                <AppResourcesFilters initialResources={testAppResources} />
            </UnloadProtectsContext.Provider>
        );

        const button = getAllByRole('button')[2];

        await user.click(button);

        const checkBoxes = getAllByRole('checkbox');

        await user.click(checkBoxes[0]);

        await user.click(checkBoxes[2]);
        await user.click(checkBoxes[3]);

        const filters = getCache('appResources', 'filters');
        expect(filters).toEqual(
            {
                appResources: [
                    'label',
                    'report'
                ],
                viewSets: true
            }
        );
    });
});