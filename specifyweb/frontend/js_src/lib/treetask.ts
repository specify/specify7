import type { AnyTree } from './datamodelutils';
import { NotFoundView } from './notfoundview';
import { router } from './router';
import schema from './schema';
import { setCurrentView } from './specifyapp';
import { treeDefinitions } from './treedefinitions';
import { caseInsensitiveHash } from './wbplanviewhelper';

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
