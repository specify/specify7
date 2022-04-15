import { crash } from './components/errorboundary';
import { router } from './router';
import { setCurrentView } from './specifyapp';

export function task() {
  router.route('workbench-plan/:id/', 'workbench-plan', (dataSetId: string) => {
    import('./components/wbplanviewwrapper')
      .then(({ WrappedWbPlanView }) =>
        setCurrentView(new WrappedWbPlanView({ dataSetId }))
      )
      .catch(crash);
  });
}
