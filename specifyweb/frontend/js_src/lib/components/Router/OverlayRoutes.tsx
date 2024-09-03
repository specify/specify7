import React from 'react';

import { attachmentsText } from '../../localization/attachments';
import { batchEditText } from '../../localization/batchEdit';
import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
import { interactionsText } from '../../localization/interactions';
import { mergingText } from '../../localization/merging';
import { queryText } from '../../localization/query';
import { reportsText } from '../../localization/report';
import { schemaText } from '../../localization/schema';
import { treeText } from '../../localization/tree';
import { userText } from '../../localization/user';
import { welcomeText } from '../../localization/welcome';
import { wbText } from '../../localization/workbench';
import type { RA } from '../../utils/types';
import { Redirect } from './Redirect';
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
        title: headerText.userTools(),
        element: () =>
          import('../Header/UserTools').then(
            ({ UserToolsOverlay }) => UserToolsOverlay
          ),
      },
      {
        path: 'simple-search',
        title: headerText.simpleSearch(),
        element: () =>
          import('../Header/ExpressSearchTask').then(
            ({ ExpressSearchOverlay }) => ExpressSearchOverlay
          ),
      },
      {
        path: 'express-search',
        element: <Redirect to="/specify/overlay/simple-search/" />,
      },
      {
        path: 'choose-collection',
        title: commonText.chooseCollection(),
        element: () =>
          import('../Header/ChooseCollection').then(
            ({ ChooseCollection }) => ChooseCollection
          ),
      },
      {
        path: 'data-entry',
        title: headerText.dataEntry(),
        element: () =>
          import('../DataEntryTables').then(
            ({ FormsDialogOverlay }) => FormsDialogOverlay
          ),
      },
      {
        path: 'trees',
        title: treeText.trees(),
        element: () =>
          import('../Toolbar/TreeRepair').then(
            ({ TreeSelectOverlay }) => TreeSelectOverlay
          ),
      },
      {
        path: 'interactions',
        title: interactionsText.interactions(),
        children: [
          {
            index: true,
            element: () =>
              import('../Interactions/InteractionsDialog').then(
                ({ InteractionsOverlay }) => InteractionsOverlay
              ),
          },
          {
            path: 'return-loan',
            element: () =>
              import('../Interactions/InteractionsDialog').then(
                ({ InteractionLoanReturn }) => InteractionLoanReturn
              ),
          },
          {
            path: 'create/:tableName',
            element: () =>
              import('../Interactions/InteractionsDialog').then(
                ({ InteractionAction }) => InteractionAction
              ),
          },
        ],
      },
      {
        path: 'queries',
        title: queryText.queries(),
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
            title: queryText.newQueryName(),
            element: () =>
              import('../Toolbar/Query').then(({ NewQuery }) => NewQuery),
          },
        ],
      },
      {
        path: 'record-sets',
        title: commonText.recordSets(),
        element: () =>
          import('../Toolbar/RecordSets').then(
            ({ RecordSetsOverlay }) => RecordSetsOverlay
          ),
      },
      {
        path: 'reports',
        title: reportsText.reports(),
        element: () =>
          import('../Reports').then(({ ReportsOverlay }) => ReportsOverlay),
      },
      {
        path: 'data-sets',
        title: wbText.workBench(),
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
        title: headerText.repairTree(),
        element: () =>
          import('../Toolbar/TreeRepair').then(
            ({ TreeRepairOverlay }) => TreeRepairOverlay
          ),
      },
      {
        path: 'master-key',
        title: userText.generateMasterKey(),
        element: () =>
          import('../Toolbar/MasterKey').then(
            ({ MasterKeyOverlay }) => MasterKeyOverlay
          ),
      },
      {
        path: 'make-dwca',
        title: headerText.makeDwca(),
        element: () =>
          import('../ExportFeed/Dwca').then(
            ({ MakeDwcaOverlay }) => MakeDwcaOverlay
          ),
      },
      {
        path: 'force-update-feed',
        title: headerText.updateExportFeed(),
        element: () =>
          import('../ExportFeed/ForceUpdate').then(
            ({ ForceUpdateFeedOverlay }) => ForceUpdateFeedOverlay
          ),
      },
      {
        path: 'about',
        title: welcomeText.aboutSpecify(),
        element: () =>
          import('../HomePage/AboutSpecify').then(
            ({ AboutOverlay }) => AboutOverlay
          ),
      },

      {
        path: 'resources/app-resource/:id/*',
        element: () =>
          import('../AppResources/DialogEditor').then(
            ({ DialogEditor }) => DialogEditor
          ),
        isSingleResource: true,
      },
      {
        // This path is used when an overlay triggered a 404 page
        path: 'not-found',
        element: () =>
          import('../Router/RouterUtils').then(
            ({ NotFoundDialog }) => NotFoundDialog
          ),
      },
      {
        path: 'merge/:tableName',
        title: mergingText.mergeRecords(),
        element: () =>
          import('../Merging/index').then(({ MergingDialog }) => MergingDialog),
      },
      {
        path: 'attachments/import',
        title: attachmentsText.importAttachments(),
        element: () =>
          import('../AttachmentsBulkImport/Datasets').then(
            ({ AttachmentsImportOverlay }) => AttachmentsImportOverlay
          ),
      },
      {
        path: 'configure/uniqueness/:tableName',
        title: schemaText.uniquenessRules(),
        element: () =>
          import('../SchemaConfig/TableUniquenessRules').then(
            ({ TableUniquenessRules }) => TableUniquenessRules
          ),
      },
      {
        // There's no physical difference between a workbench and batch-edit dataset, but separating them out helps UI.
        path: 'batch-edit',
        title: batchEditText.batchEdit(),
        element: () =>
          import('../Toolbar/WbsDialog').then(
            ({ BatchEditDataSetsOverlay }) => BatchEditDataSetsOverlay
          ),
      },
    ],
  },
];

/* eslint-enable @typescript-eslint/promise-function-async */
