import { router } from './router';
import { setCurrentView } from './specifyapp';

export default function Routes(): void {
  router.route('tree/:table/', 'tree', async (table: string) =>
    import('./components/treeview').then(({ default: TreeView }) =>
      setCurrentView(
        new TreeView({
          table,
        })
      )
    )
  );
}
