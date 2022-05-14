import React from 'react';

import { f } from '../functools';
import { hasToolPermission } from '../permissions';
import { router } from '../router';
import { getModel } from '../schema';
import { setCurrentComponent } from '../specifyapp';
import { crash } from './errorboundary';
import {
  ProtectedAction,
  ProtectedTable,
  ToolPermissionDenied,
} from './permissiondenied';

export function task(): void {
  router.route('', 'welcome', async () =>
    import('./welcomeview').then(({ WelcomeView }) =>
      setCurrentComponent(<WelcomeView />)
    )
  );
  router.route('express_search/', 'esearch', async () =>
    import('./expresssearchtask').then(({ ExpressSearchView }) =>
      setCurrentComponent(<ExpressSearchView />)
    )
  );

  router.route('datamodel/:model/', 'datamodel', async (tableName) =>
    import('./toolbar/schema').then(({ DataModelView }) =>
      setCurrentComponent(<DataModelView model={getModel(tableName)} />)
    )
  );
  router.route('datamodel/', 'datamodel', async () =>
    import('./toolbar/schema').then(({ DataModelView }) =>
      setCurrentComponent(<DataModelView model={undefined} />)
    )
  );

  router.route('security/', 'security', async () =>
    import('./toolbar/security').then(({ SecurityPanel }) =>
      setCurrentComponent(
        <ProtectedTable tableName="Institution" action="read">
          <ProtectedTable tableName="Collection" action="read">
            <SecurityPanel />
          </ProtectedTable>
        </ProtectedTable>
      )
    )
  );

  router.route('tree/:table/', 'tree', async (table: string) =>
    import('./treeview').then(({ TreeViewWrapper }) =>
      setCurrentComponent(React.createElement(TreeViewWrapper, { table }))
    )
  );

  router.route('attachments/', 'attachments', async () =>
    import('./attachmentstask').then(({ AttachmentsView }) =>
      setCurrentComponent(
        <ProtectedTable tableName="Attachment" action="read">
          <AttachmentsView />
        </ProtectedTable>
      )
    )
  );

  router.route(
    'workbench/:id/',
    'workbench',
    (id: string): void =>
      void f
        .all({
          wbView: import('../wbview'),
          treeRanks: import('../treedefinitions').then(
            async ({ treeRanksPromise }) => treeRanksPromise
          ),
        })
        .then(({ wbView: { loadDataset } }) => loadDataset(Number.parseInt(id)))
        .catch(crash)
  );

  router.route('workbench-import/', 'workbench-import', async () =>
    import('./wbimport').then(({ WbImportView }) =>
      setCurrentComponent(<WbImportView />)
    )
  );

  router.route('workbench-plan/:id/', 'workbench-plan', (dataSetId: string) => {
    import('./wbplanviewwrapper')
      .then(({ WbPlanViewWrapper }) =>
        setCurrentComponent(
          <ProtectedAction resource="/workbench/dataset" action="create">
            <WbPlanViewWrapper dataSetId={dataSetId} />
          </ProtectedAction>
        )
      )
      .catch(crash);
  });

  const appResources = async (type: 'appResources' | 'viewSets', id?: string) =>
    import('../appresources').then((appResourcesModule) =>
      hasToolPermission('resources', 'read')
        ? appResourcesModule[type](f.parseInt(id ?? '') ?? null)
        : setCurrentComponent(
            <ToolPermissionDenied tool="resources" action="read" />
          )
    );

  router.route('appresources/', 'appresources', async () =>
    appResources('appResources')
  );
  router.route('appresources/:id/', 'appresource', async (id: string) =>
    appResources('appResources', id)
  );
  router.route('viewsets/', 'viewsets', async () => appResources('viewSets'));
  router.route('viewsets/:id/', 'viewset', async (id: string) =>
    appResources('viewSets', id)
  );

  router.route('', 'welcome', function () {
    import('./welcomeview').then(({ WelcomeView }) =>
      setCurrentComponent(<WelcomeView />)
    );
  });
}
