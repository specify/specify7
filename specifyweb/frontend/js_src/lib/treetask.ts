import { getTreeDef } from './domain';
import type { GetTreeDefinition } from './legacytypes';
import NotFoundView from './notfoundview';
import router from './router';
import { setCurrentView } from './specifyapp';
import { AnyTreeDef } from './datamodelutils';

export default function Routes(): void {
  router.route('tree/:table/', 'tree', async (table: string) =>
    import('./components/treeview').then(({ default: TreeView }) => {
      const treePromise = (getTreeDef as GetTreeDefinition<AnyTreeDef>)(table);
      if (treePromise === null) {
        setCurrentView(new NotFoundView());
        return;
      }
      treePromise.then((treeDefinition) =>
        treeDefinition.rgetCollection('treeDefItems').then(({ models }) =>
          setCurrentView(
            new TreeView({
              tableName: table.toLowerCase(),
              treeDefinition,
              treeDefinitionItems: models,
            })
          )
        )
      );
    })
  );
}
