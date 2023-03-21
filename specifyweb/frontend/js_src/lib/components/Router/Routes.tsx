import React from 'react';

import { attachmentsText } from '../../localization/attachments';
import { developmentText } from '../../localization/development';
import { headerText } from '../../localization/header';
import { preferencesText } from '../../localization/preferences';
import { resourcesText } from '../../localization/resources';
import { schemaText } from '../../localization/schema';
import { userText } from '../../localization/user';
import { welcomeText } from '../../localization/welcome';
import { wbText } from '../../localization/workbench';
import type { RA } from '../../utils/types';
import { Redirect } from './Redirect';
import type { EnhancedRoute } from './RouterUtils';

// FEATURE: go over non-dynamic routes in all routers to make sure they have titles
/* eslint-disable @typescript-eslint/promise-function-async */
export const routes: RA<EnhancedRoute> = [
  {
    path: 'express-search',
    element: () =>
      import('../Header/ExpressSearchTask').then(
        ({ ExpressSearchView }) => ExpressSearchView
      ),
    title: headerText.expressSearch(),
  },
  {
    path: 'express_search',
    element: <Redirect to="/specify/express-search/" />,
  },
  {
    path: 'data-model',
    title: schemaText.databaseSchema(),
    children: [
      {
        index: true,
        title: schemaText.databaseSchema(),
        element: () =>
          import('../SchemaViewer').then(({ SchemaViewer }) => SchemaViewer),
      },
      {
        path: ':tableName',
        element: () =>
          import('../SchemaViewer/helpers').then(
            ({ DataModelRedirect }) => DataModelRedirect
          ),
      },
    ],
  },
  {
    path: 'datamodel/*',
    element: <Redirect to="/specify/data-model/*" />,
  },
  {
    path: 'tree/:tableName',
    element: () =>
      import('../TreeView').then(({ TreeViewWrapper }) => TreeViewWrapper),
  },
  {
    path: 'security',
    title: userText.securityPanel(),
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
          },
          {
            path: 'role/',
            children: [
              {
                path: 'create',
                title: userText.createRole(),
                element: () =>
                  import('../Security/CreateRole').then(
                    ({ CreateCollectionRole }) => CreateCollectionRole
                  ),
              },
              {
                path: 'new',
                title: userText.newRole(),
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
    title: attachmentsText.attachments(),
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
        title: wbText.importDataSet(),
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
    element: <Redirect to="/specify/workbench/import" />,
  },
  {
    path: 'resources',
    title: resourcesText.appResources(),
    element: () =>
      import('../AppResources').then(
        ({ AppResourcesWrapper }) => AppResourcesWrapper
      ),
    children: [
      {
        path: 'create/:directoryKey',
        title: resourcesText.addResource(),
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
        /*
         * Id is set to "new" when adding new resource.
         * Separate route was not used to prevent reloading everything when
         * adding new items to record set
         */
        path: ':id',
        element: () =>
          import('../Forms/DataTask').then(({ ViewResource }) => ViewResource),
      },
    ],
  },
  {
    path: 'bycatalog/:collectionCode/:catalogNumber/',
    element: () =>
      import('../Forms/DataTask').then(
        ({ ViewResourceByCatalog }) => ViewResourceByCatalog
      ),
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
    title: preferencesText.preferences(),
    element: () =>
      import('../UserPreferences').then(
        ({ PreferencesWrapper }) => PreferencesWrapper
      ),
  },
  {
    path: 'schema-config',
    title: schemaText.schemaConfig(),
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
        title: schemaText.addLanguage(),
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
            title: schemaText.tables(),
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
        title: headerText.clearCache(),
        element: () =>
          import('../RouterCommands/CacheBuster').then(
            ({ CacheBuster }) => CacheBuster
          ),
      },
    ],
  },
  {
    path: 'developer',
    children: [
      {
        path: 'crash-report-visualizer',
        title: developmentText.crashReportVisualizer(),
        element: () =>
          import('../Developer/CrashReportVisualizer').then(
            ({ CrashReportVisualizer }) => CrashReportVisualizer
          ),
      },
    ],
  },
  {
    index: true,
    title: welcomeText.pageTitle(),
    element: () => import('../HomePage').then(({ WelcomeView }) => WelcomeView),
  },
  /*
   * The "*" route (the 404 case) was not added, as otherwise it would be
   * triggered when displaying the overlay
   */
];

/* eslint-enable @typescript-eslint/promise-function-async */
