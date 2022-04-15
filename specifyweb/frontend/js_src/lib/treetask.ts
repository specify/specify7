import { router } from './router';
import { setCurrentView } from './specifyapp';

export function task(): void {
  router.route('tree/:table/', 'tree', async (table: string) =>
    import('./components/treeview').then(({ treeView }) =>
      setCurrentView(
        new treeView({
          table,
        })
      )
    )
  );
}
