import React from 'react';

import { adminText } from '../localization/admin';
import { commonText } from '../localization/common';
import { welcomeText } from '../localization/welcome';
import { wbText } from '../localization/workbench';
import type { RA } from '../types';
import type { EnhancedRoute } from './routerutils';
import { WelcomeView } from './welcomeview';

// FEATURE: go over non-dynamic routes in all routers to make sure they have titles
/* eslint-disable @typescript-eslint/promise-function-async */
export const routes: RA<EnhancedRoute> = [
  {
    path: 'express-search',
    element: () =>
      import('./expresssearchtask').then(
        ({ ExpressSearchView }) => ExpressSearchView
      ),
    title: commonText('expressSearch'),
    navigatable: false,
  },
  {
    path: 'datamodel',
    title: commonText('databaseSchema'),
    children: [
      {
        index: true,
        title: commonText('databaseSchema'),
        element: () =>
          import('./toolbar/schema').then(
            ({ DataModelTables }) => DataModelTables
          ),
      },
      {
        path: ':tableName',
        element: () =>
          import('./toolbar/schema').then(
            ({ DataModelTable }) => DataModelTable
          ),
      },
    ],
  },
  {
    path: 'tree/:tableName',
    element: () =>
      import('./treeview').then(({ TreeViewWrapper }) => TreeViewWrapper),
  },
  {
    path: 'security',
    title: adminText('securityPanel'),
    element: () =>
      import('./toolbar/security').then(({ SecurityPanel }) => SecurityPanel),
    children: [
      {
        path: 'institution',
        element: () =>
          import('./securityinstitution').then(
            ({ SecurityInstitution }) => SecurityInstitution
          ),
        children: [
          {
            index: true,
          },
          {
            path: 'role',
            children: [
              {
                path: 'create',
                element: () =>
                  import('./securitycreatelibraryrole').then(
                    ({ CreateLibraryRole }) => CreateLibraryRole
                  ),
              },
              {
                path: ':roleId',
                element: () =>
                  import('./securitylibraryrole').then(
                    ({ SecurityLibraryRole }) => SecurityLibraryRole
                  ),
              },
            ],
          },
        ],
      },
      {
        path: 'user/',
        children: [
          {
            path: 'new',
            element: () =>
              import('./securityuser').then(({ SecurityUser }) => SecurityUser),
          },
          {
            path: ':userId',
            element: () =>
              import('./securityuser').then(({ SecurityUser }) => SecurityUser),
          },
        ],
      },
      {
        path: 'collection/:collectionId',
        element: () =>
          import('./securitycollection').then(
            ({ SecurityCollection }) => SecurityCollection
          ),
        children: [
          {
            index: true,
          },
          {
            path: 'role/',
            children: [
              {
                path: 'create',
                title: adminText('createRoleDialogHeader'),
                element: () =>
                  import('./securitycreaterole').then(
                    ({ CreateCollectionRole }) => CreateCollectionRole
                  ),
              },
              {
                path: 'new',
                title: adminText('newRole'),
                element: () =>
                  import('./securitycollectionrole').then(
                    ({ SecurityCollectionRole }) => SecurityCollectionRole
                  ),
              },
              {
                path: ':roleId',
                element: () =>
                  import('./securitycollectionrole').then(
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
      import('./attachmentstask').then(
        ({ AttachmentsView }) => AttachmentsView
      ),
  },
  {
    path: 'workbench',
    children: [
      {
        path: ':id',
        element: () =>
          import('./wbviewtemplate').then(({ WorkBench }) => WorkBench),
      },
      {
        path: 'import',
        title: wbText('importDataSet'),
        element: () =>
          import('./wbimport').then(({ WbImportView }) => WbImportView),
      },
      {
        path: 'plan/:id',
        element: () =>
          import('./wbplanviewwrapper').then(
            ({ WbPlanViewWrapper }) => WbPlanViewWrapper
          ),
      },
    ],
  },
  {
    path: 'resources',
    title: commonText('appResources'),
    element: () =>
      import('./appresources').then(
        ({ AppResourcesWrapper }) => AppResourcesWrapper
      ),
    children: [
      {
        path: 'create/:directoryKey',
        title: adminText('addResource'),
        element: () =>
          import('./appresourcescreate').then(
            ({ CreateAppResource }) => CreateAppResource
          ),
      },
      {
        path: 'app-resource/:id',
        element: () =>
          import('./appresourceview').then(
            ({ AppResourceView }) => AppResourceView
          ),
      },
      {
        path: 'view-set/:id',
        element: () =>
          import('./appresourceview').then(({ ViewSetView }) => ViewSetView),
      },
    ],
  },
  {
    path: 'recordset/:id',
    children: [
      {
        index: true,
        element: () =>
          import('./datatask').then(({ ViewRecordSet }) => ViewRecordSet),
      },
      {
        path: ':index',
        element: () =>
          import('./datatask').then(({ ViewRecordSet }) => ViewRecordSet),
      },
    ],
  },
  {
    path: 'view/:tableName',
    children: [
      {
        path: 'new',
        element: () =>
          import('./datatask').then(({ NewResourceView }) => NewResourceView),
      },
      {
        path: ':id',
        element: () =>
          import('./datatask').then(({ ViewResource }) => ViewResource),
      },
    ],
  },
  {
    path: 'bycatalog/:collectionCode/:catalogNumber/',
    element: () =>
      import('./datatask').then(({ ViewByCatalog }) => ViewByCatalog),
  },
  {
    path: 'query',
    children: [
      {
        path: ':id',
        element: () =>
          import('./querytask').then(
            ({ QueryBuilderById }) => QueryBuilderById
          ),
      },
      {
        path: 'new/:tableName',
        element: () =>
          import('./querytask').then(({ NewQueryBuilder }) => NewQueryBuilder),
      },
      {
        path: 'fromtree/:tableName/:id',
        element: () =>
          import('./querytask').then(
            ({ QueryBuilderFromTree }) => QueryBuilderFromTree
          ),
      },
    ],
  },
  {
    path: 'user-preferences',
    title: commonText('preferences'),
    element: () =>
      import('./toolbar/preferences').then(
        ({ PreferencesWrapper }) => PreferencesWrapper
      ),
  },
  {
    path: 'schema-config',
    title: commonText('schemaConfig'),
    element: () =>
      import('./toolbar/schemaconfig').then(({ SchemaConfig }) => SchemaConfig),
    children: [
      {
        index: true,
        element: () =>
          import('./schemaconfiglanguages').then(
            ({ ChooseSchemaLanguage }) => ChooseSchemaLanguage
          ),
      },
      {
        path: 'add-language',
        title: commonText('addLanguageDialogHeader'),
        element: () =>
          import('./schemaconfiglanguages').then(
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
              import('./schemaconfigtables').then(
                ({ SchemaConfigTables }) => SchemaConfigTables
              ),
          },
          {
            path: ':tableName',
            element: () =>
              import('./schemaconfig').then(
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
          import('./switchcollection').then(
            ({ SwitchCollectionCommand }) => SwitchCollectionCommand
          ),
      },
      {
        path: 'test-error',
        element: () =>
          import('./testerror').then(
            ({ TestErrorCommand }) => TestErrorCommand
          ),
      },
      {
        path: 'clear-cache',
        title: commonText('clearCache'),
        element: () =>
          import('./toolbar/cachebuster').then(
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
