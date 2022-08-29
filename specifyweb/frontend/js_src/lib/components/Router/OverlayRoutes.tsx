import { commonText } from '../../localization/common';
import { welcomeText } from '../../localization/welcome';
import type { RA } from '../../utils/types';
import type { EnhancedRoute } from './RouterUtils';

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
          import('../Header/UserTools').then(
            ({ UserToolsOverlay }) => UserToolsOverlay
          ),
      },
      {
        path: 'data-entry',
        title: commonText('dataEntry'),
        element: () =>
          import('../Header/Forms').then(
            ({ FormsDialogOverlay }) => FormsDialogOverlay
          ),
      },
      {
        path: 'trees',
        title: commonText('treesDialogTitle'),
        element: () =>
          import('../Toolbar/TreeRepair').then(
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
              import('../Interactions/InteractionsDialog').then(
                ({ InteractionsOverlay }) => InteractionsOverlay
              ),
          },
          {
            path: ':action',
            element: () =>
              import('../Interactions/InteractionsDialog').then(
                ({ InteractionsOverlay }) => InteractionsOverlay
              ),
          },
        ],
      },
      {
        path: 'queries',
        title: commonText('queries'),
        element: () =>
          import('../Toolbar/Query').then(
            ({ QueriesOverlay }) => QueriesOverlay
          ),
        children: [
          {
            index: true,
            element: () =>
              import('../Toolbar/Query').then(
                ({ QueryListOutlet }) => QueryListOutlet
              ),
          },
          {
            path: 'new',
            title: commonText('newQueryDialogTitle'),
            element: () =>
              import('../Toolbar/Query').then(({ NewQuery }) => NewQuery),
          },
        ],
      },
      {
        path: 'record-sets',
        title: commonText('recordSets'),
        element: () =>
          import('../Toolbar/RecordSets').then(
            ({ RecordSetsOverlay }) => RecordSetsOverlay
          ),
      },
      {
        path: 'reports',
        title: commonText('reports'),
        element: () =>
          import('../Reports').then(({ ReportsOverlay }) => ReportsOverlay),
      },
      {
        path: 'data-sets',
        title: commonText('workBench'),
        element: () =>
          import('../Toolbar/WbsDialog').then(
            ({ DataSetsOverlay }) => DataSetsOverlay
          ),
      },
      {
        path: 'workbench/:dataSetId/meta',
        element: () =>
          import('../Toolbar/WbsDialog').then(
            ({ DataSetMetaOverlay }) => DataSetMetaOverlay
          ),
      },
      {
        path: 'tree-repair',
        title: commonText('repairTree'),
        element: () =>
          import('../Toolbar/TreeRepair').then(
            ({ TreeRepairOverlay }) => TreeRepairOverlay
          ),
      },
      {
        path: 'master-key',
        title: commonText('generateMasterKey'),
        element: () =>
          import('../Toolbar/MasterKey').then(
            ({ MasterKeyOverlay }) => MasterKeyOverlay
          ),
      },
      {
        path: 'make-dwca',
        title: commonText('makeDwca'),
        element: () =>
          import('../Toolbar/Dwca').then(
            ({ MakeDwcaOverlay }) => MakeDwcaOverlay
          ),
      },
      {
        path: 'force-update-feed',
        title: commonText('updateExportFeed'),
        element: () =>
          import('../Toolbar/ForceUpdate').then(
            ({ ForceUpdateFeedOverlay }) => ForceUpdateFeedOverlay
          ),
      },
      {
        path: 'about',
        title: welcomeText('aboutSpecify'),
        element: () =>
          import('../HomePage/AboutSpecify').then(
            ({ AboutOverlay }) => AboutOverlay
          ),
      },
    ],
  },
];

/* eslint-enable @typescript-eslint/promise-function-async */
