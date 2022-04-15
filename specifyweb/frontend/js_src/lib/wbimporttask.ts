import { router } from './router';
import { setCurrentView } from './specifyapp';

export function task() {
  router.route('workbench-import/', 'workbench-import', async () =>
    import('./components/wbimport').then(({ WbImportView }) =>
      setCurrentView(new WbImportView())
    )
  );
}
