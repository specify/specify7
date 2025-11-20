import { allAppResources } from '../filtersHelpers';

test('allAppResources', () => {
  expect(allAppResources).toMatchInlineSnapshot(`
    [
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
    ]
  `);
});
