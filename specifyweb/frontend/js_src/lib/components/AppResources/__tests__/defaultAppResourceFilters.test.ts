import { defaultAppResourceFilters } from '../filtersHelpers';

test('defaultAppResourceFilters', () => {
  expect(defaultAppResourceFilters).toMatchInlineSnapshot(`
    {
      "appResources": [
        "collectionPreferences",
        "dataEntryTables",
        "dataObjectFormatters",
        "defaultUserPreferences",
        "expressSearchConfig",
        "interactionsTables",
        "label",
        "leafletLayers",
        "otherAppResources",
        "otherJsonResource",
        "otherPropertiesResource",
        "otherXmlResource",
        "remotePreferences",
        "report",
        "rssExportFeed",
        "typeSearches",
        "uiFormatters",
        "userPreferences",
        "webLinks",
      ],
      "viewSets": true,
    }
  `);
});
