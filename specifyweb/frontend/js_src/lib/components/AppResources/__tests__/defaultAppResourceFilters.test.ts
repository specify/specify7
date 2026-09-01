import { defaultAppResourceFilters } from '../filtersHelpers';

test('defaultAppResourceFilters', () => {
  expect(defaultAppResourceFilters).toMatchInlineSnapshot(`
{
  "appResources": [
    "collectionPreferences",
    "dataEntryTables",
    "dataObjectFormatters",
    "dataViewQueries",
    "defaultUserPreferences",
    "expressSearchConfig",
    "interactionsTables",
    "label",
    "leafletLayers",
    "otherAppResources",
    "otherJsonResource",
    "otherPropertiesResource",
    "otherXmlResource",
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
