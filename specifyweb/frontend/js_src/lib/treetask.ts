import { NotFoundView } from './notfoundview';
import { router } from './router';
import { getModel } from './schema';
import { setCurrentView } from './specifyapp';
import { isTreeModel, treeDefinitions } from './treedefinitions';
import { caseInsensitiveHash } from './wbplanviewhelper';

export default function Routes(): void {
  router.route('tree/:table/', 'tree', async (table: string) =>
    import('./components/treeview').then(({ default: TreeView }) => {
      const tableName = getModel(table)?.name;
      if (typeof tableName === 'undefined' || !isTreeModel(tableName)) {
        setCurrentView(new NotFoundView());
        return;
      }
      const treeDefinition = caseInsensitiveHash(treeDefinitions, tableName);
      if (typeof treeDefinition === 'object')
        setCurrentView(
          new TreeView({
            tableName,
            treeDefinitionId: treeDefinition.definition.id,
            treeDefinitionItems: treeDefinition.ranks,
          })
        );
      else setCurrentView(new NotFoundView());
    })
  );
}
