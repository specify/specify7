import React from 'react';

import { adminText } from '../../localization/admin';
import { commonText } from '../../localization/common';
import { welcomeText } from '../../localization/welcome';
import { wbText } from '../../localization/workbench';
import type { RA } from '../../utils/types';
import { Redirect } from './Redirect';
import type { EnhancedRoute } from './RouterUtils';
import { WelcomeView } from '../HomePage';

// FEATURE: go over non-dynamic routes in all routers to make sure they have titles
/* eslint-disable @typescript-eslint/promise-function-async */
export const routes: RA<EnhancedRoute> = [
  {
    path: 'express-search',
    element: () =>
      import('../Header/ExpressSearchTask').then(
        ({ ExpressSearchView }) => ExpressSearchView
      ),
    title: commonText('expressSearch'),
    navigatable: false,
  },
  {
    path: 'express_search',
    element: <Redirect to="/specify/express-search/" />,
  },
  {
    path: 'datamodel',
    title: commonText('databaseSchema'),
    children: [
      {
        index: true,
        title: commonText('databaseSchema'),
        element: () =>
          import('../Toolbar/Schema').then(
            ({ DataModelTables }) => DataModelTables
          ),
      },
      {
        path: ':tableName',
        element: () =>
          import('../Toolbar/Schema').then(
            ({ DataModelTable }) => DataModelTable
          ),
      },
    ],
  },
  {
    path: 'tree/:tableName',
    element: () =>
      import('../TreeView').then(({ TreeViewWrapper }) => TreeViewWrapper),
  },
  {
    path: 'security',
    title: adminText('securityPanel'),
    element: () =>
      import('../Toolbar/Security').then(({ SecurityPanel }) => SecurityPanel),
    children: [
      {
        path: 'institution',
        element: () =>
          import('../Security/Institution').then(
            ({ SecurityInstitution }) => SecurityInstitution
          ),
        children: [
          {
            index: true,
            element: <></>,
          },
          {
            path: 'role',
            children: [
              {
                path: 'create',
                element: () =>
                  import('../Security/CreateLibraryRole').then(
                    ({ CreateLibraryRole }) => CreateLibraryRole
                  ),
              },
              {
                path: ':roleId',
                element: () =>
                  import('../Security/LibraryRole').then(
                    ({ SecurityLibraryRole }) => SecurityLibraryRole
                  ),
              },
            ],
          },
        ],
      },
      {
        path: 'user',
        children: [
          {
            path: 'new',
            element: () =>
              import('../Security/User').then(
                ({ SecurityUser }) => SecurityUser
              ),
          },
          {
            path: ':userId',
            element: () =>
              import('../Security/User').then(
                ({ SecurityUser }) => SecurityUser
              ),
          },
        ],
      },
      {
        path: 'collection/:collectionId',
        element: () =>
          import('../Security/Collection').then(
            ({ SecurityCollection }) => SecurityCollection
          ),
        children: [
          {
            index: true,
            element: <></>,
          },
          {
            path: 'role/',
            children: [
              {
                path: 'create',
                title: adminText('createRoleDialogHeader'),
                element: () =>
                  import('../Security/CreateRole').then(
                    ({ CreateCollectionRole }) => CreateCollectionRole
                  ),
              },
              {
                path: 'new',
                title: adminText('newRole'),
                element: () =>
                  import('../Security/CollectionRole').then(
                    ({ SecurityCollectionRole }) => SecurityCollectionRole
                  ),
              },
              {
                path: ':roleId',
                element: () =>
                  import('../Security/CollectionRole').then(
                    ({ SecurityCollectionRole }) => SecurityCollectionRole
                  ),
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: 'attachments',
    title: commonText('attachments'),
    element: () =>
      import('../Attachments').then(({ AttachmentsView }) => AttachmentsView),
  },
  {
    path: 'workbench',
    children: [
      {
        path: ':id',
        element: () =>
          import('../WorkBench/Template').then(({ WorkBench }) => WorkBench),
      },
      {
        path: 'import',
        title: wbText('importDataSet'),
        element: () =>
          import('../WbImport').then(({ WbImportView }) => WbImportView),
      },
      {
        path: 'plan/:id',
        element: () =>
          import('../WbPlanView').then(
            ({ WbPlanViewWrapper }) => WbPlanViewWrapper
          ),
      },
    ],
  },
  {
    path: 'workbench-plan/:id',
    element: <Redirect to="/specify/workbench/plan/:id" />,
  },
  {
    path: 'workbench-import',
    element: <Redirect to="/specify/workbench-import" />,
  },
  {
    path: 'resources',
    title: commonText('appResources'),
    element: () =>
      import('../AppResources').then(
        ({ AppResourcesWrapper }) => AppResourcesWrapper
      ),
    children: [
      {
        path: 'create/:directoryKey',
        title: adminText('addResource'),
        element: () =>
          import('../AppResources/Create').then(
            ({ CreateAppResource }) => CreateAppResource
          ),
      },
      {
        path: 'app-resource/:id',
        element: () =>
          import('../AppResources/EditorWrapper').then(
            ({ AppResourceView }) => AppResourceView
          ),
      },
      {
        path: 'view-set/:id',
        element: () =>
          import('../AppResources/EditorWrapper').then(
            ({ ViewSetView }) => ViewSetView
          ),
      },
    ],
  },
  {
    path: 'appresources',
    children: [
      {
        index: true,
        element: <Redirect to="/specify/resources/" />,
      },
      {
        path: ':id',
        element: <Redirect to="/specify/resources/app-resource/:id" />,
      },
    ],
  },
  {
    path: 'viewsets',
    children: [
      {
        index: true,
        element: <Redirect to="/specify/resources/" />,
      },
      {
        path: ':id',
        element: <Redirect to="/specify/resources/view-set/:id" />,
      },
    ],
  },
  {
    path: 'record-set/:id',
    children: [
      {
        index: true,
        element: () =>
          import('../Forms/DataTask').then(
            ({ ViewRecordSet }) => ViewRecordSet
          ),
      },
      {
        path: ':index',
        element: () =>
          import('../Forms/DataTask').then(
            ({ ViewRecordSet }) => ViewRecordSet
          ),
      },
    ],
  },
  {
    path: 'view/:tableName',
    children: [
      {
        path: 'new',
        element: () =>
          import('../Forms/DataTask').then(
            ({ NewResourceView }) => NewResourceView
          ),
      },
      {
        path: ':id',
        element: () =>
          import('../Forms/DataTask').then(({ ViewResource }) => ViewResource),
      },
    ],
  },
  {
    path: 'bycatalog/:collectionCode/:catalogNumber/',
    element: () =>
      import('../Forms/DataTask').then(({ ViewByCatalog }) => ViewByCatalog),
  },
  {
    path: 'query',
    children: [
      {
        path: ':id',
        element: () =>
          import('../QueryBuilder').then(
            ({ QueryBuilderById }) => QueryBuilderById
          ),
      },
      {
        path: 'new/:tableName',
        element: () =>
          import('../QueryBuilder').then(
            ({ NewQueryBuilder }) => NewQueryBuilder
          ),
      },
      {
        path: 'fromtree/:tableName/:id',
        element: () =>
          import('../QueryBuilder').then(
            ({ QueryBuilderFromTree }) => QueryBuilderFromTree
          ),
      },
    ],
  },
  {
    path: 'user-preferences',
    title: commonText('preferences'),
    element: () =>
      import('../UserPreferences').then(
        ({ PreferencesWrapper }) => PreferencesWrapper
      ),
  },
  {
    path: 'schema-config',
    title: commonText('schemaConfig'),
    element: () =>
      import('../Toolbar/SchemaConfig').then(
        ({ SchemaConfig }) => SchemaConfig
      ),
    children: [
      {
        index: true,
        element: () =>
          import('../SchemaConfig/Languages').then(
            ({ ChooseSchemaLanguage }) => ChooseSchemaLanguage
          ),
      },
      {
        path: 'add-language',
        title: commonText('addLanguageDialogHeader'),
        element: () =>
          import('../SchemaConfig/Languages').then(
            ({ AddLanguage }) => AddLanguage
          ),
      },
      {
        path: ':language',
        children: [
          {
            index: true,
            title: commonText('tables'),
            element: () =>
              import('../SchemaConfig/Tables').then(
                ({ SchemaConfigTables }) => SchemaConfigTables
              ),
          },
          {
            path: ':tableName',
            element: () =>
              import('../SchemaConfig').then(
                ({ SchemaConfigMain }) => SchemaConfigMain
              ),
          },
        ],
      },
    ],
  },
  {
    path: 'command',
    children: [
      {
        path: 'switch-collection/:collectionId',
        element: () =>
          import('../RouterCommands/SwitchCollection').then(
            ({ SwitchCollectionCommand }) => SwitchCollectionCommand
          ),
      },
      {
        path: 'test-error',
        element: () =>
          import('../RouterCommands/TestError').then(
            ({ TestErrorCommand }) => TestErrorCommand
          ),
      },
      {
        path: 'clear-cache',
        title: commonText('clearCache'),
        element: () =>
          import('../RouterCommands/CacheBuster').then(
            ({ CacheBuster }) => CacheBuster
          ),
      },
    ],
  },
  {
    index: true,
    title: welcomeText('pageTitle'),
    element: <WelcomeView />,
  },
  /*
   * The "*" route (the 404 case) was not added, as otherwise it would be
   * triggered when displaying the overlay
   */
];

/* eslint-enable @typescript-eslint/promise-function-async */
