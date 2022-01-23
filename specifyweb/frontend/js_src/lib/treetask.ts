import { getTreeDef } from './domain';
import type { GetTreeDefinition } from './legacytypes';
import NotFoundView from './notfoundview';
import router from './router';
import { setCurrentView } from './specifyapp';
import { AnyTree, FilterTablesByEndsWith } from './datamodelutils';
import schema from './schema';

export default function Routes(): void {
  router.route('tree/:table/', 'tree', async (table: string) =>
    import('./components/treeview').then(({ default: TreeView }) => {
      const tableName = Object.keys(schema.models).find(
        (tableName) => tableName.toLowerCase() === table
      ) as AnyTree['tableName'] | undefined;
      if (typeof tableName === 'undefined') {
        setCurrentView(new NotFoundView());
        return;
      }
      const treePromise = (
        getTreeDef as unknown as GetTreeDefinition<
          FilterTablesByEndsWith<'TreeDef'>
        >
      )(tableName);
      if (treePromise === null) {
        setCurrentView(new NotFoundView());
        return;
      }
      treePromise.then((treeDefinition) =>
        treeDefinition.rgetCollection('treeDefItems').then(({ models }) =>
          setCurrentView(
            new TreeView({
              tableName,
              treeDefinition,
              treeDefinitionItems: models,
            })
          )
        )
      );
    })
  );
}
