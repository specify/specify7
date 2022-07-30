import { commonText } from '../localization/common';
import { welcomeText } from '../localization/welcome';
import type { RA } from '../types';
import type { EnhancedRoute } from './routerutils';

/* eslint-disable @typescript-eslint/promise-function-async */
/**
 * Overlay routes are rendered inside of a <Dialog>.
 * When linking to an overlay route, the previous route remains visible in
 * the background.
 * If opening overlay route in a new tab, the background is black.
 *
 * Overlay routes can also get a handleClose callback like this:
 *
 * ```js
 * const handleClose = React.useContext(OverlayContext);
 * ```
 *
 * Calling handleClose() would return user back to what was rendered behind
 * the overlay. If nothing was rendered behind the overlay, user is returned
 * to the Welcome Page
 */
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
        path: 'interactions',
        title: commonText('interactions'),
        children: [
          {
            index: true,
            element: () =>
              import('./interactionsdialog').then(
                ({ InteractionsOverlay }) => InteractionsOverlay
              ),
          },
          {
            path: ':action',
            element: () =>
              import('./interactionsdialog').then(
                ({ InteractionsOverlay }) => InteractionsOverlay
              ),
          },
        ],
      },
      {
        path: 'queries',
        title: commonText('queries'),
        element: () =>
          import('./toolbar/query').then(
            ({ QueriesOverlay }) => QueriesOverlay
          ),
        children: [
          {
            index: true,
            element: () =>
              import('./toolbar/query').then(
                ({ QueryListOutlet }) => QueryListOutlet
              ),
          },
          {
            path: 'new',
            title: commonText('newQueryDialogTitle'),
            element: () =>
              import('./toolbar/query').then(({ NewQuery }) => NewQuery),
          },
        ],
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
        path: 'workbench/:dataSetId/meta',
        element: () =>
          import('./toolbar/wbsdialog').then(
            ({ DataSetMetaOverlay }) => DataSetMetaOverlay
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
