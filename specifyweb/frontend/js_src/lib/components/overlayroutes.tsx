import { commonText } from '../localization/common';
import { welcomeText } from '../localization/welcome';
import type { RA } from '../types';
import type { EnhancedRoute } from './routerutils';
import { UserToolsOverlay } from './usertools';

/* eslint-disable @typescript-eslint/promise-function-async */
export const overlayRoutes: RA<EnhancedRoute> = [
  {
    path: 'overlay',
    children: [
      {
        path: 'user-tools',
        title: commonText('userToolsDialogTitle'),
        element: () =>
          import('./usertools').then(
            ({ UserToolsOverlay }) => UserToolsOverlay
          ),
      },
      {
        path: 'data-entry',
        title: commonText('dataEntry'),
        element: () =>
          import('./formsdialog').then(
            ({ FormsDialogOverlay }) => FormsDialogOverlay
          ),
      },
      {
        path: 'trees',
        title: commonText('treesDialogTitle'),
        element: () =>
          import('./toolbar/treerepair').then(
            ({ TreeSelectOverlay }) => TreeSelectOverlay
          ),
      },
      {
        path: 'interactions/:action?',
        title: commonText('interactions'),
        element: () =>
          import('./interactionsdialog').then(
            ({ InteractionsOverlay }) => InteractionsOverlay
          ),
      },
      {
        path: 'queries',
        title: commonText('queries'),
        element: () =>
          import('./toolbar/query').then(
            ({ QueriesOverlay }) => QueriesOverlay
          ),
      },
      {
        path: 'record-sets',
        title: commonText('recordSets'),
        element: () =>
          import('./toolbar/recordsets').then(
            ({ RecordSetsOverlay }) => RecordSetsOverlay
          ),
      },
      {
        path: 'reports',
        title: commonText('reports'),
        element: () =>
          import('./reports').then(({ ReportsOverlay }) => ReportsOverlay),
      },
      {
        path: 'data-sets',
        title: commonText('workBench'),
        element: () =>
          import('./toolbar/wbsdialog').then(
            ({ DataSetsOverlay }) => DataSetsOverlay
          ),
      },
      {
        path: 'schema-config',
        title: commonText('schemaConfig'),
        element: () =>
          import('./toolbar/schemaconfig').then(
            ({ SchemaConfigOverlay }) => SchemaConfigOverlay
          ),
      },
      {
        path: 'tree-repair',
        title: commonText('repairTree'),
        element: () =>
          import('./toolbar/treerepair').then(
            ({ TreeRepairOverlay }) => TreeRepairOverlay
          ),
      },
      {
        path: 'master-key',
        title: commonText('generateMasterKey'),
        element: () =>
          import('./toolbar/masterkey').then(
            ({ MasterKeyOverlay }) => MasterKeyOverlay
          ),
      },
      {
        path: 'make-dwca',
        title: commonText('makeDwca'),
        element: () =>
          import('./toolbar/dwca').then(
            ({ MakeDwcaOverlay }) => MakeDwcaOverlay
          ),
      },
      {
        path: 'force-update-feed',
        title: commonText('updateExportFeed'),
        element: () =>
          import('./toolbar/forceupdate').then(
            ({ ForceUpdateFeedOverlay }) => ForceUpdateFeedOverlay
          ),
      },
      {
        path: 'about',
        title: welcomeText('aboutSpecify'),
        element: () =>
          import('./welcomeview').then(({ AboutOverlay }) => AboutOverlay),
      },
    ],
  },
];

/* eslint-enable @typescript-eslint/promise-function-async */
