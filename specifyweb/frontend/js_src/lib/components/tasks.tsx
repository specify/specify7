import React from 'react';

import { f } from '../functools';
import { hasTablePermission, hasToolPermission } from '../permissionutils';
import { router } from '../router';
import { getModel } from '../schema';
import { setCurrentComponent } from '../specifyapp';
import { ErrorBoundary, fail } from './errorboundary';
import {
  ProtectedTable,
  TablePermissionDenied,
  ToolPermissionDenied,
} from './permissiondenied';

export function task(): void {
  router.route('', 'welcome', async () =>
    import('./welcomeview').then(({ WelcomeView }) =>
      setCurrentComponent(
        <ErrorBoundary dismissable>
          <WelcomeView />
        </ErrorBoundary>
      )
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
      setCurrentComponent(<SecurityPanel />)
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
        <ProtectedTable action="read" tableName="Attachment">
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
        .catch(fail)
  );

  router.route('workbench-import/', 'workbench-import', async () =>
    import('./wbimport').then(({ WbImportView }) =>
      setCurrentComponent(<WbImportView />)
    )
  );

  router.route('workbench-plan/:id/', 'workbench-plan', (dataSetId: string) => {
    import('./wbplanviewwrapper')
      .then(({ WbPlanViewWrapper }) =>
        setCurrentComponent(<WbPlanViewWrapper dataSetId={dataSetId} />)
      )
      .catch(fail);
  });

  const appResources = async (mode: 'appResources' | 'viewSets', id?: string) =>
    import('./appresources').then(({ AppResourcesWrapper }) =>
      hasToolPermission('resources', 'read')
        ? hasTablePermission('Discipline', 'read')
          ? hasTablePermission('Collection', 'read')
            ? setCurrentComponent(
                hasTablePermission('SpecifyUser', 'read') ? (
                  <AppResourcesWrapper
                    mode={mode}
                    resourceId={f.parseInt(id ?? '')}
                  />
                ) : (
                  <TablePermissionDenied
                    action="read"
                    tableName="SpecifyUser"
                  />
                )
              )
            : setCurrentComponent(
                <TablePermissionDenied action="read" tableName="Collection" />
              )
          : setCurrentComponent(
              <TablePermissionDenied action="read" tableName="Discipline" />
            )
        : setCurrentComponent(
            <ToolPermissionDenied action="read" tool="resources" />
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

  router.route('', 'welcome', () => {
    import('./welcomeview').then(({ WelcomeView }) =>
      setCurrentComponent(<WelcomeView />)
    );
  });
}
