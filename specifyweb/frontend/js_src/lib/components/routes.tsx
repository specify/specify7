import React from 'react';

import { adminText } from '../localization/admin';
import { commonText } from '../localization/common';
import { welcomeText } from '../localization/welcome';
import { wbText } from '../localization/workbench';
import type { RA } from '../types';
import type { EnhancedRoute } from './routerutils';
import { WelcomeView } from './welcomeview';

/* eslint-disable @typescript-eslint/promise-function-async */
export const routes: RA<EnhancedRoute> = [
  {
    path: 'express_search',
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
    path: 'worbench/:id',
    element: () =>
      import('./wbviewtemplate').then(({ WorkBench }) => WorkBench),
  },
  {
    path: 'workbench-import',
    title: wbText('importDataSet'),
    element: () =>
      import('./wbimport').then(({ WbImportView }) => WbImportView),
  },
  {
    path: 'workbench-plan/:id',
    element: () =>
      import('./wbplanviewwrapper').then(
        ({ WbPlanViewWrapper }) => WbPlanViewWrapper
      ),
  },
  {
    path: 'appresources',
    title: commonText('appResources'),
    element: () =>
      import('./appresources').then(
        ({ AppResourcesWrapper }) => AppResourcesWrapper
      ),
    children: [
      {
        index: true,
        element: () =>
          import('./appresources').then(({ AppResources }) => AppResources),
      },
      {
        path: ':id',
        element: () =>
          import('./appresources').then(
            ({ AppResourceView }) => AppResourceView
          ),
      },
    ],
  },
  {
    path: 'viewsets',
    title: commonText('appResources'),
    element: () =>
      import('./appresources').then(
        ({ AppResourcesWrapper }) => AppResourcesWrapper
      ),
    children: [
      {
        index: true,
        element: () =>
          import('./appresources').then(({ AppResources }) => AppResources),
      },
      {
        path: ':id',
        element: () =>
          import('./appresources').then(({ ViewSetView }) => ViewSetView),
      },
    ],
  },
  {
    path: 'recordset/:id/:index?',
    element: () =>
      import('./datatask').then(({ ViewRecordSet }) => ViewRecordSet),
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
        path: ':index',
        element: () =>
          import('./datatask').then(({ ViewResource }) => ViewResource),
      },
    ],
  },
  {
    path: 'bycatalog/:collection/:catalogNumber/',
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
    path: 'command',
    children: [
      {
        path: 'switch-collection/:id',
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
