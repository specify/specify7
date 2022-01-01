import router from './router';
import { setCurrentView } from './specifyapp';

export default function () {
  router.route('workbench-import/', 'workbench-import', async () =>
    import('./components/wbimport').then(({ default: WbImport }) =>
      setCurrentView(new WbImport({}))
    )
  );
}
