import { requireContext } from '../../../tests/helpers';
import { exportsForTests } from '../tree';
import { staticAppResources } from './staticAppResources';
import { utilsForTests } from './utils';

const { getCollectionResources } = exportsForTests;
const { testDisciplines } = utilsForTests;

requireContext();

describe('getCollectionResources', () => {
  test('simple collection resources', () => {
    const scopedResources = getCollectionResources(
      staticAppResources.collections[0],
      {
        ...staticAppResources,
        directories: [],
        disciplines: testDisciplines,
      }
    );

    expect(scopedResources).toMatchInlineSnapshot(`
      [
        {
          "appResources": [],
          "directory": undefined,
          "key": "users",
          "label": "User Accounts",
          "subCategories": [
            {
              "appResources": [],
              "directory": {
                "_tableName": "SpAppResourceDir",
                "collection": "/api/specify/collection/65536/",
                "createdByAgent": null,
                "discipline": "/api/specify/discipline/3/",
                "disciplineType": null,
                "isPersonal": true,
                "modifiedByAgent": null,
                "resource_uri": undefined,
                "specifyUser": "/api/specify/specifyuser/5/",
                "timestampCreated": "2022-08-31",
                "timestampModified": null,
                "userType": null,
                "version": 1,
              },
              "key": "collection_65536_user_5",
              "label": "cmeyer",
              "subCategories": [],
              "viewSets": [],
            },
            {
              "appResources": [],
              "directory": {
                "_tableName": "SpAppResourceDir",
                "collection": "/api/specify/collection/65536/",
                "createdByAgent": null,
                "discipline": "/api/specify/discipline/3/",
                "disciplineType": null,
                "isPersonal": true,
                "modifiedByAgent": null,
                "resource_uri": undefined,
                "specifyUser": "/api/specify/specifyuser/4/",
                "timestampCreated": "2022-08-31",
                "timestampModified": null,
                "userType": null,
                "version": 1,
              },
              "key": "collection_65536_user_4",
              "label": "Vertnet",
              "subCategories": [],
              "viewSets": [],
            },
          ],
          "viewSets": [],
        },
        {
          "appResources": [],
          "directory": undefined,
          "key": "userTypes",
          "label": "User Types",
          "subCategories": [
            {
              "appResources": [],
              "directory": {
                "_tableName": "SpAppResourceDir",
                "collection": "/api/specify/collection/65536/",
                "createdByAgent": null,
                "discipline": "/api/specify/discipline/3/",
                "disciplineType": null,
                "isPersonal": false,
                "modifiedByAgent": null,
                "resource_uri": undefined,
                "specifyUser": null,
                "timestampCreated": "2022-08-31",
                "timestampModified": null,
                "userType": "fullaccess",
                "version": 1,
              },
              "key": "collection_65536_userType_FullAccess",
              "label": "FullAccess",
              "subCategories": [],
              "viewSets": [],
            },
            {
              "appResources": [],
              "directory": {
                "_tableName": "SpAppResourceDir",
                "collection": "/api/specify/collection/65536/",
                "createdByAgent": null,
                "discipline": "/api/specify/discipline/3/",
                "disciplineType": null,
                "isPersonal": false,
                "modifiedByAgent": null,
                "resource_uri": undefined,
                "specifyUser": null,
                "timestampCreated": "2022-08-31",
                "timestampModified": null,
                "userType": "guest",
                "version": 1,
              },
              "key": "collection_65536_userType_Guest",
              "label": "Guest",
              "subCategories": [],
              "viewSets": [],
            },
            {
              "appResources": [],
              "directory": {
                "_tableName": "SpAppResourceDir",
                "collection": "/api/specify/collection/65536/",
                "createdByAgent": null,
                "discipline": "/api/specify/discipline/3/",
                "disciplineType": null,
                "isPersonal": false,
                "modifiedByAgent": null,
                "resource_uri": undefined,
                "specifyUser": null,
                "timestampCreated": "2022-08-31",
                "timestampModified": null,
                "userType": "limitedaccess",
                "version": 1,
              },
              "key": "collection_65536_userType_LimitedAccess",
              "label": "LimitedAccess",
              "subCategories": [],
              "viewSets": [],
            },
            {
              "appResources": [],
              "directory": {
                "_tableName": "SpAppResourceDir",
                "collection": "/api/specify/collection/65536/",
                "createdByAgent": null,
                "discipline": "/api/specify/discipline/3/",
                "disciplineType": null,
                "isPersonal": false,
                "modifiedByAgent": null,
                "resource_uri": undefined,
                "specifyUser": null,
                "timestampCreated": "2022-08-31",
                "timestampModified": null,
                "userType": "manager",
                "version": 1,
              },
              "key": "collection_65536_userType_Manager",
              "label": "Manager",
              "subCategories": [],
              "viewSets": [],
            },
          ],
          "viewSets": [],
        },
      ]
    `);
  });
});
