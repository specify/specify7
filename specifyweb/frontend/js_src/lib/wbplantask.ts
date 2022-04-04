import { crash } from './components/errorboundary';
import { router } from './router';
import { setCurrentView } from './specifyapp';

export default function () {
  router.route('workbench-plan/:id/', 'workbench-plan', (dataSetId: string) => {
    import('./components/wbplanviewwrapper')
      .then(({ default: WbPlanView }) =>
        setCurrentView(new WbPlanView({ dataSetId }))
      )
      .catch(crash);
  });
}
