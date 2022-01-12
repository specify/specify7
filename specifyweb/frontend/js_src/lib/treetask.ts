import { getTreeDef } from './domain';
import type { GetTreeDefinition } from './legacytypes';
import NotFoundView from './notfoundview';
import router from './router';
import { setCurrentView } from './specifyapp';
import type { Collection } from './specifymodel';

export default function () {
  router.route('tree/:table/', 'tree', async (table: string) =>
    import('./treeview').then(({ default: treeView }) => treeView(table))
  );
  router.route('newTree/:table/', 'tree', async (table: string) =>
    import('./components/treeview').then(({ default: TreeView }) => {
      const treePromise = (getTreeDef as GetTreeDefinition)(table);
      if (treePromise === null) {
        setCurrentView(new NotFoundView());
        return;
      }
      treePromise.done((treeDefinition) =>
        treeDefinition
          .rget<Collection>('treedefitems')
          .then((treeDefinitionItems) =>
            treeDefinitionItems
              .fetch({ limit: 0 })
              .then(() => treeDefinitionItems)
          )
          .then((treeDefinitionItems) =>
            setCurrentView(
              new TreeView({
                tableName: table.toLowerCase(),
                treeDefinition,
                treeDefinitionItems: treeDefinitionItems.models,
              })
            )
          )
      );
    })
  );
}
